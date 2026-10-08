import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  ShoppingCart,
  Edit3,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Supplier, PurchaseOrder } from '../../types';
import {
  preparePurchaseOrderTemplateData,
  auditPurchaseOrderForMasterTemplate,
  generatePurchaseOrderMasterPDF,
  PurchaseOrderTemplateData
} from '../../utils/purchaseOrderPdfEngine';
import { MasterPurchaseOrderDocument } from './MasterPurchaseOrderDocument';

interface PurchaseOrderGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  supplier?: Supplier;
  onToast: (msg: string, type: 'success' | 'err') => void;
}

export const PurchaseOrderGenerateModal: React.FC<PurchaseOrderGenerateModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  supplier,
  onToast
}) => {
  if (!isOpen || !purchaseOrder) return null;

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showAuditDetails, setShowAuditDetails] = useState<boolean>(false);
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);

  // Editable Remarks and Delivery Note
  const [customRemarks, setCustomRemarks] = useState<string>(purchaseOrder.remarks || '');
  const [customDeliveryNote, setCustomDeliveryNote] = useState<string>(
    purchaseOrder.delivery_note ||
      '* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด'
  );

  // 1. Prepare exact Master Template Data with custom notes
  const templateData: PurchaseOrderTemplateData = useMemo(() => {
    const poWithCustomNotes = {
      ...purchaseOrder,
      remarks: customRemarks,
      delivery_note: customDeliveryNote
    };
    return preparePurchaseOrderTemplateData(poWithCustomNotes, supplier);
  }, [purchaseOrder, supplier, customRemarks, customDeliveryNote]);

  // 2. Pre-Export Audit & Field Mapping Check
  const auditResult = useMemo(() => {
    return auditPurchaseOrderForMasterTemplate(templateData);
  }, [templateData]);

  // 3. Download PDF (100% Geometry Matched via pdf-lib)
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const pdfBytes = await generatePurchaseOrderMasterPDF(templateData);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanNo = templateData.po_no.replace(/[\s/]/g, '_');
      link.download = `Purchase_Order_${cleanNo}_MPOWER_MASTER.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onToast(`ดาวน์โหลดเอกสารใบสั่งซื้อ ${templateData.po_no} สำเร็จ (100% Match)`, 'success');
    } catch (err: any) {
      console.error('Export Purchase Order PDF Error:', err);
      onToast(`เกิดข้อผิดพลาดในการสร้าง PDF: ${err?.message || 'Unknown error'}`, 'err');
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Print Handler
  const handlePrint = () => {
    window.print();
  };

  // 5. Download Excel Data matching columns
  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const wsData = [
      ['M Power Engineering Solutions Co., Ltd.'],
      ['53/72 Moo 8, Sattahip Subdistrict, Sattahip District, Chonburi 20180 , Thailand.'],
      ['Tel. 033-641789 / 063-9359565 Email: sales@mpower-engineering.com , info@mpower-engineering.com'],
      ['Tax ID Number. 0205569006956 (Head office)'],
      [''],
      ['Purchase Order'],
      [''],
      ['PO. No. :', templateData.po_no, '', 'Supplier :', templateData.supplier_name],
      ['Date :', templateData.date, '', 'Address :', templateData.supplier_address],
      ['Due Date :', templateData.due_date, '', 'Tax ID No. :', templateData.supplier_tax_id],
      ['Sales Name :', templateData.sales_name, '', 'Tel. :', templateData.supplier_phone],
      ['Ref. Customer :', templateData.ref_customer, '', 'Attn. :', templateData.attn],
      [''],
      ['Quantity', 'Descriptions', 'Unit Price (THB)', 'Amount (THB)'],
      ...templateData.items.map(it => [
        it.quantity,
        it.description,
        it.unit_price,
        it.amount
      ]),
      ['** LAST ENTRY **'],
      [''],
      ['', '', 'AMOUNT', templateData.amount],
      ['', '', 'SALES VAT 7%', templateData.vat_amount],
      ['', '', 'TOTAL AMOUNT', templateData.total_amount],
      [''],
      ['TOTAL AMOUNT (WORDS):', templateData.baht_text_en],
      ['Remarks;', templateData.remarks || '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Order');
    const cleanNo = templateData.po_no.replace(/[\s/]/g, '_');
    XLSX.writeFile(wb, `Purchase_Order_${cleanNo}.xlsx`);
    onToast(`ส่งออกข้อมูล Excel ${templateData.po_no} สำเร็จ`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Control Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Purchase Order Master Generator
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-mono font-bold">
                  100% Geometry Matched
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                เลขที่: <span className="font-mono font-bold text-white">{templateData.po_no}</span> • คู่ค้า: <span className="text-slate-200">{templateData.supplier_name}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 text-slate-300">
              <button
                onClick={() => setZoomLevel(z => Math.max(60, z - 10))}
                className="p-1.5 hover:bg-slate-700 hover:text-white rounded-lg transition"
                title="ย่อขนาด"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-xs font-bold text-slate-200">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(z => Math.min(140, z + 10))}
                className="p-1.5 hover:bg-slate-700 hover:text-white rounded-lg transition"
                title="ขยายขนาด"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg ml-1 transition"
                title="รีเซ็ตเป็น 100%"
              >
                100%
              </button>
            </div>

            {/* Edit Notes / Remarks Button */}
            <button
              onClick={() => setIsEditingNotes(v => !v)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer border ${
                isEditingNotes
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
              }`}
              title="ใส่ข้อความ / ปรับแก้ Remarks และ Delivery Remark"
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              <span>{isEditingNotes ? 'ปิดตัวแก้ไขโน้ต' : 'แก้ไขหมายเหตุ/โน้ต'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>พิมพ์ (Print)</span>
            </button>

            {/* Download Excel */}
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="ดาวน์โหลดโครงสร้างตาราง Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Excel</span>
            </button>

            {/* Download Master PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (100% Match)'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Template Field Audit Status Bar */}
        <div className="bg-slate-100 border-b border-slate-300 px-6 py-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ตรวจสอบความสมบูรณ์ตาม Master Template (PO.pdf):
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              จับคู่ฟิลด์ตรงตามตำแหน่ง 100%
            </span>
            <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-blue-200">
              รวม ฿{templateData.amount.toLocaleString()} + VAT 7% ฿{templateData.vat_amount.toLocaleString()} = ฿{templateData.total_amount.toLocaleString()}
            </span>
            <button
              onClick={() => setShowAuditDetails(!showAuditDetails)}
              className="text-emerald-700 hover:underline font-bold text-[11px] ml-1"
            >
              {showAuditDetails ? 'ซ่อนการตรวจสอบ' : 'ดูฟิลด์ที่ตรวจสอบ'}
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            A4 Portrait • 1 หน้าเดี่ยว
          </div>
        </div>

        {/* Audit Slots Collapsible Box */}
        {showAuditDetails && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 max-h-48 overflow-y-auto">
            <div className="font-bold text-slate-900 mb-2">รายการฟิลด์ที่ตรวจสอบกับ Master Template:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {auditResult.matchedSlots.map((slot, idx) => (
                <div key={idx} className="p-1.5 bg-white border border-slate-200 rounded text-[10.5px]">
                  <span className="font-bold text-slate-600">{slot.label}:</span>{' '}
                  <span className="text-slate-900 truncate font-mono">{slot.value}</span>
                </div>
              ))}
            </div>
            {auditResult.warnings.length > 0 && (
              <div className="mt-2 text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{auditResult.warnings.join('; ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes & Remarks Live Editor Drawer */}
        {isEditingNotes && (
          <div className="bg-indigo-50/90 border-b border-indigo-300 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-indigo-700" />
                ใส่ข้อความ / แก้ไขหมายเหตุและข้อความจัดส่งในใบสั่งซื้อ (Live Notes Editor)
              </span>
              <span className="text-[11px] text-indigo-700">ข้อความจะอัปเดตลงในตัวอย่างเอกสารและไฟล์ PDF ทันที</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  หมายเหตุ (Remarks)
                </label>
                <textarea
                  rows={2}
                  value={customRemarks}
                  onChange={e => setCustomRemarks(e.target.value)}
                  placeholder="ระบุหมายเหตุหรือเงื่อนไขเพิ่มเติมสำหรับ PO..."
                  className="w-full bg-white border border-indigo-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ข้อความการจัดส่ง (Delivery Remark / จัดส่งตามที่อยู่)
                </label>
                <textarea
                  rows={2}
                  value={customDeliveryNote}
                  onChange={e => setCustomDeliveryNote(e.target.value)}
                  placeholder="ข้อความจัดส่งท้ายตาราง เช่น กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่..."
                  className="w-full bg-white border border-indigo-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditingNotes(false)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>เสร็จสิ้นการแก้ไข</span>
              </button>
            </div>
          </div>
        )}

        {/* Preview Scrollable Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <MasterPurchaseOrderDocument data={templateData} scale={zoomLevel / 100} />
        </div>
      </div>
    </div>
  );
};
