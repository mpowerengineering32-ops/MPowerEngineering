import React, { useState } from 'react';
import { BillingNote } from '../../types';
import { numberToThaiBaht } from '../../utils/numberWords';
import { Printer, Download, X, FileText, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';

export type BillingTemplateType = 'ORIGINAL' | 'COPY' | 'RECEIPT_SLIP';

interface BillingNoteTemplateProps {
  billingNote: BillingNote;
  onClose?: () => void;
  isModal?: boolean;
}

export const BillingNoteTemplate: React.FC<BillingNoteTemplateProps> = ({
  billingNote,
  onClose,
  isModal = true,
}) => {
  const [templateType, setTemplateType] = useState<BillingTemplateType>('ORIGINAL');
  const [whtRate, setWhtRate] = useState<number>(3); // 0, 1, 3%

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = Number(billingNote.total_amount) || 0;
  // Compute subtotal and vat (assuming 7% inclusive or exclusive standard)
  const subtotal = totalAmount / 1.07;
  const vatAmount = totalAmount - subtotal;
  const whtAmount = (subtotal * whtRate) / 100;
  const netPayable = totalAmount - whtAmount;

  const thaiBahtText = numberToThaiBaht(totalAmount);

  const items = billingNote.items && billingNote.items.length > 0
    ? billingNote.items
    : [
        {
          id: 'item-1',
          no: 1,
          invoice_no: 'INV-2026-001',
          ref_no: billingNote.sales_order_no || 'SO-26001',
          sales_order_no: billingNote.sales_order_no || 'SO-26001',
          date: billingNote.date || billingNote.billing_date || '2026-07-02',
          amount: totalAmount,
          outstanding_amount: billingNote.outstanding_amount ?? totalAmount,
        }
      ];

  const content = (
    <div className="billing-template-container bg-white text-slate-800 rounded-none w-full max-w-[210mm] mx-auto p-8 sm:p-10 shadow-lg print:shadow-none print:p-0 print:m-0 print:max-w-none text-xs leading-normal">
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
          .billing-template-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Watermark badge / Copy indicator */}
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
              โทร. 033-641789, 063-935-9565 | อีเมล: sales@mpower-engineering.com, account@mpower-engineering.com
            </p>
            <p className="font-bold text-slate-800">
              เลขประจำตัวผู้เสียภาษีอากร (Tax ID): <span className="font-mono tracking-wider">0205569006956</span>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="inline-block border-2 border-slate-900 bg-slate-900 text-white font-black text-xs px-3 py-1 uppercase tracking-wider rounded-xs">
            {templateType === 'ORIGINAL' && 'ต้นฉบับ / ORIGINAL'}
            {templateType === 'COPY' && 'สำเนา / COPY'}
            {templateType === 'RECEIPT_SLIP' && 'ใบรับวางบิล / RECEIPT SLIP'}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">
            {templateType === 'ORIGINAL' && '(สำหรับลูกค้า / Customer Copy)'}
            {templateType === 'COPY' && '(สำหรับฝ่ายบัญชีการเงิน / Accounting Copy)'}
            {templateType === 'RECEIPT_SLIP' && '(สำหรับผู้ส่งมอบเก็บเป็นหลักฐาน)'}
          </div>
        </div>
      </div>

      {/* Centered Document Title */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-black text-slate-950 tracking-widest uppercase">
          {templateType === 'RECEIPT_SLIP' ? 'ใบรับวางบิล / TEMPORARY RECEIPT' : 'ใบวางบิล / ใบแจ้งหนี้ (BILLING NOTE / STATEMENT)'}
        </h2>
        <p className="text-[10px] text-slate-500 font-medium">
          เอกสารทางการสำหรับตรวจสอบและวางบิลเรียกเก็บเงินตามรอบระยะเวลา
        </p>
      </div>

      {/* Two Column Metadata Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-800 p-3 rounded-none mb-4 bg-slate-50/50 text-[11px]">
        {/* Customer Information (Left) */}
        <div className="space-y-1">
          <div className="font-bold text-slate-950 uppercase text-[10px] text-slate-500 border-b border-slate-300 pb-0.5 mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-700" />
            ข้อมูลลูกค้า (Customer Details)
          </div>
          <div className="flex">
            <span className="w-24 font-bold text-slate-700 shrink-0">ชื่อลูกค้า (To):</span>
            <span className="font-bold text-slate-950">{billingNote.customer_name}</span>
          </div>
          <div className="flex items-start">
            <span className="w-24 font-bold text-slate-700 shrink-0">ที่อยู่ (Address):</span>
            <span className="text-slate-800 leading-snug">
              {billingNote.customer_address || '789/28 นิคมอุตสาหกรรมปิ่นทอง ต.หนองขาม อ.ศรีราชา จ.ชลบุรี 20110'}
            </span>
          </div>
          <div className="flex">
            <span className="w-24 font-bold text-slate-700 shrink-0">เลขประจำตัวผู้เสียภาษี:</span>
            <span className="font-mono font-bold text-slate-900">
              {billingNote.customer_tax_id || '0205544001928'}
            </span>
          </div>
          <div className="flex">
            <span className="w-24 font-bold text-slate-700 shrink-0">สาขา (Branch):</span>
            <span className="text-slate-800">สำนักงานใหญ่ (Head Office)</span>
          </div>
        </div>

        {/* Document Metadata (Right) */}
        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-300 md:pl-4">
          <div className="font-bold text-slate-950 uppercase text-[10px] text-slate-500 border-b border-slate-300 pb-0.5 mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-700" />
            ข้อมูลเอกสารวางบิล (Billing Details)
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-700 shrink-0">เลขที่ใบวางบิล (No.):</span>
            <span className="font-mono font-black text-slate-950 text-xs">{billingNote.billing_no}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-700 shrink-0">วันที่ (Date):</span>
            <span className="font-mono text-slate-900">{billingNote.date || billingNote.billing_date || '2026-07-02'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-rose-800 shrink-0">กำหนดชำระ (Due Date):</span>
            <span className="font-mono font-black text-rose-700 text-xs">
              {billingNote.due_date || billingNote.due_of_payment || '2026-08-01'}
            </span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-700 shrink-0">เงื่อนไขการค้า (Terms):</span>
            <span className="text-slate-800">เครดิต 30 วัน (Credit 30 Days)</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-700 shrink-0">พนักงานขาย / ผู้วางบิล:</span>
            <span className="text-slate-800">{billingNote.salesperson || billingNote.delivered_by || 'Saranya (Admin)'}</span>
          </div>
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="border border-slate-900 mb-3 overflow-hidden">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-center">
              <th className="py-2 px-2 border-r border-slate-700 w-10">ลำดับ<br/><span className="text-[9px] font-normal text-slate-300">No.</span></th>
              <th className="py-2 px-2 border-r border-slate-700 w-24">วันที่เอกสาร<br/><span className="text-[9px] font-normal text-slate-300">Date</span></th>
              <th className="py-2 px-3 border-r border-slate-700 text-left">เลขที่ใบแจ้งหนี้ / ใบกำกับภาษี<br/><span className="text-[9px] font-normal text-slate-300">Invoice No.</span></th>
              <th className="py-2 px-2 border-r border-slate-700 w-28 text-left">อ้างอิง PO / SO<br/><span className="text-[9px] font-normal text-slate-300">PO / SO Ref.</span></th>
              <th className="py-2 px-2 border-r border-slate-700 w-24 text-center">ครบกำหนด<br/><span className="text-[9px] font-normal text-slate-300">Due Date</span></th>
              <th className="py-2 px-3 border-r border-slate-700 text-right w-28">จำนวนเงิน (บาท)<br/><span className="text-[9px] font-normal text-slate-300">Total Amount</span></th>
              <th className="py-2 px-3 text-right w-28">ยอดค้างชำระ (บาท)<br/><span className="text-[9px] font-normal text-slate-300">Outstanding</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {items.map((it, idx) => {
              const itAmount = Number(it.amount) || 0;
              const itOutstanding = it.outstanding_amount !== undefined ? Number(it.outstanding_amount) : itAmount;
              return (
                <tr key={it.id || idx} className="hover:bg-slate-50">
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300 text-slate-700">{idx + 1}</td>
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300 text-slate-700">{it.date || billingNote.date}</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900 border-r border-slate-300">
                    {it.invoice_no}
                    {it.description ? (
                      <div className="text-[10px] font-sans font-medium text-slate-700">{it.description}</div>
                    ) : (
                      <div className="text-[10px] font-sans font-normal text-slate-500">งานบริการทดสอบทางวิศวกรรม (Engineering Testing Services)</div>
                    )}
                  </td>
                  <td className="py-2 px-2 font-mono text-slate-700 border-r border-slate-300">{it.sales_order_no || it.ref_no || '-'}</td>
                  <td className="py-2 px-2 text-center font-mono text-slate-700 border-r border-slate-300">{billingNote.due_date || billingNote.due_of_payment || '-'}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-300">
                    ฿{itAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                    ฿{itOutstanding.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
            {/* Blank rows filler to give realistic standard A4 paper height */}
            {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
              <tr key={`fill-${i}`} className="h-7 text-transparent">
                <td className="border-r border-slate-300">.</td>
                <td className="border-r border-slate-300">.</td>
                <td className="border-r border-slate-300">.</td>
                <td className="border-r border-slate-300">.</td>
                <td className="border-r border-slate-300">.</td>
                <td className="border-r border-slate-300">.</td>
                <td>.</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {/* Thai Baht text row & Grand Total */}
            <tr className="border-t-2 border-slate-900 bg-slate-100 font-bold">
              <td colSpan={5} className="py-2.5 px-3 border-r border-slate-300 text-slate-800">
                <span className="font-semibold text-slate-600">จำนวนเงินรวมทั้งสิ้น (ตัวอักษร): </span>
                <span className="text-slate-950 font-bold underline decoration-slate-400">
                  {thaiBahtText}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right border-r border-slate-300 text-slate-950 font-black">
                ยอดรวมสุทธิ:
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-base font-black text-slate-950">
                ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Tax & Deduction Breakdown Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Payment & Bank Details Instructions (Left) */}
        <div className="border border-slate-300 bg-slate-50 p-3 text-[10.5px] rounded-none">
          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            เงื่อนไขและการชำระเงิน (Payment Terms & Banking Details):
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-700 leading-snug">
            <li>โอนเงินเข้าบัญชี: <b className="text-slate-900">ธนาคารกสิกรไทย (KBANK) สาขาสัตหีบ</b></li>
            <li>ชื่อบัญชี: <b className="text-slate-900">บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด</b></li>
            <li>เลขที่บัญชี: <b className="font-mono font-bold text-slate-950 text-xs">098-8-55442-1</b> (บัญชีออมทรัพย์)</li>
            <li>สั่งจ่ายเช็คขีดคร่อม <b className="text-slate-900">A/C PAYEE ONLY</b> ในนาม บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด</li>
            <li className="text-[10px] text-slate-500 mt-1">
              *การวางบิลจะสมบูรณ์เมื่อผู้มีอำนาจลงนามครบถ้วน และการชำระเงินจะถือว่าสมบูรณ์เมื่อเงินเข้าบัญชีบริษัทฯ เรียบร้อยแล้ว
            </li>
          </ul>
        </div>

        {/* Calculation Table (Right) */}
        <div className="border border-slate-300 p-3 text-[11px] bg-white flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>ยอดเงินก่อนภาษีมูลค่าเพิ่ม (Subtotal):</span>
              <span className="font-mono font-semibold text-slate-900">
                ฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ภาษีมูลค่าเพิ่ม 7% (VAT 7%):</span>
              <span className="font-mono font-semibold text-slate-900">
                ฿{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 items-center">
              <span className="flex items-center gap-1">
                หัก ณ ที่จ่าย (Withholding Tax):
                <select
                  value={whtRate}
                  onChange={(e) => setWhtRate(Number(e.target.value))}
                  className="no-print bg-slate-100 border border-slate-300 rounded px-1 text-[10px] font-bold text-slate-700 cursor-pointer"
                >
                  <option value={0}>0%</option>
                  <option value={1}>1%</option>
                  <option value={3}>3% (บริการ)</option>
                </select>
                <span className="print:inline hidden font-bold">({whtRate}%)</span>
              </span>
              <span className="font-mono font-semibold text-rose-700">
                -฿{whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="border-t-2 border-slate-900 pt-2 mt-2 flex justify-between items-center">
            <span className="font-black text-slate-950 text-xs">ยอดที่ต้องชำระสุทธิ (Net Payable):</span>
            <span className="font-mono font-black text-emerald-800 text-sm">
              ฿{netPayable.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Standard 3 Official Signature Blocks */}
      <div className="grid grid-cols-3 gap-3 pt-2 text-center text-[10.5px]">
        {/* Block 1: Delivered By */}
        <div className="border border-slate-400 p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/40">
          <div className="font-bold text-slate-900 uppercase text-[10px]">
            ผู้วางบิล / Delivered By
          </div>
          <div className="my-2 border-b border-dashed border-slate-400 w-3/4 mx-auto pt-6 text-slate-400 font-mono text-[10px]">
            ({billingNote.delivered_by || 'ศรัญญา แอดมิน'})
          </div>
          <div className="text-[10px] text-slate-600">
            วันที่ (Date): {billingNote.delivered_date || billingNote.date || '......../......../........'}
          </div>
        </div>

        {/* Block 2: Received By / Customer Representative */}
        <div className="border border-slate-400 p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/40">
          <div className="font-bold text-slate-900 uppercase text-[10px]">
            ผู้รับวางบิล / Received By
          </div>
          <div className="text-[9.5px] text-slate-600 text-left pl-2 space-y-0.5">
            <div>กำหนดจ่ายเงิน: [ ...../...../2026 ]</div>
            <div>วิธีจ่าย: [ ] โอนเงิน  [ ] รับเช็ค</div>
          </div>
          <div className="my-1 border-b border-dashed border-slate-400 w-3/4 mx-auto pt-2 text-slate-400 font-mono text-[10px]">
            ({billingNote.received_by || '...........................................'})
          </div>
          <div className="text-[10px] text-slate-600">
            วันที่ (Date): {billingNote.received_date || '......../......../........'}
          </div>
        </div>

        {/* Block 3: Authorized Finance Officer */}
        <div className="border border-slate-400 p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/40">
          <div className="font-bold text-slate-900 uppercase text-[10px]">
            ผู้มีอำนาจลงนาม / Authorized Signatory
          </div>
          <div className="my-2 border-b border-dashed border-slate-400 w-3/4 mx-auto pt-6 text-slate-400 font-mono text-[10px]">
            (ผู้จัดการฝ่ายการเงิน / ประทับตรา)
          </div>
          <div className="text-[10px] text-slate-600">
            วันที่ (Date): {billingNote.date || '......../......../........'}
          </div>
        </div>
      </div>

      {/* Footer System Note */}
      <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between text-[9px] text-slate-400">
        <span>เอกสารออกโดยระบบ ERP M Power Engineering Solutions (AdminLTE 4 Template)</span>
        <span>หน้า 1 จาก 1 • เลขที่อ้างอิง: {billingNote.billing_no}</span>
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className="space-y-4">
        {/* In-page Controls Header */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              เทมเพลตเอกสารใบวางบิล:
            </span>
            <span className="font-mono text-emerald-300 font-bold text-xs bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-lg">
              {billingNote.billing_no}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Template Type Selector */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTemplateType('ORIGINAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'ORIGINAL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ต้นฉบับ (Original)
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('COPY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'COPY'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                สำเนา (Copy)
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('RECEIPT_SLIP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'RECEIPT_SLIP'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ใบรับวางบิล (Receipt Slip)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์แบบฟอร์ม / Print A4</span>
            </button>
          </div>
        </div>

        {/* Document Sheet */}
        <div className="bg-slate-950/40 p-4 sm:p-6 rounded-2xl border border-slate-800 flex justify-center overflow-x-auto">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-[220mm] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto print:shadow-none print:border-none print:max-w-none print:max-h-none print:rounded-none">
        {/* Modal Controls Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                แบบฟอร์มเทมเพลตใบวางบิลทางการ (Official Billing Note Form)
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                {billingNote.billing_no} • {billingNote.customer_name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Template Selector Tabs */}
            <div className="bg-slate-200/80 p-1 rounded-xl border border-slate-300 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTemplateType('ORIGINAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'ORIGINAL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ต้นฉบับ (Original)
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('COPY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'COPY'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                สำเนา (Copy)
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('RECEIPT_SLIP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'RECEIPT_SLIP'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ใบรับวางบิล (Receipt Slip)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ / Print A4</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Printable Document Canvas */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {content}
        </div>
      </div>
    </div>
  );
};
