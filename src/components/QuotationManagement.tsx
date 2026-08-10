import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Download,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  Printer,
  Copy,
  RefreshCw,
  LayoutDashboard,
  List,
  Send,
  Filter,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Settings,
} from "lucide-react";
import FormSettingsView from "./FormSettingsView";

const getUsername = (idOrName: string) => {
  if (
    typeof window !== "undefined" &&
    (window as any).SupabaseDB?.getUsernameOrDisplayName
  ) {
    return (window as any).SupabaseDB.getUsernameOrDisplayName(idOrName);
  }
  const clean = String(idOrName).toLowerCase();
  return clean.includes("ธนพล")
    ? "@apiyut"
    : clean.includes("สุชาดา")
      ? "@pimjai"
      : clean.includes("เอกชัย")
        ? "@wiriya"
        : idOrName;
};

export default function QuotationManagement() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "list">("dashboard");
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'err' } | null>(null);

  const currentEmail = typeof localStorage !== "undefined" ? localStorage.getItem("crm_user_email") : "";
  const currentName = typeof localStorage !== "undefined" ? localStorage.getItem("crm_user_fullname") : "";
  const isApiyut = 
    currentEmail?.toLowerCase().includes("apiyut") || 
    currentName?.toLowerCase().includes("apiyut") ||
    (typeof localStorage !== "undefined" && localStorage.getItem("crm_user_role") === "Admin");

  const showToast = (msg: string, type: 'success' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const exportToExcel = () => {
    const table = document.getElementById("quotations-main-table");
    if (!table) {
      showToast("No table data found for export. Please make sure the list view is active.", "err");
      return;
    }
    try {
      // @ts-ignore
      if (typeof XLSX !== 'undefined') {
        // @ts-ignore
        const wb = XLSX.utils.table_to_book(table, { sheet: "Quotations" });
        // @ts-ignore
        XLSX.writeFile(wb, `Quotations_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast("Excel report exported successfully.", "success");
      } else {
        showToast("XLSX library not loaded yet. Please try again in a few seconds.", "err");
      }
    } catch (err) {
      console.error(err);
      showToast("Excel export failed.", "err");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // @ts-ignore
    if (window.SupabaseDB) {
      // @ts-ignore
      const quotes = (await window.SupabaseDB.getQuotations()) || [];
      // @ts-ignore
      const custs = (await window.SupabaseDB.getCustomers()) || [];
      // @ts-ignore
      const usrs = (await window.SupabaseDB.getUsers()) || [];
      setQuotations(quotes);
      setCustomers(custs);
      setUsers(usrs);
    }
  };

  const handleDuplicate = async (id: string) => {
    const q = quotations.find((quote) => quote.id === id);
    if (!q) return;

    const payload = {
      title: q.title,
      customer_id: q.customer_id,
      quotation_date: new Date().toISOString().split("T")[0],
      validity_days: q.validity_days || 30,
      payment_term: q.payment_term || "30 Days",
      sales_person: q.sales_person,
      status: "Draft",
      revision_number: 0,
      remarks: q.remarks || "",
      terms_conditions: q.terms_conditions || "",
      items: q.items ? q.items.map((it: any) => ({ ...it })) : [],
      total_value: q.total_value,
      tax_rate: q.tax_rate || 7,
      grand_total: q.grand_total,
    };

    // @ts-ignore
    if (window.SupabaseDB) {
      // @ts-ignore
      await window.SupabaseDB.addQuotation(payload);
      showToast(`คัดลอกใบเสนอราคา ${q.quotation_no} สำเร็จ (เป็นฉบับร่าง)`, 'success');
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const q = quotations.find((quote) => quote.id === id);
    if (!q) return;

    if (!isApiyut) {
      showToast("เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบใบเสนอราคาได้", "err");
      return;
    }

    // @ts-ignore
    if (window.SupabaseDB) {
      try {
        // @ts-ignore
        await window.SupabaseDB.deleteQuotation(id);
        showToast(`ลบใบเสนอราคา ${q.quotation_no} สำเร็จ`, 'success');
        loadData();
      } catch (err: any) {
        showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'err');
      }
    }
  };

  const dashboardData = {
    total: quotations.length,
    approved: quotations.filter((q) => q.status === "Approved" || q.status === "Invoiced").length,
    pending: quotations.filter(
      (q) => q.status === "Sent" || q.status === "Draft",
    ).length,
    rejected: quotations.filter((q) => q.status === "Rejected").length,
    value: quotations.reduce((acc, q) => acc + (q.grand_total_thb || ((q.grand_total || 0) * (q.exchange_rate || 1.0))), 0),
  };

  const statusData = [
    { name: "Approved", value: dashboardData.approved, color: "#10B981" },
    { name: "Pending", value: dashboardData.pending, color: "#F59E0B" },
    { name: "Rejected", value: dashboardData.rejected, color: "#EF4444" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-600" />
              Quotation Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage, approve, and track quotes in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 cursor-pointer transition"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={() => {
                setEditingId("settings");
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold border border-slate-300 shadow-sm flex items-center gap-2 cursor-pointer transition"
            >
              <Settings className="w-4 h-4 text-slate-600" /> ตั้งค่าฟอร์ม
            </button>
            <button
              onClick={() => {
                setEditingId("new");
              }}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Quotation
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 cursor-pointer"
            >
              Back to ERP
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pb-12 pt-6">
        {printId ? (
          <PrintPreview
            id={printId}
            onClose={() => setPrintId(null)}
            onEdit={() => setEditingId(printId)}
            quotations={quotations}
            customers={customers}
          />
        ) : editingId === "settings" ? (
          <FormSettingsView
            onClose={() => setEditingId(null)}
            onToast={showToast}
          />
        ) : editingId ? (
          <QuoteForm
            id={editingId}
            onClose={() => {
              setEditingId(null);
              loadData();
            }}
            quotations={quotations}
            customers={customers}
            onToast={showToast}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* KPI Cards Grid - Left 2 Columns */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <KPICard
                  title="Total Quotations"
                  value={dashboardData.total}
                  subtitle="All time"
                  icon={<FileText className="w-5 h-5 text-blue-600" />}
                  bg="bg-blue-50/70"
                  border="border-blue-100"
                />
                <KPICard
                  title="Total Value"
                  value={`฿${dashboardData.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  subtitle="Grand Total Amount"
                  icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                  bg="bg-emerald-50/70"
                  border="border-emerald-100"
                />
                <KPICard
                  title="Approved & Won"
                  value={dashboardData.approved}
                  subtitle="Won deals"
                  icon={<CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                  bg="bg-indigo-50/70"
                  border="border-indigo-100"
                />
                <KPICard
                  title="Pending Review"
                  value={dashboardData.pending}
                  subtitle="Awaiting decision"
                  icon={<RefreshCw className="w-5 h-5 text-amber-600" />}
                  bg="bg-amber-50/70"
                  border="border-amber-100"
                />
              </div>

              {/* Status Pie Chart - Right Column */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status Distribution
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    Real-time
                  </span>
                </div>
                <div className="h-[140px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          fontSize: "11px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="flex justify-around text-[10px] font-bold text-slate-600 mt-2 border-t border-slate-100 pt-2">
                  {statusData.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span>
                        {s.name} ({s.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quotations List Table Directly Below */}
            <QuoteList
              quotations={quotations}
              customers={customers}
              users={users}
              onEdit={setEditingId}
              onPrint={setPrintId}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onRefresh={loadData}
              showToast={showToast}
            />
          </div>
        )}
      </main>

      {/* Floating custom Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 animate-bounce ${toast.type === 'success' ? 'bg-emerald-950/95 border-emerald-800 text-emerald-400' : 'bg-rose-950/95 border-rose-800 text-rose-400'}`}>
          <div className="w-2 h-2 rounded-full bg-current animate-ping" />
          <span className="text-xs font-bold">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

function KPICard({ title, value, subtitle, icon, bg, border }: any) {
  return (
    <div
      className={`p-5 rounded-2xl border ${border} ${bg} shadow-sm relative overflow-hidden`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-slate-600 mb-1">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">
            {value}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-2">
            {subtitle}
          </p>
        </div>
        <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuoteList({
  quotations,
  customers,
  users,
  onEdit,
  onPrint,
  onDuplicate,
  onDelete,
  onRefresh,
  showToast,
}: any) {
  const [search, setSearch] = useState("");
  const currentEmail = typeof localStorage !== "undefined" ? localStorage.getItem("crm_user_email") : "";
  const currentName = typeof localStorage !== "undefined" ? localStorage.getItem("crm_user_fullname") : "";
  const isApiyut = 
    currentEmail?.toLowerCase().includes("apiyut") || 
    currentName?.toLowerCase().includes("apiyut") ||
    (typeof localStorage !== "undefined" && localStorage.getItem("crm_user_role") === "Admin");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [salesRepFilter, setSalesRepFilter] = useState("ALL");

  const userMap = new Map(users.map((u: any) => [u.id, u.fullname]));
  const filtered = quotations.filter((q) => {
    const custObj = customers?.find((c: any) => c.id === q.customer_id) || q.customer;
    const custName = custObj?.customer_name || q.customer_name || "";
    const matchesSearch =
      q.quotation_no.toLowerCase().includes(search.toLowerCase()) ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      custName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      q.status === statusFilter ||
      (statusFilter === "Approved" && q.status === "Invoiced");
    
    const salesRepId = q.sales_person || "";
    const salesRepName = userMap.get(salesRepId) || salesRepId;
    const matchesSalesRep =
      salesRepFilter === "ALL" ||
      salesRepName.toLowerCase() === salesRepFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesSalesRep;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${statusFilter === "ALL" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("Draft")}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${statusFilter === "Draft" ? "bg-slate-500 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
          >
            Draft
          </button>
          <button
            onClick={() => setStatusFilter("Sent")}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${statusFilter === "Sent" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
          >
            Sent
          </button>
          <button
            onClick={() => setStatusFilter("Approved")}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${statusFilter === "Approved" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter("Rejected")}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${statusFilter === "Rejected" ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
          >
            Rejected
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={salesRepFilter}
            onChange={(e) => setSalesRepFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
          >
            <option value="ALL">All Sales Reps</option>
            {users.filter(u => u.fullname !== "ART KIT").map((user) => (
              <option key={user.id} value={user.fullname}>
                {user.fullname}
              </option>
            ))}
          </select>
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table id="quotations-main-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Quote No
              </th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sale Rep
              </th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Project Name
              </th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                Amount (Excl. VAT)
              </th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Status
              </th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((q) => (
              <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {q.quotation_no}
                  </span>
                  {q.revision_number && q.revision_number > 0 ? (
                    <span className="ml-2 text-xs font-bold px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                      Rev.{q.revision_number}
                    </span>
                  ) : null}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-slate-700">
                  {getUsername(q.sales_person || "ธนพล คำดี (S03)")}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-slate-800">
                  {(() => {
                    const custObj = customers?.find((c: any) => c.id === q.customer_id) || q.customer;
                    return custObj?.customer_name || q.customer_name || "N/A";
                  })()}
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-slate-700">
                    {q.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex flex-wrap gap-1.5">
                    <span className="bg-slate-100 text-slate-600 px-1 rounded">
                      Owner: {getUsername(q.sales_person || "ธนพล คำดี (S03)")}
                    </span>
                    <span className="bg-blue-50 text-blue-600 px-1 rounded">
                      Created: {getUsername(q.created_by || "apiyut")}
                    </span>
                    {q.status === "Approved" && (
                      <span className="bg-emerald-50 text-emerald-600 px-1 rounded">
                        Approved: @apiyut
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {q.quotation_date}
                </td>
                <td className="py-3 px-4 text-sm font-mono font-bold text-slate-800 text-right">
                  <div>
                    {q.currency || "THB"} {(q.total_value !== undefined ? q.total_value : (q.grand_total ? q.grand_total / 1.07 : 0)).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  {q.currency && q.currency !== "THB" && (
                    <div className="text-[10px] text-slate-400 font-normal">
                      (THB {(q.total_value_thb !== undefined ? q.total_value_thb : (q.grand_total_thb ? q.grand_total_thb / 1.07 : (q.total_value || 0) * (q.exchange_rate || 1.0))).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })})
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <StatusBadge status={q.status} />
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onPrint(q.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                      title="Print/Export PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(q.id)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                      title="Edit/Revise"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDuplicate(q.id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded"
                      title="Duplicate Quotation"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {isApiyut ? (
                      <button
                        onClick={() => onDelete(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="ลบใบเสนอราคา (Delete)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        className="p-1.5 text-slate-200 cursor-not-allowed"
                        title="เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบได้"
                        disabled
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {q.status === "Approved" || q.status === "Accepted" ? (
                      <button
                        onClick={async () => {
                          try {
                            showToast(`กำลังส่งใบเสนอราคา ${q.quotation_no} ไปสร้างเป็น Sales Order...`, 'success');
                            // @ts-ignore
                            if (window.SupabaseDB) {
                              // Map quotation items to sales order items with rich fields for maximum compatibility
                              const soItems = (q.items || []).map((it: any, idx: number) => {
                                const qty = Number(it.qty || 1);
                                const duration = Number(it.duration || 1);
                                const unitRate = Number(it.unit_rate || it.rate || it.unit_price || 0);
                                const totalPrice = Number(it.total_price || (qty * duration * unitRate));
                                return {
                                  item_no: it.item_no || idx + 1,
                                  description: it.description || it.desc || "",
                                  qty: qty,
                                  remaining_qty: qty,
                                  duration: duration,
                                  unit: it.unit || "Set",
                                  unit_rate: unitRate,
                                  unit_price: unitRate,
                                  total_price: totalPrice
                                };
                              });

                               const soPayload = {
                                quotation_id: q.id,
                                customer_id: q.customer_id,
                                project_name: q.title || q.project_name || "ดีลจากใบเสนอราคา " + q.quotation_no,
                                total_amount: q.grand_total || q.total_value || 0,
                                status: "Pending",
                                order_date: new Date().toISOString().slice(0, 10),
                                sales_person: q.sales_person || q.sales_representative || null,
                                po_no: q.po_no || null,
                                delivery_plan: q.delivery_plan || null,
                                target_delivery_date: q.delivery_plan || null,
                                items: soItems
                              };

                              // 1. Create Sales Order
                              // @ts-ignore
                              const createdSo = await window.SupabaseDB.addSalesOrder(soPayload);
                              
                              // 2. Update Quotation status to 'Invoiced' (จบกระบวนการใบเสนอราคา)
                              // @ts-ignore
                              await window.SupabaseDB.updateQuotation(q.id, { status: 'Invoiced' });
                              
                              showToast(`ส่งไปสร้าง Sales Order สำเร็จ! ได้เลขที่สั่งขาย: ${createdSo.so_no || ''}`, 'success');
                              
                              // 3. Redirect to Sales Orders page
                              setTimeout(() => {
                                window.location.href = "/sales-orders.html";
                              }, 1200);
                            } else {
                              showToast("ไม่พบตัวเชื่อมโยงระบบฐานข้อมูล", 'err');
                            }
                          } catch (err: any) {
                            showToast("เกิดข้อผิดพลาดในการแปลงเอกสาร: " + err.message, 'err');
                          }
                        }}
                        className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded border border-emerald-200 transition-colors cursor-pointer"
                        title="ส่งไป Sales Orders"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No quotation records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    Draft: "bg-slate-100 text-slate-700",
    Sent: "bg-blue-100 text-blue-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-rose-100 text-rose-700",
    Invoiced: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-orange-100 text-orange-700",
  };
  const displayStatus = status === "Invoiced" ? "Approved" : status;
  return (
    <span
      className={`px-2.5 py-1 text-xs font-bold rounded-md ${styles[status] || styles["Draft"]}`}
    >
      {displayStatus}
    </span>
  );
}

// -----------------------------------------------------
// FORM COMPONENT
// -----------------------------------------------------
function QuoteForm({ id, onClose, quotations, customers, onToast }: any) {
  const initialQuote =
    id === "new" ? null : quotations.find((q: any) => q.id === id);
  const [items, setItems] = useState<
    {
      id: string;
      desc: string;
      qty: number;
      duration_days: number;
      unit: string;
      rate: number;
    }[]
  >(
    initialQuote
      ? (initialQuote.items || []).map((i: any, idx: number) => ({
          id: i.item_no || idx.toString(),
          desc: i.description,
          qty: i.qty,
          duration_days: i.duration_days || i.duration || 1,
          unit: i.unit,
          rate: i.unit_rate,
        }))
      : [{ id: "0", desc: "", qty: 1, duration_days: 1, unit: "Set", rate: 0 }],
  );

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialQuote?.customer_id || ""
  );
  const [attention, setAttention] = useState(
    initialQuote?.attention || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    initialQuote?.customer_phone || ""
  );
  const [customerEmail, setCustomerEmail] = useState(
    initialQuote?.customer_email || ""
  );
  const [currency, setCurrency] = useState(initialQuote?.currency || "THB");
  const [exchangeRate, setExchangeRate] = useState<number>(initialQuote?.exchange_rate || 1.0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    if (newCurr === "THB") {
      setExchangeRate(1.0);
    } else if (newCurr === "USD") {
      setExchangeRate(36.5);
    } else if (newCurr === "SGD") {
      setExchangeRate(27.0);
    }
  };

  const selectedCust = customers.find((c: any) => c.id === selectedCustomerId);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find((c: any) => c.id === customerId);
    if (cust) {
      if (cust.contacts && cust.contacts.length > 0) {
        const firstContact = cust.contacts[0];
        setAttention(firstContact.contact_name);
        setCustomerPhone(firstContact.phone || cust.phone || "");
        setCustomerEmail(firstContact.email || cust.email || "");
      } else {
        setAttention("");
        setCustomerPhone(cust.phone || "");
        setCustomerEmail(cust.email || "");
      }
    } else {
      setAttention("");
      setCustomerPhone("");
      setCustomerEmail("");
    }
  };

  const handleContactChange = (contactIdx: string) => {
    if (contactIdx === "") return;
    const idx = parseInt(contactIdx, 10);
    if (selectedCust && selectedCust.contacts && selectedCust.contacts[idx]) {
      const contact = selectedCust.contacts[idx];
      setAttention(contact.contact_name);
      setCustomerPhone(contact.phone || selectedCust.phone || "");
      setCustomerEmail(contact.email || selectedCust.email || "");
    }
  };

  const calculateTotal = () =>
    items.reduce((acc, i) => acc + i.qty * i.duration_days * i.rate, 0);

  const moveItemUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    setItems(newItems);
  };

  const moveItemDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    setItems(newItems);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setErrorMsg(null);
    const fd = new FormData(e.target);

    // Verify if trying to set status to Approved
    // เซลลทุกคนสามารถปรับ Status ได้ตามต้องการ (All sales representatives can now change the status)
    const statusVal = fd.get("status");

    const subtotal = calculateTotal();
    const tax = subtotal * 0.07;

    const customerId = fd.get("customer");
    const selectedCust = customers.find((c: any) => c.id === customerId);

    // Auto seq if new
    let newQuoteNo = initialQuote?.quotation_no;
    if (!newQuoteNo) {
      const qDate = (fd.get("quotation_date") as string) || (fd.get("issue_date") as string) || new Date().toISOString().slice(0, 10);
      let yr = "";
      let mm = "";
      if (qDate && qDate.includes("-")) {
        const parts = qDate.split("-");
        yr = parts[0].slice(-2);
        mm = parts[1].padStart(2, "0");
      }
      if (!yr || !mm) {
        const d = new Date();
        yr = d.getFullYear().toString().slice(-2);
        mm = String(d.getMonth() + 1).padStart(2, "0");
      }
      const prefix = `QT${yr}${mm}`;
      const regex = new RegExp(`^QT-?${yr}${mm}(\\d+)`, "i");

      const seqs = quotations.map((q: any) => {
        if (!q.quotation_no) return 0;
        const match = q.quotation_no.match(regex);
        return match ? parseInt(match[1], 10) : 0;
      });

      const maxSeq = Math.max(0, ...seqs);
      const seq = maxSeq + 1;
      newQuoteNo = `${prefix}${String(seq).padStart(3, "0")}`;
    }

    const payload = {
      quotation_no: newQuoteNo,
      title: fd.get("title"),
      customer_id: customerId,
      customer_name: selectedCust?.customer_name || "",
      customer_phone: fd.get("customer_phone") || selectedCust?.phone || "",
      customer_email: fd.get("customer_email") || selectedCust?.email || "",
      attention: fd.get("attention") || "",
      cc: fd.get("cc") || "",
      quotation_date: fd.get("date"),
      validity_days: parseInt(fd.get("validity") as string) || 30,
      payment_term: fd.get("payment"),
      sales_person: fd.get("sales"),
      po_no: fd.get("po_no") || "",
      delivery_plan: fd.get("delivery_plan") || "",
      status: fd.get("status"),
      revision_number: parseInt(fd.get("revision") as string) || 0,
      remarks: fd.get("remarks") || "",
      terms_conditions: fd.get("terms"),
      items: items.map((i, idx) => ({
        item_no: idx + 1,
        description: i.desc,
        qty: i.qty,
        unit: i.unit,
        duration: i.duration_days,
        duration_days: i.duration_days,
        unit_rate: i.rate,
        total_price: i.qty * i.duration_days * i.rate,
      })),
      total_value: subtotal,
      tax_rate: 7,
      grand_total: subtotal + tax,
      currency: currency,
      exchange_rate: exchangeRate,
      total_value_thb: subtotal * exchangeRate,
      grand_total_thb: (subtotal + tax) * exchangeRate,
    };

    // @ts-ignore
    if (window.SupabaseDB) {
      let savedQuote;
      if (initialQuote) {
        // @ts-ignore
        savedQuote = await window.SupabaseDB.updateQuotation(initialQuote.id, payload);
      } else {
        // @ts-ignore
        savedQuote = await window.SupabaseDB.addQuotation(payload);
      }

      // Automatically create a Sales Order when quotation is Approved
      if (payload.status === "Approved" && savedQuote) {
        try {
          // Double check if Sales Order already exists for this quotation to prevent duplicates
          // @ts-ignore
          const existingOrders = await window.SupabaseDB.getSalesOrders() || [];
          const alreadyExists = existingOrders.some((so: any) => String(so.quotation_id) === String(savedQuote.id));

          if (!alreadyExists) {
            // Map items
            const soItems = (savedQuote.items || []).map((it: any, idx: number) => {
              const qty = Number(it.qty || 1);
              const duration = Number(it.duration || it.duration_days || 1);
              const unitRate = Number(it.unit_rate || it.rate || it.unit_price || 0);
              const totalPrice = Number(it.total_price || (qty * duration * unitRate));
              return {
                item_no: it.item_no || idx + 1,
                description: it.description || it.desc || "",
                qty: qty,
                remaining_qty: qty,
                duration: duration,
                unit: it.unit || "Set",
                unit_rate: unitRate,
                unit_price: unitRate,
                total_price: totalPrice
              };
            });

            const soPayload = {
              quotation_id: savedQuote.id,
              customer_id: savedQuote.customer_id,
              project_name: savedQuote.title || "ดีลจากใบเสนอราคา " + savedQuote.quotation_no,
              total_amount: savedQuote.grand_total || savedQuote.total_value || 0,
              status: "Pending",
              order_date: new Date().toISOString().slice(0, 10),
              sales_person: savedQuote.sales_person || null,
              po_no: savedQuote.po_no || null,
              delivery_plan: savedQuote.delivery_plan || null,
              target_delivery_date: savedQuote.delivery_plan || null,
              items: soItems
            };

            // @ts-ignore
            const createdSo = await window.SupabaseDB.addSalesOrder(soPayload);

            // Update Quotation status to 'Invoiced' (จบกระบวนการใบเสนอราคา)
            // @ts-ignore
            await window.SupabaseDB.updateQuotation(savedQuote.id, { status: 'Invoiced' });

            // Toast/Alert to signify the auto conversion
            // @ts-ignore
            if (window.Swal) {
              // @ts-ignore
              window.Swal.fire({
                title: "Approved & Converted!",
                text: `Quotation Approved successfully. Sales Order ${createdSo.so_no || ""} has been automatically generated in the database!`,
                icon: "success",
                timer: 4000,
                showConfirmButton: true
              });
            } else if (onToast) {
              onToast(`Approved! Sales Order ${createdSo.so_no || ""} created automatically.`, 'success');
            }
          }
        } catch (err: any) {
          console.error("Auto sales order conversion failed:", err);
          if (onToast) {
            onToast("เกิดข้อผิดพลาดในการสร้าง Sales Order อัตโนมัติ: " + err.message, 'err');
          }
        }
      }

      // Update real-time menu badges
      // @ts-ignore
      if (window.updateSystemBadges) {
        // @ts-ignore
        window.updateSystemBadges();
      }
    }
    onClose();
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mx-auto max-w-5xl"
    >
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {initialQuote
              ? `Edit Quotation: ${initialQuote.quotation_no}`
              : "Create New Quotation"}
          </h2>
          <p className="text-sm text-slate-500">
            Fill in the details for the quotation to send to the client.
          </p>
        </div>
      </div>
      <div className="p-6 space-y-8">
        {errorMsg && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-rose-800">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Project Name (Title) <span className="text-rose-500">*</span>
            </label>
            <input
              name="title"
              defaultValue={initialQuote?.title}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Customer <span className="text-rose-500">*</span>
            </label>
            <select
              name="customer"
              required
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name}
                </option>
              ))}
            </select>
          </div>

          {selectedCust?.contacts && selectedCust.contacts.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-indigo-600 mb-1.5 flex items-center gap-1">
                <span>เลือกผู้ติดต่อ (Select Contact Person)</span>
              </label>
              <select
                onChange={(e) => handleContactChange(e.target.value)}
                defaultValue=""
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-indigo-50/50 text-indigo-900 font-medium focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- ดึงข้อมูลจากทะเบียนรายชื่อผู้ติดต่อ --</option>
                {selectedCust.contacts.map((contact: any, index: number) => (
                  <option key={index} value={index}>
                    {contact.contact_name} ({contact.position || "N/A"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Attention (Attn)
            </label>
            <input
              type="text"
              name="attention"
              value={attention}
              onChange={(e) => setAttention(e.target.value)}
              placeholder="e.g. Khun Sawit Kong-ngoen"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Direct Phone (Tel)
            </label>
            <input
              type="text"
              name="customer_phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +66(0)93-296-9151"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Direct Email (Email)
            </label>
            <input
              type="text"
              name="customer_email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="e.g. sawit.k@stpi.co.th"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              CC
            </label>
            <input
              type="text"
              name="cc"
              defaultValue={initialQuote?.cc}
              placeholder="e.g. -"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-700 mb-1.5">
              Currency <span className="text-rose-500">*</span>
            </label>
            <select
              name="currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-blue-50/20 font-bold text-blue-950"
            >
              <option value="THB">THB (฿)</option>
              <option value="USD">USD ($)</option>
              <option value="SGD">SGD (S$)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-700 mb-1.5">
              Exchange Rate (to THB)
            </label>
            <input
              type="number"
              step="any"
              name="exchange_rate"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
              disabled={currency === "THB"}
              placeholder="1.0"
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-blue-50/10 font-mono font-bold text-blue-950 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              required
              defaultValue={
                initialQuote?.quotation_date ||
                new Date().toISOString().slice(0, 10)
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Validity (Days)
            </label>
            <input
              type="number"
              name="validity"
              defaultValue={initialQuote?.validity_days || 30}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Payment Term
            </label>
            <input
              type="text"
              name="payment"
              defaultValue={initialQuote?.payment_term || "30 Days"}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Sales Rep
            </label>
            <input
              type="text"
              name="sales"
              defaultValue={
                initialQuote?.sales_person ||
                (typeof localStorage !== "undefined"
                  ? localStorage.getItem("crm_user_fullname")
                  : "") ||
                "Admin"
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-teal-700 mb-1.5">
              Customer PO Ref
            </label>
            <input
              type="text"
              name="po_no"
              defaultValue={initialQuote?.po_no || ""}
              placeholder="e.g. PO-PTT-8890"
              className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm bg-teal-50/20 text-teal-900 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-teal-700 mb-1.5">
              Delivery Plan
            </label>
            <input
              type="date"
              name="delivery_plan"
              defaultValue={initialQuote?.delivery_plan || ""}
              className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm bg-teal-50/20 text-teal-900 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Status
            </label>
            <select
              name="status"
              defaultValue={initialQuote?.status || "Draft"}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Approved">
                Approved
              </option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Revision Number
            </label>
            <input
              type="number"
              name="revision"
              defaultValue={initialQuote?.revision_number || 0}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-800">Line Items</h3>
            <button
              type="button"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    id: Math.random().toString(),
                    desc: "",
                    qty: 1,
                    duration_days: 1,
                    unit: "Set",
                    rate: 0,
                  },
                ])
              }
              className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Row
            </button>
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 w-20 text-center">Qty</th>
                  <th className="py-2 px-3 w-20 text-center">Unit</th>
                  <th className="py-2 px-3 w-24 text-center">Duration Day</th>
                  <th className="py-2 px-3 w-32 text-right">Unit Rate</th>
                  <th className="py-2 px-3 w-32 text-right">Total</th>
                  <th className="py-2 px-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="p-2">
                      <textarea
                        value={item.desc}
                        onChange={(e) => {
                          const newI = [...items];
                          newI[index].desc = e.target.value;
                          setItems(newI);
                        }}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded bg-slate-50 resize-y"
                        rows={2}
                        placeholder="รายละเอียดสินค้า/บริการ (รองรับหลายบรรทัด)"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.qty}
                        onChange={(e) => {
                          const newI = [...items];
                          newI[index].qty = parseFloat(e.target.value) || 0;
                          setItems(newI);
                        }}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded bg-slate-50 text-center"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={item.unit}
                        onChange={(e) => {
                          const newI = [...items];
                          newI[index].unit = e.target.value;
                          setItems(newI);
                        }}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded bg-slate-50 text-center"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.duration_days}
                        onChange={(e) => {
                          const newI = [...items];
                          newI[index].duration_days =
                            parseFloat(e.target.value) || 0;
                          setItems(newI);
                        }}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded bg-slate-50 text-center"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => {
                          const newI = [...items];
                          newI[index].rate = parseFloat(e.target.value) || 0;
                          setItems(newI);
                        }}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded bg-slate-50 text-right"
                        required
                      />
                    </td>
                    <td className="p-2 text-right font-mono text-sm font-bold pt-3 bg-slate-50/50">
                      {(
                        item.qty *
                        item.duration_days *
                        item.rate
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveItemUp(index)}
                          disabled={index === 0}
                          className={`p-1.5 rounded transition-all ${index === 0 ? "text-slate-200 cursor-not-allowed" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
                          title="ย้ายขึ้น (Move Up)"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItemDown(index)}
                          disabled={index === items.length - 1}
                          className={`p-1.5 rounded transition-all ${index === items.length - 1 ? "text-slate-200 cursor-not-allowed" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
                          title="ย้ายลง (Move Down)"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setItems(items.filter((_, i) => i !== index))
                          }
                          className="p-1.5 rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                          title="ลบแถว (Remove)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4">
            <div className="w-80 space-y-2 text-sm border bg-slate-50/50 p-3 rounded-lg">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>{" "}
                <span className="font-mono font-bold">
                  {currency} {calculateTotal().toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT (7%):</span>{" "}
                <span className="font-mono font-bold">
                  {currency} {(calculateTotal() * 0.07).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-slate-200">
                <span>Grand Total:</span>{" "}
                <span className="font-mono text-blue-700">
                  {currency} {(calculateTotal() * 1.07).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {currency !== "THB" && (
                <div className="flex justify-between text-slate-600 border-t border-dashed border-slate-200 pt-2 font-medium">
                  <span>In THB (Est.):</span>{" "}
                  <span className="font-mono text-emerald-600 font-bold">
                    THB {((calculateTotal() * 1.07) * exchangeRate).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Remarks / Notes
            </label>
            <textarea
              name="remarks"
              defaultValue={initialQuote?.remarks || ""}
              rows={3}
              placeholder="Add professional notes..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 resize-y"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-bold text-slate-700">
                Terms & Conditions
              </label>
              <button
                type="button"
                onClick={() => {
                  const textarea = document.getElementsByName("terms")[0] as HTMLTextAreaElement;
                  if (textarea) {
                    textarea.value = "- 30 days validily from date of quotation.\n- All prices above are quoted in THB.";
                  }
                }}
                className="text-[11px] font-bold text-blue-600 hover:underline px-2 py-0.5 bg-blue-50 hover:bg-blue-100 rounded transition-all cursor-pointer"
              >
                Reset to Standard Text
              </button>
            </div>
            <textarea
              name="terms"
              defaultValue={
                initialQuote?.terms_conditions ||
                "- 30 days validily from date of quotation.\n- All prices above are quoted in THB."
              }
              rows={5}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 resize-y font-mono text-slate-800 leading-relaxed"
            />
          </div>
        </div>
      </div>
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 flex items-center gap-2"
        >
          Save Quotation
        </button>
      </div>
    </form>
  );
}

// -----------------------------------------------------
// HELPER FUNCTION: Convert amount to uppercase English Baht words
// -----------------------------------------------------
function amountToEnglishWords(num: number): string {
  if (isNaN(num) || num <= 0) return "ZERO BAHT";
  
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", 
                "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  
  const convertBelowThousand = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " HUNDRED" + (n % 100 !== 0 ? " " + convertBelowThousand(n % 100) : "");
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let result = "";
  if (integerPart >= 1000000) {
    result += convertBelowThousand(Math.floor(integerPart / 1000000)) + " MILLION ";
  }
  if ((integerPart % 1000000) >= 1000) {
    result += convertBelowThousand(Math.floor((integerPart % 1000000) / 1000)) + " THOUSAND ";
  }
  if (integerPart % 1000 > 0) {
    result += convertBelowThousand(integerPart % 1000) + " ";
  }

  result = result.trim() + " BAHT";

  if (decimalPart > 0) {
    result += " AND " + convertBelowThousand(decimalPart) + " SATANG";
  }

  return result;
}

// -----------------------------------------------------
// PRINT LAYOUT (PIXEL PERFECT A4 - M POWER FORMAT)
// -----------------------------------------------------
function PrintPreview({ id, onClose, onEdit, quotations, customers }: any) {
  const quote = quotations.find((q: any) => q.id === id);
  if (!quote)
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Quotation not found
      </div>
    );
  const customer = customers.find((c: any) => c.id === quote.customer_id);

  // Load custom form configurations
  const savedSignature = localStorage.getItem("saved_authorized_signature");

  // Format Items
  const items = quote.items && quote.items.length > 0 ? quote.items : [
    {
      qty: 1,
      unit: "Set",
      description: quote.title || quote.subject || "Sky Lotech High Lift",
      brand: "Skyy Lotech",
      model: "M-380X-200",
      specs: ["Length : 200 Meter", "Length : 200 Meter", "Diameter : 1/2\""],
      unit_rate: quote.total_value || quote.total_amount || 2800,
      total_price: quote.total_value || quote.total_amount || 2800
    }
  ];

  const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.total_price || (item.qty * (item.unit_rate || item.price || 0))) || 0), 0);
  const vatRate = quote.tax_rate ?? 7;
  const vatAmount = subtotal * (vatRate / 100);
  const grandTotal = subtotal + vatAmount;

  const bahtTextWords = amountToEnglishWords(grandTotal);

  return (
    <div className="bg-slate-50 p-6 sm:p-12 min-h-screen print:p-0 print:bg-white transition-all duration-300">
      {/* Action panel */}
      <div className="max-w-[210mm] mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm animate-fade-in">
        <div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer border border-transparent"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100/80 transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-200/60 shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Document
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
          >
            <Printer className="w-3.5 h-3.5" /> Print to PDF / A4
          </button>
        </div>
      </div>

      {/* A4 PRINT SHEET */}
      <div
        className="print-area bg-white mx-auto shadow-[0_12px_40px_rgba(0,0,0,0.06)] print:shadow-none border border-slate-100 print:border-none"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "15mm 15mm",
          boxSizing: "border-box",
          position: "relative",
          color: "#000",
          fontSize: "11px",
          fontFamily: "'Sarabun', 'Inter', sans-serif"
        }}
      >
        <style>{`
           @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Inter:wght@300;400;500;600;700;800&display=swap');
           
           @media print {
             @page { size: A4 portrait; margin: 0; }
             body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
             .print-area { border: none !important; box-shadow: none !important; padding: 12mm 12mm !important; }
           }
           
           .print-area table, .print-area td, .print-area th {
             font-family: 'Sarabun', 'Inter', sans-serif !important;
           }
         `}</style>

        {/* Company Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-[180px] shrink-0 pt-0.5">
              <img src="/mpower-logo.png" alt="M Power Logo" className="w-full h-auto object-contain" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).onerror=null; (e.target as HTMLImageElement).src='https://lh3.googleusercontent.com/d/1DWDy98ToKToCLyb-1rI6U7k_aoNayq1Q'; }} />
            </div>

            {/* Company Info */}
            <div className="text-[10px] text-black leading-tight pt-0.5">
              <div className="font-bold text-[12px] text-black">M Power Engineering Solutions Co., Ltd.</div>
              <div>53/72 Moo 8, Sattahip Subdistrict, Sattahip District, Chonburi 20180 , Thailand.</div>
              <div>Tel. 033-641789 / 063-9359565 Email: sales.mpower-engineering.com , info@mpower-engineering.com</div>
              <div>Tax ID Number. 0205569006956 (Head office)</div>
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center my-3">
          <h1 className="text-base font-bold tracking-widest text-black uppercase m-0">
            QUOTATION
          </h1>
        </div>

        {/* Metadata Double Box */}
        <div className="border border-black grid grid-cols-2 text-[10.5px] leading-snug mb-3">
          {/* Left Customer Cell */}
          <div className="p-2 border-r border-black space-y-0.5">
            <div className="font-bold text-[11px] text-black">
              {customer?.customer_name || quote.customer_name || "IKM Testing (Thailand) Co., Ltd"}
            </div>
            <div>
              {customer?.address || quote.customer_address || "155/167 Moo 5, Samnakthon Sub-District"}
            </div>
            <div>
              {customer?.city ? `${customer.city}, ${customer.province || ''}` : "Banchang District, Rayong, Thailand 21130"}
            </div>
            <div>
              Tel. {customer?.phone || quote.customer_phone || "038-601 996-8"}
            </div>
            <div>
              Tax ID: {customer?.tax_id || quote.tax_id || "0215552000909"} (Head Office)
            </div>
            
            <div className="pt-2 border-t border-black/20 mt-1 space-y-0.5">
              <div className="grid grid-cols-[42px_8px_1fr]">
                <span className="font-bold">Attn</span>
                <span>:</span>
                <span className="font-semibold">{quote.attention || quote.attn || customer?.contacts?.[0]?.name || "Sarote Tongra-ar"}</span>
              </div>
              <div className="grid grid-cols-[42px_8px_1fr]">
                <span className="font-bold">Tel</span>
                <span>:</span>
                <span>{quote.attention_phone || quote.customer_phone || customer?.contacts?.[0]?.phone || customer?.phone || "081-821-6634"}</span>
              </div>
              <div className="grid grid-cols-[42px_8px_1fr]">
                <span className="font-bold">Email</span>
                <span>:</span>
                <span>{quote.attention_email || quote.customer_email || customer?.contacts?.[0]?.email || customer?.email || "sarote.t@etenergymsiam.com"}</span>
              </div>
            </div>
          </div>

          {/* Right Quotation Details Cell */}
          <div className="p-2 space-y-1">
            <div className="grid grid-cols-[90px_1fr]">
              <span className="font-semibold">Quotation No. :</span>
              <span className="font-bold">{quote.quotation_no || "QT2607001"}</span>
            </div>
            <div className="grid grid-cols-[90px_1fr]">
              <span className="font-semibold">Date :</span>
              <span>{quote.quotation_date || quote.issue_date || "26-10-2025"}</span>
            </div>
            <div className="grid grid-cols-[90px_1fr]">
              <span className="font-semibold">Due Date :</span>
              <span>{quote.validity_days ? `${quote.validity_days} Days` : (quote.payment_term || "30 Days")}</span>
            </div>
            <div className="grid grid-cols-[90px_1fr]">
              <span className="font-semibold">Sales Name :</span>
              <span>{quote.sales_person || quote.sales_representative || "Pronpicha"}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-black mb-0">
          <table className="w-full border-collapse text-[10px] table-fixed">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[60%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-black font-bold text-[10.5px]">
                <th className="p-1.5 border-r border-black text-center">Quantity</th>
                <th className="p-1.5 border-r border-black text-center">Drescription</th>
                <th className="p-1.5 border-r border-black text-right">Unit Price</th>
                <th className="p-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {items.map((it: any, idx: number) => {
                const itemQty = it.qty || 1;
                const itemUnitPrice = Number(it.unit_rate || it.price || 0);
                const itemAmount = Number(it.total_price || (itemQty * itemUnitPrice)) || 0;
                
                return (
                  <tr key={idx} className="min-h-[100px]">
                    <td className="p-2 border-r border-black text-center font-mono">
                      {itemQty}
                    </td>
                    <td className="p-2 border-r border-black text-left leading-snug">
                      <div className="font-bold text-black text-[11px]">
                        {it.description || it.name || quote.title || "Sky Lotech High Lift"}
                      </div>
                      {it.brand && <div className="text-[10px] mt-0.5">Brand : {it.brand}</div>}
                      {it.model && <div className="text-[10px]">Model : {it.model}</div>}
                      {it.specs && Array.isArray(it.specs) && it.specs.map((sp: string, sIdx: number) => (
                        <div key={sIdx} className="pl-2 text-[10px]">- {sp}</div>
                      ))}
                    </td>
                    <td className="p-2 border-r border-black text-right font-mono">
                      {itemUnitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {itemAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}

              {/* Remarks / Notes Section inside table */}
              {(quote.remarks || quote.notes) && (
                <tr>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2.5 border-r border-black text-left">
                    <div className="font-bold text-black text-[10.5px] mb-0.5">Remarks / Notes</div>
                    <div className="text-[10px] text-black whitespace-pre-wrap leading-snug">
                      {quote.remarks || quote.notes}
                    </div>
                  </td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2"></td>
                </tr>
              )}

              {/* Mid Table Last Entry marker */}
              <tr>
                <td className="p-2 border-r border-black"></td>
                <td className="p-4 border-r border-black text-center font-bold text-black text-[10px] uppercase tracking-widest">
                  ** LAST ENTRY **
                </td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2"></td>
              </tr>

              {/* Padding height rows */}
              <tr className="h-24">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary Table Row (Baht text left, Totals right) */}
        <div className="border border-t-0 border-black grid grid-cols-[70%_30%] text-[10.5px]">
          {/* Left Spelled-out Baht box */}
          <div className="p-2 border-r border-black flex items-center justify-center font-bold text-center uppercase tracking-wide">
            {bahtTextWords}
          </div>

          {/* Right Totals Box */}
          <div className="divide-y divide-black text-right font-mono">
            <div className="p-1.5 flex justify-between">
              <span className="font-sans font-semibold">AMOUNT</span>
              <span>{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-1.5 flex justify-between">
              <span className="font-sans font-semibold">SALES VAT 7%</span>
              <span>{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-1.5 flex justify-between font-bold text-black bg-slate-50">
              <span className="font-sans">TOTAL AMOUNT</span>
              <span>{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions + Page info */}
        <div className="mt-4 flex justify-between items-start text-[10px] text-black">
          <div>
            <div className="font-bold text-[10.5px] mb-1">Terms & Condition;</div>
            <div className="space-y-0.5">
              {quote.terms_conditions ? (
                quote.terms_conditions.split('\n').map((tc: string, tIdx: number) => {
                  const trimmed = tc.trim();
                  if (!trimmed) return null;
                  const hasBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed);
                  return (
                    <div key={tIdx}>{hasBullet ? tc : `- ${tc}`}</div>
                  );
                })
              ) : (
                <>
                  <div>- 30 days validily from date of quotation.</div>
                  <div>- All prices above are quoted in THB.</div>
                </>
              )}
            </div>
          </div>
          <div className="text-right font-bold text-[10px]">
            Page 1/1
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 mt-12 text-[10.5px] font-bold text-black">
          {/* Left Signature */}
          <div className="flex flex-col items-center justify-end h-24">
            <div className="border-b border-black w-64 mb-1 h-10"></div>
            <div className="uppercase tracking-wider">PREPARE BY</div>
          </div>

          {/* Right Signature */}
          <div className="flex flex-col items-center justify-end h-24">
            <div className="border-b border-black w-64 mb-1"></div>
            <div className="uppercase tracking-wider">CUSTOMER APPRROVE BY</div>
          </div>
        </div>

      </div>
    </div>
  );
}
