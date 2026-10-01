import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  FileText,
  Building,
  Calendar,
  Layers,
  ShieldCheck,
  CreditCard,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Invoice, Customer } from '../types';
import { COMPANY_MASTER_INFO } from '../data/masterTemplatesData';
import { numberToThaiBaht } from '../utils/numberWords';

export type InvoiceExcelFormType = 'TAX_INVOICE_ORIGINAL' | 'TAX_INVOICE_COPY' | 'RECEIPT';

interface InvoiceExcelRow {
  item_no: number;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  amount: number;
}

interface InvoiceExcelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any | null;
  customers: any[];
  onSave?: (updatedInvoice: any) => void;
  onToast: (msg: string, type: 'success' | 'err') => void;
}

export const InvoiceExcelFormModal: React.FC<InvoiceExcelFormModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customers,
  onSave,
  onToast
}) => {
  if (!isOpen || !invoice) return null;

  // 1. Current Active Form Mode: Tax Invoice ORIGINAL / Tax Invoice COPY / Receipt
  const [formType, setFormType] = useState<InvoiceExcelFormType>('TAX_INVOICE_ORIGINAL');

  // Customer match
  const customer = useMemo(() => {
    const found = customers.find(c => String(c.id) === String(invoice.customer_id) || c.customer_name === invoice.customer_name);
    if (found) return found;
    return {
      customer_name: invoice.customer_name || 'บริษัท ปตท. จำกัด (มหาชน)',
      address: '555 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
      tax_id: '0107544000108',
      branch_type: 'Head Office',
      branch_code: '00000',
      phone: '02-537-2000'
    };
  }, [invoice, customers]);

  // Form Fields State (Editable / Manual filling with automatic recording)
  const [docNo, setDocNo] = useState(invoice.invoice_no || 'INV-26001');
  const [docDate, setDocDate] = useState((invoice as any).invoice_date || (invoice as any).issue_date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState((invoice as any).due_date || '');
  const [refPoNo, setRefPoNo] = useState((invoice as any).ref_po_no || (invoice as any).po_number || (invoice as any).quotation_no || '-');
  const [customerName, setCustomerName] = useState(invoice.customer_name || '');
  const [customerAddress, setCustomerAddress] = useState(customer.address || '');
  const [customerTaxId, setCustomerTaxId] = useState(customer.tax_id || '');
  const [customerBranch, setCustomerBranch] = useState(customer.branch_type === 'Head Office' ? 'สำนักงานใหญ่' : `สาขา ${customer.branch_code || '00001'}`);
  const [paymentTerm, setPaymentTerm] = useState((invoice as any).payment_term || 'เครดิต 30 วัน');
  const [paymentMethod, setPaymentMethod] = useState<'Transfer' | 'Cheque' | 'Cash'>('Transfer');
  const [chequeBank, setChequeBank] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [whtRate, setWhtRate] = useState<number>(0); // 0% or 3%
  const [remark, setRemark] = useState((invoice as any).notes || 'ได้รับเอกสารและสินค้า/บริการตามรายการข้างต้นถูกต้องเรียบร้อยแล้ว');
  const [authorizedSigner, setAuthorizedSigner] = useState('นายพงษ์ศักดิ์ บุญประเสริฐ');
  const [collectorName, setCollectorName] = useState('ฝ่ายการเงินและบัญชี');

  // Items List (Can add/edit/delete up to 10 rows matching exact Excel structure)
  const [items, setItems] = useState<InvoiceExcelRow[]>(() => {
    if ((invoice as any).items && (invoice as any).items.length > 0) {
      return (invoice as any).items.map((it: any, idx: number) => ({
        item_no: idx + 1,
        description: it.description || it.name || 'บริการงานวิศวกรรมและการทดสอบ',
        qty: Number(it.qty || it.quantity || 1),
        unit: it.unit || 'งาน (Job)',
        unit_price: Number(it.unit_price || it.unit_rate || (invoice as any).subtotal || (invoice as any).total_amount || 0),
        amount: Number(it.amount || it.total_price || (Number(it.qty || it.quantity || 1) * Number(it.unit_price || 0)))
      }));
    }
    const defaultPrice = (invoice as any).subtotal || (invoice as any).total_amount || 0;
    return [
      {
        item_no: 1,
        description: (invoice as any).description || 'บริการงานซ่อมบำรุงและทดสอบแรงดันระบบท่อ (Hydrotest Service)',
        qty: 1,
        unit: 'Job',
        unit_price: defaultPrice,
        amount: defaultPrice
      }
    ];
  });

  // Calculate Subtotal, VAT, Grand Total
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  }, [items]);

  const vat = useMemo(() => {
    return formType === 'RECEIPT' ? 0 : Math.round(subtotal * 0.07 * 100) / 100;
  }, [subtotal, formType]);

  const totalWithVat = useMemo(() => {
    return formType === 'RECEIPT' ? subtotal : subtotal + vat;
  }, [subtotal, vat, formType]);

  const whtAmount = useMemo(() => {
    return Math.round(subtotal * (whtRate / 100) * 100) / 100;
  }, [subtotal, whtRate]);

  const netPayable = useMemo(() => {
    return totalWithVat - whtAmount;
  }, [totalWithVat, whtAmount]);

  const bahtText = useMemo(() => {
    return numberToThaiBaht(netPayable);
  }, [netPayable]);

  // Handle Item Row Change
  const handleItemChange = (index: number, field: keyof InvoiceExcelRow, val: any) => {
    setItems(prev => {
      const next = [...prev];
      const target = { ...next[index], [field]: val };
      if (field === 'qty' || field === 'unit_price') {
        const q = field === 'qty' ? Number(val) : target.qty;
        const p = field === 'unit_price' ? Number(val) : target.unit_price;
        target.amount = Math.round(q * p * 100) / 100;
      }
      next[index] = target;
      return next;
    });
  };

  // Add Item Row
  const handleAddItem = () => {
    if (items.length >= 10) {
      onToast('ตาราง Excel รองรับรายการสูงสุด 10 บรรทัดต่อหน้า', 'err');
      return;
    }
    setItems(prev => [
      ...prev,
      {
        item_no: prev.length + 1,
        description: '',
        qty: 1,
        unit: 'Job',
        unit_price: 0,
        amount: 0
      }
    ]);
  };

  // Remove Item Row
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      onToast('เอกสารต้องมีอย่างน้อย 1 รายการ', 'err');
      return;
    }
    setItems(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((it, idx) => ({ ...it, item_no: idx + 1 }));
    });
  };

  // Save changes back to record
  const handleSaveRecord = () => {
    const updatedInvoice: any = {
      ...invoice,
      invoice_no: docNo,
      invoice_date: docDate,
      issue_date: docDate,
      due_date: dueDate,
      customer_name: customerName,
      subtotal: subtotal,
      total_amount: subtotal,
      vat: vat,
      vat_amount: vat,
      grand_total: netPayable,
      status: invoice.status,
      items: items,
      notes: remark,
      payment_term: paymentTerm,
      ref_po_no: refPoNo,
      wht_rate: whtRate,
      wht_amount: whtAmount,
      authorized_signer: authorizedSigner
    };

    if (onSave) {
      onSave(updatedInvoice);
    }
    onToast(`บันทึกข้อมูลแบบฟอร์มเอกสาร ${docNo} สำเร็จ (Recorded)`, 'success');
  };

  // Export Excel 100% Geometry Matched
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    let titleTH = '';
    let titleEN = '';
    let copyBadge = '';

    if (formType === 'TAX_INVOICE_ORIGINAL') {
      titleTH = 'ใบกำกับภาษี / ใบส่งของ';
      titleEN = 'TAX INVOICE / DELIVERY NOTE';
      copyBadge = 'ต้นฉบับ (ORIGINAL)';
    } else if (formType === 'TAX_INVOICE_COPY') {
      titleTH = 'ใบกำกับภาษี / ใบส่งของ';
      titleEN = 'TAX INVOICE / DELIVERY NOTE';
      copyBadge = 'สำเนา (COPY)';
    } else {
      titleTH = 'ใบเสร็จรับเงิน';
      titleEN = 'RECEIPT';
      copyBadge = 'ต้นฉบับ (ORIGINAL)';
    }

    const wsData = [
      [COMPANY_MASTER_INFO.company_name_en, '', '', '', '', titleEN],
      [COMPANY_MASTER_INFO.company_name_th, '', '', '', '', titleTH],
      [COMPANY_MASTER_INFO.address_th, '', '', '', '', `[ ${copyBadge} ]`],
      [`เลขประจำตัวผู้เสียภาษีอากร: ${COMPANY_MASTER_INFO.tax_id} (สำนักงานใหญ่)`, '', '', '', '', `เลขที่: ${docNo}`],
      [`โทรศัพท์: ${COMPANY_MASTER_INFO.phone}`, '', '', '', '', `วันที่: ${docDate}`],
      ['', '', '', '', '', `เงื่อนไขชำระเงิน: ${paymentTerm}`],
      ['--- ข้อมูลลูกค้า (Customer) ---', '', '', '--- ข้อมูลอ้างอิง (Reference) ---', '', ''],
      [`ชื่อ: ${customerName}`, '', '', `PO อ้างอิง: ${refPoNo}`, '', `ครบกำหนด: ${dueDate}`],
      [`ที่อยู่: ${customerAddress}`, '', '', `สาขา: ${customerBranch}`, '', ''],
      [`เลขประจำตัวผู้เสียภาษี: ${customerTaxId}`, '', '', '', '', ''],
      [''],
      ['ลำดับ (Item)', 'รายการสินค้าหรือบริการ (Description)', 'จำนวน (Qty)', 'หน่วย (Unit)', 'ราคา/หน่วย (Unit Price)', 'จำนวนเงิน (Amount)'],
      ...items.map(it => [
        it.item_no,
        it.description,
        it.qty,
        it.unit,
        it.unit_price,
        it.amount
      ]),
      [''],
      ['จำนวนเงินเป็นตัวอักษร:', bahtText, '', '', 'รวมมูลค่าสินค้า/บริการ:', subtotal],
      ['', '', '', '', 'ภาษีมูลค่าเพิ่ม 7% (VAT):', vat],
      ['', '', '', '', 'หักภาษี ณ ที่จ่าย (WHT):', whtAmount],
      ['', '', '', '', 'ยอดรวมสุทธิ (Grand Total):', netPayable],
      [''],
      [`หมายเหตุ: ${remark}`],
      [''],
      ['ลงชื่อ ____________________ ผู้รับเอกสาร/สินค้า', '', '', 'ลงชื่อ ____________________ ผู้มีอำนาจลงนาม'],
      [`(                                      )`, '', '', `( ${authorizedSigner} )`]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, formType.substring(0, 31));
    XLSX.writeFile(wb, `${formType}_${docNo}_MPOWER.xlsx`);
    onToast(`ส่งออกไฟล์ Excel แม่แบบ ${formType} สำเร็จ`, 'success');
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Header Title strings based on formType
  const getFormTitle = () => {
    switch (formType) {
      case 'TAX_INVOICE_ORIGINAL':
        return {
          th: 'ใบกำกับภาษี / ใบส่งของ',
          en: 'TAX INVOICE / DELIVERY NOTE',
          badge: 'ต้นฉบับ / ORIGINAL',
          color: 'bg-rose-700 text-white'
        };
      case 'TAX_INVOICE_COPY':
        return {
          th: 'ใบกำกับภาษี / ใบส่งของ',
          en: 'TAX INVOICE / DELIVERY NOTE',
          badge: 'สำเนา / COPY',
          color: 'bg-slate-700 text-white'
        };
      case 'RECEIPT':
        return {
          th: 'ใบเสร็จรับเงิน',
          en: 'RECEIPT',
          badge: 'ต้นฉบับ / ORIGINAL',
          color: 'bg-emerald-700 text-white'
        };
    }
  };

  const formMeta = getFormTitle();

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Control Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white">
                  แบบฟอร์มเอกสารการเงินตรงตาม Excel ต้นฉบับ 100%
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {docNo}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                เลือกรูปแบบเอกสารได้ 3 ชนิด: Tax Invoice ORIGINAL, Tax Invoice COPY และ Receipt พร้อมแก้ไขข้อมูล Manual และบันทึก
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveRecord}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="บันทึกข้อมูลที่กรอก Manual ลงในระบบ Record"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึก (Record)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="ส่งออกไฟล์ Excel ตามแบบ Form"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออก Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="พิมพ์เอกสารออกกระดาษ A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Form Mode Selector Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              เลือกประเภทเอกสารตามแบบฟอร์ม Excel (3 รูปแบบ):
            </span>

            {/* Mode 1: Tax Invoice ORIGINAL */}
            <button
              onClick={() => setFormType('TAX_INVOICE_ORIGINAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                formType === 'TAX_INVOICE_ORIGINAL'
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Tax Invoice ORIGINAL (ต้นฉบับ)</span>
            </button>

            {/* Mode 2: Tax Invoice COPY */}
            <button
              onClick={() => setFormType('TAX_INVOICE_COPY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                formType === 'TAX_INVOICE_COPY'
                  ? 'bg-slate-800 text-white shadow-sm ring-2 ring-slate-800/30'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Tax Invoice COPY (สำเนา)</span>
            </button>

            {/* Mode 3: Receipt */}
            <button
              onClick={() => setFormType('RECEIPT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                formType === 'RECEIPT'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>3. Receipt (ใบเสร็จรับเงิน)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            <span className="text-emerald-700 font-bold">● กรอกข้อมูล Manual ได้อิสระ</span> และกดบันทึกเพื่อบันทึกย้อนกลับสู่ระบบ
          </div>
        </div>

        {/* Document Body (Printable & Exact Excel Layout) */}
        <div className="p-6 overflow-y-auto bg-slate-200/60 print:bg-white print:p-0 flex-1 flex justify-center">
          <div className="bg-white border border-slate-400 p-8 rounded-none w-[210mm] min-h-[297mm] shadow-lg print:border-none print:shadow-none print:m-0 print:p-6 text-slate-900 font-sans text-xs flex flex-col justify-between">
            
            <div>
              {/* 1. Master Corporate Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
                <div className="flex items-start gap-4">
                  <img
                    src={COMPANY_MASTER_INFO.logo_url}
                    alt="M Power Engineering Solutions Logo"
                    className="w-32 h-auto object-contain shrink-0 pt-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/d/1DWDy98ToKToCLyb-1rI6U7k_aoNayq1Q';
                    }}
                  />
                  <div className="text-[10px] text-slate-700 leading-tight">
                    <h1 className="text-[13px] font-black text-slate-950 tracking-wide uppercase">
                      {COMPANY_MASTER_INFO.company_name_en}
                    </h1>
                    <p className="font-bold text-slate-900 text-[11px]">
                      {COMPANY_MASTER_INFO.company_name_th}
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      {COMPANY_MASTER_INFO.address_th}
                    </p>
                    <p className="text-slate-600">
                      โทร. {COMPANY_MASTER_INFO.phone} | อีเมล: {COMPANY_MASTER_INFO.email}
                    </p>
                    <p className="text-slate-900 font-bold mt-0.5">
                      เลขประจำตัวผู้เสียภาษีอากร: {COMPANY_MASTER_INFO.tax_id} (สำนักงานใหญ่)
                    </p>
                  </div>
                </div>

                {/* Form Title Box */}
                <div className="text-right shrink-0">
                  <div className={`${formMeta.color} px-4 py-2 rounded-sm inline-block text-right mb-1.5 shadow-xs`}>
                    <div className="text-xs font-black tracking-wider uppercase">{formMeta.th}</div>
                    <div className="text-[9px] text-slate-100 font-sans tracking-wide">{formMeta.en}</div>
                    <div className="text-[9px] font-bold mt-0.5 tracking-wider bg-black/20 px-1 py-0.5 rounded inline-block">
                      {formMeta.badge}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono space-y-1 mt-1">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-slate-500 font-bold">เลขที่ / No: </span>
                      <input
                        type="text"
                        value={docNo}
                        onChange={e => setDocNo(e.target.value)}
                        className="font-extrabold text-slate-950 text-right bg-amber-50/50 border border-slate-300 rounded px-1.5 py-0.5 text-xs w-32 focus:bg-white focus:outline-indigo-500"
                        title="กรอกเลขที่เอกสาร Manual ได้"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-slate-500 font-bold">วันที่ / Date: </span>
                      <input
                        type="date"
                        value={docDate}
                        onChange={e => setDocDate(e.target.value)}
                        className="font-mono text-slate-900 text-right bg-amber-50/50 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] w-32 focus:bg-white"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-slate-500 font-bold">เงื่อนไข / Term: </span>
                      <input
                        type="text"
                        value={paymentTerm}
                        onChange={e => setPaymentTerm(e.target.value)}
                        className="text-right bg-amber-50/50 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] w-32 focus:bg-white"
                        placeholder="เครดิต 30 วัน"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Customer & Reference Boxes */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
                {/* Left: Customer Info (Editable Manual) */}
                <div className="border border-slate-300 rounded-sm p-2.5 bg-slate-50/60 space-y-1.5">
                  <div className="font-extrabold text-slate-900 uppercase text-[10px] pb-1 border-b border-slate-200 flex items-center justify-between">
                    <span>ข้อมูลลูกค้า / ผู้ซื้อ (Customer Details)</span>
                    <span className="text-[9px] text-emerald-700 font-normal">แก้ไขได้</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block mb-0.5">ชื่อบริษัท / ลูกค้า:</span>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full font-bold text-slate-950 bg-amber-50/50 border border-slate-300 rounded px-2 py-1 text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block mb-0.5">ที่อยู่:</span>
                    <textarea
                      rows={2}
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      className="w-full text-slate-800 bg-amber-50/50 border border-slate-300 rounded px-2 py-1 text-[10px] focus:bg-white leading-tight resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">เลขประจำตัวผู้เสียภาษี:</span>
                      <input
                        type="text"
                        value={customerTaxId}
                        onChange={e => setCustomerTaxId(e.target.value)}
                        className="w-full font-mono text-slate-900 bg-amber-50/50 border border-slate-300 rounded px-2 py-0.5 text-[10px] focus:bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">สาขา:</span>
                      <input
                        type="text"
                        value={customerBranch}
                        onChange={e => setCustomerBranch(e.target.value)}
                        className="w-full text-slate-900 bg-amber-50/50 border border-slate-300 rounded px-2 py-0.5 text-[10px] focus:bg-white"
                        placeholder="สำนักงานใหญ่"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Payment & Reference (Editable Manual) */}
                <div className="border border-slate-300 rounded-sm p-2.5 bg-slate-50/60 space-y-1.5">
                  <div className="font-extrabold text-slate-900 uppercase text-[10px] pb-1 border-b border-slate-200 flex items-center justify-between">
                    <span>เงื่อนไข & เอกสารอ้างอิง (Terms & Payment)</span>
                    <span className="text-[9px] text-emerald-700 font-normal">แก้ไขได้</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">PO / QT อ้างอิง:</span>
                      <input
                        type="text"
                        value={refPoNo}
                        onChange={e => setRefPoNo(e.target.value)}
                        className="w-full font-mono text-indigo-700 font-bold bg-amber-50/50 border border-slate-300 rounded px-2 py-1 text-[10px] focus:bg-white"
                        placeholder="PTT-PO-2601"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">วันครบกำหนดชำระ:</span>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="w-full font-mono text-slate-900 bg-amber-50/50 border border-slate-300 rounded px-2 py-1 text-[10px] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Payment Methods (โอน/เช็ค/เงินสด) */}
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-bold block mb-1">การชำระเงิน (Payment By):</span>
                    <div className="flex items-center gap-3 text-[10px] mb-1.5">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="payMethod"
                          checked={paymentMethod === 'Transfer'}
                          onChange={() => setPaymentMethod('Transfer')}
                          className="accent-indigo-600"
                        />
                        <span>โอนเงินผ่านบัญชี</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="payMethod"
                          checked={paymentMethod === 'Cheque'}
                          onChange={() => setPaymentMethod('Cheque')}
                          className="accent-indigo-600"
                        />
                        <span>เช็คธนาคาร</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="payMethod"
                          checked={paymentMethod === 'Cash'}
                          onChange={() => setPaymentMethod('Cash')}
                          className="accent-indigo-600"
                        />
                        <span>เงินสด</span>
                      </label>
                    </div>

                    {paymentMethod === 'Cheque' && (
                      <div className="grid grid-cols-3 gap-1.5 mt-1">
                        <input
                          type="text"
                          placeholder="ชื่อธนาคาร"
                          value={chequeBank}
                          onChange={e => setChequeBank(e.target.value)}
                          className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[9px]"
                        />
                        <input
                          type="text"
                          placeholder="เลขที่เช็ค"
                          value={chequeNo}
                          onChange={e => setChequeNo(e.target.value)}
                          className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[9px]"
                        />
                        <input
                          type="date"
                          value={chequeDate}
                          onChange={e => setChequeDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[9px]"
                        />
                      </div>
                    )}

                    {paymentMethod === 'Transfer' && (
                      <div className="text-[9px] text-slate-600 bg-white border border-slate-200 p-1 rounded">
                        ธ.กสิกรไทย สาขาสัตหีบ | บัญชี: 023-8-47192-5 บจก. เอ็ม พาวเวอร์ฯ
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Items Table (Exact Excel Column Layout, Manual edit allowed) */}
              <div className="border border-slate-900 mb-3 min-h-[300px] flex flex-col justify-between">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-extrabold text-[10px]">
                      <th className="p-2 w-[7%] text-center border-r border-slate-700">ลำดับ</th>
                      <th className="p-2 w-[51%] text-left border-r border-slate-700">รายการสินค้าหรือบริการ (Description)</th>
                      <th className="p-2 w-[10%] text-center border-r border-slate-700">จำนวน</th>
                      <th className="p-2 w-[10%] text-center border-r border-slate-700">หน่วย</th>
                      <th className="p-2 w-[11%] text-right border-r border-slate-700">ราคา/หน่วย</th>
                      <th className="p-2 w-[11%] text-right">จำนวนเงิน (฿)</th>
                      <th className="p-2 w-[25px] text-center print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-1 text-center font-mono font-bold border-r border-slate-200">
                          {row.item_no}
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.description}
                            onChange={e => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full bg-transparent hover:bg-amber-50/50 focus:bg-white border-0 border-b border-transparent focus:border-indigo-500 text-[10px] py-0.5 px-1 font-medium"
                            placeholder="ระบุชื่อสินค้าหรือบริการ..."
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200 text-center">
                          <input
                            type="number"
                            min="1"
                            value={row.qty}
                            onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                            className="w-full text-center bg-transparent hover:bg-amber-50/50 focus:bg-white border-0 border-b border-transparent focus:border-indigo-500 font-mono text-[10px] py-0.5 px-1"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200 text-center">
                          <input
                            type="text"
                            value={row.unit}
                            onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full text-center bg-transparent hover:bg-amber-50/50 focus:bg-white border-0 border-b border-transparent focus:border-indigo-500 text-[10px] py-0.5 px-1"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200 text-right">
                          <input
                            type="number"
                            step="any"
                            value={row.unit_price}
                            onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                            className="w-full text-right bg-transparent hover:bg-amber-50/50 focus:bg-white border-0 border-b border-transparent focus:border-indigo-500 font-mono text-[10px] py-0.5 px-1"
                          />
                        </td>
                        <td className="p-1 text-right font-mono font-bold text-slate-900">
                          {row.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-1 text-center print:hidden">
                          {items.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 transition p-0.5"
                              title="ลบแถวนี้"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Empty spacing rows to preserve Excel geometric grid */}
                    {Array.from({ length: Math.max(0, 6 - items.length) }).map((_, emptyIdx) => (
                      <tr key={`empty-${emptyIdx}`} className="border-b border-slate-150 h-7 text-slate-300">
                        <td className="border-r border-slate-200 text-center font-mono">{items.length + emptyIdx + 1}</td>
                        <td className="border-r border-slate-200"></td>
                        <td className="border-r border-slate-200"></td>
                        <td className="border-r border-slate-200"></td>
                        <td className="border-r border-slate-200"></td>
                        <td></td>
                        <td className="print:hidden"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add Item Row Button (Print Hidden) */}
                <div className="p-1.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center print:hidden">
                  <button
                    onClick={handleAddItem}
                    disabled={items.length >= 10}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>เพิ่มแถวรายการ ({items.length}/10)</span>
                  </button>

                  <span className="text-[10px] text-slate-500">
                    * สามารถแก้ไขตัวเลขและราคาได้โดยตรง ช่อง Total จะคำนวณให้อัตโนมัติ
                  </span>
                </div>
              </div>

              {/* 4. Summary & Calculations */}
              <div className="grid grid-cols-12 gap-3 mb-4 text-[10px]">
                {/* Left: Baht Text & Notes */}
                <div className="col-span-7 border border-slate-300 p-2.5 rounded-sm bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 pb-1 mb-1 border-b border-slate-200">
                      จำนวนเงินรวมเป็นตัวอักษร (Baht in Words):
                    </div>
                    <div className="bg-white border border-slate-200 p-2 rounded text-slate-900 font-bold text-[11px] text-center tracking-wide">
                      ({bahtText})
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="text-slate-500 font-bold block mb-0.5">หมายเหตุเพิ่มเติม / ข้อตกลง:</span>
                    <input
                      type="text"
                      value={remark}
                      onChange={e => setRemark(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[9.5px] focus:bg-white"
                      placeholder="ระบุข้อความหมายเหตุ..."
                    />
                  </div>
                </div>

                {/* Right: Calculations Summary */}
                <div className="col-span-5 border border-slate-900 bg-white">
                  <div className="divide-y divide-slate-200 text-[10px]">
                    <div className="flex justify-between p-1.5">
                      <span className="text-slate-600 font-medium">รวมมูลค่าสินค้า/บริการ:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {formType !== 'RECEIPT' && (
                      <div className="flex justify-between p-1.5">
                        <span className="text-slate-600 font-medium">ภาษีมูลค่าเพิ่ม 7% (VAT):</span>
                        <span className="font-mono font-bold text-slate-900">
                          {vat.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {/* Withholding Tax (WHT Option) */}
                    <div className="flex justify-between items-center p-1.5 bg-slate-50">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600 font-medium">หัก ณ ที่จ่าย:</span>
                        <select
                          value={whtRate}
                          onChange={e => setWhtRate(Number(e.target.value))}
                          className="bg-white border border-slate-300 rounded px-1 py-0 text-[9px] print:hidden cursor-pointer"
                        >
                          <option value={0}>0%</option>
                          <option value={3}>3% (บริการ)</option>
                          <option value={1}>1% (ขนส่ง)</option>
                        </select>
                        <span className="font-bold print:inline hidden text-[9px]">({whtRate}%)</span>
                      </div>
                      <span className="font-mono font-bold text-rose-600">
                        {whtAmount > 0 ? `- ฿${whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '฿0.00'}
                      </span>
                    </div>

                    {/* Grand Total */}
                    <div className="flex justify-between p-2 bg-slate-900 text-white font-extrabold text-[11px]">
                      <span>ยอดเงินสุทธิที่ต้องชำระ:</span>
                      <span className="font-mono text-emerald-400 text-xs">
                        ฿{netPayable.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Signature Boxes (Exact Excel 3 Signatures) */}
              <div className="grid grid-cols-3 gap-3 border border-slate-300 p-2.5 rounded-sm bg-white text-center text-[10px]">
                {/* 1. Recipient / Collector */}
                <div className="p-2 border-r border-slate-200">
                  <div className="text-slate-500 font-bold mb-8">
                    ผู้รับสินค้า / บริการ / วางบิล
                  </div>
                  <div className="border-b border-dotted border-slate-400 w-36 mx-auto mb-1"></div>
                  <div className="text-[9px] text-slate-600">(____________________________)</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">วันที่: ____/____/________</div>
                </div>

                {/* 2. Cashier / Collector */}
                <div className="p-2 border-r border-slate-200">
                  <div className="text-slate-500 font-bold mb-8">
                    ผู้ส่งของ / เจ้าหน้าที่การเงิน
                  </div>
                  <div className="border-b border-dotted border-slate-400 w-36 mx-auto mb-1"></div>
                  <input
                    type="text"
                    value={collectorName}
                    onChange={e => setCollectorName(e.target.value)}
                    className="text-[9px] text-slate-700 text-center bg-transparent border-0 border-b border-transparent focus:border-indigo-400 w-36 mx-auto block py-0"
                  />
                  <div className="text-[9px] text-slate-500 mt-0.5">วันที่: {docDate}</div>
                </div>

                {/* 3. Authorized Signature */}
                <div className="p-2">
                  <div className="text-slate-900 font-extrabold mb-8">
                    ผู้มีอำนาจลงนาม (Authorized Signature)
                  </div>
                  <div className="border-b border-dotted border-slate-400 w-36 mx-auto mb-1"></div>
                  <input
                    type="text"
                    value={authorizedSigner}
                    onChange={e => setAuthorizedSigner(e.target.value)}
                    className="text-[9px] font-bold text-slate-900 text-center bg-transparent border-0 border-b border-transparent focus:border-indigo-400 w-44 mx-auto block py-0"
                  />
                  <div className="text-[9px] text-slate-500 mt-0.5">กรรมการผู้จัดการ / ผู้แทน</div>
                </div>
              </div>

            </div>

            {/* Print Footer Note */}
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[8.5px] text-slate-400">
              <span>{COMPANY_MASTER_INFO.company_name_en} - Document System</span>
              <span>เอกสารพิมพ์ตามแบบฟอร์มต้นฉบับ Master Form | พิมพ์วันที่: {new Date().toLocaleString('th-TH')}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
