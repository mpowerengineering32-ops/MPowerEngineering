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
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, SalesOrder } from '../../types';
import {
  prepareSalesOrderTemplateData,
  auditSalesOrderForMasterTemplate,
  generateSalesOrderMasterPDF,
  SalesOrderTemplateData
} from '../../utils/salesOrderPdfEngine';
import { MasterSalesOrderDocument } from './MasterSalesOrderDocument';

interface SalesOrderGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrder: SalesOrder | null;
  customer?: Customer;
  onToast: (msg: string, type: 'success' | 'err') => void;
}

export const SalesOrderGenerateModal: React.FC<SalesOrderGenerateModalProps> = ({
  isOpen,
  onClose,
  salesOrder,
  customer,
  onToast
}) => {
  if (!isOpen || !salesOrder) return null;

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showAuditDetails, setShowAuditDetails] = useState<boolean>(false);

  // 1. Prepare exact Master Template Data
  const templateData: SalesOrderTemplateData = useMemo(() => {
    return prepareSalesOrderTemplateData(salesOrder, customer);
  }, [salesOrder, customer]);

  // 2. Pre-Export Audit & Field Mapping Check (Rule 12 & 13)
  const auditResult = useMemo(() => {
    return auditSalesOrderForMasterTemplate(templateData);
  }, [templateData]);

  // 3. Download PDF (100% Geometry Matched via pdf-lib)
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const pdfBytes = await generateSalesOrderMasterPDF(templateData);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sale_Order_${templateData.so_no}_MPOWER_MASTER.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onToast(`ดาวน์โหลดเอกสาร Sale Order ${templateData.so_no} สำเร็จ (100% Match)`, 'success');
    } catch (err: any) {
      console.error('Export Sales Order PDF Error:', err);
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
      ['SALE ORDER'],
      [''],
      ['Customer :', templateData.customer_name, '', 'Sale Order No. :', templateData.so_no],
      ['Address :', templateData.customer_address_1, '', 'Date :', templateData.date],
      ['', templateData.customer_address_2, '', 'Terms of Payment :', templateData.terms_of_payment],
      ['Tax ID :', templateData.tax_id, '', 'Sales Name :', templateData.sales_name],
      ['Attn :', templateData.attn],
      ['Tel :', templateData.tel],
      [''],
      ['Quantity', 'Drescription', 'Unit Price (THB)', 'Amount (THB)'],
      ...templateData.items.map(it => [
        it.qty,
        it.details && it.details.length > 0 ? `${it.description}\n${it.details.join('\n')}` : it.description,
        it.unit_price,
        it.amount
      ]),
      ['', '** LAST ENTRY **', '', ''],
      [''],
      [templateData.baht_text_en, '', 'AMOUNT', templateData.subtotal],
      ['', '', 'SALES VAT 7%', templateData.vat],
      ['', '', 'TOTAL AMOUNT', templateData.grand_total],
      [''],
      ['Terms & Condition;'],
      ['- 30 days validily from date of quotation.'],
      ['- All prices above are quoted in THB.'],
      [''],
      ['Prepared By : ......................................................', '', '', 'Authorized Signature : ......................................................']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sale Order');
    XLSX.writeFile(wb, `Sale_Order_${templateData.so_no}.xlsx`);
    onToast(`ส่งออกข้อมูล Excel ${templateData.so_no} สำเร็จ`, 'success');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* ========================================================= */}
        {/* TOP MODAL HEADER (Toolbar with actions)                   */}
        {/* ========================================================= */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-400">
              <FileCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  <span>Sales Order Master Generator</span>
                  <span className="text-[11px] font-normal text-slate-400">(ระบบสร้างเอกสารแม่แบบ 100%)</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {templateData.so_no}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  1 ใบเท่านั้น (Single Order)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                สร้างจากข้อมูลระบบ CRM บรรจุลงใน Sale Order Master Template โดยตรงโดยไม่แก้ไข Layout
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
                  ? 'bg-indigo-600 text-white border-indigo-500'
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
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
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
        {/* AUDIT & FIELD MAPPING CHECKLIST (Rule 12 & 13)            */}
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
                AMOUNT: ฿{auditResult.subtotal.toLocaleString()} + VAT 7%: ฿{auditResult.vat.toLocaleString()} = TOTAL: ฿{auditResult.grandTotal.toLocaleString()}
              </span>
              {auditResult.missingSlotsInTemplate.length > 0 && (
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  มีข้อมูลที่ไม่มีช่องรองรับใน Template: {auditResult.missingSlotsInTemplate.length} รายการ (ระบบจะไม่แทรกช่องใหม่)
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
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono text-slate-600 font-bold">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(z => Math.min(150, z + 15))}
                className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                title="ขยาย"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1 text-[10px] text-slate-500 hover:bg-slate-100 rounded cursor-pointer ml-0.5 font-bold"
                title="ขนาดจริง 100%"
              >
                100%
              </button>
            </div>
          </div>

          {/* Expanded Audit Details Panel */}
          {showAuditDetails && (
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
              {/* Matched Fields */}
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="font-extrabold text-slate-900 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ฟิลด์ที่นำเข้าช่องใน Master Template ({auditResult.matchedSlots.length} จุด)</span>
                </div>
                <div className="space-y-1 mt-2 max-h-36 overflow-y-auto text-[11px]">
                  {auditResult.matchedSlots.map((slot, idx) => (
                    <div key={idx} className="flex justify-between items-center py-0.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">{slot.label}</span>
                      <span className="font-bold text-slate-800 text-right truncate max-w-[200px]" title={slot.value}>
                        {slot.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Slots in Master Template Notice (Rule 12 & 13) */}
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                <div className="font-extrabold text-amber-900 pb-1.5 border-b border-amber-200/60 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>การแจ้งเตือนตามกฎ Master Template (ข้อมูลที่ไม่มีช่องรองรับ)</span>
                </div>
                <p className="text-[10px] text-amber-800 mt-1.5 mb-2 leading-relaxed">
                  * กฎข้อที่ 12 & 13: "ถ้าข้อมูลจาก Database ไม่มีช่องรองรับใน Template ห้ามสร้างช่องใหม่เอง ให้แจ้งว่า ไม่มีช่องรองรับข้อมูลนี้ใน Master Template"
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto text-[11px]">
                  {auditResult.missingSlotsInTemplate.map((miss, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg border border-amber-200 text-slate-800">
                      <div className="font-bold text-amber-950 flex items-center justify-between">
                        <span>{miss.label}</span>
                        <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                          ไม่มีช่องในแม่แบบ
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5 truncate">
                        ค่าใน Database: <span className="font-semibold text-slate-800">"{miss.dbValue}"</span>
                      </div>
                      <div className="text-[9.5px] text-amber-700 italic mt-0.5">
                        {miss.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* DOCUMENT PREVIEW CANVAS (Exact Replica of Master Template)*/}
        {/* ========================================================= */}
        <div className="p-6 overflow-y-auto bg-slate-200/70 print:bg-white print:p-0 flex-1 flex justify-center">
          <MasterSalesOrderDocument
            data={templateData}
            scale={zoomLevel / 100}
          />
        </div>

      </div>
    </div>
  );
};
