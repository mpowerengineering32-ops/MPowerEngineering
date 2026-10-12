import React, { useState, useMemo } from 'react';
import { PurchaseRequest, PurchaseOrder } from '../../types';
import { numberToThaiBaht } from '../../utils/numberWords';
import { Printer, Download, X, FileText, ShoppingCart, CheckCircle2, ShieldCheck, Building2, Calendar, UserCheck } from 'lucide-react';
import { MasterPurchaseOrderDocument } from '../purchase-order/MasterPurchaseOrderDocument';
import { preparePurchaseOrderTemplateData, generatePurchaseOrderMasterPDF, PurchaseOrderTemplateData } from '../../utils/purchaseOrderPdfEngine';
import { MasterPurchaseRequestDocument } from '../purchase-request/MasterPurchaseRequestDocument';
import { preparePurchaseRequestTemplateData, generatePurchaseRequestMasterPDF, PurchaseRequestTemplateData } from '../../utils/purchaseRequestPdfEngine';

export type PRTemplateType = 'PR_INTERNAL' | 'PR_PROJECT' | 'PR_SERVICE';

interface PurchaseDocumentTemplateProps {
  documentType: 'PR' | 'PO';
  data: PurchaseRequest | PurchaseOrder;
  onClose?: () => void;
  isModal?: boolean;
}

export const PurchaseDocumentTemplate: React.FC<PurchaseDocumentTemplateProps> = ({
  documentType,
  data,
  onClose,
  isModal = true,
}) => {
  const [prTemplateType, setPrTemplateType] = useState<PRTemplateType>('PR_PROJECT');
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const isPR = documentType === 'PR';
  const pr = isPR ? (data as PurchaseRequest) : null;
  const po = !isPR ? (data as PurchaseOrder) : null;

  // Master Template Data for PO
  const poTemplateData: PurchaseOrderTemplateData | null = useMemo(() => {
    if (isPR || !po) return null;
    return preparePurchaseOrderTemplateData(po);
  }, [isPR, po]);

  // Master Template Data for PR
  const prTemplateData: PurchaseRequestTemplateData | null = useMemo(() => {
    if (!isPR || !pr) return null;
    return preparePurchaseRequestTemplateData(pr);
  }, [isPR, pr]);

  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true);
      if (isPR && prTemplateData) {
        const pdfBytes = await generatePurchaseRequestMasterPDF(prTemplateData);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanNo = prTemplateData.pr_no.replace(/[\s/]/g, '_');
        a.download = `Purchase_Request_${cleanNo}_MPOWER_MASTER.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (!isPR && poTemplateData) {
        const pdfBytes = await generatePurchaseOrderMasterPDF(poTemplateData);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanNo = poTemplateData.po_no.replace(/[\s/]/g, '_');
        a.download = `Purchase_Order_${cleanNo}_MPOWER_MASTER.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const totalAmount = Number(data.total_amount) || 0;
  const subtotal = totalAmount / 1.07;
  const vatAmount = totalAmount - subtotal;
  const thaiBahtText = numberToThaiBaht(totalAmount);

  // Normalizing items
  const items = data.items && data.items.length > 0
    ? data.items
    : [
        {
          id: 'item-1',
          item_name: 'Seamless Steel Pipe ASTM A106 Gr.B 2" Sch.40',
          description: 'ท่อเหล็กไร้ตะเข็บมาตรฐาน ASTM A106 เกรด B ขนาด 2 นิ้ว พร้อม Mill Test Certificate',
          quantity: 20,
          unit: 'ท่อน (Lengths)',
          unit_price: 3200,
          total_price: 64000,
        },
        {
          id: 'item-2',
          item_name: 'Forged Steel Flange Class 300 WNRF 2"',
          description: 'หน้าแปลนเหล็กเหนียว Weld Neck Class 300 ขนาด 2 นิ้ว สำหรับแรงดันสูง',
          quantity: 10,
          unit: 'ตัว (Pcs)',
          unit_price: 1850,
          total_price: 18500,
        }
      ];

  const content = (
    <div className="procurement-template-container bg-white text-slate-800 rounded-none w-full max-w-[210mm] mx-auto p-8 sm:p-10 shadow-lg print:shadow-none print:p-0 print:m-0 print:max-w-none text-xs leading-normal">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 12mm 12mm 12mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, aside, footer, #navbar-shell, #sidebar-shell, .app-sidebar {
            display: none !important;
          }
          .procurement-template-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Corporate Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex items-start gap-4">
          <img
            src="/mpower-logo.png"
            alt="M Power Engineering Solutions Logo"
            className="w-40 h-auto object-contain shrink-0 pt-0.5"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://lh3.googleusercontent.com/d/1DWDy98ToKToCLyb-1rI6U7k_aoNayq1Q';
            }}
          />
          <div className="text-[10px] text-slate-700 leading-tight">
            <h1 className="text-[13px] font-black text-slate-950 tracking-wide uppercase">
              M Power Engineering Solutions Co., Ltd.
            </h1>
            <p className="font-bold text-slate-900 text-[11px]">
              บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด (สำนักงานใหญ่)
            </p>
            <p className="text-slate-600 mt-0.5">
              53/72 หมู่ที่ 8 ต.สัตหีบ อ.สัตหีบ จ.ชลบุรี 20180 (53/72 Moo 8, Sattahip, Sattahip, Chonburi 20180)
            </p>
            <p className="text-slate-600">
              โทร. 033-641789, 063-935-9565 | อีเมล: procurement@mpower-engineering.com
            </p>
            <p className="font-bold text-slate-800">
              เลขประจำตัวผู้เสียภาษีอากร (Tax ID): <span className="font-mono tracking-wider">0205569006956</span>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="inline-block border-2 border-slate-900 text-white font-black text-xs px-3 py-1 uppercase tracking-wider rounded-xs bg-amber-700">
            {prTemplateType === 'PR_PROJECT' ? 'PROJECT PR / ขอซื้อโครงการ' :
             prTemplateType === 'PR_SERVICE' ? 'SERVICE PR / จ้างบริการ' : 'INTERNAL PR / ขอซื้อทั่วไป'}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1 font-mono">
            PR NO: {(data as PurchaseRequest).pr_no}
          </div>
        </div>
      </div>

      {/* Document Title */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-black text-slate-950 tracking-widest uppercase">
          {isPR ? 'ใบขอซื้อสินค้า / จ้างบริการ (PURCHASE REQUEST)' : 'ใบสั่งซื้อสินค้า / บริการ (PURCHASE ORDER)'}
        </h2>
        <p className="text-[10px] text-slate-500 font-medium">
          {isPR
            ? 'เอกสารเสนอขออนุมัติจัดซื้อจัดจ้างสำหรับโครงการและงานวิศวกรรม'
            : 'เอกสารข้อตกลงสั่งซื้อสินค้าและจ้างงานบริการอย่างเป็นทางการตามมาตรฐานวิศวกรรม'}
        </p>
      </div>

      {/* Two Column Metadata Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-800 p-3 rounded-none mb-4 bg-slate-50/50 text-[11px]">
        {/* Left Column: Vendor / Requestor Details */}
        <div className="space-y-1">
          <div className="font-bold text-slate-950 uppercase text-[10px] text-slate-500 border-b border-slate-300 pb-0.5 mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-700" />
            {isPR ? 'ข้อมูลผู้เสนอขอซื้อ / คู่ค้าแนะนำ (Requestor & Supplier)' : 'ข้อมูลผู้ขาย / ผู้รับจ้าง (Vendor Information)'}
          </div>

          {isPR ? (
            <>
              <div className="flex">
                <span className="w-28 font-bold text-slate-700 shrink-0">ผู้ขอซื้อ (Requested By):</span>
                <span className="font-bold text-slate-950">{pr?.requested_by || 'วิศวกรประจำโครงการ (Project Engineer)'}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold text-slate-700 shrink-0">แผนก (Department):</span>
                <span className="text-slate-800">{pr?.department || 'ฝ่ายวิศวกรรมและโครงการ (Engineering & Projects)'}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold text-slate-700 shrink-0">คู่ค้าที่แนะนำ:</span>
                <span className="font-bold text-indigo-900">{pr?.supplier_name || 'บริษัท สยามฟิตติ้ง แอนด์ วาล์ว จำกัด'}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold text-slate-700 shrink-0">ความเร่งด่วน:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  (pr as any)?.urgency === 'High' || (pr as any)?.urgency === 'Critical'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-slate-200 text-slate-800'
                }`}>
                  {(pr as any)?.urgency || 'Normal (ปกติ)'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex">
                <span className="w-28 font-bold text-slate-700 shrink-0">ผู้ขาย (Vendor):</span>
                <span className="font-bold text-slate-950">{po?.supplier_name || 'บริษัท สยามสตีลไพพ์ จำกัด'}</span>
              </div>
              <div className="flex items-start">
                <span className="w-28 font-bold text-slate-700 shrink-0">ที่อยู่ (Address):</span>
                <span className="text-slate-800 leading-snug break-words break-all whitespace-pre-wrap">{po?.supplier_address || '123/45 นิคมอุตสาหกรรมมาบตาพุด ต.มาบตาพุด อ.เมือง จ.ระยอง 21150'}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold text-slate-700 shrink-0">เลขประจำตัวผู้เสียภาษี:</span>
                <span className="font-mono font-bold text-slate-900">{po?.supplier_tax_id || '0105554098231'}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold text-slate-700 shrink-0">ผู้ติดต่อ / โทรศัพท์:</span>
                <span className="text-slate-800">{(po as any)?.contact_person || 'คุณประสิทธิ์'} โทร. {po?.supplier_phone || '038-684900'}</span>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Document Details */}
        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-300 md:pl-4">
          <div className="font-bold text-slate-950 uppercase text-[10px] text-slate-500 border-b border-slate-300 pb-0.5 mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-700" />
            {isPR ? 'รายละเอียดคำขอซื้อ (PR Metadata)' : 'รายละเอียดใบสั่งซื้อ (PO Metadata)'}
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-700 shrink-0">{isPR ? 'เลขที่ PR (PR No.):' : 'เลขที่ PO (PO No.):'}</span>
            <span className="font-mono font-black text-slate-950 text-xs">{isPR ? pr?.pr_no : po?.po_no}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-700 shrink-0">วันที่ออกเอกสาร (Date):</span>
            <span className="font-mono text-slate-900">{isPR ? pr?.pr_date || (pr as any)?.date : po?.po_date || (po as any)?.date}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-700 shrink-0">{isPR ? 'ต้องการใช้วันที่:' : 'กำหนดส่งมอบ (Delivery):'}</span>
            <span className="font-mono font-bold text-rose-800">
              {isPR ? pr?.required_date || '2026-07-20' : (po as any)?.delivery_date || '2026-07-25'}
            </span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-700 shrink-0">โครงการ / ลูกค้าอ้างอิง:</span>
            <span className="font-medium text-slate-900 truncate">
              {isPR ? pr?.ref_customer || (pr as any)?.project || 'โครงการซ่อมบำรุงโรงแยกก๊าซ' : (po as any)?.ref_customer || (po as any)?.project || 'โครงการติดตั้งท่อก๊าซธรรมชาติ'}
            </span>
          </div>
          {!isPR && (
            <>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700 shrink-0">เงื่อนไขการชำระเงิน:</span>
                <span className="text-slate-800">{po?.payment_term || 'เครดิต 30 วัน (Credit 30 Days)'}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700 shrink-0">สถานที่จัดส่ง:</span>
                <span className="text-slate-800">{(po as any)?.delivery_location || 'คลังสินค้า M Power สัตหีบ ชลบุรี'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items Table with Full Grid Lines (Headers, Rows, Dividers) */}
      <div className="border border-black mb-3 overflow-hidden">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-center border-b border-black">
              <th className="py-2.5 px-2 border-r border-black w-10">ลำดับ<br/><span className="text-[9px] font-normal text-slate-300">No.</span></th>
              <th className="py-2.5 px-3 border-r border-black text-left">รายละเอียดสินค้า / บริการ / ข้อมูลจำเพาะ<br/><span className="text-[9px] font-normal text-slate-300">Item Description & Technical Specifications</span></th>
              <th className="py-2.5 px-2 border-r border-black w-20 text-center">จำนวน<br/><span className="text-[9px] font-normal text-slate-300">Qty</span></th>
              <th className="py-2.5 px-2 border-r border-black w-20 text-center">หน่วย<br/><span className="text-[9px] font-normal text-slate-300">Unit</span></th>
              <th className="py-2.5 px-3 border-r border-black text-right w-28">ราคาต่อหน่วย<br/><span className="text-[9px] font-normal text-slate-300">Unit Price</span></th>
              <th className="py-2.5 px-3 text-right w-32">จำนวนเงิน (บาท)<br/><span className="text-[9px] font-normal text-slate-300">Amount (THB)</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any, idx: number) => {
              const qty = Number(it.quantity) || 1;
              const unitPrice = Number(it.unit_price) || 0;
              const itemTotal = Number(it.total_price) || qty * unitPrice;
              return (
                <tr key={it.id || idx} className="hover:bg-slate-50">
                  <td className="py-2 px-2 text-center font-mono border-r border-black text-slate-700" style={{ borderRight: '1px solid #000' }}>{idx + 1}</td>
                  <td className="py-2 px-3 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                    <div className="font-bold text-slate-900">{it.item_name}</div>
                    {it.description && (
                      <div className="text-[10px] text-slate-600 leading-tight mt-0.5">{it.description}</div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 border-r border-black" style={{ borderRight: '1px solid #000' }}>{qty.toLocaleString()}</td>
                  <td className="py-2 px-2 text-center text-slate-700 border-r border-black" style={{ borderRight: '1px solid #000' }}>{it.unit || 'ชุด'}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                    ฿{unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                    ฿{itemTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
            {/* Blank filler rows with continuous vertical dividers */}
            {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
              <tr key={`proc-fill-${i}`} className="h-7 text-transparent">
                <td className="border-r border-black" style={{ borderRight: '1px solid #000' }}>.</td>
                <td className="border-r border-black" style={{ borderRight: '1px solid #000' }}>.</td>
                <td className="border-r border-black" style={{ borderRight: '1px solid #000' }}>.</td>
                <td className="border-r border-black" style={{ borderRight: '1px solid #000' }}>.</td>
                <td className="border-r border-black" style={{ borderRight: '1px solid #000' }}>.</td>
                <td>.</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {/* Subtotal */}
            <tr className="border-t border-black bg-slate-50 font-bold">
              <td colSpan={4} rowSpan={3} className="py-2 px-3 border-r border-black align-top text-slate-700">
                <div className="text-[10.5px]">
                  <span className="font-semibold text-slate-600">จำนวนเงินรวมทั้งสิ้น (ตัวอักษร):</span>
                  <div className="text-slate-950 font-bold underline decoration-slate-400 mt-1">
                    {thaiBahtText}
                  </div>
                  {isPR && ((pr as any)?.notes || (pr as any)?.remarks) && (
                    <div className="mt-2 text-[10px] text-slate-600">
                      <b>เหตุผลความจำเป็นในการขอซื้อ:</b> {(pr as any)?.notes || (pr as any)?.remarks}
                    </div>
                  )}
                  {!isPR && (
                    <div className="mt-2 text-[10px] text-slate-600">
                      <b>หมายเหตุ:</b> ผู้ขายต้องส่งมอบเอกสาร Mill Test Certificate พร้อมสินค้า
                    </div>
                  )}
                </div>
              </td>
              <td className="py-1.5 px-3 text-right border-r border-black text-slate-700">ยอดรวมก่อนภาษี:</td>
              <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                ฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            {/* VAT 7% */}
            <tr className="bg-slate-50 font-bold border-t border-black">
              <td className="py-1.5 px-3 text-right border-r border-black text-slate-700">ภาษีมูลค่าเพิ่ม 7%:</td>
              <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                ฿{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            {/* Grand Total */}
            <tr className="bg-slate-100 font-black border-t border-black">
              <td className="py-2 px-3 text-right border-r border-black text-slate-950">ยอดสุทธิทั้งสิ้น:</td>
              <td className="py-2 px-3 text-right font-mono text-base text-slate-950">
                ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Terms & Conditions (For PO) */}
      {!isPR && (
        <div className="border border-slate-300 bg-slate-50 p-2.5 text-[10px] mb-4">
          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
            ข้อกำหนดและเงื่อนไขการสั่งซื้อ (Terms & Conditions):
          </div>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-700 leading-snug">
            <li>ใบส่งของ/ใบกำกับภาษี และหีบห่อบรรจุภัณฑ์ ต้องระบุเลขที่ใบสั่งซื้อ (PO No.) นี้อย่างชัดเจนทุกครั้ง</li>
            <li>สินค้าต้องตรงตามมาตรฐานวิศวกรรม มีสภาพสมบูรณ์ พร้อมเอกสารรับรองคุณภาพการทดสอบ (Inspection/Certificate)</li>
            <li>การวางบิลต้องแนบใบสั่งซื้อต้นฉบับและใบรับสินค้าที่ลงนามถูกต้อง โดยส่งเอกสารภายในวันที่ 25-30 ของเดือน</li>
            <li>บริษัทฯ สงวนสิทธิ์ในการปฏิเสธการรับสินค้าหากไม่เป็นไปตามข้อกำหนดหรือส่งมอบเกินกำหนดเวลา</li>
          </ol>
        </div>
      )}

      {/* Signature Workflows */}
      {isPR ? (
        /* 4-Tier PR Approval Matrix */
        <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px]">
          <div className="border border-slate-400 p-2 flex flex-col justify-between min-h-[95px] bg-slate-50/40">
            <div className="font-bold text-slate-900 uppercase">1. ผู้ขอซื้อ / Requested By</div>
            <div className="my-1 w-4/5 mx-auto pt-4 text-slate-500 font-mono text-[9px]">
              ({pr?.requested_by || 'วิศวกรโครงการ'})
            </div>
            <div className="text-slate-600">วันที่: {pr?.pr_date || '....../....../......'}</div>
          </div>
          <div className="border border-slate-400 p-2 flex flex-col justify-between min-h-[95px] bg-slate-50/40">
            <div className="font-bold text-slate-900 uppercase">2. หัวหน้าฝ่าย / Dept Head</div>
            <div className="my-1 w-4/5 mx-auto pt-4 text-slate-500 font-mono text-[9px]">
              (ผู้จัดการโครงการ / วิศวกรรม)
            </div>
            <div className="text-slate-600">วันที่: {pr?.pr_date || '....../....../......'}</div>
          </div>
          <div className="border border-slate-400 p-2 flex flex-col justify-between min-h-[95px] bg-slate-50/40">
            <div className="font-bold text-slate-900 uppercase">3. เจ้าหน้าที่จัดซื้อ / Procurement</div>
            <div className="my-1 w-4/5 mx-auto pt-4 text-slate-500 font-mono text-[9px]">
              (ตรวจสอบราคาและงบประมาณ)
            </div>
            <div className="text-slate-600">วันที่: {pr?.pr_date || '....../....../......'}</div>
          </div>
          <div className="border border-slate-400 p-2 flex flex-col justify-between min-h-[95px] bg-slate-50/40">
            <div className="font-bold text-slate-900 uppercase">4. ผู้อนุมัติ / Final Approval</div>
            <div className="my-1 w-4/5 mx-auto pt-4 text-slate-500 font-mono text-[9px]">
              (กรรมการผู้จัดการ)
            </div>
            <div className="text-slate-600">วันที่: {pr?.pr_date || '....../....../......'}</div>
          </div>
        </div>
      ) : (
        /* 3-Block PO Signatures */
        <div className="grid grid-cols-3 gap-3 pt-2 text-center text-[10.5px]">
          <div className="border border-slate-400 p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/40">
            <div className="font-bold text-slate-900 uppercase text-[10px]">
              เจ้าหน้าที่จัดซื้อ / Purchasing Officer
            </div>
            <div className="my-2 w-3/4 mx-auto pt-6 text-slate-500 font-mono text-[10px]">
              (ศรัญญา พานิชย์ / จัดซื้อ)
            </div>
            <div className="text-[10px] text-slate-600">
              วันที่: {po?.po_date || '......../......../........'}
            </div>
          </div>

          <div className="border border-slate-400 p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/40">
            <div className="font-bold text-slate-900 uppercase text-[10px]">
              ผู้มีอำนาจสั่งซื้อ / Authorized Signatory
            </div>
            <div className="my-2 w-3/4 mx-auto pt-6 text-slate-500 font-mono text-[10px]">
              (กรรมการผู้จัดการ / ประทับตรา)
            </div>
            <div className="text-[10px] text-slate-600">
              วันที่: {po?.po_date || '......../......../........'}
            </div>
          </div>

          <div className="border border-slate-400 p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/40">
            <div className="font-bold text-slate-900 uppercase text-[10px]">
              ผู้ขายยืนยันคำสั่งซื้อ / Vendor Acknowledged
            </div>
            <div className="my-2 w-3/4 mx-auto pt-6 text-slate-500 font-mono text-[10px]">
              (ลงนามผู้รับคำสั่งซื้อ / ประทับตรา)
            </div>
            <div className="text-[10px] text-slate-600">
              วันที่: ......./......./.......
            </div>
          </div>
        </div>
      )}

      {/* Footer System Note */}
      <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between text-[9px] text-slate-400">
        <span>เอกสารทางการ M Power Engineering Solutions Co., Ltd. ระบบจัดซื้อและพัสดุ</span>
        <span>{isPR ? `PR: ${(data as PurchaseRequest).pr_no}` : `PO: ${(data as PurchaseOrder).po_no}`} • หน้า 1 จาก 1</span>
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              {isPR ? <FileText className="w-4 h-4 text-amber-600" /> : <ShoppingCart className="w-4 h-4 text-indigo-600" />}
              {isPR ? 'เทมเพลตใบขอซื้อ (PR):' : 'เทมเพลตใบสั่งซื้อ (PO):'}
            </span>
            <span className="font-mono text-slate-900 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              {isPR ? (data as PurchaseRequest).pr_no : (data as PurchaseOrder).po_no}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sub-template Switcher (Only for PR) */}
            {isPR && (
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPrTemplateType('PR_PROJECT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    prTemplateType === 'PR_PROJECT' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  ขอซื้อโครงการ
                </button>
                <button
                  type="button"
                  onClick={() => setPrTemplateType('PR_SERVICE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    prTemplateType === 'PR_SERVICE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  ขอจัดจ้างบริการ
                </button>
                <button
                  type="button"
                  onClick={() => setPrTemplateType('PR_INTERNAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    prTemplateType === 'PR_INTERNAL' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  ขอซื้อทั่วไป
                </button>
              </div>
            )}

            {!isPR && (
              <button
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPDF ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (100% Match)'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className={`px-4 py-2 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer text-white shadow-xs ${
                isPR ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์แบบฟอร์ม / Print A4</span>
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-slate-100/60 p-4 sm:p-6 rounded-2xl border border-slate-200 flex justify-center overflow-x-auto">
          {isPR ? <MasterPurchaseRequestDocument data={prTemplateData!} /> : <MasterPurchaseOrderDocument data={poTemplateData!} />}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-[220mm] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto print:shadow-none print:border-none print:max-w-none print:max-h-none print:rounded-none">
        {/* Header Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl ${isPR ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-900 text-white'}`}>
              {isPR ? <FileText className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {isPR ? 'แบบฟอร์มเทมเพลตใบขอซื้อ (Purchase Request Form)' : 'Purchase Order Master Template (PO.pdf 100%)'}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                {isPR ? (data as PurchaseRequest).pr_no : (data as PurchaseOrder).po_no}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* PR Template Selector (Only shown for PR) */}
            {isPR && (
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPrTemplateType('PR_PROJECT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    prTemplateType === 'PR_PROJECT' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  ขอซื้อโครงการ
                </button>
                <button
                  type="button"
                  onClick={() => setPrTemplateType('PR_SERVICE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    prTemplateType === 'PR_SERVICE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  ขอจ้างบริการ
                </button>
                <button
                  type="button"
                  onClick={() => setPrTemplateType('PR_INTERNAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    prTemplateType === 'PR_INTERNAL' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  ขอซื้อทั่วไป
                </button>
              </div>
            )}

            {/* Download PDF Button (100% Match) */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className={`px-3.5 py-1.5 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60 ${
                isPR ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (100% Match)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className={`px-3.5 py-1.5 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isPR ? 'bg-amber-700 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ / Print A4</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Printable Document Canvas */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/50 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {isPR ? (
            <MasterPurchaseRequestDocument data={prTemplateData!} />
          ) : (
            <MasterPurchaseOrderDocument data={poTemplateData!} />
          )}
        </div>
      </div>
    </div>
  );
};
