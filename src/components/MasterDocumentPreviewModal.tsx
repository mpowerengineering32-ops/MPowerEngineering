import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  ShieldCheck, 
  Maximize2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { MasterTemplate, MasterDocumentData } from '../types';
import { auditDocumentBeforeExport, generateMasterPDF, exportMasterExcel, downloadFileBlob } from '../utils/documentMasterEngine';
import { numberToThaiBaht } from '../utils/numberWords';
import { COMPANY_MASTER_INFO } from '../data/masterTemplatesData';
import { MasterSalesOrderDocument } from './sales-order/MasterSalesOrderDocument';
import { SalesOrderTemplateData, generateSalesOrderMasterPDF } from '../utils/salesOrderPdfEngine';
import { MasterBillingNoteDocument } from './billing-note/MasterBillingNoteDocument';
import { BillingNoteTemplateData, generateBillingNoteMasterPDF } from '../utils/billingNotePdfEngine';
import { MasterPurchaseOrderDocument } from './purchase-order/MasterPurchaseOrderDocument';
import { PurchaseOrderTemplateData, generatePurchaseOrderMasterPDF, formatPODate } from '../utils/purchaseOrderPdfEngine';
import { MasterPurchaseRequestDocument } from './purchase-request/MasterPurchaseRequestDocument';
import { PurchaseRequestTemplateData, generatePurchaseRequestMasterPDF, formatPRDate } from '../utils/purchaseRequestPdfEngine';
import { numberToEnglishBaht } from '../utils/numberWords';

interface MasterDocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: MasterTemplate;
  data: MasterDocumentData;
  onVersionChange?: (version: string) => void;
}

export const MasterDocumentPreviewModal: React.FC<MasterDocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  template,
  data,
  onVersionChange
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activePage, setActivePage] = useState<number>(1);
  const [showAuditPanel, setShowAuditPanel] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Pre-export audit check
  const auditResult = useMemo(() => {
    return auditDocumentBeforeExport(data, template);
  }, [data, template]);

  // Exact 100% Geometry Matched Data for Sales Order
  const soTemplateData: SalesOrderTemplateData | null = useMemo(() => {
    if (template.docType !== 'so' && template.docType !== 'sales_order') return null;
    const rawAddr = data.customer_address || '155/167 Moo 5, Samnakthon Sub-District\nBanchang District, Rayong, Thailand 21130';
    const addrParts = rawAddr.split('\n').map(s => s.trim()).filter(Boolean);
    const addr1 = addrParts[0] || '155/167 Moo 5, Samnakthon Sub-District';
    const addr2 = addrParts.slice(1).join(', ') || 'Banchang District, Rayong, Thailand 21130';

    let taxIdStr = data.customer_tax_id || '0215552000909 (Head Office)';
    if (!taxIdStr.includes('Head Office') && !taxIdStr.includes('สาขา')) {
      taxIdStr += ' (Head Office)';
    }

    const itemsList = (data.items && data.items.length > 0) ? data.items.map(it => {
      const q = Number(it.qty ?? it.ordered_qty ?? 1);
      const p = Number(it.unit_price ?? 0);
      const a = Number(it.amount ?? (q * p));
      const descLines = (it.description || '').split('\n').map(s => s.trim()).filter(Boolean);
      const mainDesc = descLines[0] || 'Sky Lotech High Lift';
      const details = descLines.slice(1);
      return {
        qty: q,
        description: mainDesc,
        details: details.length > 0 ? details : (it.description && it.description.includes('Sky Lotech') ? ['Brand : Skyy Lotech', 'Model : M-380X-200', '- Length : 200 Meter', '- Length : 200 Meter', '- Diameter : 1/2"'] : undefined),
        unit_price: p,
        amount: a
      };
    }) : [
      {
        qty: 1,
        description: 'Sky Lotech High Lift',
        details: ['Brand : Skyy Lotech', 'Model : M-380X-200', '- Length : 200 Meter', '- Length : 200 Meter', '- Diameter : 1/2"'],
        unit_price: 2800,
        amount: 2800
      }
    ];

    const subtotal = Math.round(itemsList.reduce((s, it) => s + it.amount, 0) * 100) / 100;
    const vat = Math.round(subtotal * 0.07 * 100) / 100;
    const grandTotal = Math.round((subtotal + vat) * 100) / 100;

    return {
      so_no: data.document_no || 'SO-2609001',
      date: data.document_date || '01-09-2026',
      customer_name: data.customer_name || 'IKM Testing (Thailand) Co., Ltd',
      customer_address_1: addr1,
      customer_address_2: addr2,
      tax_id: taxIdStr,
      attn: (data as any).attn || (data as any).contact_person || 'Khun Apiyut',
      tel: (data as any).tel || (data as any).customer_phone || '038-601 996-8',
      terms_of_payment: data.payment_term || '30 Days',
      sales_name: data.sales_name || 'Pornpicha O.',
      items: itemsList,
      subtotal: subtotal,
      vat: vat,
      grand_total: grandTotal,
      baht_text_en: data.baht_text_en || 'TWO THOUSAND NINE HUNDRED NINETY SIX BAHT',
      project_name: data.project_name,
      delivery_plan: data.delivery_date
    };
  }, [data, template]);

  // Exact 100% Geometry Matched Data for Billing Note
  const bnTemplateData: BillingNoteTemplateData | null = useMemo(() => {
    if (template.docType !== 'billing_note') return null;
    const rawAddr = data.customer_address || '';
    const addrParts = rawAddr.split('\n').map(s => s.trim()).filter(Boolean);
    const addr1 = addrParts[0] || rawAddr || '-';
    const addr2 = addrParts.slice(1).join(', ') || '';

    const itemsList = (data.items && data.items.length > 0) ? data.items.map((it, idx) => ({
      no: it.item_no || idx + 1,
      ref_no: it.ref_no || (it as any).sales_order_no || '-',
      invoice_no: it.invoice_no || it.description || '-',
      date: it.invoice_date || (it as any).date || data.document_date || '',
      amount: Number(it.amount || 0)
    })) : [
      {
        no: 1,
        ref_no: '-',
        invoice_no: 'INV-2609001',
        date: data.document_date || '01-09-2026',
        amount: Number(data.subtotal || data.grand_total || 50000)
      }
    ];

    const total = Number(data.subtotal || itemsList.reduce((s, it) => s + it.amount, 0));

    return {
      billing_no: data.document_no || 'BL 26-001',
      date: data.document_date || '01-09-2026',
      customer_name: data.customer_name || 'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)',
      customer_address_1: addr1,
      customer_address_2: addr2,
      customer_tax_id: data.customer_tax_id,
      items: itemsList,
      total: total,
      baht_text_thai: data.baht_text || numberToThaiBaht(total),
      due_of_payment: data.due_date || (data as any).due_of_payment || '30 วัน',
      delivered_by: (data as any).delivered_by || data.sales_name || 'Saranya.',
      delivered_date: (data as any).delivered_date || data.document_date || '01-09-2026',
      received_by: (data as any).received_by || '',
      received_date: (data as any).received_date || ''
    };
  }, [data, template]);

  // Exact 100% Geometry Matched Data for Purchase Order (PO.pdf)
  const poTemplateData: PurchaseOrderTemplateData | null = useMemo(() => {
    if (template.docType !== 'po') return null;

    const suppName = data.supplier_name || 'Dacon Trading Co., Ltd. (Head Office)';
    const suppAddr = data.supplier_address || '88/9 Moo 3, Phala, Banchang,\nRayong 21130 Thailand';
    const suppTax = data.supplier_tax_id || '0215542000248';
    const suppPhone = (data as any).supplier_phone || (data as any).phone || '081-8935437';
    const suppAttn = (data as any).supplier_attn || (data as any).attn || 'Khun Chatcha';

    const itemsList = (data.items && data.items.length > 0)
      ? data.items.map(it => {
          const qty = Number(it.qty ?? (it as any).quantity ?? 1);
          const price = Number(it.unit_price ?? 0);
          const amt = Number(it.amount ?? (qty * price));
          return {
            quantity: qty,
            description: it.description || '1630,WL/WF,BLACK',
            unit_price: price,
            amount: amt
          };
        })
      : [
          {
            quantity: 2,
            description: '1630,WL/WF,BLACK',
            unit_price: 19100,
            amount: 38200
          }
        ];

    const subtotal = Math.round(itemsList.reduce((s, it) => s + it.amount, 0) * 100) / 100;
    const vat = Math.round(subtotal * 0.07 * 100) / 100;
    const grandTotal = Math.round((subtotal + vat) * 100) / 100;

    return {
      po_no: data.document_no || '2609001',
      date: formatPODate(data.document_date),
      due_date: data.due_date || data.payment_term || 'Cash',
      supplier_name: suppName,
      supplier_address: suppAddr,
      supplier_tax_id: suppTax,
      supplier_phone: suppPhone,
      supplier_attn: suppAttn,
      sales_name: data.sales_name || (data as any).requestor_name || 'Praiya',
      ref_customer: data.project_name || (data as any).ref_customer || 'Promt Solution',
      attn: suppAttn,
      items: itemsList,
      amount: subtotal,
      vat_amount: vat,
      total_amount: grandTotal,
      baht_text_en: data.baht_text_en || numberToEnglishBaht(grandTotal),
      remarks: data.remark || '',
      delivery_note: (data as any).delivery_note || 'กรุณาจัดส่งสินค้าตามชื่อ-ที่อยู่\nบริษัท เอ็ม พาวเวอร์เอ็นจิเนียริ่งโซลูชั่นส์ จำกัด\nเปิดบิล-ส่งของวันที่ 1 กันยายน 2569',
      prepared_by: (data as any).prepared_by || data.sales_name || 'Praiya',
      approved_by: data.authorized_name || 'Authorized Manager'
    };
  }, [data, template]);

  // Exact 100% Geometry Matched Data for Purchase Request (PR.pdf)
  const prTemplateData: PurchaseRequestTemplateData | null = useMemo(() => {
    if (template.docType !== 'pr') return null;

    const suppName = data.supplier_name || 'Dacon Trading Co., Ltd. (Head Office)';
    const suppAddr = data.supplier_address || '88/9 Moo 3, Phala, Banchang,\nRayong 21130 Thailand';
    const suppTax = data.supplier_tax_id || '0215542000248';
    const suppPhone = (data as any).supplier_phone || '081-8935437';
    const suppAttn = (data as any).supplier_attn || (data as any).attn || 'Khun Chatcha';

    const itemsList =
      data.items && data.items.length > 0
        ? data.items.map(it => {
            const qty = Number(it.qty ?? (it as any).quantity ?? 1);
            const unitPrice = Number(it.unit_price ?? 0);
            const amt = Number(it.amount ?? qty * unitPrice);
            return {
              quantity: qty,
              description: it.description || '1630,WL/WF,BLACK',
              unit_price: unitPrice,
              amount: amt
            };
          })
        : [
            {
              quantity: 2,
              description: '1630,WL/WF,BLACK',
              unit_price: 19100,
              amount: 38200
            }
          ];

    const subtotal = Math.round(itemsList.reduce((s, it) => s + it.amount, 0) * 100) / 100;
    const vat = Math.round(subtotal * 0.07 * 100) / 100;
    const grandTotal = Math.round((subtotal + vat) * 100) / 100;

    return {
      pr_no: data.document_no || '2609001',
      date: formatPRDate(data.document_date),
      due_date: data.due_date || (data as any).payment_term || 'Cash',
      supplier_name: suppName,
      supplier_address: suppAddr,
      supplier_tax_id: suppTax,
      supplier_phone: suppPhone,
      supplier_attn: suppAttn,
      sales_name: data.sales_name || (data as any).requestor_name || 'Praiya',
      ref_customer: data.project_name || (data as any).ref_customer || 'Promt Solution',
      attn: suppAttn,
      items: itemsList,
      amount: subtotal,
      vat_amount: vat,
      total_amount: grandTotal,
      baht_text_en: data.baht_text_en || numberToEnglishBaht(grandTotal),
      remarks: data.remark || '',
      delivery_note: (data as any).delivery_note || '* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด\nเปิดบิล-ส่งของวันที่ 1 กันยายน 2569',
      requested_by: (data as any).requested_by || data.sales_name || 'Requested By',
      approved_by: data.authorized_name || 'Approved By'
    };
  }, [data, template]);

  if (!isOpen) return null;

  const items = data.items && data.items.length > 0 ? data.items : [
    {
      item_no: 1,
      description: data.project_name || 'Hydrotest & Equipment Service Package',
      qty: 1,
      unit: 'Job',
      unit_price: data.subtotal || 0,
      amount: data.subtotal || 0
    }
  ];

  const maxPerPage = template.maxItemsPerPage || 6;
  const totalPages = Math.max(1, Math.ceil(items.length / maxPerPage));
  const currentItems = items.slice((activePage - 1) * maxPerPage, activePage * maxPerPage);
  const isFinalPage = activePage === totalPages;

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      let pdfBytes: Uint8Array;
      if ((template.docType === 'so' || template.docType === 'sales_order') && soTemplateData) {
        pdfBytes = await generateSalesOrderMasterPDF(soTemplateData);
      } else if (template.docType === 'billing_note' && bnTemplateData) {
        pdfBytes = await generateBillingNoteMasterPDF(bnTemplateData);
      } else if (template.docType === 'po' && poTemplateData) {
        pdfBytes = await generatePurchaseOrderMasterPDF(poTemplateData);
      } else if (template.docType === 'pr' && prTemplateData) {
        pdfBytes = await generatePurchaseRequestMasterPDF(prTemplateData);
      } else {
        pdfBytes = await generateMasterPDF(data, template);
      }
      const filename = `${template.docType.toUpperCase()}_${data.document_no}_v${template.version}.pdf`;
      downloadFileBlob(pdfBytes, filename, 'application/pdf');
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      const excelBytes = exportMasterExcel(data, template);
      const filename = `${template.docType.toUpperCase()}_${data.document_no}_v${template.version}.xlsx`;
      downloadFileBlob(excelBytes, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (err) {
      console.error('Failed to export Excel:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const thaiBahtText = data.baht_text || numberToThaiBaht(data.grand_total);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden text-slate-800 print:border-none print:shadow-none print:max-h-none print:rounded-none">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">{template.title}</h3>
                <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded-full font-bold">
                  Master Ver. {template.version}
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% Geometry Matched
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                เลขที่เอกสาร: <span className="font-mono text-white font-bold">{data.document_no}</span> | ลูกค้า: {data.customer_name || data.supplier_name}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Version Selector */}
            {template.versionHistory && template.versionHistory.length > 1 && (
              <select
                value={template.version}
                onChange={(e) => onVersionChange?.(e.target.value)}
                className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              >
                {template.versionHistory.map(v => (
                  <option key={v.id} value={v.version}>Ver {v.version} {v.isActive ? '(Active)' : ''}</option>
                ))}
              </select>
            )}

            {/* Audit Toggle */}
            <button
              onClick={() => setShowAuditPanel(!showAuditPanel)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showAuditPanel ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="ตรวจสอบความถูกต้องเทียบ Master Template"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>การตรวจสอบ ({auditResult.matchedSlots.length} ช่อง)</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleDownloadExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="ส่งออกไฟล์ Excel ตามพิกัด Cell Mapping"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="ส่งออก PDF โครงสร้างตรงกับ Template 100%"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'กำลังสร้าง PDF...' : 'ส่งออก PDF (100% Match)'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-all cursor-pointer"
              title="พิมพ์เอกสาร (Print)"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit & Integrity Checklist Bar */}
        {showAuditPanel && (
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs shrink-0 print:hidden transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  การตรวจสอบความถูกต้องก่อนส่งออก (Master Integrity Check):
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  จับคู่ฟิลด์สำเร็จ: {auditResult.matchedSlots.length} จุด
                </span>
                <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                  คำนวณตัวเลข: ฿{auditResult.calculatedSubtotal.toLocaleString()} + VAT ฿{auditResult.calculatedVat.toLocaleString()} = ฿{auditResult.calculatedGrandTotal.toLocaleString()}
                </span>
                <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                  จำนวนหน้า: {totalPages} หน้า
                </span>
              </div>

              {/* Page Controls & Zoom */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    disabled={activePage <= 1}
                    onClick={() => setActivePage(p => Math.max(1, p - 1))}
                    className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-[11px] font-mono font-bold text-slate-700">
                    หน้า {activePage}/{totalPages}
                  </span>
                  <button
                    disabled={activePage >= totalPages}
                    onClick={() => setActivePage(p => Math.min(totalPages, p + 1))}
                    className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    onClick={() => setZoomLevel(z => Math.max(75, z - 10))}
                    className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    title="ย่อ"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-[11px] font-mono text-slate-600 font-bold">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel(z => Math.min(150, z + 10))}
                    className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    title="ขยาย"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer ml-0.5"
                    title="ขนาดจริง 100%"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Requirement 13 Warning Display */}
            {auditResult.missingSlotsInTemplate.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">เงื่อนไขการคงรูป Master Template (ข้อกำหนดที่ 13):</span>
                  {auditResult.missingSlotsInTemplate.map((slot, idx) => (
                    <div key={idx} className="mt-0.5 text-amber-800">
                      • {slot.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Scrollable Canvas Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          
          {(template.docType === 'so' || template.docType === 'sales_order') && soTemplateData ? (
            <MasterSalesOrderDocument data={soTemplateData} scale={zoomLevel / 100} />
          ) : template.docType === 'billing_note' && bnTemplateData ? (
            <MasterBillingNoteDocument data={bnTemplateData} scale={zoomLevel / 100} />
          ) : template.docType === 'po' && poTemplateData ? (
            <MasterPurchaseOrderDocument data={poTemplateData} scale={zoomLevel / 100} />
          ) : template.docType === 'pr' && prTemplateData ? (
            <MasterPurchaseRequestDocument data={prTemplateData} scale={zoomLevel / 100} />
          ) : (
            /* Printable Document Paper Sheet Container */
            <div 
              style={{ 
                transform: `scale(${zoomLevel / 100})`, 
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-xl border border-slate-300 p-8 sm:p-10 font-sans text-xs leading-normal relative print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:min-h-0"
            >
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 10mm 10mm 10mm 10mm;
                }
                body {
                  background: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print, header, nav, aside, footer, #navbar-shell, #sidebar-shell {
                  display: none !important;
                }
              }
            `}</style>

            {/* 1. MASTER CORPORATE HEADER */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-start gap-4">
                <img
                  src={COMPANY_MASTER_INFO.logo_url}
                  alt="M Power Engineering Solutions Logo"
                  className="w-36 h-auto object-contain shrink-0 pt-0.5"
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
                    {COMPANY_MASTER_INFO.address_th} ({COMPANY_MASTER_INFO.address_en})
                  </p>
                  <p className="text-slate-600">
                    โทร. {COMPANY_MASTER_INFO.phone} | อีเมล: {COMPANY_MASTER_INFO.email}
                  </p>
                  <p className="text-slate-900 font-bold mt-0.5">
                    เลขประจำตัวผู้เสียภาษีอากร: {COMPANY_MASTER_INFO.tax_id} (สำนักงานใหญ่)
                  </p>
                </div>
              </div>

              {/* Title & Document Badge */}
              <div className="text-right shrink-0">
                <div className="bg-slate-900 text-white px-3 py-1.5 rounded-sm inline-block text-right mb-1">
                  <div className="text-xs font-black tracking-wider uppercase">{template.title}</div>
                  <div className="text-[9px] text-slate-300 font-sans">{template.subTitle}</div>
                </div>
                <div className="text-[10px] font-mono space-y-0.5 mt-1">
                  <div>
                    <span className="text-slate-500 font-bold">เลขที่ / No: </span>
                    <span className="font-extrabold text-slate-950">{data.document_no}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">วันที่ / Date: </span>
                    <span>{data.document_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">หน้า / Page: </span>
                    <span className="font-bold">{activePage} / {totalPages}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CUSTOMER & TERMS INFO BOXES */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
              {/* Left Box: Customer / Supplier */}
              <div className="border border-slate-300 rounded-sm p-2.5 bg-slate-50/50 space-y-1">
                <div className="font-extrabold text-slate-900 uppercase text-[10px] pb-1 border-b border-slate-200">
                  ข้อมูลลูกค้า / ผู้รับเอกสาร (Recipient Details)
                </div>
                <div className="pt-0.5">
                  <span className="text-slate-500 font-bold">ชื่อบริษัท: </span>
                  <span className="font-bold text-slate-900 text-[11px]">{data.customer_name || data.supplier_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">ที่อยู่: </span>
                  <span className="text-slate-800">{data.customer_address || data.supplier_address || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">เลขประจำตัวผู้เสียภาษี: </span>
                  <span className="font-mono text-slate-900">{data.customer_tax_id || data.supplier_tax_id || '-'}</span>
                  {data.customer_branch && (
                    <span className="ml-2 text-slate-600 font-bold">({data.customer_branch})</span>
                  )}
                </div>
              </div>

              {/* Right Box: Specifications & Terms */}
              <div className="border border-slate-300 rounded-sm p-2.5 bg-slate-50/50 space-y-1">
                <div className="font-extrabold text-slate-900 uppercase text-[10px] pb-1 border-b border-slate-200">
                  เงื่อนไข & ข้อมูลโครงการ (Specifications & Conditions)
                </div>
                <div className="pt-0.5">
                  <span className="text-slate-500 font-bold">ชื่องาน / โครงการ: </span>
                  <span className="font-bold text-slate-900">{data.project_name || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">เงื่อนไขการชำระเงิน (Payment Term): </span>
                  <span className="text-indigo-700 font-bold">{data.payment_term || 'เครดิต 30 วัน (Credit 30 Days)'}</span>
                </div>
                {template.docType !== 'quotation' && (
                  <div>
                    <span className="text-slate-500 font-bold">กำหนดครบชำระ / ส่งมอบ: </span>
                    <span className="font-mono text-slate-800">{data.due_date || data.delivery_date || data.required_date || '-'}</span>
                  </div>
                )}
                {template.docType === 'quotation' && (
                  <div>
                    <span className="text-slate-500 font-bold">กำหนดยืนราคา (Validity): </span>
                    <span className="font-mono text-slate-800">{data.validity_days || '30 วัน นับจากวันที่เสนอราคา'}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 font-bold">เอกสารอ้างอิง: </span>
                  <span className="font-mono text-indigo-700 font-bold">{data.ref_quotation_no || data.ref_pr_no || data.ref_po_no || data.ref_so_no || data.ref_invoice_no || '-'}</span>
                </div>
              </div>
            </div>

            {/* 3. MASTER ITEM TABLE */}
            <div className="border border-slate-900 mb-4 min-h-[340px] flex flex-col justify-between">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold">
                    {template.tableColumns.map(col => (
                      <th
                        key={col.key}
                        style={{ width: `${col.widthPct}%` }}
                        className={`p-2 border-r border-slate-700 last:border-r-0 ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {col.headerText}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, idx) => {
                    const rowNumber = (activePage - 1) * maxPerPage + idx + 1;
                    const q = Number(item.qty ?? item.ordered_qty ?? 1);
                    const p = Number(item.unit_price ?? 0);
                    const amt = Number(item.amount ?? (q * p));

                    return (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                        {template.tableColumns.map(col => {
                          return (
                            <td
                              key={col.key}
                              className={`p-2 border-r border-slate-200 last:border-r-0 align-top ${
                                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                              }`}
                            >
                              {col.key === 'item_no' && <span className="font-mono font-bold">{item.item_no || rowNumber}</span>}
                              {col.key === 'description' && (
                                <div>
                                  <div className="font-bold text-slate-900">{item.description}</div>
                                  {(item as any).product_code && (
                                    <div className="text-[9px] text-slate-500 font-mono">Code: {(item as any).product_code}</div>
                                  )}
                                </div>
                              )}
                              {(col.key === 'qty' || col.key === 'ordered_qty') && (
                                <span className="font-mono font-bold">{q.toLocaleString()}</span>
                              )}
                              {col.key === 'delivered_qty' && (
                                <span className="font-mono font-bold text-emerald-700">{(item as any).delivered_qty ?? q}</span>
                              )}
                              {col.key === 'unit' && <span>{item.unit || 'หน่วย'}</span>}
                              {col.key === 'unit_price' && (
                                <span className="font-mono">{p.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                              )}
                              {col.key === 'amount' && (
                                <span className="font-mono font-extrabold text-slate-900">{amt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                              )}
                              {col.key === 'invoice_no' && (
                                <span className="font-mono font-bold text-indigo-700">{item.invoice_no || '-'}</span>
                              )}
                              {col.key === 'invoice_date' && (
                                <span className="font-mono">{item.invoice_date || '-'}</span>
                              )}
                              {col.key === 'ref_no' && (
                                <span className="font-mono text-slate-600">{item.ref_no || '-'}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Empty rows filler to keep table grid height 100% matched to Master Template */}
                  {Array.from({ length: Math.max(0, maxPerPage - currentItems.length) }).map((_, emptyIdx) => (
                    <tr key={`empty-${emptyIdx}`} className="h-8 border-b border-slate-100 last:border-b-0">
                      {template.tableColumns.map(col => (
                        <td key={col.key} className="border-r border-slate-200 last:border-r-0">&nbsp;</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isFinalPage && (
                <div className="bg-slate-100 text-center py-2 text-[10px] text-slate-500 font-bold border-t border-slate-200">
                  (มีต่อหน้า {activePage + 1} / Continued on Page {activePage + 1})
                </div>
              )}
            </div>

            {/* 4. MASTER SUMMARY & CALCULATIONS */}
            {isFinalPage ? (
              <div className="grid grid-cols-12 gap-3 mb-4 text-[10px]">
                {/* Left: Thai Baht Text & Remarks */}
                <div className="col-span-7 border border-slate-300 rounded-sm p-2.5 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <span className="text-slate-500 font-bold block mb-0.5">จำนวนเงินตัวอักษร / Total in Thai Baht (Text):</span>
                    <div className="font-extrabold text-slate-900 bg-white border border-slate-200 p-1.5 rounded-sm text-[11px] text-center font-mono">
                      ( {thaiBahtText} )
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-slate-600">
                    <span className="font-bold text-slate-700 block">หมายเหตุ / Conditions:</span>
                    <div>{data.remark || 'ราคานี้รวมภาษีมูลค่าเพิ่ม 7% และค่าใช้จ่ายตามข้อตกลงเรียบร้อยแล้ว'}</div>
                  </div>
                </div>

                {/* Right: Numbers calculation */}
                <div className="col-span-5 border border-slate-300 rounded-sm p-2.5 bg-slate-50/50 space-y-1 font-mono">
                  <div className="flex justify-between text-slate-700">
                    <span>รวมเป็นเงิน (Subtotal):</span>
                    <span className="font-bold">฿{(data.subtotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {data.discount !== undefined && data.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>ส่วนลด (Discount):</span>
                      <span className="font-bold">-฿{data.discount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700">
                    <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                    <span className="font-bold">฿{(data.vat || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {data.wht_amount !== undefined && data.wht_amount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>หัก ณ ที่จ่าย (WHT):</span>
                      <span className="font-bold">-฿{data.wht_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-slate-900 pt-1 text-xs font-black text-slate-950">
                    <span>ยอดสุทธิ (Grand Total):</span>
                    <span className="text-[13px] text-indigo-700">฿{(data.grand_total || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-center text-[10px] text-slate-500 font-bold mb-4">
                สรุปยอดเงินและช่องลายเซ็นจะแสดงในหน้าสุดท้าย (หน้า {totalPages})
              </div>
            )}

            {/* 5. MASTER SIGNATURE BLOCKS */}
            <div className="grid grid-cols-3 gap-3 border border-slate-300 rounded-sm p-3 text-[9px] text-center text-slate-600">
              <div className="space-y-4">
                <div className="font-bold text-slate-800">ผู้จัดทำ (Prepared By)</div>
                <div className="pt-3">....................................................</div>
                <div className="text-[8.5px]">
                  ({data.requestor_name || 'เจ้าหน้าที่ผู้จัดทำ'})<br />
                  วันที่: ...... / ...... / ......
                </div>
              </div>

              <div className="space-y-4 border-x border-slate-200 px-2">
                <div className="font-bold text-slate-800">ผู้ตรวจสอบ / อนุมัติ (Approved By)</div>
                <div className="pt-3">....................................................</div>
                <div className="text-[8.5px]">
                  (ผู้จัดการฝ่ายวิศวกรรม / จัดซื้อ)<br />
                  วันที่: ...... / ...... / ......
                </div>
              </div>

              <div className="space-y-4">
                <div className="font-bold text-slate-800">ผู้มีอำนาจลงนาม / ลูกค้า (Authorized)</div>
                <div className="pt-3">....................................................</div>
                <div className="text-[8.5px]">
                  ({data.authorized_name || COMPANY_MASTER_INFO.company_name_en})<br />
                  วันที่: ...... / ...... / ......
                </div>
              </div>
            </div>

            {/* Verification Footer Note */}
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[8px] text-slate-400 font-mono">
              <div>
                Master Template ID: {template.id} | Ver {template.version} | Format: {template.fileType.toUpperCase()}
              </div>
              <div>
                สร้างผ่านระบบ M Power Engineering Solutions CRM เมื่อ {new Date().toLocaleString('th-TH')}
              </div>
            </div>

          </div>
          )}
        </div>

      </div>
    </div>
  );
};
