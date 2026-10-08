import React, { useState, useMemo } from 'react';
import { Customer, SalesOrder, UserRole, Opportunity, Invoice } from '../types';
import { Briefcase, Plus, Search, Filter, Trash2, Eye, Printer, Edit2, FileText, Check, Calendar, Settings2, ShieldAlert, X, Lock, Copy, Tag, ReceiptText, FileCheck, ShieldCheck } from 'lucide-react';
import { SalesOrderGenerateModal } from './sales-order/SalesOrderGenerateModal';

interface SalesOrderViewProps {
  salesOrders: SalesOrder[];
  customers: Customer[];
  opportunities: Opportunity[];
  invoices: Invoice[];
  onAdd: (payload: Omit<SalesOrder, 'id' | 'so_no' | 'created_at'>) => Promise<any>;
  onUpdate: (id: string, updates: Partial<SalesOrder>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onToast: (msg: string, type: 'success' | 'err') => void;
  currentRole: UserRole;
  currentUserId: string;
}

export default function SalesOrderView({
  salesOrders,
  customers,
  opportunities,
  invoices,
  onAdd,
  onUpdate,
  onDelete,
  onToast,
  currentRole,
  currentUserId
}: SalesOrderViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSO, setEditingSO] = useState<SalesOrder | null>(null);
  const [generatingSO, setGeneratingSO] = useState<SalesOrder | null>(null);

  // Form State
  const [custId, setCustId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  });
  const [deliveryPlan, setDeliveryPlan] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<SalesOrder['status']>('Pending');
  const [poNo, setPoNo] = useState('');
  const [soNo, setSoNo] = useState('');
  const [salesPerson, setSalesPerson] = useState('');

  const canModify = currentRole !== 'Management';
  const canDelete = currentRole === 'Admin' || currentRole === 'System Administrator';

  const handleOpenAddForm = async () => {
    setEditingSO(null);
    setCustId('');
    setProjectName('');
    setTotalAmount(0);
    setOrderDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 60);
    const defDelivery = d.toISOString().split('T')[0];
    setTargetDeliveryDate(defDelivery);
    setDeliveryPlan(defDelivery);
    setStatus('Pending');
    setPoNo('');
    setSalesPerson('');
    
    // Auto-generate SO number for new orders
    try {
      const { CRMService } = await import('../supabaseService');
      const newSoNo = await CRMService.generateSalesOrderNumber();
      setSoNo(newSoNo);
    } catch (e) {
      setSoNo('');
    }
    
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (so: SalesOrder) => {
    setEditingSO(so);
    setCustId(so.customer_id);
    setProjectName(so.project_name);
    setTotalAmount(so.total_amount);
    setOrderDate(so.order_date);
    setTargetDeliveryDate(so.target_delivery_date);
    setDeliveryPlan(so.delivery_plan || so.target_delivery_date || '');
    setStatus(so.status);
    setPoNo(so.po_no || '');
    setSoNo(so.so_no);
    setSalesPerson(so.sales_person || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custId || !projectName || totalAmount <= 0 || !soNo) {
      onToast('กรุณากรอกข้อมูลเลขใบสั่งขาย ข้อมูลลูกค้า ชื่อโครงการ และยอดเงินเป้าหมายให้ครบถ้วน', 'err');
      return;
    }

    const payload = {
      so_no: soNo,
      customer_id: custId,
      customer_name: customers.find(c => c.id === custId)?.customer_name || '',
      project_name: projectName,
      total_amount: Number(totalAmount),
      status,
      order_date: orderDate,
      target_delivery_date: deliveryPlan || targetDeliveryDate,
      delivery_plan: deliveryPlan || targetDeliveryDate,
      po_no: poNo,
      sales_person: salesPerson
    };

    try {
      if (editingSO) {
        await onUpdate(editingSO.id, payload);
        onToast(`แก้ไขใบสั่งสั่งขาย ${editingSO.so_no} ลงระบบเรียบร้อย`, 'success');
      } else {
        await onAdd(payload);
        onToast(`สร้างบันทึกใบสั่งขาย (Sales Order) ใหม่สำเร็จ`, 'success');
      }
      setIsFormOpen(false);
    } catch {
      onToast('เกิดข้อผิดพลาดในการเชื่อมต่อคลาวด์/จัดเก็บข้อมูล', 'err');
    }
  };

  // Multiple filter states: Status, Customer, Sales Rep, and Cascading Delivery Plan
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('All');
  const [selectedSalesRepFilter, setSelectedSalesRepFilter] = useState('All');
  const [selectedDeliveryPlan, setSelectedDeliveryPlan] = useState('All');

  // Customer options list
  const existingCustomersList = useMemo(() => {
    const list = salesOrders.map(so => so.customer_name).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [salesOrders]);

  // Sales Reps options list
  const existingSalesRepsList = useMemo(() => {
    const list = salesOrders.map(so => so.sales_person).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [salesOrders]);

  // Step 1: Pre-filter by Search, Status, Customer, and Sales Rep (Cascading Excel-like logic)
  const preDeliverySalesOrders = useMemo(() => {
    return salesOrders.filter(so => {
      const matchSearch = 
        so.so_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        so.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (so.customer_name && so.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (so.po_no && so.po_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (so.sales_person && so.sales_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ((so.delivery_plan || so.target_delivery_date) && (so.delivery_plan || so.target_delivery_date)?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchStatus = 
        selectedStatus === 'All' || 
        so.status === selectedStatus ||
        (selectedStatus === 'Delivered' && (so.status === 'Completed' || (so.status as string) === 'Delivered')) ||
        (selectedStatus === 'Approved' && (so.status === 'Fully Invoiced' || (so.status as string) === 'Approved'));
      
      const matchCustomer = selectedCustomerFilter === 'All' || so.customer_name === selectedCustomerFilter;
      const matchSalesRep = selectedSalesRepFilter === 'All' || so.sales_person === selectedSalesRepFilter;
      
      return matchSearch && matchStatus && matchCustomer && matchSalesRep;
    });
  }, [salesOrders, searchTerm, selectedStatus, selectedCustomerFilter, selectedSalesRepFilter]);

  // Step 2: Extract available Delivery Plans dynamically from the remaining subset
  const availableDeliveryPlans = useMemo(() => {
    const list = preDeliverySalesOrders
      .map(so => so.delivery_plan || so.target_delivery_date)
      .filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [preDeliverySalesOrders]);

  // Step 3: Final filtered Sales Orders with Delivery Plan applied
  const filteredSalesOrders = useMemo(() => {
    if (selectedDeliveryPlan === 'All') return preDeliverySalesOrders;
    return preDeliverySalesOrders.filter(so => 
      (so.delivery_plan || so.target_delivery_date) === selectedDeliveryPlan
    );
  }, [preDeliverySalesOrders, selectedDeliveryPlan]);

  const handlePrint = () => {
    window.print();
  };

  const handleDuplicateSO = async (so: SalesOrder) => {
    if (!confirm(`คุณต้องการคัดลอกใบสั่งขาย ${so.so_no} เป็นรายการใหม่ใช่หรือไม่?`)) {
      return;
    }

    const payload = {
      customer_id: so.customer_id,
      project_name: so.project_name,
      total_amount: so.total_amount,
      status: 'Pending' as const,
      order_date: new Date().toISOString().split('T')[0],
      target_delivery_date: so.target_delivery_date,
      delivery_plan: so.delivery_plan || so.target_delivery_date,
      po_no: so.po_no || '',
      sales_person: so.sales_person || '',
      items: so.items ? so.items.map(it => ({
        item_no: it.item_no,
        description: it.description,
        qty: it.qty,
        remaining_qty: it.qty,
        unit: it.unit,
        unit_price: it.unit_price
      })) : []
    };

    try {
      await onAdd(payload);
      onToast(`คัดลอกใบสั่งขาย ${so.so_no} สำเร็จ`, 'success');
    } catch (err) {
      onToast('เกิดข้อผิดพลาดในการคัดลอกใบสั่งขาย', 'err');
    }
  };

  return (
    <div className="space-y-6" id="salesorder-module">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-150 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Sales Order Management (ออกใบสั่งขายและแผนส่งมอบงาน)</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">โมดูลที่ 5: จัดการใบสั่งงาน คอนเฟิร์มดีลโครงการค้าขาย และบริหารแผนส่งมอบงาน (Delivery Plan)</p>
          </div>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-xs text-sm"
        >
          <Plus className="w-4 h-4" />
          เปิดใบสั่งขาย SO / New Sales Order
        </button>
      </div>

      {/* filter tools */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ใบสั่งขาย SO, แผนส่งมอบ Delivery Plan, ชื่อโครงการ หรือชื่อบริษัทลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 transition-all"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          {/* Status Filter */}
          <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200/60 shadow-xxs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">สถานะใบสั่งขาย / Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-transparent border-0 text-xs focus:outline-none cursor-pointer font-extrabold text-slate-700 mt-0.5"
            >
              <option value="All">ทั้งหมด (ทุกสถานะ)</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Delivered">Delivered</option>
              <option value="Approved">Approved</option>
              <option value="Planning">Planning</option>
              <option value="Completed">Completed</option>
              <option value="Partially Invoiced">Partially Invoiced</option>
              <option value="Fully Invoiced">Fully Invoiced</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sales Representative Filter */}
          <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200/60 shadow-xxs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ผู้ดูแล / Sales Rep:</span>
            <select
              value={selectedSalesRepFilter}
              onChange={(e) => setSelectedSalesRepFilter(e.target.value)}
              className="w-full bg-transparent border-0 text-xs focus:outline-none cursor-pointer font-extrabold text-slate-700 mt-0.5"
            >
              <option value="All">ทั้งหมด (ทุกฝ่ายขาย)</option>
              {existingSalesRepsList.map(rep => (
                <option key={rep} value={rep}>{rep}</option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200/60 shadow-xxs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">บริษัทคู่ค้า / Customer:</span>
            <select
              value={selectedCustomerFilter}
              onChange={(e) => setSelectedCustomerFilter(e.target.value)}
              className="w-full bg-transparent border-0 text-xs focus:outline-none cursor-pointer font-extrabold text-slate-700 mt-0.5"
            >
              <option value="All">ทั้งหมด (ทุกบริษัทลูกค้า)</option>
              {existingCustomersList.map(cust => (
                <option key={cust} value={cust}>{cust}</option>
              ))}
            </select>
          </div>

          {/* Delivery Plan Cascading Filter (Excel-like) */}
          <div className="space-y-1 bg-teal-50/70 p-2 rounded-lg border border-teal-200/80 shadow-xxs">
            <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">แผนส่งมอบ / DELIVERY PLAN:</span>
            <select
              value={selectedDeliveryPlan}
              onChange={(e) => setSelectedDeliveryPlan(e.target.value)}
              className="w-full bg-transparent border-0 text-xs focus:outline-none cursor-pointer font-extrabold text-teal-900 mt-0.5"
            >
              <option value="All">
                ทั้งหมด ({availableDeliveryPlans.length} แผน / {preDeliverySalesOrders.length} รายการ)
              </option>
              {availableDeliveryPlans.map(dp => (
                <option key={dp} value={dp}>
                  📅 {dp} ({preDeliverySalesOrders.filter(so => (so.delivery_plan || so.target_delivery_date) === dp).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Spreadsheet Tab simulation bar */}
      <div className="bg-[#f8f9fa] border border-slate-200 border-b-0 px-4 py-2 flex items-center justify-between text-xs select-none rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="font-medium bg-[#E8EAED] px-2.5 py-1 rounded border border-slate-200 text-slate-700 select-none">Sheet1</span>
          <span className="text-slate-400">|</span>
          <span className="font-mono font-semibold text-emerald-600">{filteredSalesOrders.length} แถว (Rows)</span>
        </div>
      </div>

      {/* Main Grid table in Google Sheet style */}
      <div className="bg-white rounded-b-2xl border border-[#DADCE0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              {/* Excel Column Headers A, B, C... */}
              <tr className="bg-[#F8F9FA] border-b border-slate-250 text-[10px] font-mono text-slate-400 select-none">
                <th className="border border-slate-200 bg-[#E8EAED] text-center w-10 py-1"></th>
                <th className="border border-slate-200 text-center w-40">A</th>
                <th className="border border-slate-200 text-center">B</th>
                <th className="border border-slate-200 text-center w-44">C</th>
                <th className="border border-slate-200 text-center w-44">D</th>
                <th className="border border-slate-200 text-center w-36">E</th>
                <th className="border border-slate-200 text-center w-36">F</th>
              </tr>
              {/* Header Columns inside the spreadsheet */}
              <tr className="bg-[#F8F9FA] border-b-2 border-slate-300 text-xs font-semibold text-slate-600">
                <th className="border border-slate-200 bg-[#E8EAED] text-center w-10 font-mono select-none"></th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">รหัสใบสั่งขาย</th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">แคมเปญโครงการ / บริษัทคู่ค้า</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-slate-700">มูลค่างบประมาณรวม</th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">วันที่รับจ้าง / กำหนดสำเร็จ</th>
                <th className="border border-slate-200 px-3 py-2 text-center text-slate-700">คิวสถานะ</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-slate-700">การสั่งการ</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700">
              {filteredSalesOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs border border-slate-200">
                    ไม่พบข้อมูลประวัติใบสั่งสั่งขายทางการค้าในรอบพอร์ทัล
                  </td>
                </tr>
              ) : (
                filteredSalesOrders.map((so, idx) => (
                  <tr 
                    key={so.id} 
                    onClick={() => setGeneratingSO(so)}
                    className={`hover:bg-blue-50/45 cursor-pointer transition-colors border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F8F9FA]/70'}`}
                  >
                    {/* Index row background (spreadsheet numbering) */}
                    <td className="border border-slate-200 bg-[#F1F3F4] text-[#5f6368] text-center font-mono text-[10px] select-none py-1.5">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-slate-800">
                      {so.so_no}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-extrabold text-slate-800 text-sm block">{so.project_name}</span>
                        {so.po_no && (
                          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 font-mono font-bold px-1.5 py-0.5 rounded border border-teal-200 text-[10px]" title="Customer PO Number">
                            PO: {so.po_no}
                          </span>
                        )}
                        {(so.delivery_plan || so.target_delivery_date) && (
                          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 font-mono font-bold px-1.5 py-0.5 rounded border border-teal-200 text-[10px]" title="Delivery Plan">
                            📅 แผนส่งมอบ: {so.delivery_plan || so.target_delivery_date}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-semibold block">ลูกค้า: {so.customer_name}</span>
                      {so.sales_person && (
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                          ผู้ดูแล: <span className="text-slate-600 font-semibold">{so.sales_person}</span>
                        </span>
                      )}

                      {so.items && so.items.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">รายการสัดส่วนและยอดคงเหลือ / Invoiced Items & Remaining:</span>
                          <div className="space-y-1">
                            {so.items.map((it, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[11px] bg-slate-50/50 p-1.5 rounded border border-slate-100">
                                <span className="text-slate-600 font-medium">{it.item_no}. {it.description}</span>
                                <span className={`font-mono font-bold whitespace-nowrap px-1.5 py-0.2 rounded ${it.remaining_qty === 0 ? 'text-green-700 bg-green-50 border border-green-100' : 'text-amber-700 bg-amber-50 border border-amber-100'}`}>
                                  คงเหลือ: {it.remaining_qty} / {it.qty} {it.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                      ฿{so.total_amount.toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5">
                      <span className="text-xs block text-slate-600 font-bold">เริ่ม: {so.order_date}</span>
                      <span className="text-[10px] text-teal-700 block font-bold mt-0.5">แผนส่งมอบ: {so.delivery_plan || so.target_delivery_date}</span>
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold leading-none ${
                        so.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-150' :
                        so.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' :
                        so.status === 'Planning' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                        so.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-150' :
                        'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        {so.status}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* 1. Generate Sales Order Button (Master Template 100% Geometry Matched) */}
                        <button
                          onClick={() => setGeneratingSO(so)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          title="สร้างเอกสาร Sales Order ตรงตาม Master Template ต้นฉบับ 100%"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Generate Sales Order</span>
                        </button>

                        <button
                          onClick={() => setGeneratingSO(so)}
                          title="ดูและพิมพ์แบบฟอร์ม Sales Order (Master Template)"
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateSO(so)}
                          title="คัดลอก"
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditForm(so)}
                          title="แก้ไข"
                          className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบใบสั่งขาย ${so.so_no} ใช่หรือไม่?`)) {
                                onDelete(so.id);
                              }
                            }}
                            title="ลบ"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create / Edit Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up">
            <div className="bg-slate-50 p-6 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {editingSO ? `ปรับขั้นตอนการทำงานใบสั่งจ้าง SO: ${editingSO.so_no}` : 'ขึ้นทะเบียนใบสั่งขาย Sales Order (รับมอบงาน)'}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">บันทึกข้อตกลงงานวิศวกรรมเฉพาะทาง หรือจัดหาทรัพยากรกำลังคน</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-white border border-slate-150">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Quotation Ref */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">รหัสใบสั่งขาย (SO No.) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น SO-001-26"
                  value={soNo}
                  onChange={(e) => setSoNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono font-bold"
                />
              </div>

              {/* Project name input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">องค์กรลูกค้าหลัก</label>
                <select
                  required
                  value={custId}
                  onChange={(e) => setCustId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">-- เลือกบริษัทลูกค้า --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customer_name}</option>
                  ))}
                </select>
              </div>

              {/* Project name input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">ชื่อแคมเปญโครงการ/งานบริการที่ระบุ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โครงการตรวจแก้หม้อแก๊สโรงไฟฟ้า PTT"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Delivery Plan Input */}
              <div>
                <label className="block text-xs font-bold text-teal-800 mb-1.5">
                  แผนส่งมอบงาน / DELIVERY PLAN * <span className="text-teal-600 font-normal">(กำหนดวันที่หรือแผนส่งมอบงานโครงการ)</span>
                </label>
                <input
                  type="date"
                  required
                  value={deliveryPlan}
                  onChange={(e) => {
                    setDeliveryPlan(e.target.value);
                    setTargetDeliveryDate(e.target.value);
                  }}
                  className="w-full bg-teal-50/40 border border-teal-300 rounded-xl px-3.5 py-2 text-sm font-semibold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Customer PO Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  เลขที่ใบสั่งซื้อลูกค้า / Customer PO No. <span className="text-slate-450 font-normal">(ระบุเลขที่เอกสาร PO ที่ได้รับจากลูกค้าเพื่อใช้คุยงานร่วมกัน)</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น PO-681903, PO-2026-610"
                  value={poNo}
                  onChange={(e) => setPoNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Sales Representative Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  ผู้ดูแลยอดสั่งซื้อ / Sales Representative
                </label>
                <input
                  type="text"
                  placeholder="เช่น Thanaphol Khamdee"
                  value={salesPerson}
                  onChange={(e) => setSalesPerson(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Amount and Status and Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">ยอดงบประมาณจัดจ้าง (฿) *</label>
                  <input
                    type="number"
                    required
                    placeholder="เช่น 1200000"
                    value={totalAmount || ''}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">รหัสคิวสถานะดีลงาน</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">วันที่ตกลงสั่งจ้าง / Order Date</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">กำหนดส่งมอบแผนงาน / Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={targetDeliveryDate}
                    onChange={(e) => setTargetDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-50 border border-slate-200 text-slate-600 font-bold px-5 py-2 rounded-xl text-xs hover:bg-slate-100 transition-all"
                >
                  ออก
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-teal-700 shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  อนุมัติคำสั่งสั่งขาย / Issue SO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Master Sales Order Document Generator Modal (100% Geometry Matched) */}
      {generatingSO && (
        <SalesOrderGenerateModal
          isOpen={!!generatingSO}
          onClose={() => setGeneratingSO(null)}
          salesOrder={generatingSO}
          customer={customers.find(c => c.id === generatingSO.customer_id || c.customer_name === generatingSO.customer_name)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
