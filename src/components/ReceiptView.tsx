import React, { useState, useMemo } from 'react';
import { Customer, Invoice, Receipt, UserRole } from '../types';
import { numberToEnglishWords } from '../utils/numberWords';
import { CreditCard, Plus, Search, Filter, Trash2, Eye, Printer, Edit2, FileText, Check, DollarSign, Wallet, Calendar, X, Lock } from 'lucide-react';

interface ReceiptViewProps {
  receipts: Receipt[];
  invoices: Invoice[];
  customers: Customer[];
  onAdd: (payload: Omit<Receipt, 'id' | 'receipt_no' | 'created_at'>) => Promise<any>;
  onUpdate: (id: string, updates: Partial<Receipt>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onToast: (msg: string, type: 'success' | 'err') => void;
  currentRole: UserRole;
  currentUserId: string;
}

export default function ReceiptView({
  receipts,
  invoices,
  customers,
  onAdd,
  onUpdate,
  onDelete,
  onToast,
  currentRole,
  currentUserId
}: ReceiptViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

  // Form State
  const [invoiceId, setInvoiceId] = useState('');
  const [custId, setCustId] = useState('');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Transfer' | 'Cash' | 'Cheque' | 'Credit Card'>('Transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const canModify = currentRole !== 'Management';
  const canDelete = currentRole === 'Admin' || currentRole === 'System Administrator';

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const inv = invoices.find(item => item.id === id);
    if (inv) {
      setCustId(inv.customer_id);
      setReceivedAmount(inv.grand_total);
    }
  };

  const handleOpenAddForm = () => {
    setEditingReceipt(null);
    setInvoiceId('');
    setCustId('');
    setReceivedAmount(0);
    setPaymentMethod('Transfer');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (rec: Receipt) => {
    setEditingReceipt(rec);
    setInvoiceId(rec.invoice_id);
    setCustId(rec.customer_id);
    setReceivedAmount(rec.received_amount);
    setPaymentMethod(rec.payment_method);
    setPaymentDate(rec.payment_date);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custId || receivedAmount <= 0) {
      onToast('กรุณาระบุใบแจ้งหนี้เพื่อจับคู่วางรับชำระและยอดเงินหลัก', 'err');
      return;
    }

    const payload = {
      invoice_id: invoiceId,
      customer_id: custId,
      received_amount: Number(receivedAmount),
      payment_method: paymentMethod,
      payment_date: paymentDate
    };

    try {
      if (editingReceipt) {
        await onUpdate(editingReceipt.id, payload);
        onToast(`แก้ไขข้อมูลใบรับเงินเลขที่ ${editingReceipt.receipt_no} สำเร็จ`, 'success');
      } else {
        await onAdd(payload);
        onToast(`สร้างเอกสารใบเสร็จชำระหนี้ (Receipt Issued) สำเร็จ`, 'success');
      }
      setIsFormOpen(false);
    } catch {
      onToast('ระบบบันทึกความสมดุลการทอนชำระเงินทางคลาวด์ขัดข้อง', 'err');
    }
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter(rec => {
      const matchSearch =
        rec.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.customer_name && rec.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchMethod = selectedMethod === 'All' || rec.payment_method === selectedMethod;
      return matchSearch && matchMethod;
    });
  }, [receipts, searchTerm, selectedMethod]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="receipt-module">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-150 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Receipt Management (บันทึกรับเงิน / ออกใบเสร็จรับเงิน)</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium font-sans">โมดูลที่ 8: บันทึกปิดรอบการชำระ ออกใบเสร็จรับเงินพร้อมใบกำกับภาษี จัดเรียงกลุ่มตรวจสอบงบดุล</p>
          </div>
        </div>
        {canModify && (
          <button
            onClick={handleOpenAddForm}
            className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-750 text-white font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-xs text-sm"
          >
            <Plus className="w-4 h-4" />
            ออกใบเสร็จรับเงินใหม่ / New Receipt
          </button>
        )}
      </div>

      {/* filter panel selection */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="ค้นหาตามเลขที่รับเงิน RE, ชื่อบริษัทคู่สัญญา หรือใบแจ้งหนี้ INV อ้างอิง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="text-slate-400 w-4 h-4 shrink-0" />
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full md:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer font-bold"
          >
            <option value="All">ทุกช่องทางการโอน</option>
            <option value="Transfer">Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="Credit Card">Credit Card</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Tab simulation bar */}
      <div className="bg-[#f8f9fa] border border-slate-200 border-b-0 px-4 py-2 flex items-center justify-between text-xs select-none rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="font-medium bg-[#E8EAED] px-2.5 py-1 rounded border border-slate-200 text-slate-700 select-none">Sheet1</span>
          <span className="text-slate-400">|</span>
          <span className="font-mono font-semibold text-emerald-600">{filteredReceipts.length} แถว (Rows)</span>
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
                <th className="border border-slate-200 text-center w-40">C</th>
                <th className="border border-slate-200 text-center w-48">D</th>
                <th className="border border-slate-200 text-center w-40">E</th>
                <th className="border border-slate-200 text-center w-36">F</th>
              </tr>
              {/* Header Columns inside the spreadsheet */}
              <tr className="bg-[#F8F9FA] border-b-2 border-slate-300 text-xs font-semibold text-slate-600">
                <th className="border border-slate-200 bg-[#E8EAED] text-center w-10 font-mono select-none"></th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">หมายเลขใบรับเงิน</th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">ผู้จ่ายเงิน / องค์กรที่ชำระ</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-slate-700">ยอดรับเข้าสุทธิ</th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">ประเภทจ่าย / ชำระเข้ามา</th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">ลงวันชำระและประทับ RE</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-slate-700">ปฏิบัติการ</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs border border-slate-200">
                    ไม่พบรายการบันทึกรับเงินของฝ่ายบัญชีและสถิติคลังโอนสิทธิ
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((rec, idx) => (
                  <tr 
                    key={rec.id} 
                    className={`hover:bg-blue-50/45 cursor-pointer transition-colors border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F8F9FA]/70'}`}
                  >
                    {/* Index row background (spreadsheet numbering) */}
                    <td className="border border-slate-200 bg-[#F1F3F4] text-[#5f6368] text-center font-mono text-[10px] select-none py-1.5">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-slate-800">
                      {rec.receipt_no}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5">
                      <span className="font-extrabold text-slate-800 block">{rec.customer_name}</span>
                      <span className="text-xs text-slate-400 font-normal">อ้างอิงใบแจ้งหนี้: {rec.invoice_id}</span>
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-extrabold text-purple-600">
                      ฿{rec.received_amount.toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] border font-bold ${
                        rec.payment_method === 'Transfer' ? 'bg-indigo-50 border-indigo-150 text-indigo-700' :
                        rec.payment_method === 'Credit Card' ? 'bg-blue-50 border-blue-150 text-blue-700' :
                        rec.payment_method === 'Cash' ? 'bg-green-50 border-green-150 text-green-700' :
                        'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        {rec.payment_method}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-slate-600 font-bold">
                      {rec.payment_date}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingReceipt(rec)}
                          title="ดูแบบฟอร์มปิดงบและพิมพ์"
                          className="p-1 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleOpenEditForm(rec)}
                            title="แก้ไขบันทึกยอดโอนเงิน"
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete ? (
                          <button
                            onClick={async () => {
                              if (confirm(`คุณต้องการยกเลิกประวัติใบรับเงินแท็กซี่ฟลอร์นี้หรือไม่ ${rec.receipt_no}?`)) {
                                await onDelete(rec.id);
                                onToast('ถอนลบข้อมูลใบเสร็จรับเงินเสร็จสิ้นแล้ว', 'success');
                              }
                            }}
                            title="ลบออก"
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

      {/* Adding / Editing Modal form details */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up">
            <div className="bg-slate-50 p-6 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {editingReceipt ? `ปรับปรุงรายละเอียดรับปิดประวัติชำระเงิน: ${editingReceipt.receipt_no}` : 'บันทึกประมวลผลรับเงินเข้าและพิมพ์ประทับชำระ RE'}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">จัดแผนการบันทึกงบปิดสมานเครดิตการค้าของแคมเปญผู้ประสานงานหลัก</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-white border border-slate-150">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Reference to Invoices */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">จับคู่ใบวางบิลค้างรับชำระเงิน (Invoice Ref) *</label>
                <select
                  required
                  value={invoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">-- เลือกใบแจ้งหนี้เพื่อหักชำระ --</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoice_no} - (ยอดสะสม: ฿{inv.grand_total.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              {/* Reference customer */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">บริษัทผู้จ่ายชำระภาษีหลัก</label>
                <select
                  required
                  disabled={true}
                  value={custId}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs cursor-not-allowed text-slate-500"
                >
                  <option value="">-- จะดึงชื่องานปลายโครงการชำระอัตโนมัติ --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customer_name}</option>
                  ))}
                </select>
              </div>

              {/* Amounts and payment methods */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-sans">จำนวนเงินที่ได้รับล่วงหน้า (฿) *</label>
                  <input
                    type="number"
                    required
                    placeholder="ใส่จำนวนเงินที่ได้รับจริง"
                    value={receivedAmount || ''}
                    onChange={(e) => setReceivedAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-500/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-sans">ประเภทการชำระเงินโอน</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="Transfer">Transfer (โอนเงินธนาคาร)</option>
                    <option value="Cash">Cash (เงินสดหน้างาน)</option>
                    <option value="Cheque">Cheque (เช็คการค้า)</option>
                    <option value="Credit Card">Credit Card (บัตรเครดิต)</option>
                  </select>
                </div>
              </div>

              {/* Payment dates */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">วันที่ตรวจพิจารณาชำระจริง / Receipt Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-50 border border-slate-200 text-slate-600 font-bold px-5 py-2 rounded-xl text-xs hover:bg-slate-100 transition-all font-sans"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-purple-750 shadow-xs transition-behavior flex items-center gap-1.5 font-sans"
                >
                  <Check className="w-4 h-4" />
                  บันทึกปิดใบเสร็จ / Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual professional Printed Receipt template preview modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in print:bg-white print:p-0 print:absolute animate-fade-in">
          <div className="bg-white rounded-2xl shadow-3xl w-full max-w-3xl overflow-hidden my-8 animate-scale-up print:shadow-none print:my-0 print:rounded-none">
            
            {/* Toolbar */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between print:hidden">
              <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Printer className="w-4.5 h-4.5 text-purple-600" />
                ใบเสร็จรับเงินแวตบิลเงินและใบกํากับภาษีอย่างย่อกากเดี่ยว ({viewingReceipt.receipt_no})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  พิมพ์เอกสารใบกำกับ
                </button>
                <button onClick={() => setViewingReceipt(null)} className="p-1 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* printsheet */}
            {(() => {
              const customerObj = customers.find(c => c.id === viewingReceipt.customer_id);
              const invoiceObj = invoices.find(i => i.id === viewingReceipt.invoice_id);

              const customerName = viewingReceipt.customer_name || customerObj?.customer_name || "IKM Testing (Thailand) Co., Ltd";
              const customerAddress = customerObj?.address || "155/167 Moo 5, Samnakthon Sub-District\nBanchang District, Rayong, Thailand 21130";
              const customerPhone = customerObj?.phone || "038-601 996-8";
              const customerTaxId = customerObj?.tax_id || "0215552000909";

              const receiptNoStr = viewingReceipt.receipt_no || "202607001";
              const paymentDateStr = viewingReceipt.payment_date || "07-01-2026";
              const dueDateStr = invoiceObj?.due_date || "30 Days";
              const salespersonName = "Pronpicha";
              const referencePoStr = (invoiceObj as any)?.reference_po || "";

              const totalAmount = viewingReceipt.received_amount || 2996;
              const subtotalVal = Math.round(totalAmount / 1.07);
              const vatVal = totalAmount - subtotalVal;
              const grandTotalVal = totalAmount;

              const grandTotalInWords = numberToEnglishWords(grandTotalVal);

              return (
                <div className="bg-white print:p-0 print:m-0 text-black font-sans w-[210mm] min-h-[297mm] mx-auto relative select-none p-8 md:p-10" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {/* Top Header Row */}
                  <div className="flex justify-between items-start mb-4">
                    {/* Left: Logo & Company Address */}
                    <div className="flex items-start gap-3">
                      <div className="w-[180px] shrink-0 pt-1">
                        <img src="/mpower-logo.svg" alt="M Power Logo" className="w-full h-auto object-contain" />
                      </div>
                      <div className="text-[11.5px] leading-snug text-black">
                        <div className="font-bold text-[13px] text-black">M Power Engineering Solutions Co., Ltd.</div>
                        <div>53/72 Moo 8, Sattahip Subdistrict, Sattahip District, Chonburi 20180 , Thailand.</div>
                        <div>Tel. 033-641789 / 063-9359565 Email: sales.mpower-engineering.com , info@mpower-engineering.com</div>
                        <div>Tax ID Number. 0205569006956 (Head office)</div>
                      </div>
                    </div>

                    {/* Right: Stamp */}
                    <div className="text-right">
                      <div className="text-[#dc2626] font-bold text-lg tracking-wider uppercase">
                        ORIGINAL
                      </div>
                    </div>
                  </div>

                  {/* Document Title Centered */}
                  <div className="text-center my-4">
                    <h2 className="text-xl font-bold text-black uppercase tracking-wide">
                      OFFICIAL RECEIPT
                    </h2>
                  </div>

                  {/* Metadata Box (2 Columns with Outer Border) */}
                  <div className="border border-black grid grid-cols-2 text-[12px] leading-relaxed">
                    {/* Left Box: Customer Details */}
                    <div className="p-3 border-r border-black space-y-0.5">
                      <div className="font-bold text-[13px] text-black">{customerName}</div>
                      <div className="whitespace-pre-line">{customerAddress}</div>
                      <div>Tel.{customerPhone}</div>
                      <div>Tax ID: {customerTaxId} (Head Office)</div>
                    </div>

                    {/* Right Box: Receipt Metadata */}
                    <div className="p-3 space-y-1 text-[12px]">
                      <div className="flex"><span className="w-36 font-semibold">Receipt No. :</span> <span className="font-bold">{receiptNoStr}</span></div>
                      <div className="flex"><span className="w-36 font-semibold">Date :</span> <span>{paymentDateStr}</span></div>
                      <div className="flex"><span className="w-36 font-semibold">Due Date :</span> <span>{dueDateStr}</span></div>
                      <div className="flex"><span className="w-36 font-semibold">Sales Name :</span> <span>{salespersonName}</span></div>
                      <div className="flex"><span className="w-36 font-semibold">Customer PO Ref:</span> <span>{referencePoStr}</span></div>
                    </div>
                  </div>

                  {/* Items Table with Full-Height Vertical Lines */}
                  <div className="border border-black border-t-0 text-[12px] min-h-[460px] flex flex-col justify-between">
                    <table className="w-full border-collapse h-full" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="border-b border-black text-center font-bold text-[12px] bg-white">
                          <th className="py-2 px-1 w-[12%] border-r border-black align-middle">Quantity</th>
                          <th className="py-2 px-2 w-[56%] border-r border-black text-center align-middle">Drescription</th>
                          <th className="py-2 px-2 w-[16%] border-r border-black align-middle">
                            <div>Unit Price</div>
                            <div className="font-bold text-[11px] mt-0.5">THB</div>
                          </th>
                          <th className="py-2 px-2 w-[16%] align-middle">
                            <div>Amount</div>
                            <div className="font-bold text-[11px] mt-0.5">THB</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-none h-full">
                        <tr className="align-top">
                          <td className="py-3 px-1 text-center font-semibold border-r border-black">
                            1
                          </td>
                          <td className="py-3 px-3 border-r border-black whitespace-pre-wrap leading-snug">
                            <div className="font-bold text-black">Sky Lotech High Lift</div>
                            <div className="text-black font-normal">Brand : Skyy Lotech</div>
                            <div className="text-black font-normal">Model : M-380X-200</div>
                            <div className="text-black font-normal"> - Length : 200 Meter</div>
                            <div className="text-black font-normal"> - Length : 200 Meter</div>
                            <div className="text-black font-normal"> - Diameter : 1/2"</div>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold border-r border-black">
                            {subtotalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold">
                            {subtotalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>

                        {/* Mid-table marker row */}
                        <tr>
                          <td className="py-6 border-r border-black"></td>
                          <td className="py-6 border-r border-black text-center font-bold italic text-black tracking-wider">
                            ** LAST ENTRY **
                          </td>
                          <td className="py-6 border-r border-black"></td>
                          <td className="py-6"></td>
                        </tr>

                        {/* Filler row to force vertical column borders to reach bottom */}
                        <tr className="h-full">
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Section */}
                  <div className="border border-black border-t-0 flex text-[12px]">
                    {/* Left: Total Amount in Words inside a rectangular frame box */}
                    <div className="w-[68%] border-r border-black p-2 flex items-center justify-center">
                      <div className="w-full mx-2 border border-black py-1.5 px-3 text-center font-bold text-[11.5px] uppercase tracking-wide">
                        {grandTotalInWords}
                      </div>
                    </div>

                    {/* Right: Amounts Summary Table */}
                    <div className="w-[32%] text-[12px] font-semibold divide-y divide-black">
                      <div className="flex justify-between px-3 py-1.5">
                        <span>AMOUNT</span>
                        <span className="font-bold">{subtotalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between px-3 py-1.5">
                        <span>SALES VAT 7%</span>
                        <span className="font-bold">{vatVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between px-3 py-1.5 font-bold">
                        <span>TOTAL AMOUNT</span>
                        <span className="font-bold">{grandTotalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Page indicator */}
                  <div className="text-right text-[11px] font-bold mt-1 text-black">
                    Page 1/1
                  </div>

                  {/* Payment Method & Bank Instructions */}
                  <div className="mt-4 text-[11.5px] leading-relaxed text-black">
                    <div className="font-bold">Method of payment :</div>
                    <div className="pl-4">Cheque or transfer under name M Power Engineering Solutions Co., Ltd.</div>
                    <div className="pl-4">Kasikorn Bank Sattahip Branch, Account no. 235-3-12229-3</div>
                    <div className="mt-3 font-semibold text-[11px]">
                      After your processing payment Please let us know and attach poof document to account.mpower-engineering.com or call number + 66 33 641 789
                    </div>
                  </div>

                  {/* Signatures Section */}
                  <div className="mt-12 grid grid-cols-2 text-center text-[11.5px] font-bold">
                    <div className="flex flex-col items-center justify-end h-20">
                      <div className="relative w-full flex flex-col items-center">
                        <svg className="w-28 h-10 text-blue-700 opacity-90 -mb-2" viewBox="0 0 120 40">
                          <path d="M 10 28 C 25 5, 45 35, 60 15 C 75 -5, 85 30, 110 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                        <div>......................................................</div>
                        <div className="mt-1">PREPARE BY</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-end h-20">
                      <div>......................................................</div>
                      <div className="mt-1">CUSTOMER APPRROVE BY</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
