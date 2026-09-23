import React, { useState } from 'react';
import { Supplier, PurchaseOrder, PurchaseRequest } from '../../types';
import { Printer, Download, X, Building2, CheckCircle2, ShieldCheck, Award, FileText, Phone, Mail, MapPin, DollarSign, Calendar } from 'lucide-react';

export type SupplierTemplateType = 'VENDOR_REGISTRATION' | 'PURCHASE_STATEMENT' | 'SUPPLIER_EVALUATION';

interface SupplierProfileTemplateProps {
  supplier: Supplier;
  purchaseOrders?: PurchaseOrder[];
  purchaseRequests?: PurchaseRequest[];
  onClose?: () => void;
  isModal?: boolean;
}

export const SupplierProfileTemplate: React.FC<SupplierProfileTemplateProps> = ({
  supplier,
  purchaseOrders = [],
  purchaseRequests = [],
  onClose,
  isModal = true,
}) => {
  const [templateType, setTemplateType] = useState<SupplierTemplateType>('VENDOR_REGISTRATION');

  const handlePrint = () => {
    window.print();
  };

  // Filter POs for this supplier
  const supplierPOs = purchaseOrders.filter(
    po => po.supplier_id === supplier.id || po.supplier_name === supplier.supplier_name
  );

  const totalPurchases = supplierPOs.reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0) || (supplier as any).totalPurchases || 450000;
  const outstandingBalance = (supplier as any).outstanding || (supplier as any).outstanding_balance || 125000;

  const content = (
    <div className="supplier-template-container bg-white text-slate-800 rounded-none w-full max-w-[210mm] mx-auto p-8 sm:p-10 shadow-lg print:shadow-none print:p-0 print:m-0 print:max-w-none text-xs leading-normal">
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
          .supplier-template-container {
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
              บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด (ฝ่ายจัดซื้อและพัฒนาคู่ค้า)
            </p>
            <p className="text-slate-600 mt-0.5">
              53/72 หมู่ที่ 8 ต.สัตหีบ อ.สัตหีบ จ.ชลบุรี 20180 (Procurement & Supply Chain Division)
            </p>
            <p className="text-slate-600">
              โทร. 033-641789, 063-935-9565 | อีเมล: procurement@mpower-engineering.com
            </p>
            <p className="font-bold text-slate-800">
              เลขประจำตัวผู้เสียภาษีอากร: <span className="font-mono tracking-wider">0205569006956</span>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="inline-block border-2 border-slate-900 bg-indigo-950 text-white font-black text-xs px-3 py-1 uppercase tracking-wider rounded-xs">
            {templateType === 'VENDOR_REGISTRATION' && 'APPROVED VENDOR / ทะเบียนคู่ค้า'}
            {templateType === 'PURCHASE_STATEMENT' && 'VENDOR STATEMENT / รายงานบัญชี'}
            {templateType === 'SUPPLIER_EVALUATION' && 'KPI EVALUATION / แบบประเมิน'}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1 font-mono">
            CODE: {supplier.supplier_code || 'SUP-001'}
          </div>
        </div>
      </div>

      {/* Document Title */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-black text-slate-950 tracking-widest uppercase">
          {templateType === 'VENDOR_REGISTRATION' && 'SUPPLIER PROFILE & REGISTRATION SHEET / ทะเบียนประวัติคู่ค้า'}
          {templateType === 'PURCHASE_STATEMENT' && 'VENDOR PURCHASE & ACCOUNT STATEMENT / รายงานสรุปการสั่งซื้อและบัญชีคู่ค้า'}
          {templateType === 'SUPPLIER_EVALUATION' && 'ANNUAL SUPPLIER PERFORMANCE EVALUATION / แบบประเมินประสิทธิภาพคู่ค้าประจำปี'}
        </h2>
        <p className="text-[10px] text-slate-500 font-medium">
          ระบบบริหารจัดการห่วงโซ่อุปทานและมาตรฐานการจัดซื้อจัดจ้าง บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด
        </p>
      </div>

      {/* ========================================================================= */}
      {/* TEMPLATE 1: VENDOR REGISTRATION PROFILE                                   */}
      {/* ========================================================================= */}
      {templateType === 'VENDOR_REGISTRATION' && (
        <div className="space-y-4">
          {/* General Company Information */}
          <div className="border border-slate-800 p-3 bg-slate-50/50">
            <div className="font-bold text-slate-950 uppercase text-[10px] text-indigo-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                ข้อมูลทั่วไปของนิติบุคคล / คู่ค้า (Company Information)
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[9px] border border-emerald-300">
                สถานะ: {supplier.status === 'Active' ? 'Active (ขึ้นทะเบียนสมบูรณ์)' : supplier.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
              <div className="flex">
                <span className="w-32 font-bold text-slate-700 shrink-0">รหัสคู่ค้า (Supplier Code):</span>
                <span className="font-mono font-bold text-indigo-900">{supplier.supplier_code}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700 shrink-0">ประเภทธุรกิจ:</span>
                <span className="text-slate-900 font-medium">{supplier.supplier_type || 'ตัวแทนจำหน่าย (Distributor)'}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700 shrink-0">ชื่อบริษัท (ภาษาไทย):</span>
                <span className="font-bold text-slate-950">{supplier.supplier_name}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700 shrink-0">เลขประจำตัวผู้เสียภาษี:</span>
                <span className="font-mono font-bold text-slate-900">{supplier.tax_id || '-'}</span>
              </div>
              <div className="flex col-span-2 items-start">
                <span className="w-32 font-bold text-slate-700 shrink-0">ที่อยู่สถานประกอบการ:</span>
                <span className="text-slate-800 leading-snug">{supplier.address || '-'}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700 shrink-0">โทรศัพท์ (Telephone):</span>
                <span className="font-mono text-slate-900">{supplier.phone || '-'}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700 shrink-0">อีเมลติดต่อ (Email):</span>
                <span className="font-mono text-slate-900">{supplier.email || '-'}</span>
              </div>
            </div>
          </div>

          {/* Contact Person & Authorized Coordinator */}
          <div className="border border-slate-800 p-3 bg-white">
            <div className="font-bold text-slate-950 uppercase text-[10px] text-indigo-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-700" />
              บุคคลติดต่อและตัวแทนประสานงานหลัก (Key Contact Person)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
              <div className="p-2 border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-500 block">ชื่อ-นามสกุล / ผู้ติดต่อ</span>
                <div className="font-bold text-slate-900 text-xs mt-0.5">{supplier.contact_person || 'คุณสมชาย วิทยาพงษ์'}</div>
                <div className="text-[10px] text-slate-600">ฝ่ายขายและบริการลูกค้าสัมพันธ์</div>
              </div>
              <div className="p-2 border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-500 block">เบอร์โทรศัพท์สายตรง / มือถือ</span>
                <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">{supplier.phone || '02-316-4455'}</div>
                <div className="text-[10px] text-slate-600">เวลาทำการ: จันทร์ - ศุกร์ 08:30 - 17:30</div>
              </div>
              <div className="p-2 border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-500 block">อีเมลสำหรับส่งใบสั่งซื้อ (PO Email)</span>
                <div className="font-mono font-bold text-indigo-900 text-xs mt-0.5">{supplier.email || 'sales@supplier.com'}</div>
                <div className="text-[10px] text-slate-600">ตอบกลับข้อเสนอราคาภายใน 24 ชม.</div>
              </div>
            </div>
          </div>

          {/* Commercial Terms & Banking Details */}
          <div className="border border-slate-800 p-3 bg-slate-50/50">
            <div className="font-bold text-slate-950 uppercase text-[10px] text-indigo-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-indigo-700" />
              เงื่อนไขทางการค้าและบัญชีรับโอนเงิน (Commercial & Banking Information)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-36 font-bold text-slate-700">เงื่อนไขการชำระเงิน:</span>
                  <span className="font-bold text-emerald-800">{supplier.payment_term || 'เครดิต 30 วัน (Credit 30 Days)'}</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-700">วงเงินเครดิตที่อนุมัติ:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ฿{Number(supplier.credit_limit || 500000).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-700">รอบการวางบิล-รับเช็ค:</span>
                  <span className="text-slate-800">วางบิลทุกวันที่ 25-30 / โอนเงินทุกวันที่ 15 ของเดือนถัดไป</span>
                </div>
              </div>

              <div className="p-2.5 border border-slate-300 bg-white space-y-1">
                <div className="font-bold text-slate-900 text-[10px] uppercase text-slate-600">ข้อมูลบัญชีธนาคารสำหรับจ่ายชำระเงิน:</div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ธนาคาร:</span>
                  <span className="font-bold text-slate-900">{supplier.bank_account?.bank_name || 'ธนาคารกรุงเทพ (BBL) สาขาระยอง'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">เลขที่บัญชี:</span>
                  <span className="font-mono font-black text-indigo-950 text-xs">{supplier.bank_account?.account_number || '123-4-56789-0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ชื่อบัญชี:</span>
                  <span className="font-bold text-slate-900">{supplier.bank_account?.account_name || supplier.supplier_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Approved Scope of Supply */}
          <div className="border border-slate-800 p-3 bg-white">
            <div className="font-bold text-slate-950 uppercase text-[10px] text-indigo-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              ขอบเขตสินค้าและบริการที่ได้รับการรับรอง (Approved Scope of Supply)
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10.5px]">
              <div className="p-2 border border-emerald-200 bg-emerald-50/40 rounded-none">
                <div className="font-bold text-emerald-950">✓ ท่อและอุปกรณ์ข้อต่อแรงดัน</div>
                <div className="text-[9.5px] text-slate-600 mt-0.5">Seamless Pipe ASTM A106, High-Pressure Flanges & Fittings Class 150-1500</div>
              </div>
              <div className="p-2 border border-emerald-200 bg-emerald-50/40 rounded-none">
                <div className="font-bold text-emerald-950">✓ วาล์วอุตสาหกรรมปิโตรเคมี</div>
                <div className="text-[9.5px] text-slate-600 mt-0.5">Ball, Gate, Globe & Check Valves, Test Certificates & MTRs</div>
              </div>
              <div className="p-2 border border-emerald-200 bg-emerald-50/40 rounded-none">
                <div className="font-bold text-emerald-950">✓ อุปกรณ์เครื่องมือวัดและทดสอบ</div>
                <div className="text-[9.5px] text-slate-600 mt-0.5">Pressure Gauges, Hydrostatic Test Manifolds, Digital Data Loggers</div>
              </div>
            </div>
          </div>

          {/* Supplier History Summary */}
          <div className="grid grid-cols-3 gap-3 border border-slate-800 p-3 bg-slate-50/50">
            <div>
              <span className="text-[10px] text-slate-500 block">ยอดจัดซื้อสะสมทั้งหมด:</span>
              <div className="font-mono font-bold text-sm text-emerald-800">
                ฿{totalPurchases.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">ยอดเจ้าหนี้คงค้างปัจจุบัน:</span>
              <div className="font-mono font-bold text-sm text-amber-700">
                ฿{outstandingBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">ผลการประเมินคุณภาพ (KPI Score):</span>
              <div className="font-bold text-sm text-indigo-900 flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-500" />
                95.0% (เกรด A - คู่ค้าระดับดีเยี่ยม)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEMPLATE 2: PURCHASE & ACCOUNT STATEMENT                                  */}
      {/* ========================================================================= */}
      {templateType === 'PURCHASE_STATEMENT' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 border border-slate-800 p-3 bg-slate-50/70">
            <div>
              <span className="text-[10px] text-slate-500 block">คู่ค้า / ผู้ขาย:</span>
              <div className="font-bold text-slate-900 text-xs">{supplier.supplier_name}</div>
              <div className="font-mono text-[10px] text-slate-500">Tax ID: {supplier.tax_id || '-'}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">ยอดการสั่งซื้อรวมทั้งหมด (Total POs):</span>
              <div className="font-mono font-black text-sm text-slate-950">
                ฿{totalPurchases.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500">รวม {supplierPOs.length || 3} ฉบับ</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">ยอดเจ้าหนี้ค้างชำระ (Balance Due):</span>
              <div className="font-mono font-black text-sm text-rose-700">
                ฿{outstandingBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-700 font-bold">สถานะ: ชำระตรงกำหนด</div>
            </div>
          </div>

          {/* PO Statement Table */}
          <div className="border border-slate-900 overflow-hidden">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-center">
                  <th className="py-2 px-2 border-r border-slate-700 w-10">ลำดับ</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-24">วันที่สั่งซื้อ</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-28 text-left">เลขที่ PO</th>
                  <th className="py-2 px-2 border-r border-slate-700 text-left">โครงการ / วัตถุประสงค์</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-24 text-center">สถานะ</th>
                  <th className="py-2 px-3 text-right w-32">มูลค่ารวม (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {(supplierPOs.length > 0 ? supplierPOs : [
                  { id: '1', po_no: 'PO-2607001', date: '2026-07-02', ref_customer: 'PTT Gas Separation Plant', status: 'Completed', total_amount: 19795 },
                  { id: '2', po_no: 'PO-2607002', date: '2026-07-08', ref_customer: 'Thai Oil Clean Fuel Project', status: 'Completed', total_amount: 85600 },
                  { id: '3', po_no: 'PO-2608001', date: '2026-08-15', ref_customer: 'IRPC Polypropylene Unit', status: 'Received', total_amount: 145000 }
                ]).map((po: any, idx: number) => (
                  <tr key={po.id || idx} className="hover:bg-slate-50">
                    <td className="py-2 px-2 text-center font-mono border-r border-slate-300 text-slate-700">{idx + 1}</td>
                    <td className="py-2 px-2 text-center font-mono border-r border-slate-300 text-slate-700">{po.date || po.po_date || '2026-07-02'}</td>
                    <td className="py-2 px-2 font-mono font-bold text-indigo-900 border-r border-slate-300">{po.po_no}</td>
                    <td className="py-2 px-2 text-slate-800 border-r border-slate-300">{po.ref_customer || po.project || 'จัดซื้อวัสดุอุปกรณ์ทดสอบ'}</td>
                    <td className="py-2 px-2 text-center border-r border-slate-300">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {po.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      ฿{Number(po.total_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-100 font-bold">
                  <td colSpan={5} className="py-2 px-3 text-right border-r border-slate-300">
                    ยอดสั่งซื้อสะสมรวมทั้งสิ้น:
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-950 font-black">
                    ฿{totalPurchases.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEMPLATE 3: ANNUAL PERFORMANCE EVALUATION SHEET                           */}
      {/* ========================================================================= */}
      {templateType === 'SUPPLIER_EVALUATION' && (
        <div className="space-y-4">
          <div className="border border-slate-800 p-3 bg-slate-50/50 flex justify-between items-center">
            <div>
              <div className="font-bold text-slate-900 text-xs">เกณฑ์การประเมินประสิทธิภาพผู้ขายประจำปี 2026</div>
              <div className="text-[10px] text-slate-500">คู่ค้า: {supplier.supplier_name} ({supplier.supplier_code})</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase text-indigo-900 px-3 py-1 bg-indigo-100 border border-indigo-300">
                คะแนนรวม: 95.0 / 100 (เกรด A)
              </span>
            </div>
          </div>

          <div className="border border-slate-900 overflow-hidden">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-center">
                  <th className="py-2 px-2 border-r border-slate-700 w-12">ลำดับ</th>
                  <th className="py-2 px-3 border-r border-slate-700 text-left">หัวข้อการประเมิน (Evaluation Criteria)</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-24 text-center">คะแนนเต็ม</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-24 text-center">คะแนนที่ได้</th>
                  <th className="py-2 px-3 text-left">ข้อคิดเห็น / หลักฐานอ้างอิง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300">1</td>
                  <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-900">
                    คุณภาพสินค้าและความถูกต้องของสเปก (Quality & Specs)
                    <div className="text-[10px] font-normal text-slate-600">มี Mill Certificate / Inspection Report ครบถ้วน ไม่พบงานตีกลับ</div>
                  </td>
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300">30</td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-emerald-800 border-r border-slate-300">29.0</td>
                  <td className="py-2 px-3 text-slate-700 text-[10px]">สินค้าผ่านเกณฑ์ 100% ไม่มีของชำรุดเสียหาย</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300">2</td>
                  <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-900">
                    ความตรงต่อเวลาการส่งมอบ (On-Time Delivery Rate)
                    <div className="text-[10px] font-normal text-slate-600">ส่งมอบสินค้าตรงตามนัดหมายในใบสั่งซื้อ PO ทุกรายการ</div>
                  </td>
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300">30</td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-emerald-800 border-r border-slate-300">28.5</td>
                  <td className="py-2 px-3 text-slate-700 text-[10px]">ส่งมอบตรงเวลา 98% แจ้งล่วงหน้าเมื่อมีการปรับแผน</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300">3</td>
                  <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-900">
                    ความสามารถในการแข่งขันด้านราคา (Price Competitiveness)
                    <div className="text-[10px] font-normal text-slate-600">ให้ส่วนลดการค้าเหมาะสมและรักษาราคาตามข้อตกลง</div>
                  </td>
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300">20</td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-emerald-800 border-r border-slate-300">19.0</td>
                  <td className="py-2 px-3 text-slate-700 text-[10px]">ราคาแข่งขันได้ ให้เครดิตเทอม 30 วัน</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300">4</td>
                  <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-900">
                    การบริการและเอกสาร (Customer Service & Compliance)
                    <div className="text-[10px] font-normal text-slate-600">การตอบกลับรวดเร็ว เอกสารใบกำกับภาษีและใบวางบิลถูกต้อง</div>
                  </td>
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300">20</td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-emerald-800 border-r border-slate-300">18.5</td>
                  <td className="py-2 px-3 text-slate-700 text-[10px]">บริการดี ให้คำแนะนำด้านวิศวกรรมได้ดี</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-100 font-bold">
                  <td colSpan={2} className="py-2.5 px-3 text-right border-r border-slate-300 text-slate-900">
                    ผลคะแนนประเมินรวมทั้งสิ้น (Total Score):
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono border-r border-slate-300">100</td>
                  <td className="py-2.5 px-2 text-center font-mono text-indigo-900 font-black border-r border-slate-300">95.0</td>
                  <td className="py-2.5 px-3 text-emerald-800 font-black">
                    ผลสรุป: คงสถานะ Approved Vendor เกรด A
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Official Signatures Section for Vendor Management */}
      <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-300 text-center text-[10.5px]">
        {/* Block 1: Procurement Officer */}
        <div className="border border-slate-400 p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/40">
          <div className="font-bold text-slate-900 uppercase text-[10px]">
            เจ้าหน้าที่จัดซื้อ / ผู้รวบรวมข้อมูล
          </div>
          <div className="my-2 border-b border-dashed border-slate-400 w-3/4 mx-auto pt-6 text-slate-400 font-mono text-[10px]">
            (ศรัญญา พานิชย์ / เจ้าหน้าที่จัดซื้อ)
          </div>
          <div className="text-[10px] text-slate-600">
            วันที่: {supplier.created_at ? supplier.created_at.split('T')[0] : '2026-07-01'}
          </div>
        </div>

        {/* Block 2: Quality & Technical Reviewer */}
        <div className="border border-slate-400 p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/40">
          <div className="font-bold text-slate-900 uppercase text-[10px]">
            วิศวกรผู้ตรวจสอบคุณสมบัติสินค้า
          </div>
          <div className="my-2 border-b border-dashed border-slate-400 w-3/4 mx-auto pt-6 text-slate-400 font-mono text-[10px]">
            (วิศวกรโครงการ / QC Inspector)
          </div>
          <div className="text-[10px] text-slate-600">
            วันที่: {supplier.created_at ? supplier.created_at.split('T')[0] : '2026-07-01'}
          </div>
        </div>

        {/* Block 3: Managing Director / Final Approval */}
        <div className="border border-slate-400 p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/40">
          <div className="font-bold text-slate-900 uppercase text-[10px]">
            ผู้มีอำนาจอนุมัติขึ้นทะเบียนคู่ค้า
          </div>
          <div className="my-2 border-b border-dashed border-slate-400 w-3/4 mx-auto pt-6 text-slate-400 font-mono text-[10px]">
            (กรรมการผู้จัดการ / ประทับตรา)
          </div>
          <div className="text-[10px] text-slate-600">
            วันที่: {supplier.created_at ? supplier.created_at.split('T')[0] : '2026-07-01'}
          </div>
        </div>
      </div>

      {/* Footer System Note */}
      <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between text-[9px] text-slate-400">
        <span>ทะเบียนคู่ค้าทางการ M Power Engineering Solutions Co., Ltd. (AdminLTE 4)</span>
        <span>รหัสคู่ค้า: {supplier.supplier_code} • {supplier.supplier_name}</span>
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
              <Building2 className="w-4 h-4 text-indigo-400" />
              เทมเพลตข้อมูลคู่ค้าและซัพพลายเออร์:
            </span>
            <span className="font-mono text-indigo-300 font-bold text-xs bg-indigo-950/70 border border-indigo-800 px-2 py-0.5 rounded-lg">
              {supplier.supplier_code} • {supplier.supplier_name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Template Selector */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTemplateType('VENDOR_REGISTRATION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'VENDOR_REGISTRATION'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ทะเบียนประวัติคู่ค้า (Profile)
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('PURCHASE_STATEMENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'PURCHASE_STATEMENT'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                รายงานสรุปการสั่งซื้อ (Statement)
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('SUPPLIER_EVALUATION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'SUPPLIER_EVALUATION'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                แบบประเมินผู้ขาย (KPI)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[220mm] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto print:shadow-none print:border-none print:max-w-none print:max-h-none print:rounded-none">
        {/* Header Controls */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                แบบฟอร์มเทมเพลตทะเบียนคู่ค้าทางการ (Vendor Profile & Assessment)
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {supplier.supplier_code} • {supplier.supplier_name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Template Selector Tabs */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTemplateType('VENDOR_REGISTRATION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'VENDOR_REGISTRATION'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ทะเบียนประวัติ (Profile)
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('PURCHASE_STATEMENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'PURCHASE_STATEMENT'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                สรุปการสั่งซื้อ (Statement)
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('SUPPLIER_EVALUATION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  templateType === 'SUPPLIER_EVALUATION'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                แบบประเมินผู้ขาย (KPI)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ / Print A4</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Printable Document Canvas */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/50 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {content}
        </div>
      </div>
    </div>
  );
};
