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
  FileCheck,
  Receipt,
  Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, BillingNote, Invoice } from '../../types';
import {
  prepareBillingNoteTemplateData,
  auditBillingNoteForMasterTemplate,
  generateBillingNoteMasterPDF,
  BillingNoteTemplateData
} from '../../utils/billingNotePdfEngine';
import { MasterBillingNoteDocument } from './MasterBillingNoteDocument';

interface BillingNoteGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingNote: BillingNote | null;
  customer?: Customer;
  invoices?: Invoice[];
  onToast: (msg: string, type: 'success' | 'err') => void;
}

export const BillingNoteGenerateModal: React.FC<BillingNoteGenerateModalProps> = ({
  isOpen,
  onClose,
  billingNote,
  customer,
  invoices = [],
  onToast
}) => {
  if (!isOpen || !billingNote) return null;

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showAuditDetails, setShowAuditDetails] = useState<boolean>(false);

  // 1. Prepare exact Master Template Data
  const templateData: BillingNoteTemplateData = useMemo(() => {
    return prepareBillingNoteTemplateData(billingNote, customer, invoices);
  }, [billingNote, customer, invoices]);

  // 2. Pre-Export Audit & Field Mapping Check
  const auditResult = useMemo(() => {
    return auditBillingNoteForMasterTemplate(templateData);
  }, [templateData]);

  // 3. Download PDF (100% Geometry Matched via pdf-lib)
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const pdfBytes = await generateBillingNoteMasterPDF(templateData);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanNo = templateData.billing_no.replace(/[\s/]/g, '_');
      link.download = `Billing_Note_${cleanNo}_MPOWER_MASTER.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onToast(`ดาวน์โหลดเอกสารใบวางบิล ${templateData.billing_no} สำเร็จ (100% Match)`, 'success');
    } catch (err: any) {
      console.error('Export Billing Note PDF Error:', err);
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
      ['53/72 Moo.8 , T. Sattahip, A. Sattahip, Chonburi 20180'],
      ['Tel.: 033 - 641789 / 063-9968789'],
      ['E-mail : account@mpower-engineering.com'],
      [''],
      ['ใบวางบิล / Billing'],
      ['Document Receipt'],
      [''],
      ['NO.', templateData.billing_no, '', 'Date :', templateData.date],
      ['Customer :', templateData.customer_name],
      ['Address :', templateData.customer_address_1],
      ['', templateData.customer_address_2],
      [''],
      ['NO.', 'Ref. No.', 'Invoice No.', 'Date', 'Amount'],
      ...templateData.items.map(it => [
        it.no,
        it.ref_no || '-',
        it.invoice_no,
        it.date,
        it.amount
      ]),
      ['', '', '** LAST ENTRY **', '', ''],
      [''],
      ['( ' + templateData.baht_text_thai + ' )', '', '', 'Total', templateData.total],
      [''],
      ['Due of Payment :', templateData.due_of_payment],
      [''],
      ['Delivered by :', templateData.delivered_by, '', 'Received by :', templateData.received_by || '-'],
      ['Date :', templateData.delivered_date, '', 'Date :', templateData.received_date || '-'],
      [''],
      ['หมายเหตุ / Remark :'],
      ['1. กรุณาโอนเงินเข้าบัญชี หรือจ่ายเช็คสั่งจ่ายในนาม "บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด"'],
      ['2. กรณีจ่ายเช็คกรุณาระบุวันนัดรับเช็ค หรือชำระเงินตามกำหนด Due of Payment']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Billing Note');
    const cleanNo = templateData.billing_no.replace(/[\s/]/g, '_');
    XLSX.writeFile(wb, `Billing_Note_${cleanNo}.xlsx`);
    onToast(`ส่งออกข้อมูล Excel ${templateData.billing_no} สำเร็จ`, 'success');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* ========================================================= */}
        {/* TOP MODAL HEADER (Toolbar with actions)                   */}
        {/* ========================================================= */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  <span>Billing Note Master Generator</span>
                  <span className="text-[11px] font-normal text-slate-400">(ระบบสร้างใบวางบิลแม่แบบ 100%)</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {templateData.billing_no}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  1 ใบเท่านั้น (Single Document Guard)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ดึงข้อมูลจากระบบ CRM บรรจุลงใน Billing Note Master Template ต้นฉบับ 100%
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Toggle Audit Checklist */}
            <button
              onClick={() => setShowAuditDetails(!showAuditDetails)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                showAuditDetails
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="ตรวจสอบการจับคู่ฟิลด์ Mapping และข้อจำกัด Master Template"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{showAuditDetails ? 'ซ่อนการตรวจสอบ' : 'ตรวจสอบฟิลด์'}</span>
            </button>

            {/* Download Excel */}
            <button
              onClick={handleDownloadExcel}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="ส่งออกไฟล์ Excel ตามพิกัดเซลล์"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="ดาวน์โหลด PDF โครงสร้างตรงกับ Master Template 100%"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'กำลังสร้าง PDF...' : 'Download PDF (100% Match)'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="พิมพ์เอกสาร A4 (Print)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>พิมพ์</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* AUDIT & FIELD MAPPING CHECKLIST                           */}
        {/* ========================================================= */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 text-xs shrink-0 print:hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                สถานะการตรวจสอบ Master Template:
              </span>
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                จับคู่ฟิลด์สำเร็จ: {auditResult.matchedSlots.length} จุด
              </span>
              <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                Total: ฿{auditResult.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              {auditResult.missingSlotsInTemplate.length > 0 && (
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  มีข้อมูลที่ไม่มีช่องรองรับใน Template: {auditResult.missingSlotsInTemplate.length} รายการ (รักษา Layout เดิม 100%)
                </span>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs shrink-0">
              <button
                onClick={() => setZoomLevel(z => Math.max(75, z - 15))}
                className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                title="ย่อ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-[11px] font-mono font-bold text-slate-700">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(z => Math.min(130, z + 15))}
                className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                title="ขยาย"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Audit Drawer */}
          {showAuditDetails && (
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
              {/* Left: Matched Slots */}
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <h4 className="font-extrabold text-[11px] text-slate-800 mb-2 flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  รายการฟิลด์ที่เชื่อมโยงตรงกับ Master Template:
                </h4>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {auditResult.matchedSlots.map((slot, sIdx) => (
                    <div key={sIdx} className="flex items-center justify-between text-[10.5px] py-0.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">{slot.label}</span>
                      <span className="font-mono text-slate-800 font-bold truncate max-w-[200px]">{slot.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Warnings / Database fields without slot */}
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <h4 className="font-extrabold text-[11px] text-slate-800 mb-2 flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ฟิลด์ในระบบที่ไม่มีช่องรองรับใน Template (ไม่แทรกช่องเพิ่ม):
                </h4>
                {auditResult.missingSlotsInTemplate.length > 0 ? (
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {auditResult.missingSlotsInTemplate.map((miss, mIdx) => (
                      <div key={mIdx} className="text-[10.5px] bg-amber-50/60 p-1.5 rounded border border-amber-100 text-amber-900">
                        <div className="font-bold">{miss.label}: <span className="font-normal font-mono">{miss.dbValue}</span></div>
                        <div className="text-[9.5px] text-amber-700 mt-0.5">{miss.reason}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-[10.5px] py-4 text-center">
                    ไม่มีฟิลด์ตกหล่น ทุกข้อมูลถูกจัดวางสมบูรณ์
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* DOCUMENT PREVIEW CANVAS (A4 Sheet 100% Geometry Matched)  */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <MasterBillingNoteDocument data={templateData} scale={zoomLevel / 100} />
        </div>
      </div>
    </div>
  );
};
