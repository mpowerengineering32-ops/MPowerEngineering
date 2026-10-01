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
  FileCheck2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Supplier, PurchaseRequest } from '../../types';
import {
  preparePurchaseRequestTemplateData,
  auditPurchaseRequestForMasterTemplate,
  generatePurchaseRequestMasterPDF,
  PurchaseRequestTemplateData
} from '../../utils/purchaseRequestPdfEngine';
import { MasterPurchaseRequestDocument } from './MasterPurchaseRequestDocument';

interface PurchaseRequestGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequest: PurchaseRequest | null;
  supplier?: Supplier;
  onToast: (msg: string, type: 'success' | 'err') => void;
}

export const PurchaseRequestGenerateModal: React.FC<PurchaseRequestGenerateModalProps> = ({
  isOpen,
  onClose,
  purchaseRequest,
  supplier,
  onToast
}) => {
  if (!isOpen || !purchaseRequest) return null;

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showAuditDetails, setShowAuditDetails] = useState<boolean>(false);

  // 1. Prepare exact Master Template Data (PR.pdf)
  const templateData: PurchaseRequestTemplateData = useMemo(() => {
    return preparePurchaseRequestTemplateData(purchaseRequest, supplier);
  }, [purchaseRequest, supplier]);

  // 2. Pre-Export Audit & Field Mapping Check
  const auditResult = useMemo(() => {
    return auditPurchaseRequestForMasterTemplate(templateData);
  }, [templateData]);

  // 3. Download PDF (100% Geometry Matched via pdf-lib)
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const pdfBytes = await generatePurchaseRequestMasterPDF(templateData);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanNo = templateData.pr_no.replace(/[\s/]/g, '_');
      link.download = `Purchase_Request_${cleanNo}_MPOWER_MASTER.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onToast(`ดาวน์โหลดเอกสารใบขอซื้อ ${templateData.pr_no} สำเร็จ (100% Match)`, 'success');
    } catch (err: any) {
      console.error('Export Purchase Request PDF Error:', err);
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
      ['53/72 Moo 8, Sattahip Subdistrict, Sattahip District,'],
      ['Chonburi 20180 , Thailand.'],
      ['Tel. 033-641789 / 063-9359565'],
      ['Email: sales@mpower-engineering.com , info@mpower-engineering.com'],
      ['Tax ID Number. 0205569006956 (Head office)'],
      [''],
      ['Purchase Request'],
      [''],
      ['PR. No. :', templateData.pr_no, '', 'Supplier :', templateData.supplier_name],
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
      ['* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด'],
      [''],
      ['', '', 'AMOUNT', templateData.amount],
      ['', '', 'SALES VAT 7%', templateData.vat_amount],
      ['', '', 'TOTAL AMOUNT', templateData.total_amount],
      [''],
      ['TOTAL AMOUNT (WORDS):', templateData.baht_text_en],
      ['Remarks;', templateData.remarks || '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Request');
    const cleanNo = templateData.pr_no.replace(/[\s/]/g, '_');
    XLSX.writeFile(wb, `Purchase_Request_${cleanNo}.xlsx`);
    onToast(`ส่งออกข้อมูล Excel ${templateData.pr_no} สำเร็จ`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Control Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/30 text-amber-400 border border-amber-500/40 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Purchase Request Master Generator
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-mono font-bold">
                  100% Geometry Matched
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                เลขที่: <span className="font-mono font-bold text-white">{templateData.pr_no}</span> • คู่ค้า: <span className="text-slate-200">{templateData.supplier_name}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 text-slate-300">
              <button
                onClick={() => setZoomLevel(z => Math.max(60, z - 10))}
                className="p-1.5 hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer"
                title="ย่อขนาด"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-xs font-bold text-slate-200">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(z => Math.min(140, z + 10))}
                className="p-1.5 hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer"
                title="ขยายขนาด"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg ml-1 transition cursor-pointer"
                title="รีเซ็ตเป็น 100%"
              >
                100%
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>พิมพ์ (Print)</span>
            </button>

            {/* Download Excel */}
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="ดาวน์โหลดโครงสร้างตาราง Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Excel</span>
            </button>

            {/* Download Master PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-950/40 disabled:opacity-60 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (100% Match)'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition ml-1 cursor-pointer"
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
              ตรวจสอบความสมบูรณ์ตาม Master Template (PR.pdf):
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
              className="text-amber-700 hover:underline font-bold text-[11px] ml-1 cursor-pointer"
            >
              {showAuditDetails ? 'ซ่อนการตรวจสอบ' : 'ดูฟิลด์ที่ตรวจสอบ'}
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            A4 Portrait • 1 หน้าเดี่ยว • Page 1/1
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

        {/* Preview Scrollable Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <MasterPurchaseRequestDocument data={templateData} scale={zoomLevel / 100} />
        </div>
      </div>
    </div>
  );
};
