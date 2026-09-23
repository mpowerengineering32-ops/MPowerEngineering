import React, { useState, useMemo } from 'react';
import { Customer, SalesOrder, Invoice, UserRole, InvoiceItem } from '../types';
import { numberToEnglishWords } from '../utils/numberWords';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Printer, 
  Edit2, 
  Check, 
  AlertCircle, 
  Calendar, 
  X, 
  Coins, 
  TrendingUp, 
  FileCheck, 
  Clock, 
  Settings, 
  ChevronRight, 
  DollarSign, 
  Trash, 
  FileText,
  Lock
} from 'lucide-react';

interface InvoiceViewProps {
  invoices: Invoice[];
  salesOrders: SalesOrder[];
  customers: Customer[];
  onAdd: (payload: any) => Promise<any>;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onToast: (msg: string, type: 'success' | 'err') => void;
  currentRole: UserRole;
  currentUserId: string;
}

export default function InvoiceView({
  invoices,
  salesOrders,
  customers,
  onAdd,
  onUpdate,
  onDelete,
  onToast,
  currentRole,
  currentUserId
}: InvoiceViewProps) {
  const logoSize = localStorage.getItem("crm_form_logo_size") || "80px";
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Document Toggle Controls for professional PRINT template (3 exact forms requested by user)
  const [activeInvoiceTemplate, setActiveInvoiceTemplate] = useState<'TAX_INVOICE_ORIGINAL' | 'TAX_INVOICE_COPY' | 'RECEIPT'>('TAX_INVOICE_ORIGINAL');
  const [printDocType, setPrintDocType] = useState<'INVOICE / TAX INVOICE' | 'INVOICE' | 'DEBIT NOTE'>('INVOICE / TAX INVOICE');
  const [printWatermark, setPrintWatermark] = useState<'ORIGINAL' | 'COPY'>('ORIGINAL');

  // Form State
  const [soId, setSoId] = useState('');
  const [custId, setCustId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<'Unpaid' | 'Overdue' | 'Paid' | 'Partially Paid'>('Unpaid');
  const [referencePo, setReferencePo] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Custom multi-item list state
  const [invoiceItems, setInvoiceItems] = useState<Omit<InvoiceItem, 'id'>[]>([
    { item_no: 1, description: '', quantity: 1, unit_price: 0, tax_rate: 7, amount: 0 }
  ]);

  const canModify = currentRole !== 'Management';
  const canDelete = currentRole === 'Admin' || currentRole === 'System Administrator';

  // Calculate stats for AdminLTE 4 widgets
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalOverdue = 0;

    invoices.forEach(inv => {
      totalInvoiced += inv.grand_total || inv.total_amount;
      if (inv.status === 'Paid') {
        totalPaid += inv.grand_total || inv.total_amount;
      } else if (inv.status === 'Unpaid' || inv.status === 'Partially Paid') {
        totalUnpaid += inv.grand_total || inv.total_amount;
      } else if (inv.status === 'Overdue') {
        totalOverdue += inv.grand_total || inv.total_amount;
      }
    });

    return { totalInvoiced, totalPaid, totalUnpaid, totalOverdue };
  }, [invoices]);

  // Handle Sales Order Selection
  const handleSOChange = (id: string) => {
    setSoId(id);
    const so = salesOrders.find(item => item.id === id);
    if (so) {
      setCustId(so.customer_id);
      
      if (so.items && so.items.length > 0) {
        setInvoiceItems(so.items.map(it => ({
          item_no: it.item_no,
          description: it.description,
          quantity: it.remaining_qty,
          unit_price: it.unit_price,
          tax_rate: 7,
          amount: it.remaining_qty * it.unit_price
        })));
      } else {
        // Attempt to construct realistic items
        setInvoiceItems([
          {
            item_no: 1,
            description: `Service fee & project execution for "${so.project_name}"\nContract Ref: ${so.so_no}`,
            quantity: 1,
            unit_price: so.total_amount,
            tax_rate: 7,
            amount: so.total_amount
          }
        ]);
      }
    }
  };

  // Line Item actions
  const handleAddItemRow = () => {
    setInvoiceItems(prev => [
      ...prev,
      {
        item_no: prev.length + 1,
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 7,
        amount: 0
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (invoiceItems.length === 1) {
      onToast('ส่วนขยายบิลต้องมีรายการทำงานอย่างน้อย 1 รายการ', 'err');
      return;
    }
    const updated = invoiceItems.filter((_, idx) => idx !== index).map((item, idx) => ({
      ...item,
      item_no: idx + 1
    }));
    setInvoiceItems(updated);
  };

  const handleItemFieldChange = (index: number, field: keyof Omit<InvoiceItem, 'id'>, value: any) => {
    const updated = [...invoiceItems];
    const item = { ...updated[index] };

    if (field === 'description') {
      item.description = value;
    } else if (field === 'quantity') {
      item.quantity = Number(value) || 1;
    } else if (field === 'unit_price') {
      item.unit_price = Number(value) || 0;
    } else if (field === 'tax_rate') {
      item.tax_rate = Number(value) || 0;
    }

    item.amount = item.quantity * item.unit_price;
    updated[index] = item;
    setInvoiceItems(updated);
  };

  // Aggregate subtotal, tax and total based on item rows
  const calculatedFormTotals = useMemo(() => {
    const total_amount = invoiceItems.reduce((acc, item) => acc + item.amount, 0);
    // For simplicity we assume 7% tax from row rate
    const vat_amount = Math.round(total_amount * 0.07);
    const grand_total = total_amount + vat_amount;
    return { total_amount, vat_amount, grand_total };
  }, [invoiceItems]);

  const handleOpenAddForm = () => {
    setEditingInvoice(null);
    setSoId('');
    setCustId('');
    setReferencePo('');
    setRemarks('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split('T')[0]);
    setStatus('Unpaid');
    setInvoiceItems([
      { item_no: 1, description: '', quantity: 1, unit_price: 0, tax_rate: 7, amount: 0 }
    ]);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (inv: Invoice) => {
    setEditingInvoice(inv);
    setSoId(inv.sales_order_id);
    setCustId(inv.customer_id);
    setIssueDate(inv.issue_date);
    setDueDate(inv.due_date);
    setStatus(inv.status);
    setReferencePo((inv as any).reference_po || '');
    setRemarks((inv as any).remarks || '');
    
    if (inv.items && inv.items.length > 0) {
      setInvoiceItems(inv.items.map(item => ({
        item_no: item.item_no,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        amount: item.amount
      })));
    } else {
      setInvoiceItems([
        {
          item_no: 1,
          description: `Contract Services for: ${inv.customer_name}`,
          quantity: 1,
          unit_price: inv.total_amount,
          tax_rate: 7,
          amount: inv.total_amount
        }
      ]);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custId) {
      onToast('กรุณาระบุบริษัทลูกค้าผู้ร่วมทำสัญญา', 'err');
      return;
    }

    if (invoiceItems.some(i => !i.description.trim() || i.unit_price <= 0)) {
      onToast('กรุณากรอกรายละเอียดสินค้า/บริการหลักคู่สัญญาค้า และราคาต่อหน่วยให้มากกว่า 0', 'err');
      return;
    }

    // Validate remaining quantities if linked to Sales Order
    let partialInvoiceMsg = '';
    if (soId) {
      const so = salesOrders.find(item => item.id === soId);
      if (so && so.items && so.items.length > 0) {
        for (const invItem of invoiceItems) {
          const targetSOItem = so.items.find(si => si.item_no === invItem.item_no || si.description === invItem.description || si.description.includes(invItem.description) || invItem.description.includes(si.description));
          if (targetSOItem) {
            // Calculate max allowed
            let maxAllowedQty = targetSOItem.remaining_qty;
            if (editingInvoice) {
              const previousMatchedItem = editingInvoice.items?.find(ei => ei.item_no === targetSOItem.item_no || ei.description === targetSOItem.description);
              if (previousMatchedItem) {
                maxAllowedQty += previousMatchedItem.quantity;
              }
            }
            if (invItem.quantity > maxAllowedQty) {
              onToast(`ไม่สามารถออก Invoice ได้เกินยอดคงเหลือ (ยอดคงเหลือ ${maxAllowedQty} ${targetSOItem.unit})`, 'err');
              return;
            }
            const finalRem = maxAllowedQty - invItem.quantity;
            if (finalRem > 0) {
              partialInvoiceMsg = `สร้าง Invoice สำเร็จ ยอดคงเหลือ ${finalRem} ${targetSOItem.unit} สามารถออก Invoice ส่วนที่เหลือได้ในภายหลัง`;
            }
          }
        }
      }
    }

    const { total_amount, vat_amount, grand_total } = calculatedFormTotals;

    // Attach local unique IDs to form items to match backend InvoiceItem schema
    const formattedItems: InvoiceItem[] = invoiceItems.map((item, idx) => ({
      ...item,
      id: `invi_${Date.now()}_${idx}`
    }));

    const payload = {
      sales_order_id: soId,
      customer_id: custId,
      total_amount,
      vat_amount,
      grand_total,
      status,
      issue_date: issueDate,
      due_date: dueDate,
      reference_po: referencePo,
      remarks,
      items: formattedItems
    };

    try {
      if (editingInvoice) {
        await onUpdate(editingInvoice.id, payload);
        onToast(partialInvoiceMsg || `ประสานแก้ไขข้อมูลในใบแจ้งหนี้แบบสรุป (${editingInvoice.invoice_no}) เรียบร้อย`, 'success');
      } else {
        await onAdd(payload);
        onToast(partialInvoiceMsg || `ออกใบแจ้งหนี้ต้นฉบับระบบและบันทึกค้างกองทุนสำเร็จ`, 'success');
      }
      setIsFormOpen(false);
    } catch {
      onToast('เกิดข้อผิดพลาดในการติดต่อกับเซิร์ฟเวอร์ โปรดลองใหม่อีกครั้ง', 'err');
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch =
        inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ((inv as any).reference_po && (inv as any).reference_po.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = selectedStatus === 'All' || inv.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, selectedStatus]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans text-slate-800" id="invoice-module">
      
      {/* Title Header / Breadcrumb - AdminLTE 4 Clean Styled */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>HOME</span>
            <ChevronRight className="w-3 h-3 text-slate-350" />
            <span>FINANCES</span>
            <ChevronRight className="w-3 h-3 text-slate-350" />
            <span className="text-amber-600 font-extrabold">INVOICES</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Invoice Management
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">ระบบวางบิลค้างรับ</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">บริหารจัดการแจ้งหนี้ วางกำหนดเรียกเก็บเงิน ตรวจสอบสถานะลูกหนี้การค้า IKM Testing</p>
        </div>
        
        {canModify && (
          <button
            onClick={handleOpenAddForm}
            className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/10 hover:-translate-y-0.5 duration-200"
          >
            <Plus className="w-4 h-4" />
            ออกใบวางบิลชุดใหม่ / New Invoice
          </button>
        )}
      </div>

      {/* AdminLTE v4 Small Box Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Widget 1: Total Invoiced */}
        <div className="relative overflow-hidden bg-white rounded-xl border-l-[5px] border-blue-500 border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all group duration-250">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 tracking-widest uppercase block">Total Invoiced Amount</span>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight group-hover:text-blue-600 transition-colors">
              ฿{stats.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400 font-bold">รวมฐานภาษีและ VAT 7% ของใบแจ้งหนี้ทั้งหมด</p>
          </div>
          <Coins className="absolute top-4 right-4 w-12 h-12 text-blue-100 group-hover:scale-110 group-hover:text-blue-200 transition-all duration-300 pointer-events-none" />
        </div>

        {/* Widget 2: Collected (Paid) */}
        <div className="relative overflow-hidden bg-white rounded-xl border-l-[5px] border-emerald-500 border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all group duration-250">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 tracking-widest uppercase block">Collected Cash (Paid)</span>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight group-hover:text-emerald-600 transition-colors">
              ฿{stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400 font-bold">ยอดเงินสดที่ทำการตัดรับเงินบิล (Check In) แล้ว</p>
          </div>
          <FileCheck className="absolute top-4 right-4 w-12 h-12 text-emerald-100 group-hover:scale-110 group-hover:text-emerald-200 transition-all duration-300 pointer-events-none" />
        </div>

        {/* Widget 3: Unpaid Accounts */}
        <div className="relative overflow-hidden bg-white rounded-xl border-l-[5px] border-amber-500 border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all group duration-250">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 tracking-widest uppercase block">Pending Collections</span>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight group-hover:text-amber-600 transition-colors">
              ฿{stats.totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400 font-bold">ใบแจ้งหนี้ทวงถามที่ยังรอการชำระเงินตามดิวดีล</p>
          </div>
          <Clock className="absolute top-4 right-4 w-12 h-12 text-amber-100 group-hover:scale-110 group-hover:text-amber-200 transition-all duration-300 pointer-events-none" />
        </div>

        {/* Widget 4: Overdue Debt */}
        <div className="relative overflow-hidden bg-white rounded-xl border-l-[5px] border-rose-500 border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all group duration-250">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 tracking-widest uppercase block">Overdue Outstanding</span>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight group-hover:text-rose-600 transition-colors">
              ฿{stats.totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-rose-500 font-extrabold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
              ประเมินเสี่ยงการเรียกชำระล่าช้า (Over 30+ Days)
            </p>
          </div>
          <AlertCircle className="absolute top-4 right-4 w-12 h-12 text-rose-100 group-hover:scale-110 group-hover:text-rose-200 transition-all duration-300 pointer-events-none" />
        </div>

      </div>

      {/* Filter / Search Panel styled like AdminLTE Card Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="ค้นหาใบแจ้งหนี้อิงรหัสอ้างอิง PO, ชื่อบริษัทลูกค้าองค์กร หรือหมายเลข INV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500 transition-all font-medium text-slate-800"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <Filter className="text-slate-400 w-4 h-4" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-56 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500 cursor-pointer font-extrabold text-slate-700"
          >
            <option value="All">ทุกระดับสถานะยอดชำระ / All Status</option>
            <option value="Unpaid">Unpaid (ยังไม่ชำระ)</option>
            <option value="Overdue">Overdue (ค้างชำระเกินกำหนด)</option>
            <option value="Paid">Paid (ชำระภาษีเงินได้เสร็จสิ้น)</option>
            <option value="Partially Paid">Partially Paid (ชำระบางส่วน)</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Tab simulation bar */}
      <div className="bg-[#f8f9fa] border border-slate-200 border-b-0 px-4 py-2 flex items-center justify-between text-xs select-none rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="font-medium bg-[#E8EAED] px-2.5 py-1 rounded border border-slate-200 text-slate-700 select-none">Sheet1</span>
          <span className="text-slate-400">|</span>
          <span className="font-mono font-semibold text-emerald-600">{filteredInvoices.length} แถว (Rows)</span>
        </div>
      </div>

      {/* Main Table Grid in Google Sheet style */}
      <div className="bg-white rounded-b-2xl border border-[#DADCE0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              {/* Excel Column Headers A, B, C... */}
              <tr className="bg-[#F8F9FA] border-b border-slate-250 text-[10px] font-mono text-slate-400 select-none">
                <th className="border border-slate-200 bg-[#E8EAED] text-center w-10 py-1"></th>
                <th className="border border-slate-200 text-center w-36">A</th>
                <th className="border border-slate-200 text-center">B</th>
                <th className="border border-slate-200 text-center w-36">C</th>
                <th className="border border-slate-200 text-center w-36">D</th>
                <th className="border border-slate-200 text-center w-40">E</th>
                <th className="border border-slate-200 text-center w-44">F</th>
                <th className="border border-slate-200 text-center w-32">G</th>
                <th className="border border-slate-200 text-center w-36">H</th>
              </tr>
              {/* Header Columns inside the spreadsheet */}
              <tr className="bg-[#F8F9FA] border-b-2 border-slate-300 text-xs font-semibold text-slate-600">
                <th className="border border-slate-200 bg-[#E8EAED] text-center w-10 font-mono select-none"></th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">Doc Number</th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">Client Enterprise</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-slate-700">Subtotal</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-slate-700">Tax (VAT 7%)</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-rose-600 font-extrabold">Grand Total</th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">Terms (Issue / Term Ends)</th>
                <th className="border border-slate-200 px-3 py-2 text-center text-slate-700">Status Badge</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-slate-400 font-medium border border-slate-200">
                    ไม่พบทะเบียนข้อมูลใบวางบิลหรือใบแจ้งหนี้ค้างชำระสรรพากร
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr 
                    key={inv.id} 
                    className={`hover:bg-blue-50/45 cursor-pointer transition-colors border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F8F9FA]/70'}`}
                  >
                    {/* Index row background (spreadsheet numbering) */}
                    <td className="border border-slate-200 bg-[#F1F3F4] text-[#5f6368] text-center font-mono text-[10px] select-none py-1.5">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 font-mono text-rose-600 font-bold truncate">
                      {inv.invoice_no}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5">
                      <span className="font-black text-slate-900 block text-xs">{inv.customer_name}</span>
                      <span className="text-[10px] text-slate-400 font-medium block">Job SO Ref: {inv.sales_order_id}</span>
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-mono text-slate-600 font-bold">
                      ฿{inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-mono text-slate-500">
                      ฿{inv.vat_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-mono font-bold text-rose-600">
                      ฿{inv.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5">
                      <div className="text-slate-700 font-bold">Issued: {inv.issue_date}</div>
                      <div className="text-emerald-600 font-extrabold mt-0.5">Due: {inv.due_date}</div>
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black tracking-wide ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        inv.status === 'Partially Paid' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                        inv.status === 'Unpaid' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-rose-50 text-rose-800 border border-rose-200 animate-pulse'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          title="พรีวิวโมเดลพิมพ์จริง / Print Preview"
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleOpenEditForm(inv)}
                            title="สิทธิอัปเดต / Edit Invoice"
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete ? (
                          <button
                            onClick={async () => {
                              if (confirm(`คลังกระทรวงยืนยันยกเลิกใบเรียกวางบิล ${inv.invoice_no} ใช่หรือไม่?`)) {
                                await onDelete(inv.id);
                                onToast('ถอนใบแจ้งหนี้เสร็จแก้ไขฐานเรียบร้อย', 'success');
                              }
                            }}
                            title="ลบทิ้ง"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            disabled
                            title="จำกัดสิทธิ์เฉพาะ Admin เท่านั้น"
                            className="p-1 text-slate-300 cursor-not-allowed rounded"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Full Multi-Item Form Modal (AdminLTE Look with pristine borders) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-3xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-4xl overflow-hidden my-6 animate-scale-up border-t-8 border-rose-600 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-250 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {editingInvoice ? `Edit Tax Invoice: ${editingInvoice.invoice_no}` : 'อนุมัติออกใบวางบิลเรียกเก็บเงินใหม่ / Issue Tax Invoice'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">กรอกคลังข้อมูลสัญญาเรียกรับเงิน ลูกค้าผู้ซื้ออุตสาหกรรมในสังกัด</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg bg-white border border-slate-200">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              
              {/* Part 1: Contract References */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase mb-2">1. ข้อมูลสัญญาสั่งจ้าง / ORDER DEED CODES</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Sales Order */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">อ้างอิงใบสั่งขาย SO (Sales Order Ref) *</label>
                    <select
                      required
                      value={soId}
                      onChange={(e) => handleSOChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-600 font-semibold"
                    >
                      <option value="">-- กรุณาเลือกใบสัญญาจ้างผลิตที่อนุมัติแล้ว --</option>
                      {salesOrders.map(so => (
                        <option key={so.id} value={so.id}>{so.so_no} - {so.project_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Disable customer auto select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">บริษัทคู่สัญญา (Auto Customer Mapping)</label>
                    <select
                      required
                      disabled
                      value={custId}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed"
                    >
                      <option value="">-- จะดึงรายชื่อลูกค้าวิเคราะห์สัญญากรณีระบุ SO --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.customer_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PO number reference */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">เลขที่ออกใบสั่งซื้ออ้างอิงลูกค้า (PO / Reference No.)</label>
                    <input
                      type="text"
                      placeholder="เช่น PO-007441/2026 หรือ PO9871"
                      value={referencePo}
                      onChange={(e) => setReferencePo(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-rose-600"
                    />
                  </div>

                  {/* Status selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">สถานะคิวรอบจัดส่งบิล (Payment Status)</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer font-bold focus:outline-none"
                    >
                      <option value="Unpaid">Unpaid (ยังไม่ชำระ)</option>
                      <option value="Overdue">Overdue (เลยพ้นกำหนดชำระ)</option>
                      <option value="Paid">Paid (เครดิตตัดเงินเสร็จสิ้น)</option>
                      <option value="Partially Paid">Partially Paid (ชำระมัดจำบางส่วน)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Part 2: Dynamic Multi-item spreadsheet */}
              <div className="border border-slate-200 rounded-xl overflow-hidden p-4 space-y-4 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">2. รายการคำนวณภาษีด้านใน / ITEMIZED INVOICE LINES</h4>
                    <p className="text-[10px] text-slate-400">กรอกแยกจำลองแถวการผลิต อะไหล่ ค่าบริการ หรือค่าแทรกคีย์บริการ</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 bg-slate-900 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มแถว / Add Line Item
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-[11px] text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-600">
                        <th className="px-3 py-2 text-center w-12">ลำดับ</th>
                        <th className="px-3 py-2">คำอธิบายงาน / Description *</th>
                        <th className="px-3 py-2 text-center w-16">จำนวน *</th>
                        <th className="px-3 py-2 text-center w-16">หน่วย *</th>
                        <th className="px-3 py-2 text-right w-28">ราคา/หน่วย (THB) *</th>
                        <th className="px-3 py-2 text-right w-32">จำนวนเงินสะสม</th>
                        <th className="px-3 py-2 text-center w-12">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {invoiceItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-center font-mono font-bold text-slate-400">
                            {item.item_no}
                          </td>
                          <td className="px-3 py-2">
                            <textarea
                              rows={2}
                              required
                              placeholder="เช่น (3000650001) ค่าบริการบริการงานล้างและทำความสะอาด..."
                              value={item.description}
                              onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                              className="w-full border border-slate-200 bg-white rounded p-1 text-[11px] focus:outline-none focus:border-rose-600 font-medium"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                              className="w-full border border-slate-200 bg-white rounded p-1 text-center font-mono focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              required
                              placeholder="เช่น Job, Set"
                              value={(item as any).unit || 'Job'}
                              onChange={(e) => handleItemFieldChange(idx, 'unit' as any, e.target.value)}
                              className="w-full border border-slate-200 bg-white rounded p-1 text-center focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              required
                              min="0"
                              placeholder="0.00"
                              value={(item as any).unit_rate !== undefined ? (item as any).unit_rate : (item as any).unit_price}
                              onChange={(e) => handleItemFieldChange(idx, 'unit_price', e.target.value)}
                              className="w-full border border-slate-200 bg-white rounded p-1 text-right font-mono font-bold focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-extrabold text-slate-900">
                            ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sub Total, VAT, Grand totals inside create/edit */}
                <div className="flex justify-end">
                  <div className="w-72 space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50 text-[11px]">
                    <div className="flex justify-between font-bold text-slate-500">
                      <span>ยอดสุทธิไม่มีภาษี (Subtotal):</span>
                      <span className="font-mono text-slate-800">฿{calculatedFormTotals.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-500">
                      <span>ภาษีมูลค่าเพิ่ม VAT 7%:</span>
                      <span className="font-mono text-slate-800">฿{calculatedFormTotals.vat_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-rose-600 text-xs">
                      <span>ยอดสุทธิใบแจ้งหนี้ (Total Due):</span>
                      <span className="font-mono">฿{calculatedFormTotals.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part 3: Secondary Terms */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase mb-2">3. สัญญาเครดิตเทอม / TERMS & DUAL DATES</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่เริ่มออกใบแจ้ง (Issue Date) *</label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่ครบกำหนดตัดเงินเครดิต (Due Date) *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">หมายเหตุเพิ่มเติมท้ายกระดาษ (Remarks / Bank Transfer descriptions)</label>
                  <textarea
                    rows={2}
                    placeholder="ระบุข้อกำหนดเครดิตเพิ่ม หรือเงื่อนไขหัก ณ ที่จ่าย 3% 5%"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-100 border border-slate-250 text-slate-600 hover:bg-slate-200 font-extrabold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  ออกภายนอก
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 text-white font-extrabold px-6 py-2.5 rounded-xl hover:bg-rose-700 shadow-md shadow-rose-600/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingInvoice ? 'อัปเดตบันทึก / Save Updates' : 'ออกใบวางบิลเรียกเก็บ / Issue Invoice'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Visual professional Printed Tax Invoice template modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in print:bg-white print:p-0 print:absolute">
          <div className="bg-white rounded-2xl shadow-3xl w-full max-w-4xl overflow-hidden my-8 animate-scale-up print:shadow-none print:my-0 print:rounded-none">
            
            {/* Control header with 3 Exact Forms matching user request */}
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
              <span className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                <FileText className="w-5 h-5 text-rose-500" />
                เอกสารสำหรับ Invoice: <span className="font-mono text-amber-400">{viewingInvoice.invoice_no}</span>
              </span>
              
              {/* 3 Form Templates requested by user */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="bg-slate-950 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInvoiceTemplate('TAX_INVOICE_ORIGINAL');
                      setPrintWatermark('ORIGINAL');
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      activeInvoiceTemplate === 'TAX_INVOICE_ORIGINAL'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    Tax Invoice ORIGINAL
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveInvoiceTemplate('TAX_INVOICE_COPY');
                      setPrintWatermark('COPY');
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      activeInvoiceTemplate === 'TAX_INVOICE_COPY'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    Tax Invoice COPY
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveInvoiceTemplate('RECEIPT');
                      setPrintWatermark('ORIGINAL');
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      activeInvoiceTemplate === 'RECEIPT'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    Receipt (ใบเสร็จรับเงิน)
                  </button>
                </div>

                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  พิมพ์ / Print PDF
                </button>
                <button onClick={() => setViewingInvoice(null)} className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Print Sheet: Pixel Perfect M Power TAX Format matching attachment 100% */}
            {(() => {
              const customerObj = customers.find(c => c.id === viewingInvoice.customer_id);
              const customerName = viewingInvoice.customer_name || customerObj?.customer_name || "IKM Testing (Thailand) Co., Ltd";
              const customerAddress = customerObj?.address || "155/167 Moo 5, Samnakthon Sub-District\nBanchang District, Rayong, Thailand 21130";
              const customerPhone = customerObj?.phone || "038-601 996-8";
              const customerTaxId = customerObj?.tax_id || "0215552000909";

              const invoiceNumberStr = viewingInvoice.invoice_no || "202607001";
              const issueDateStr = viewingInvoice.issue_date || "07-01-2026";
              const dueDateStr = viewingInvoice.due_date || "30 Days";
              const salespersonName = (viewingInvoice as any).salesperson_name || "Pronpicha";
              const referencePoStr = (viewingInvoice as any).reference_po || "PO2609001";

              const invoiceItemsList = viewingInvoice.items && viewingInvoice.items.length > 0 ? viewingInvoice.items : [
                {
                  description: `Sky Lotech High Lift\nBrand : Skyy Lotech\nModel : M-380X-200\n- Length : 200 Meter\n- Diameter : 1/2"`,
                  quantity: 1,
                  unit_price: viewingInvoice.total_amount || 38200,
                  amount: viewingInvoice.total_amount || 38200
                }
              ];

              const subtotalVal = viewingInvoice.total_amount || 38200;
              const vatVal = viewingInvoice.vat_amount || Math.round(subtotalVal * 0.07);
              const grandTotalVal = viewingInvoice.grand_total || (subtotalVal + vatVal);
              const grandTotalInWords = numberToEnglishWords(grandTotalVal);

              const isReceipt = activeInvoiceTemplate === 'RECEIPT';
              const isCopy = activeInvoiceTemplate === 'TAX_INVOICE_COPY';

              return (
                <div className="bg-white print:p-0 print:m-0 text-black font-sans w-[210mm] min-h-[297mm] mx-auto relative select-none p-8 md:p-10" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {/* Top Header Row */}
                  <div className="flex justify-between items-start mb-3">
                    {/* Left: Logo & Company Address */}
                    <div className="flex items-start gap-4">
                      <div className="w-[180px] shrink-0 pt-0.5">
                        <img 
                          src="/mpower-logo.png" 
                          alt="M Power Logo" 
                          className="w-full h-auto object-contain" 
                          referrerPolicy="no-referrer" 
                          onError={(e) => { 
                            (e.target as HTMLImageElement).onerror=null; 
                            (e.target as HTMLImageElement).src='https://lh3.googleusercontent.com/d/1DWDy98ToKToCLyb-1rI6U7k_aoNayq1Q'; 
                          }} 
                        />
                      </div>
                      <div className="text-[11px] leading-tight text-black">
                        <div className="font-bold text-[12px] text-black">M Power Engineering Solutions Co., Ltd.</div>
                        <div>53/72 Moo 8, Sattahip Subdistrict, Sattahip District, Chonburi 20180 , Thailand.</div>
                        <div>Tel. 033-641789 / 063-9359565 Email: sales@mpower-engineering.com , info@mpower-engineering.com</div>
                        <div>Tax ID Number. 0205569006956 (Head office)</div>
                      </div>
                    </div>

                    {/* Right: Watermark Tag */}
                    <div className="text-right">
                      <div className="text-[#dc2626] font-bold text-base tracking-wider uppercase">
                        {isCopy ? 'COPY' : 'ORIGINAL'}
                      </div>
                    </div>
                  </div>

                  {/* Document Title Centered */}
                  <div className="text-center my-3">
                    <h2 className="text-lg font-bold text-black uppercase tracking-wide">
                      {isReceipt ? 'Receipt' : 'Tax Invoice / Delivery Note'}
                    </h2>
                  </div>

                  {/* Metadata Box (2 Columns with 1px Outer Border) */}
                  <div className="border border-black grid grid-cols-2 text-[11px] leading-snug mb-3">
                    {/* Left Box: Customer Details */}
                    <div className="p-2.5 border-r border-black space-y-0.5">
                      <div className="font-bold text-[11.5px] text-black">{customerName}</div>
                      <div className="whitespace-pre-line">{customerAddress}</div>
                      <div>Tel. {customerPhone}</div>
                      <div>Tax ID: {customerTaxId} (Head Office)</div>
                    </div>

                    {/* Right Box: Invoice Metadata */}
                    <div className="p-2.5 space-y-0.5 text-[11px]">
                      {isReceipt ? (
                        <>
                          <div className="flex"><span className="w-36 font-bold">Receipt No. :</span> <span className="font-bold">{invoiceNumberStr}</span></div>
                          <div className="flex"><span className="w-36 font-bold">Date :</span> <span>{issueDateStr}</span></div>
                          <div className="flex"><span className="w-36 font-bold">Customer PO Ref:</span> <span>{referencePoStr}</span></div>
                        </>
                      ) : (
                        <>
                          <div className="flex"><span className="w-36 font-bold">Tax Invoice No. :</span> <span className="font-bold">{invoiceNumberStr}</span></div>
                          <div className="flex"><span className="w-36 font-bold">Date :</span> <span>{issueDateStr}</span></div>
                          <div className="flex"><span className="w-36 font-bold">Due Date :</span> <span>{dueDateStr}</span></div>
                          <div className="flex"><span className="w-36 font-bold">Sales Name :</span> <span>{salespersonName}</span></div>
                          <div className="flex"><span className="w-36 font-bold">Customer PO Ref:</span> <span>{referencePoStr}</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Table with continuous vertical lines and 1 outer box */}
                  <div className="border border-black mb-3" style={{ borderWidth: '1px' }}>
                    <table className="w-full border-collapse text-black" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #000000' }}>
                          <th className="py-1.5 px-2 text-center font-bold text-[11px]" style={{ width: '12%', borderRight: '1px solid #000000' }}>
                            Quantity
                          </th>
                          <th className="py-1.5 px-3 text-center font-bold text-[11px]" style={{ width: '58%', borderRight: '1px solid #000000' }}>
                            {isCopy ? 'Descriptions' : 'Drescription'}
                          </th>
                          <th className="py-1.5 px-2 text-center font-bold text-[11px]" style={{ width: '15%', borderRight: '1px solid #000000' }}>
                            Unit Price (THB)
                          </th>
                          <th className="py-1.5 px-2 text-center font-bold text-[11px]" style={{ width: '15%' }}>
                            Amount (THB)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceItemsList.map((item, idx) => (
                          <tr key={idx} style={{ border: 'none' }}>
                            <td style={{ borderRight: '1px solid #000000', padding: '6px 4px', textAlign: 'center', verticalAlign: 'top', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>
                              {item.quantity}
                            </td>
                            <td style={{ borderRight: '1px solid #000000', padding: '6px 8px', textAlign: 'left', verticalAlign: 'top', lineHeight: '1.35', fontSize: '11px' }}>
                              <div className="font-bold text-black">
                                {item.description.split('\n')[0]}
                              </div>
                              {item.description.split('\n').slice(1).map((line, lIdx) => (
                                <div key={lIdx} className="text-black text-[10.5px]">{line}</div>
                              ))}
                            </td>
                            <td style={{ borderRight: '1px solid #000000', padding: '6px 8px', textAlign: 'right', verticalAlign: 'top', fontFamily: 'monospace', fontSize: '11px' }}>
                              {(item.unit_rate !== undefined ? item.unit_rate : (item.unit_price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', verticalAlign: 'top', fontFamily: 'monospace', fontSize: '11px' }}>
                              {(item.amount || ((item.quantity || 1) * (item.unit_price || 0))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}

                        {/* Mid-table marker row */}
                        <tr style={{ border: 'none' }}>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                          <td style={{ borderRight: '1px solid #000000', padding: '16px 8px 8px', textAlign: 'center', fontWeight: 'bold', fontStyle: 'italic', color: '#000000', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                            ** LAST ENTRY **
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                          <td style={{ padding: '4px' }}></td>
                        </tr>

                        {/* Stretch vertical lines to bottom */}
                        <tr style={{ border: 'none', height: '140px' }}>
                          <td style={{ borderRight: '1px solid #000000' }}></td>
                          <td style={{ borderRight: '1px solid #000000' }}></td>
                          <td style={{ borderRight: '1px solid #000000' }}></td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Section */}
                  <div className="flex justify-between items-end mb-2">
                    {/* Left: Total Amount in Words inside a rectangular frame box */}
                    <div className="w-[68%] border border-black py-1.5 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-black">
                      {grandTotalInWords}
                    </div>

                    {/* Right: Amounts Summary Table */}
                    <div className="w-[30%]">
                      <table className="w-full border-collapse text-[10.5px]">
                        <tbody>
                          <tr>
                            <td className="py-1 px-2 text-right font-bold text-black uppercase text-[10px]">
                              AMOUNT
                            </td>
                            <td className="w-[110px] py-1 px-2 border border-black text-right font-mono text-[10.5px] text-black">
                              {subtotalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2 text-right font-bold text-black uppercase text-[10px]">
                              SALES VAT 7%
                            </td>
                            <td className="w-[110px] py-1 px-2 border border-black text-right font-mono text-[10.5px] text-black">
                              {vatVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2 text-right font-bold text-black uppercase text-[10px]">
                              TOTAL AMOUNT
                            </td>
                            <td className="w-[110px] py-1 px-2 border border-black text-right font-mono font-bold text-[10.5px] text-black">
                              {grandTotalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Page indicator */}
                  <div className="text-right text-[10px] font-bold text-black mb-1">
                    Page 1/1
                  </div>

                  {/* Form-Specific Bottom Section */}
                  {isReceipt ? (
                    <>
                      {/* Receipt Method of payment & Cheque details */}
                      <div className="mt-3 text-[11px] leading-relaxed text-black">
                        <div className="font-bold">Payment Method:</div>
                        <div className="pl-2">Kasikorn Bank Sattahip Branch, Account no. 235-3-12229-3</div>
                        <div className="grid grid-cols-4 gap-2 mt-2 pt-1 border-t border-slate-200">
                          <div>Cheque No. : .......................</div>
                          <div>Date : .......................</div>
                          <div>Bank : .......................</div>
                          <div>Amount : .......................</div>
                        </div>
                      </div>

                      {/* Receipt Signatures */}
                      <div className="mt-10 grid grid-cols-2 text-center text-[11px] font-bold text-black">
                        <div className="flex flex-col items-center justify-end">
                          <div>......................................................</div>
                          <div className="mt-1">Cashier Of Collector</div>
                          <div className="mt-1 text-slate-600 font-normal">Date : ..... / ..... / .....</div>
                        </div>

                        <div className="flex flex-col items-center justify-end">
                          <div>......................................................</div>
                          <div className="mt-1">Authorized Signature</div>
                          <div className="mt-1 text-slate-600 font-normal">Date : ..... / ..... / .....</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Tax Invoice Confirmation text */}
                      <div className="text-[10.5px] text-black leading-snug mb-2 font-normal">
                        {isCopy 
                          ? "Above mentioned goods/services has been received in correct quantity and good conditon. Price show is accepted."
                          : "We hereby confirm that the above-mentioned goods/services have been received in the correct quantity and good condition, and the price indicated is accepted."
                        }
                      </div>

                      {/* Payment Method & Bank Instructions */}
                      <div className="text-[10.5px] leading-relaxed text-black mb-6">
                        <div className="font-bold">Method of payment :</div>
                        <div className="pl-2">Cheque or transfer under name M Power Engineering Solutions Co., Ltd.</div>
                        <div className="pl-2">Kasikorn Bank Sattahip Branch, Account no. 235-3-12229-3</div>
                        <div className="mt-1 text-slate-700">
                          After your processing payment Please let us know and attach poof document to account.mpower-engineering.com or call number + 66 33 641 789
                        </div>
                      </div>

                      {/* Signatures Section */}
                      <div className="grid grid-cols-2 text-center text-[11px] font-bold text-black pt-2">
                        <div className="flex flex-col items-center justify-end">
                          <div>......................................................</div>
                          <div className="mt-1">{isCopy ? 'Received By' : 'PREPARE BY'}</div>
                        </div>

                        <div className="flex flex-col items-center justify-end">
                          <div>......................................................</div>
                          <div className="mt-1">{isCopy ? 'Authorized Signature' : 'CUSTOMER APPRROVE BY'}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
