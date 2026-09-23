import React, { useState, useMemo } from 'react';
import { 
  Supplier, 
  PurchaseRequest, 
  PurchaseOrder, 
  BillingNote, 
  UserRole 
} from '../types';
import { 
  Activity, 
  FileText, 
  ShoppingBag, 
  Receipt, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  ArrowRight, 
  RefreshCw, 
  DollarSign, 
  Sparkles, 
  Printer, 
  ShieldCheck, 
  Truck,
  TrendingUp,
  SlidersHorizontal,
  ExternalLink,
  Plus
} from 'lucide-react';
import { BillingNoteTemplate } from './templates/BillingNoteTemplate';
import { SupplierProfileTemplate } from './templates/SupplierProfileTemplate';
import { PurchaseDocumentTemplate } from './templates/PurchaseDocumentTemplate';

export type TrackedModuleType = 'all' | 'billing' | 'suppliers' | 'pr_po';
export type TrackedStatusCategory = 'all' | 'pending' | 'in_progress' | 'completed' | 'urgent_or_rejected';

interface UnifiedTrackedItem {
  id: string;
  module: 'billing' | 'supplier' | 'pr' | 'po';
  code: string;
  title: string;
  subtitle: string;
  date: string;
  amount: number;
  status: string;
  statusCategory: 'pending' | 'in_progress' | 'completed' | 'urgent_or_rejected';
  rawItem: BillingNote | Supplier | PurchaseRequest | PurchaseOrder;
}

interface StatusTrackerHubProps {
  billingNotes: BillingNote[];
  suppliers: Supplier[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  onUpdateBilling?: (id: string, updates: Partial<BillingNote>) => Promise<any>;
  onUpdateSupplier?: (id: string, updates: Partial<Supplier>) => Promise<any>;
  onUpdatePR?: (id: string, updates: Partial<PurchaseRequest>) => Promise<any>;
  onUpdatePO?: (id: string, updates: Partial<PurchaseOrder>) => Promise<any>;
  onApprovePRtoPO?: (prId: string) => Promise<any>;
  onNavigateToTab?: (tab: string) => void;
  onToast?: (msg: string, type: 'success' | 'err') => void;
  currentRole?: UserRole;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const StatusTrackerHub: React.FC<StatusTrackerHubProps> = ({
  billingNotes = [],
  suppliers = [],
  purchaseRequests = [],
  purchaseOrders = [],
  onUpdateBilling,
  onUpdateSupplier,
  onUpdatePR,
  onUpdatePO,
  onApprovePRtoPO,
  onNavigateToTab,
  onToast,
  currentRole = 'Admin',
  onRefresh,
  isLoading = false,
}) => {
  // State
  const [activeModuleTab, setActiveModuleTab] = useState<TrackedModuleType>('all');
  const [statusCategoryFilter, setStatusCategoryFilter] = useState<TrackedStatusCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // Template preview modal states
  const [previewBilling, setPreviewBilling] = useState<BillingNote | null>(null);
  const [previewSupplier, setPreviewSupplier] = useState<Supplier | null>(null);
  const [previewPR, setPreviewPR] = useState<PurchaseRequest | null>(null);
  const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null);

  // Map each raw record to a UnifiedTrackedItem
  const unifiedItems: UnifiedTrackedItem[] = useMemo(() => {
    const list: UnifiedTrackedItem[] = [];

    // 1. Billing Notes
    billingNotes.forEach((b) => {
      let statusCat: 'pending' | 'in_progress' | 'completed' | 'urgent_or_rejected' = 'in_progress';
      const s = (b.status || 'Draft').toLowerCase();

      if (s.includes('paid') && !s.includes('partially')) {
        statusCat = 'completed';
      } else if (s.includes('overdue') || s.includes('cancel')) {
        statusCat = 'urgent_or_rejected';
      } else if (s.includes('pending') || s.includes('draft')) {
        statusCat = 'pending';
      } else {
        // Delivered, Issued, Partially Paid
        statusCat = 'in_progress';
      }

      list.push({
        id: `billing-${b.id}`,
        module: 'billing',
        code: b.billing_no || 'BN-UNKNOWN',
        title: b.customer_name || 'ลูกค้าทั่วไป',
        subtitle: `กำหนดชำระ: ${b.due_of_payment || b.due_date || '-'} • ออกโดย: ${b.delivered_by || '-'}`,
        date: b.date || b.billing_date || b.created_at?.split('T')[0] || '-',
        amount: Number(b.total_amount) || 0,
        status: b.status || 'Draft',
        statusCategory: statusCat,
        rawItem: b,
      });
    });

    // 2. Supplier Accounts
    suppliers.forEach((sup) => {
      let statusCat: 'pending' | 'in_progress' | 'completed' | 'urgent_or_rejected' = 'completed';
      const s = (sup.status || 'Active').toLowerCase();

      if (s.includes('pending')) {
        statusCat = 'pending';
      } else if (s.includes('inactive')) {
        statusCat = 'urgent_or_rejected';
      } else {
        statusCat = 'completed';
      }

      list.push({
        id: `supplier-${sup.id}`,
        module: 'supplier',
        code: sup.supplier_code || 'SUP-CODE',
        title: sup.supplier_name || 'ซัพพลายเออร์',
        subtitle: `ผู้ติดต่อ: ${sup.contact_person || '-'} • โทร: ${sup.phone || '-'} • เครดิตเทอม: ${sup.payment_term || '-'}`,
        date: sup.last_purchase_date || sup.created_at?.split('T')[0] || '-',
        amount: Number(sup.outstanding_balance) || 0,
        status: sup.status || 'Active',
        statusCategory: statusCat,
        rawItem: sup,
      });
    });

    // 3. Purchase Requests (PR)
    purchaseRequests.forEach((pr) => {
      let statusCat: 'pending' | 'in_progress' | 'completed' | 'urgent_or_rejected' = 'pending';
      const s = (pr.status || 'Pending').toLowerCase();

      if (s.includes('approved') || s.includes('converted')) {
        statusCat = 'completed';
      } else if (s.includes('rejected') || s.includes('cancel')) {
        statusCat = 'urgent_or_rejected';
      } else if (s.includes('draft')) {
        statusCat = 'in_progress';
      } else {
        statusCat = 'pending'; // Pending Approval
      }

      list.push({
        id: `pr-${pr.id}`,
        module: 'pr',
        code: pr.pr_no || 'PR-UNKNOWN',
        title: pr.supplier_name || 'ไม่ระบุซัพพลายเออร์',
        subtitle: `ผู้ขอซื้อ: ${pr.requested_by || pr.requestor || '-'} • โครงการ: ${pr.project || pr.ref_customer || '-'}`,
        date: pr.required_date || pr.date || pr.pr_date || pr.created_at?.split('T')[0] || '-',
        amount: Number(pr.total_amount || pr.amount) || 0,
        status: pr.status || 'Pending',
        statusCategory: statusCat,
        rawItem: pr,
      });
    });

    // 4. Purchase Orders (PO)
    purchaseOrders.forEach((po) => {
      let statusCat: 'pending' | 'in_progress' | 'completed' | 'urgent_or_rejected' = 'in_progress';
      const s = (po.status || 'Pending').toLowerCase();

      if (s.includes('completed') || s.includes('received') && !s.includes('partially')) {
        statusCat = 'completed';
      } else if (s.includes('cancel')) {
        statusCat = 'urgent_or_rejected';
      } else if (s.includes('pending')) {
        statusCat = 'pending';
      } else {
        statusCat = 'in_progress'; // PO Issued, Partially Received, Approved
      }

      list.push({
        id: `po-${po.id}`,
        module: 'po',
        code: po.po_no || 'PO-UNKNOWN',
        title: po.supplier_name || 'ไม่ระบุซัพพลายเออร์',
        subtitle: `ผู้จัดทำ: ${po.prepared_by || '-'} • โครงการ: ${po.project || po.ref_customer || '-'}`,
        date: po.date || po.po_date || po.order_date || po.created_at?.split('T')[0] || '-',
        amount: Number(po.total_amount || po.amount) || 0,
        status: po.status || 'Pending',
        statusCategory: statusCat,
        rawItem: po,
      });
    });

    return list;
  }, [billingNotes, suppliers, purchaseRequests, purchaseOrders]);

  // Filtering
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      // Module Tab filter
      if (activeModuleTab === 'billing' && item.module !== 'billing') return false;
      if (activeModuleTab === 'suppliers' && item.module !== 'supplier') return false;
      if (activeModuleTab === 'pr_po' && item.module !== 'pr' && item.module !== 'po') return false;

      // Status Category filter
      if (statusCategoryFilter !== 'all' && item.statusCategory !== statusCategoryFilter) return false;

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchStatus = item.status.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchSubtitle && !matchStatus) return false;
      }

      return true;
    });
  }, [unifiedItems, activeModuleTab, statusCategoryFilter, searchQuery]);

  // Metric counts
  const metrics = useMemo(() => {
    const total = unifiedItems.length;
    const pendingCount = unifiedItems.filter((i) => i.statusCategory === 'pending').length;
    const inProgressCount = unifiedItems.filter((i) => i.statusCategory === 'in_progress').length;
    const completedCount = unifiedItems.filter((i) => i.statusCategory === 'completed').length;
    const urgentCount = unifiedItems.filter((i) => i.statusCategory === 'urgent_or_rejected').length;

    const billingTotal = billingNotes.reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0);
    const prpoTotal = purchaseOrders.reduce((acc, po) => acc + (Number(po.total_amount) || 0), 0);

    return {
      total,
      pendingCount,
      inProgressCount,
      completedCount,
      urgentCount,
      billingTotal,
      prpoTotal,
      billingCount: billingNotes.length,
      supplierCount: suppliers.length,
      prpoCount: purchaseRequests.length + purchaseOrders.length,
    };
  }, [unifiedItems, billingNotes, suppliers, purchaseRequests, purchaseOrders]);

  // Status Change Handlers
  const handleQuickStatusChange = async (item: UnifiedTrackedItem, newStatus: string) => {
    setIsUpdatingId(item.id);
    try {
      if (item.module === 'billing' && onUpdateBilling) {
        const raw = item.rawItem as BillingNote;
        await onUpdateBilling(raw.id, { status: newStatus as any });
        onToast?.(`อัปเดตสถานะใบวางบิล ${item.code} เป็น "${newStatus}" สำเร็จ`, 'success');
      } else if (item.module === 'supplier' && onUpdateSupplier) {
        const raw = item.rawItem as Supplier;
        await onUpdateSupplier(raw.id, { status: newStatus as any });
        onToast?.(`อัปเดตสถานะคู่ค้า ${item.code} เป็น "${newStatus}" สำเร็จ`, 'success');
      } else if (item.module === 'pr' && onUpdatePR) {
        const raw = item.rawItem as PurchaseRequest;
        await onUpdatePR(raw.id, { status: newStatus as any });
        onToast?.(`อัปเดตสถานะใบขอซื้อ ${item.code} เป็น "${newStatus}" สำเร็จ`, 'success');
      } else if (item.module === 'po' && onUpdatePO) {
        const raw = item.rawItem as PurchaseOrder;
        await onUpdatePO(raw.id, { status: newStatus as any });
        onToast?.(`อัปเดตสถานะใบสั่งซื้อ ${item.code} เป็น "${newStatus}" สำเร็จ`, 'success');
      }
    } catch (err: any) {
      onToast?.(err?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', 'err');
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleApprovePR = async (prId: string, prNo: string) => {
    if (!onApprovePRtoPO) return;
    setIsUpdatingId(`pr-${prId}`);
    try {
      await onApprovePRtoPO(prId);
      onToast?.(`อนุมัติใบขอซื้อ ${prNo} และแปลงเป็น PO สำเร็จ`, 'success');
    } catch (err: any) {
      onToast?.(err?.message || 'อนุมัติ PR ล้มเหลว', 'err');
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Helper for rendering status badges
  const renderStatusBadge = (module: string, status: string) => {
    const s = status.toLowerCase();

    if (s.includes('paid') && !s.includes('partially') || s.includes('approved') || s.includes('active') || s.includes('completed') || s.includes('received') && !s.includes('partially')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          {status}
        </span>
      );
    }

    if (s.includes('pending') || s.includes('draft') || s.includes('wait')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-950/80 text-amber-300 border border-amber-800">
          <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
          {status === 'Pending Approval' ? 'รออนุมัติ' : status}
        </span>
      );
    }

    if (s.includes('delivered') || s.includes('issued') || s.includes('partially') || s.includes('converted')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-indigo-950/80 text-indigo-300 border border-indigo-800">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          {status}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-rose-950/80 text-rose-300 border border-rose-800">
        <AlertCircle className="w-3 h-3 text-rose-400" />
        {status}
      </span>
    );
  };

  const getModuleBadge = (module: string) => {
    switch (module) {
      case 'billing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
            <Receipt className="w-3 h-3 text-cyan-400" />
            ใบวางบิล (Billing)
          </span>
        );
      case 'supplier':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-800">
            <Building2 className="w-3 h-3 text-amber-400" />
            คู่ค้า (Supplier)
          </span>
        );
      case 'pr':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-950 text-indigo-300 border border-indigo-800">
            <FileText className="w-3 h-3 text-indigo-400" />
            ใบขอซื้อ (PR)
          </span>
        );
      case 'po':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
            <ShoppingBag className="w-3 h-3 text-emerald-400" />
            ใบสั่งซื้อ (PO)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div 
        className="p-6 rounded-3xl shadow-xl relative overflow-hidden text-white border border-indigo-500/30"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)' }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                CENTRALIZED WORKFLOW & STATUS QUEUE
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Live Auto-Sync
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              ศูนย์ติดตามสถานะและการอัปเดตรายการ (Status & Action Center)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              ศูนย์รวมรายการทั้งหมดจาก <b className="text-cyan-300">ใบวางบิล (Billing Notes)</b>, <b className="text-amber-300">บัญชีคู่ค้า (Supplier Accounts)</b>, และ <b className="text-emerald-300">PR / PO</b> ที่มีการอัปเดตสถานะ ให้คุณติดตาม จัดการ และเปลี่ยนสถานะได้ในที่เดียว
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>รีเฟรชข้อมูล</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงานสรุป</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Icon */}
        <Activity className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 pointer-events-none" />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monitored */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>รายการติดตามรวม (Total)</span>
            <span className="text-indigo-400 bg-indigo-950 border border-indigo-900 text-[9px] px-2 py-0.5 rounded">All Modules</span>
          </div>
          <div className="font-mono text-2xl font-black text-white mt-2">
            {metrics.total} <span className="text-xs text-slate-400 font-sans font-normal">รายการ</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2">
            <span>BL: {metrics.billingCount}</span>
            <span>•</span>
            <span>Sup: {metrics.supplierCount}</span>
            <span>•</span>
            <span>PR/PO: {metrics.prpoCount}</span>
          </div>
        </div>

        {/* Pending Action Needed */}
        <div 
          onClick={() => setStatusCategoryFilter('pending')}
          className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition ${
            statusCategoryFilter === 'pending' ? 'border-amber-500 bg-amber-950/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>รอการอนุมัติ / รอตรวจสอบ</span>
            <span className="text-amber-400 bg-amber-950 border border-amber-900 text-[9px] px-2 py-0.5 rounded">Pending Action</span>
          </div>
          <div className="font-mono text-2xl font-black text-amber-400 mt-2">
            {metrics.pendingCount} <span className="text-xs text-slate-400 font-sans font-normal">รายการ</span>
          </div>
          <div className="text-[10px] text-amber-300/80 mt-2">
            ต้องรีบอนุมัติหรือตรวจรับเอกสาร
          </div>
        </div>

        {/* In Progress / Active Workflow */}
        <div 
          onClick={() => setStatusCategoryFilter('in_progress')}
          className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition ${
            statusCategoryFilter === 'in_progress' ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>กำลังดำเนินการ / ส่งมอบแล้ว</span>
            <span className="text-indigo-400 bg-indigo-950 border border-indigo-900 text-[9px] px-2 py-0.5 rounded">In Progress</span>
          </div>
          <div className="font-mono text-2xl font-black text-indigo-300 mt-2">
            {metrics.inProgressCount} <span className="text-xs text-slate-400 font-sans font-normal">รายการ</span>
          </div>
          <div className="text-[10px] text-indigo-300/80 mt-2">
            วางบิลแล้ว / ออก PO แล้ว / รับของบางส่วน
          </div>
        </div>

        {/* Completed / Paid */}
        <div 
          onClick={() => setStatusCategoryFilter('completed')}
          className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition ${
            statusCategoryFilter === 'completed' ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>เสร็จสิ้น / ชำระแล้ว / ใช้งาน</span>
            <span className="text-emerald-400 bg-emerald-950 border border-emerald-800 text-[9px] px-2 py-0.5 rounded">Completed</span>
          </div>
          <div className="font-mono text-2xl font-black text-emerald-400 mt-2">
            {metrics.completedCount} <span className="text-xs text-slate-400 font-sans font-normal">รายการ</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-2">
            ได้รับชำระเงิน / รับของครบ / อนุมัติสำเร็จ
          </div>
        </div>
      </div>

      {/* Main Filter & Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        {/* Module Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveModuleTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeModuleTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>ทุกโมดูล (All: {metrics.total})</span>
            </button>
            <button
              onClick={() => setActiveModuleTab('billing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeModuleTab === 'billing'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-cyan-300" />
              <span>ใบวางบิล ({metrics.billingCount})</span>
            </button>
            <button
              onClick={() => setActiveModuleTab('suppliers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeModuleTab === 'suppliers'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-300" />
              <span>บัญชีคู่ค้า ({metrics.supplierCount})</span>
            </button>
            <button
              onClick={() => setActiveModuleTab('pr_po')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeModuleTab === 'pr_po'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />
              <span>PR / PO ({metrics.prpoCount})</span>
            </button>
          </div>

          {/* Quick jump to full module buttons */}
          {onNavigateToTab && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">ไปยังหน้าหลัก:</span>
              <button
                onClick={() => onNavigateToTab('billing')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <span>ใบวางบิล</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => onNavigateToTab('suppliers')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <span>คู่ค้า</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => onNavigateToTab('pr_po')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <span>PR/PO</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Search & Status Category Filter Chips */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขที่เอกสาร, ชื่อคู่ค้า/ลูกค้า, โครงการ, สถานะ..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              กลุ่มสถานะ:
            </span>
            <button
              onClick={() => setStatusCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusCategoryFilter === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setStatusCategoryFilter('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusCategoryFilter === 'pending'
                  ? 'bg-amber-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-amber-400 hover:bg-amber-950/40 border border-amber-900/60'
              }`}
            >
              รออนุมัติ / รอตรวจสอบ ({metrics.pendingCount})
            </button>
            <button
              onClick={() => setStatusCategoryFilter('in_progress')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusCategoryFilter === 'in_progress'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-indigo-300 hover:bg-indigo-950/40 border border-indigo-900/60'
              }`}
            >
              กำลังดำเนินการ ({metrics.inProgressCount})
            </button>
            <button
              onClick={() => setStatusCategoryFilter('completed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusCategoryFilter === 'completed'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/60'
              }`}
            >
              เสร็จสิ้น / ชำระแล้ว ({metrics.completedCount})
            </button>
            <button
              onClick={() => setStatusCategoryFilter('urgent_or_rejected')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusCategoryFilter === 'urgent_or_rejected'
                  ? 'bg-rose-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-rose-400 hover:bg-rose-950/40 border border-rose-900/60'
              }`}
            >
              มีปัญหา / ยกเลิก ({metrics.urgentCount})
            </button>
          </div>
        </div>
      </div>

      {/* Unified Table of Tracked Items */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              รายการที่ตรงตามเงื่อนไขสถานะ ({filteredItems.length} รายการ)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            คลิกที่ปุ่มสถานะเพื่อเปลี่ยนสถานะได้ทันที (Auto Update)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-4">โมดูล</th>
                <th className="py-3 px-4">รหัส / เลขที่เอกสาร</th>
                <th className="py-3 px-4">ชื่อคู่ค้า / ลูกค้า / รายละเอียด</th>
                <th className="py-3 px-4 text-center">วันที่</th>
                <th className="py-3 px-4 text-right">ยอดเงิน / มูลค่า</th>
                <th className="py-3 px-4 text-center">สถานะปัจจุบัน</th>
                <th className="py-3 px-4 text-center">เปลี่ยนสถานะด่วน (Quick Action)</th>
                <th className="py-3 px-4 text-right">เปิดดูเทมเพลต</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <div>ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหาหรือสถานะที่เลือก</div>
                    <button
                      onClick={() => {
                        setActiveModuleTab('all');
                        setStatusCategoryFilter('all');
                        setSearchQuery('');
                      }}
                      className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isBusy = isUpdatingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      
                      {/* Module Badge */}
                      <td className="py-3 px-4">
                        {getModuleBadge(item.module)}
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white text-xs">{item.code}</div>
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-200 truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {item.date}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {item.amount > 0 ? (
                          <span>฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Current Status */}
                      <td className="py-3 px-4 text-center">
                        {renderStatusBadge(item.module, item.status)}
                      </td>

                      {/* Quick Status Action Controls */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Module Specific Actions */}

                          {/* 1. Billing Note quick actions */}
                          {item.module === 'billing' && (
                            <select
                              value={item.status}
                              disabled={isBusy}
                              onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                              className="bg-slate-950 border border-slate-700 text-cyan-300 text-[11px] rounded-lg px-2 py-1 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Issued">Issued</option>
                              <option value="Pending">Pending</option>
                              <option value="Delivered">Delivered (ส่งมอบ)</option>
                              <option value="Partially Paid">Partially Paid</option>
                              <option value="Paid">Paid (ชำระแล้ว)</option>
                              <option value="Overdue">Overdue (เกินกำหนด)</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          )}

                          {/* 2. Supplier quick actions */}
                          {item.module === 'supplier' && (
                            <select
                              value={item.status}
                              disabled={isBusy}
                              onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                              className="bg-slate-950 border border-slate-700 text-amber-300 text-[11px] rounded-lg px-2 py-1 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer disabled:opacity-50"
                            >
                              <option value="Active">Active (พร้อมใช้งาน)</option>
                              <option value="Pending">Pending (รอตรวจสอบ)</option>
                              <option value="Inactive">Inactive (ระงับ)</option>
                            </select>
                          )}

                          {/* 3. PR quick actions */}
                          {item.module === 'pr' && (
                            <div className="flex items-center gap-1">
                              {item.status === 'Pending' || item.status === 'Pending Approval' ? (
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleApprovePR((item.rawItem as PurchaseRequest).id, item.code)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="อนุมัติ PR และแปลงเป็น PO ทันที"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>อนุมัติ PR</span>
                                </button>
                              ) : null}

                              <select
                                value={item.status}
                                disabled={isBusy}
                                onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                                className="bg-slate-950 border border-slate-700 text-indigo-300 text-[11px] rounded-lg px-2 py-1 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                              >
                                <option value="Draft">Draft</option>
                                <option value="Pending Approval">Pending Approval</option>
                                <option value="Approved">Approved</option>
                                <option value="Converted to PO">Converted to PO</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </div>
                          )}

                          {/* 4. PO quick actions */}
                          {item.module === 'po' && (
                            <select
                              value={item.status}
                              disabled={isBusy}
                              onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                              className="bg-slate-950 border border-slate-700 text-emerald-300 text-[11px] rounded-lg px-2 py-1 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="PO Issued">PO Issued (ออก PO)</option>
                              <option value="Partially Received">Partially Received (รับบางส่วน)</option>
                              <option value="Received">Received (รับครบ)</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Template Preview Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (item.module === 'billing') setPreviewBilling(item.rawItem as BillingNote);
                              if (item.module === 'supplier') setPreviewSupplier(item.rawItem as Supplier);
                              if (item.module === 'pr') setPreviewPR(item.rawItem as PurchaseRequest);
                              if (item.module === 'po') setPreviewPO(item.rawItem as PurchaseOrder);
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer border border-slate-700"
                            title="เปิดดูเอกสารเทมเพลตมาตรฐาน A4"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span>เทมเพลต A4</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL PREVIEWS FOR THE THREE MODULES                         */}
      {/* ============================================================ */}

      {/* 1. Billing Note Template Modal */}
      {previewBilling && (
        <BillingNoteTemplate
          billingNote={previewBilling}
          onClose={() => setPreviewBilling(null)}
          isModal={true}
        />
      )}

      {/* 2. Supplier Profile Template Modal */}
      {previewSupplier && (
        <SupplierProfileTemplate
          supplier={previewSupplier}
          purchaseOrders={purchaseOrders}
          purchaseRequests={purchaseRequests}
          onClose={() => setPreviewSupplier(null)}
          isModal={true}
        />
      )}

      {/* 3. PR / PO Purchase Document Template Modal */}
      {(previewPR || previewPO) && (
        <PurchaseDocumentTemplate
          documentType={previewPR ? 'PR' : 'PO'}
          data={previewPR || previewPO!}
          onClose={() => {
            setPreviewPR(null);
            setPreviewPO(null);
          }}
          isModal={true}
        />
      )}
    </div>
  );
};

export default StatusTrackerHub;
