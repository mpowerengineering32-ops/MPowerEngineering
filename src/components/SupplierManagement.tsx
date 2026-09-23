import React, { useState, useMemo } from 'react';
import { Supplier, PurchaseRequest, PurchaseOrder, UserRole, SupplierContact, SupplierAddress } from '../types';
import { MetricCard } from './common/MetricCard';
import { SupplierProfileTemplate } from './templates/SupplierProfileTemplate';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  Printer,
  Check,
  X,
  Download,
  Calendar,
  Building,
  UserCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CreditCard,
  FileSpreadsheet,
  Copy,
  ShoppingCart,
  Receipt,
  FileText,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Users,
  UserPlus,
  User,
  Edit,
  FolderOpen,
  History,
  TrendingUp,
  Tag,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface SupplierManagementProps {
  suppliers?: Supplier[];
  purchaseRequests?: PurchaseRequest[];
  purchaseOrders?: PurchaseOrder[];
  onAdd: (payload: Omit<Supplier, 'id' | 'created_at'>) => Promise<any>;
  onUpdate: (id: string, updates: Partial<Supplier>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onToast: (msg: string, type: 'success' | 'err') => void;
  currentRole: UserRole;
  currentUserId?: string;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  onNavigateToPR?: (supplierId: string) => void;
}

export default function SupplierManagement({
  suppliers = [],
  purchaseRequests = [],
  purchaseOrders = [],
  onAdd,
  onUpdate,
  onDelete,
  onToast,
  currentRole,
  onRefresh,
  isLoading,
  onNavigateToPR
}: SupplierManagementProps) {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplierType, setFilterSupplierType] = useState('All');
  const [filterPaymentTerm, setFilterPaymentTerm] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Selected Checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Active Views
  const [viewMode, setViewMode] = useState<'table' | 'template'>('table');
  const [selectedTemplateSupplier, setSelectedTemplateSupplier] = useState<Supplier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [detailTab, setDetailTab] = useState<
    'overview' | 'template' | 'contact' | 'address' | 'financial' | 'pr' | 'po' | 'purchase_history' | 'documents' | 'activity'
  >('overview');

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [formSupplierType, setFormSupplierType] = useState<Supplier['supplier_type']>('Distributor');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPaymentTerm, setFormPaymentTerm] = useState('Credit 30');
  const [formCreditLimit, setFormCreditLimit] = useState(500000);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive' | 'Pending'>('Active');
  const [formNotes, setFormNotes] = useState('');
  const [formBankName, setFormBankName] = useState('ธนาคารกสิกรไทย (KBANK)');
  const [formBankAccNo, setFormBankAccNo] = useState('');
  const [formBankAccName, setFormBankAccName] = useState('');

  // Contact person sub-state for Supplier Drawer (mirroring CustomerView)
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPosition, setContactPosition] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const handleOpenContactForm = (idx: number | null = null) => {
    if (idx !== null && viewingSupplier) {
      const contact = (viewingSupplier.contacts || [])[idx];
      if (contact) {
        setEditingContactIndex(idx);
        setContactName(contact.name);
        setContactPosition(contact.role || '');
        setContactPhone(contact.phone || '');
        setContactEmail(contact.email || '');
      }
    } else {
      setEditingContactIndex(null);
      setContactName('');
      setContactPosition('Sales / Procurement Contact');
      setContactPhone('');
      setContactEmail('');
    }
    setIsContactFormOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingSupplier) return;
    if (!contactName.trim() || !contactPhone.trim()) {
      onToast('กรุณากรอกชื่อผู้ติดต่อและเบอร์โทรศัพท์', 'err');
      return;
    }

    const newContact: SupplierContact = {
      id: editingContactIndex !== null && viewingSupplier.contacts?.[editingContactIndex]
        ? viewingSupplier.contacts[editingContactIndex].id
        : `cnt-${Date.now()}`,
      name: contactName,
      role: contactPosition,
      phone: contactPhone,
      email: contactEmail,
      is_primary: editingContactIndex === 0 || !(viewingSupplier.contacts && viewingSupplier.contacts.length > 0)
    };

    let updatedContacts = [...(viewingSupplier.contacts || [])];
    if (editingContactIndex !== null) {
      updatedContacts[editingContactIndex] = newContact;
    } else {
      updatedContacts.push(newContact);
    }

    try {
      await onUpdate(viewingSupplier.id, { contacts: updatedContacts });
      setViewingSupplier({ ...viewingSupplier, contacts: updatedContacts });
      setIsContactFormOpen(false);
      onToast('บันทึกข้อมูลผู้ติดต่อคู่ค้าสำเร็จ', 'success');
    } catch {
      onToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ติดต่อ', 'err');
    }
  };

  const handleDeleteContact = async (idx: number) => {
    if (!viewingSupplier) return;
    if (confirm('ยืนยันการลบผู้ติดต่อนี้?')) {
      const updatedContacts = (viewingSupplier.contacts || []).filter((_, i) => i !== idx);
      try {
        await onUpdate(viewingSupplier.id, { contacts: updatedContacts });
        setViewingSupplier({ ...viewingSupplier, contacts: updatedContacts });
        onToast('ลบผู้ติดต่อสำเร็จ', 'success');
      } catch {
        onToast('ไม่สามารถลบข้อมูลผู้ติดต่อได้', 'err');
      }
    }
  };

  const canModify = currentRole !== 'Management';
  const canDelete = currentRole === 'Admin' || currentRole === 'System Administrator' || (currentRole as string) === 'Administrator';

  // Compute spend and stats per supplier
  const enrichedSuppliers = useMemo(() => {
    return (suppliers || []).map(sup => {
      const linkedOrders = (purchaseOrders || []).filter(
        po => po.supplier_id === sup.id || po.supplier_name?.toLowerCase() === sup.supplier_name?.toLowerCase()
      );
      const totalPurchases = linkedOrders.reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0);
      const linkedPRs = (purchaseRequests || []).filter(
        pr => pr.supplier_id === sup.id || pr.supplier_name?.toLowerCase() === sup.supplier_name?.toLowerCase()
      );

      // Estimated outstanding payables
      const outstanding = sup.outstanding_balance !== undefined
        ? sup.outstanding_balance
        : linkedOrders
            .filter(po => po.status !== 'Completed' && po.status !== 'Cancelled')
            .reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0);

      const lastPurchase = linkedOrders.length > 0
        ? linkedOrders.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0].date
        : (sup.last_purchase_date || '-');

      return {
        ...sup,
        supplier_type: sup.supplier_type || 'Distributor',
        credit_limit: sup.credit_limit || 500000,
        totalPurchases,
        outstanding,
        lastPurchase,
        linkedOrders,
        linkedPRs
      };
    });
  }, [suppliers, purchaseOrders, purchaseRequests]);

  // KPIs
  const totalSuppliersCount = enrichedSuppliers.length;
  const activeCount = enrichedSuppliers.filter(s => s.status === 'Active').length;
  const inactiveCount = enrichedSuppliers.filter(s => s.status === 'Inactive').length;
  const pendingCount = enrichedSuppliers.filter(s => s.status === 'Pending').length;
  const totalSpendAll = enrichedSuppliers.reduce((sum, s) => sum + s.totalPurchases, 0);
  const totalOutstandingPayables = enrichedSuppliers.reduce((sum, s) => sum + s.outstanding, 0);

  // Top 10 Suppliers by Total Spend
  const topSuppliersBySpend = useMemo(() => {
    return [...enrichedSuppliers]
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, 10);
  }, [enrichedSuppliers]);

  // Top Outstanding Payables
  const topOutstandingSuppliers = useMemo(() => {
    return [...enrichedSuppliers]
      .filter(s => s.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 5);
  }, [enrichedSuppliers]);

  // Supplier Type Chart Data
  const typeChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    enrichedSuppliers.forEach(s => {
      const t = s.supplier_type || 'Distributor';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], idx) => {
      const colors = ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];
      return { name, value, color: colors[idx % colors.length] };
    });
  }, [enrichedSuppliers]);

  // Spend by Supplier Chart (Top 5)
  const spendChartData = useMemo(() => {
    return topSuppliersBySpend.slice(0, 5).map(s => ({
      name: s.supplier_name.length > 15 ? s.supplier_name.substring(0, 13) + '...' : s.supplier_name,
      amount: s.totalPurchases
    }));
  }, [topSuppliersBySpend]);

  // Filtered Suppliers List
  const filteredList = useMemo(() => {
    return enrichedSuppliers.filter(s => {
      const matchSearch =
        (s.supplier_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.tax_id && s.tax_id.includes(searchTerm)) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = filterSupplierType === 'All' || s.supplier_type === filterSupplierType;
      
      const matchTerm = filterPaymentTerm === 'All' ||
        (filterPaymentTerm === 'Cash' && (!s.payment_term || s.payment_term.toLowerCase().includes('cash'))) ||
        (filterPaymentTerm === 'Credit 15' && s.payment_term?.includes('15')) ||
        (filterPaymentTerm === 'Credit 30' && s.payment_term?.includes('30')) ||
        (filterPaymentTerm === 'Credit 60' && s.payment_term?.includes('60')) ||
        (filterPaymentTerm === 'Credit 90' && s.payment_term?.includes('90'));

      const matchStatus = filterStatus === 'All' || s.status === filterStatus;

      const cDate = s.created_at || '';
      const matchDateFrom = !filterDateFrom || (cDate >= filterDateFrom);
      const matchDateTo = !filterDateTo || (cDate <= filterDateTo);

      return matchSearch && matchType && matchTerm && matchStatus && matchDateFrom && matchDateTo;
    });
  }, [enrichedSuppliers, searchTerm, filterSupplierType, filterPaymentTerm, filterStatus, filterDateFrom, filterDateTo]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterSupplierType('All');
    setFilterPaymentTerm('All');
    setFilterStatus('All');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // Open Create Supplier Modal
  const handleOpenAdd = () => {
    setEditingSupplier(null);
    const nextSeq = suppliers.length + 1;
    setFormCode(`SUP-26${String(nextSeq).padStart(4, '0')}`);
    setFormName('');
    setFormTaxId('');
    setFormSupplierType('Distributor');
    setFormContactPerson('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormPaymentTerm('Credit 30');
    setFormCreditLimit(500000);
    setFormStatus('Active');
    setFormNotes('');
    setFormBankName('ธนาคารกสิกรไทย (KBANK)');
    setFormBankAccNo('');
    setFormBankAccName('');
    setIsModalOpen(true);
  };

  // Open Edit Supplier Modal
  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormCode(sup.supplier_code);
    setFormName(sup.supplier_name);
    setFormTaxId(sup.tax_id || '');
    setFormSupplierType(sup.supplier_type || 'Distributor');
    setFormContactPerson(sup.contact_person || '');
    setFormPhone(sup.phone || '');
    setFormEmail(sup.email || '');
    setFormAddress(sup.address || '');
    setFormPaymentTerm(sup.payment_term || 'Credit 30');
    setFormCreditLimit(sup.credit_limit || 500000);
    setFormStatus(sup.status || 'Active');
    setFormNotes(sup.notes || '');
    setFormBankName(sup.bank_account?.bank_name || 'ธนาคารกสิกรไทย (KBANK)');
    setFormBankAccNo(sup.bank_account?.account_number || '');
    setFormBankAccName(sup.bank_account?.account_name || sup.supplier_name);
    setIsModalOpen(true);
  };

  // Duplicate Supplier
  const handleDuplicate = (sup: Supplier) => {
    const nextSeq = suppliers.length + 1;
    setEditingSupplier(null);
    setFormCode(`SUP-26${String(nextSeq).padStart(4, '0')}`);
    setFormName(`${sup.supplier_name} (สำเนา)`);
    setFormTaxId(sup.tax_id || '');
    setFormSupplierType(sup.supplier_type || 'Distributor');
    setFormContactPerson(sup.contact_person || '');
    setFormPhone(sup.phone || '');
    setFormEmail(sup.email || '');
    setFormAddress(sup.address || '');
    setFormPaymentTerm(sup.payment_term || 'Credit 30');
    setFormCreditLimit(sup.credit_limit || 500000);
    setFormStatus('Pending');
    setFormNotes(sup.notes || '');
    setFormBankName(sup.bank_account?.bank_name || 'ธนาคารกสิกรไทย (KBANK)');
    setFormBankAccNo(sup.bank_account?.account_number || '');
    setFormBankAccName(sup.bank_account?.account_name || '');
    setIsModalOpen(true);
    onToast(`คัดลอกข้อมูลจาก ${sup.supplier_code} แล้ว กรุณาตรวจสอบและกดบันทึก`, 'success');
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onToast('กรุณากรอกชื่อ Supplier / บริษัทคู่ค้า', 'err');
      return;
    }

    const cleanTax = formTaxId.trim().replace(/-/g, '');
    if (cleanTax && cleanTax.length !== 13) {
      onToast('⚠️ เลขประจำตัวผู้เสียภาษี (Tax ID) ต้องมี 13 หลัก', 'err');
      return;
    }

    try {
      const bank_account = {
        bank_name: formBankName,
        account_number: formBankAccNo,
        account_name: formBankAccName || formName
      };

      const defaultContacts: SupplierContact[] = [
        {
          id: 'c1',
          name: formContactPerson || 'ฝ่ายขายและการตลาด',
          role: 'Primary Contact / Sales',
          phone: formPhone || '-',
          email: formEmail || '-',
          is_primary: true
        }
      ];

      const defaultAddresses: SupplierAddress[] = [
        {
          type: 'Headquarters',
          address: formAddress || 'ประเทศไทย'
        },
        {
          type: 'Tax Invoice',
          address: formAddress || 'สำนักงานใหญ่'
        }
      ];

      if (editingSupplier) {
        await onUpdate(editingSupplier.id, {
          supplier_code: formCode,
          supplier_name: formName,
          tax_id: formTaxId,
          supplier_type: formSupplierType,
          address: formAddress,
          phone: formPhone,
          email: formEmail,
          contact_person: formContactPerson,
          payment_term: formPaymentTerm,
          credit_limit: formCreditLimit,
          status: formStatus,
          notes: formNotes,
          bank_account,
          contacts: editingSupplier.contacts || defaultContacts,
          addresses: editingSupplier.addresses || defaultAddresses
        });
        onToast(`อัปเดตข้อมูล ${formName} เรียบร้อย`, 'success');
      } else {
        await onAdd({
          supplier_code: formCode,
          supplier_name: formName,
          tax_id: formTaxId,
          supplier_type: formSupplierType,
          address: formAddress,
          phone: formPhone,
          email: formEmail,
          contact_person: formContactPerson,
          payment_term: formPaymentTerm,
          credit_limit: formCreditLimit,
          outstanding_balance: 0,
          status: formStatus,
          notes: formNotes,
          bank_account,
          contacts: defaultContacts,
          addresses: defaultAddresses,
          documents: [
            { id: 'doc-1', name: 'หนังสือรับรองบริษัท (ภพ.20).pdf', type: 'PDF', uploaded_at: new Date().toISOString().split('T')[0], file_size: '1.4 MB' },
            { id: 'doc-2', name: 'สำเนาหน้าสมุดบัญชีธนาคาร (Bank Book).pdf', type: 'PDF', uploaded_at: new Date().toISOString().split('T')[0], file_size: '850 KB' }
          ],
          activity_logs: [
            { id: 'log-1', action: 'สร้างบัญชีคู่ค้าในระบบ', user: 'Admin', timestamp: new Date().toISOString() }
          ]
        });
        onToast(`เพิ่มคู่ค้า ${formName} สำเร็จ`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      onToast(err?.message || 'บันทึกข้อมูลไม่สำเร็จ', 'err');
    }
  };

  // Export CSV
  const handleExportExcel = () => {
    const headers = ['Supplier Code', 'Supplier Name', 'Tax ID', 'Contact Person', 'Phone', 'Email', 'Payment Term', 'Credit Limit', 'Outstanding', 'Status'];
    const rows = filteredList.map(s => [
      s.supplier_code,
      `"${s.supplier_name.replace(/"/g, '""')}"`,
      `"${s.tax_id || '-'}"`,
      `"${s.contact_person || '-'}"`,
      `"${s.phone || '-'}"`,
      s.email || '-',
      s.payment_term || '-',
      s.credit_limit || 0,
      s.outstanding || 0,
      s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Suppliers_Master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('ส่งออกไฟล์ข้อมูลคู่ค้าสำเร็จ', 'success');
  };

  // Checkbox Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredList.length) setSelectedIds([]);
    else setSelectedIds(filteredList.map(s => s.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6" id="supplier-management-page">
      {/* ============================================================ */}
      {/* SECTION 1: DASHBOARD & SUMMARY CARDS                         */}
      {/* ============================================================ */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                <Building2 className="w-5 h-5" />
              </span>
              Supplier Accounts — บัญชีผู้ขาย
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Supplier Master Database • จัดการข้อมูลคู่ค้า • เครดิตเทอม • ประวัติจัดซื้อสะสม • เชื่อมโยง PR/PO Workflow
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              ทั้งหมด <b className="text-white">{totalSuppliersCount}</b> ราย | ยอดซื้อรวม <b className="text-emerald-400 font-mono">฿{totalSpendAll.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</b>
            </span>
          </div>
        </div>

        {/* 6 Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            id="kpi-suppliers-total"
            title="Suppliers ทั้งหมด"
            value={totalSuppliersCount}
            subtext="บัญชีผู้ขายในระบบ"
            icon={Building2}
            colorScheme="indigo"
          />
          <MetricCard
            id="kpi-suppliers-active"
            title="Active (ใช้งาน)"
            value={activeCount}
            subtext="สถานะพร้อมสั่งซื้อ"
            icon={CheckCircle2}
            colorScheme="emerald"
          />
          <MetricCard
            id="kpi-suppliers-inactive"
            title="Inactive (ปิดใช้งาน)"
            value={inactiveCount}
            subtext="ระงับการสั่งซื้อ"
            icon={X}
            colorScheme="slate"
          />
          <MetricCard
            id="kpi-suppliers-pending"
            title="รออนุมัติ (Pending)"
            value={pendingCount}
            subtext="รอตรวจสอบเอกสาร"
            icon={Clock}
            colorScheme="amber"
          />
          <MetricCard
            id="kpi-suppliers-total-spend"
            title="ยอดซื้อทั้งหมด"
            value={`฿${(totalSpendAll / 1000).toFixed(0)}k`}
            subtext={`฿${totalSpendAll.toLocaleString('th-TH')}`}
            icon={ShoppingCart}
            colorScheme="blue"
          />
          <MetricCard
            id="kpi-suppliers-payables"
            title="เจ้าหนี้ค้างชำระ"
            value={`฿${(totalOutstandingPayables / 1000).toFixed(0)}k`}
            subtext="Outstanding Payables"
            icon={DollarSign}
            colorScheme="rose"
          />
        </div>

        {/* Dashboard Additional: Supplier Type & Top Suppliers Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Supplier Type Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-indigo-400" />
                จำนวน Supplier แยกตามประเภท
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Industry</span>
            </div>
            <div className="h-44 flex items-center justify-center">
              {typeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any, name: any) => [`${val} ราย`, name]}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500 text-xs">
                  ยังไม่มีข้อมูลประเภทซัพพลายเออร์
                </div>
              )}
            </div>
          </div>

          {/* Spend by Supplier Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                ยอดซื้อสูงสุดแยกตาม Supplier (Top 5)
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold">PO Value</span>
            </div>
            <div className="h-44 flex items-center justify-center">
              {spendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, 'ยอดซื้อสะสม']}
                    />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500 text-xs">
                  ยังไม่มีประวัติยอดซื้อสะสม
                </div>
              )}
            </div>
          </div>

          {/* Top Suppliers by Outstanding Payables */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-rose-400" />
                  Supplier ที่มียอดค้างชำระสูงสุด
                </h3>
                <span className="text-[10px] text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800">
                  AP Balance
                </span>
              </div>

              <div className="space-y-2">
                {topOutstandingSuppliers.length > 0 ? (
                  topOutstandingSuppliers.map((sup, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-[10px] font-bold text-slate-500 w-4">{idx + 1}.</span>
                        <span className="text-slate-300 truncate font-medium">{sup.supplier_name}</span>
                      </div>
                      <span className="font-mono font-bold text-rose-400 text-xs shrink-0">
                        ฿{sup.outstanding.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    ไม่มีรายการเจ้าหนี้ค้างชำระ
                  </div>
                )}
              </div>
            </div>

            {/* Top 1 Supplier summary badge */}
            {topSuppliersBySpend.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] bg-slate-950/40 p-2 rounded-xl">
                <span className="text-slate-400 truncate">
                  ซื้อสูงสุด: <b className="text-white">{topSuppliersBySpend[0].supplier_name}</b>
                </span>
                <span className="font-mono text-emerald-400 font-bold shrink-0">฿{topSuppliersBySpend[0].totalPurchases.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: TOOLBAR                                           */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          {canModify && (
            <button
              id="btn-create-supplier"
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่ม Supplier</span>
            </button>
          )}

          {selectedIds.length > 0 && (
            <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded-xl font-medium">
              เลือก {selectedIds.length} คู่ค้า
            </span>
          )}
        </div>

        {/* Secondary Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-export-supplier-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="ส่งออกรายการผู้ขายเป็น Excel/CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            id="btn-download-supplier-template"
            onClick={() => {
              const sample = 'Supplier Code,Supplier Name,Tax ID,Contact Person,Phone,Email,Supplier Type,Payment Term,Credit Limit\nSUP-EXAMPLE,Sample Co Ltd,0105550000000,Khun Somchai,02-123-4567,sales@example.com,Distributor,Credit 30,500000\n';
              const uri = encodeURI('data:text/csv;charset=utf-8,\uFEFF' + sample);
              const a = document.createElement('a');
              a.href = uri;
              a.download = 'Supplier_Import_Template.csv';
              a.click();
              onToast('ดาวน์โหลด Template นำเข้าผู้ขายสำเร็จ', 'success');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="ดาวน์โหลดเทมเพลตสำหรับ Import ข้อมูล"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download Template</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="มุมมองตารางรายการ"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>ตารางข้อมูล (Table)</span>
            </button>
            <button
              onClick={() => {
                setViewMode('template');
                if (!selectedTemplateSupplier && filteredList.length > 0) {
                  setSelectedTemplateSupplier(filteredList[0]);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'template'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="มุมมองแบบฟอร์มเทมเพลต A4"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>เทมเพลตคู่ค้า (Template View)</span>
            </button>
          </div>

          <button
            id="btn-print-suppliers"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="พิมพ์หน้ารายการคู่ค้า"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print</span>
          </button>

          {onRefresh && (
            <button
              id="btn-refresh-suppliers"
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'กำลังโหลด...' : 'Refresh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: FILTER PANEL                                      */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">ค้นหาและตัวกรองข้อมูลคู่ค้า (Filter Panel)</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[11px] text-slate-400 hover:text-white transition font-medium cursor-pointer"
          >
            ล้างตัวกรอง
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Search Box */}
          <div className="lg:col-span-2">
            <label className="text-[10px] text-slate-400 font-semibold mb-1 block">ค้นหา (รหัส, ชื่อ, Tax ID, ผู้ติดต่อ, เบอร์, อีเมล)</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหารหัส, ชื่อ, เบอร์..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Supplier Type */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Supplier Type</label>
            <select
              value={filterSupplierType}
              onChange={e => setFilterSupplierType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">ทุกประเภทคู่ค้า</option>
              <option value="Distributor">Distributor (ตัวแทนจำหน่าย)</option>
              <option value="Manufacturer">Manufacturer (ผู้ผลิต)</option>
              <option value="Wholesaler">Wholesaler (ค้าส่ง)</option>
              <option value="Service Provider">Service Provider (ผู้ให้บริการ)</option>
              <option value="Subcontractor">Subcontractor (ผู้รับเหมาช่วง)</option>
            </select>
          </div>

          {/* Payment Term */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Payment Term</label>
            <select
              value={filterPaymentTerm}
              onChange={e => setFilterPaymentTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">ทุกเงื่อนไขเครดิต</option>
              <option value="Cash">Cash (เงินสด / โอนทันที)</option>
              <option value="Credit 15">Credit 15 วัน</option>
              <option value="Credit 30">Credit 30 วัน</option>
              <option value="Credit 60">Credit 60 วัน</option>
              <option value="Credit 90">Credit 90 วัน</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">ทุกสถานะ</option>
              <option value="Active">Active (เปิดใช้งาน)</option>
              <option value="Inactive">Inactive (ปิดใช้งาน)</option>
              <option value="Pending">Pending (รอตรวจสอบ)</option>
            </select>
          </div>

          {/* Created Date Range */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold mb-1 block">วันที่สร้าง From – To</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-slate-500 text-[10px]">-</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: SUPPLIER LIST TABLE                               */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Google Sheets Sheets Tab styling & Formula Bar (mirroring CustomerView) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-800 bg-slate-950/90 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
          <div className="flex items-center px-4 py-2 flex-grow min-w-0">
            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/80 text-[10px] mr-2">fx</span>
            <div className="font-mono text-[11px] text-slate-300 bg-slate-900 border border-slate-800 py-1 px-2.5 rounded flex-1 truncate select-all">
              =FILTER(SUPPLIER_DATABASE, SEARCH(&quot;{searchTerm || '*'}&quot;, SupplierName) * Type=&quot;{filterSupplierType}&quot; * Status=&quot;{filterStatus}&quot;)
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 text-xs text-slate-400">
            <span className="font-medium bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-slate-200 text-[11px] select-none">Sheet1 (Suppliers)</span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-mono text-[11px] font-bold">{filteredList.length} Records</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">
              Supplier Directory ({filteredList.length} รายการ)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            ระบบจัดการคู่ค้าและทะเบียนผู้ขายระดับองค์กร (โครงสร้างเดียวกับ Customer Accounts)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredList.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 font-mono">Supplier Code</th>
                <th className="py-3 px-3">Supplier Name</th>
                <th className="py-3 px-3">Tax ID</th>
                <th className="py-3 px-3">Contact Person</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Payment Term</th>
                <th className="py-3 px-3 text-right">Credit Limit</th>
                <th className="py-3 px-3 text-right">Outstanding</th>
                <th className="py-3 px-3 text-center">Last Purchase</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-10 text-slate-500 text-xs">
                    ไม่พบข้อมูลผู้ขายตามเงื่อนไขที่กำหนด
                  </td>
                </tr>
              ) : (
                filteredList.map(sup => {
                  const isChecked = selectedIds.includes(sup.id);

                  return (
                    <tr
                      key={sup.id}
                      className={`hover:bg-slate-850/40 transition-colors ${
                        isChecked ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(sup.id)}
                          className="rounded border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Supplier Code */}
                      <td className="py-3.5 px-3 font-mono font-bold text-indigo-400">
                        <button
                          onClick={() => {
                            setViewingSupplier(sup);
                            setDetailTab('overview');
                          }}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {sup.supplier_code}
                        </button>
                      </td>

                      {/* Supplier Name */}
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <div className="font-bold text-white truncate">{sup.supplier_name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Tag className="w-2.5 h-2.5 text-indigo-400" />
                          <span>{sup.supplier_type || 'Distributor'}</span>
                        </div>
                      </td>

                      {/* Tax ID */}
                      <td className="py-3.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {sup.tax_id || '-'}
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-3 text-slate-300 truncate max-w-[130px]">
                        {sup.contact_person || '-'}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {sup.phone || '-'}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-3 font-mono text-slate-400 truncate max-w-[140px]" title={sup.email}>
                        {sup.email || '-'}
                      </td>

                      {/* Payment Term */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {sup.payment_term || 'Cash'}
                        </span>
                      </td>

                      {/* Credit Limit */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                        ฿{(sup.credit_limit || 0).toLocaleString('th-TH')}
                      </td>

                      {/* Outstanding Balance */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={sup.outstanding > 0 ? 'text-rose-400' : 'text-slate-400'}>
                          ฿{(sup.outstanding || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Last Purchase */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-400 whitespace-nowrap">
                        {sup.lastPurchase || '-'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          sup.status === 'Active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : sup.status === 'Pending'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {sup.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Detail */}
                          <button
                            onClick={() => {
                              setViewingSupplier(sup);
                              setDetailTab('overview');
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition cursor-pointer"
                            title="ดูรายละเอียด Supplier Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* View Template */}
                          <button
                            onClick={() => {
                              setViewingSupplier(sup);
                              setDetailTab('template');
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/70 rounded-lg text-[10.5px] font-medium transition cursor-pointer"
                            title="ดูแบบฟอร์มเทมเพลตประวัติคู่ค้า A4 (Official Template)"
                          >
                            <FileText className="w-3 h-3 text-indigo-400" />
                            <span>เทมเพลต</span>
                          </button>

                          {/* Edit */}
                          {canModify && (
                            <button
                              onClick={() => handleOpenEdit(sup)}
                              className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="แก้ไขข้อมูลคู่ค้า"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Duplicate */}
                          {canModify && (
                            <button
                              onClick={() => handleDuplicate(sup)}
                              className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="ทำสำเนา (Duplicate Supplier)"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Purchase History Tab */}
                          <button
                            onClick={() => {
                              setViewingSupplier(sup);
                              setDetailTab('purchase_history');
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition cursor-pointer"
                            title="ดูประวัติการซื้อ (Purchase History)"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {canDelete && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบคู่ค้า ${sup.supplier_name}?`)) {
                                  await onDelete(sup.id);
                                  onToast(`ลบคู่ค้า ${sup.supplier_name} เรียบร้อยแล้ว`, 'success');
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="ลบข้อมูลคู่ค้า"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            แสดง {filteredList.length} จากทั้งหมด {totalSuppliersCount} ราย
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold">1</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUPPLIER DETAIL PAGE MODAL (9 TABS)                          */}
      {/* ============================================================ */}
      {viewingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{viewingSupplier.supplier_name}</h3>
                    <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded-lg">
                      {viewingSupplier.supplier_code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      viewingSupplier.status === 'Active'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {viewingSupplier.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {viewingSupplier.supplier_type || 'Distributor'} • เลขประจำตัวผู้เสียภาษี: {viewingSupplier.tax_id || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailTab('template')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                    detailTab === 'template'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                  }`}
                  title="ดูแบบฟอร์มเทมเพลต A4 สำหรับพิมพ์"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>เทมเพลต A4</span>
                </button>

                {onNavigateToPR && (
                  <button
                    onClick={() => {
                      const supId = viewingSupplier.id;
                      setViewingSupplier(null);
                      onNavigateToPR(supId);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>+ ออกใบ PR ทันที</span>
                  </button>
                )}
                <button
                  onClick={() => setViewingSupplier(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/50 px-3 py-1.5 gap-1 text-xs">
              {[
                { id: 'overview', label: '1. Overview', icon: FileText },
                { id: 'template', label: '★ เอกสารเทมเพลต A4 (Template)', icon: Sparkles },
                { id: 'contact', label: '2. Contact', icon: Users },
                { id: 'address', label: '3. Address', icon: MapPin },
                { id: 'financial', label: '4. Financial', icon: DollarSign },
                { id: 'pr', label: '5. PR (ใบขอซื้อ)', icon: FileText },
                { id: 'po', label: '6. PO (ใบสั่งซื้อ)', icon: ShoppingCart },
                { id: 'purchase_history', label: '7. Purchase History', icon: History },
                { id: 'documents', label: '8. Documents', icon: FolderOpen },
                { id: 'activity', label: '9. Activity Log', icon: Clock }
              ].map(tab => {
                const IconComp = tab.icon;
                const isActive = detailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
              {/* TAB: OFFICIAL TEMPLATE */}
              {detailTab === 'template' && (
                <div className="space-y-4">
                  <SupplierProfileTemplate
                    supplier={viewingSupplier}
                    purchaseOrders={purchaseOrders}
                    purchaseRequests={purchaseRequests}
                    isModal={false}
                  />
                </div>
              )}
              {/* TAB 1: OVERVIEW */}
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">ยอดจัดซื้อสะสมทั้งหมด</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                        ฿{((viewingSupplier as any).totalPurchases || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">จากใบสั่งซื้อทั้งหมด</div>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">ยอดเจ้าหนี้ค้างชำระ</div>
                      <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                        ฿{((viewingSupplier as any).outstanding || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">วงเงินเครดิต: ฿{(viewingSupplier.credit_limit || 500000).toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">เงื่อนไขการค้า (Payment Term)</div>
                      <div className="text-lg font-bold text-white mt-1">
                        {viewingSupplier.payment_term || 'Credit 30'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">การซื้อล่าสุด: {(viewingSupplier as any).lastPurchase || '-'}</div>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/30 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">ข้อมูลทั่วไปของสถานประกอบการ</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] text-slate-400">ชื่อสถานประกอบการ (ทางการ)</div>
                        <div className="font-bold text-white text-sm">{viewingSupplier.supplier_name}</div>
                        <div className="text-[10px] text-slate-400 mt-2">เลขประจำตัวผู้เสียภาษี 13 หลัก</div>
                        <div className="font-mono text-white font-bold">{viewingSupplier.tax_id || '-'}</div>
                        <div className="text-[10px] text-slate-400 mt-2">ประเภทสถานประกอบการ</div>
                        <div className="text-white">{viewingSupplier.supplier_type || 'Distributor'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">ผู้ติดต่อหลัก (Primary Contact)</div>
                        <div className="text-white font-bold">{viewingSupplier.contact_person || '-'}</div>
                        <div className="text-[10px] text-slate-400 mt-2">เบอร์โทรศัพท์ติดต่อ</div>
                        <div className="font-mono text-white">{viewingSupplier.phone || '-'}</div>
                        <div className="text-[10px] text-slate-400 mt-2">อีเมลติดต่อ</div>
                        <div className="font-mono text-indigo-400">{viewingSupplier.email || '-'}</div>
                      </div>
                    </div>
                    {viewingSupplier.notes && (
                      <div className="pt-2 border-t border-slate-800 mt-2">
                        <div className="text-[10px] text-slate-400 mb-0.5">บันทึกเพิ่มเติม / สินค้าเฉพาะทาง:</div>
                        <div className="text-slate-300 italic">{viewingSupplier.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACT (mirroring CustomerView pattern) */}
              {detailTab === 'contact' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-white">รายชื่อผู้ติดต่อประจำคู่ค้า (Supplier Representatives)</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">จัดการข้อมูลผู้ติดต่อ ฝ่ายขาย บัญชี หรือประสานงาน</p>
                    </div>
                    <button
                      id="btn-add-supplier-contact"
                      onClick={() => handleOpenContactForm()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      + เพิ่มผู้ติดต่อ
                    </button>
                  </div>

                  {viewingSupplier.contacts && viewingSupplier.contacts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewingSupplier.contacts.map((contact, idx) => (
                        <div key={contact.id || idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all text-xs space-y-2 relative group">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                {contact.name}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 pl-5">
                                ตำแหน่ง: <span className="text-slate-300 font-medium">{contact.role || '-'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {(contact.is_primary || idx === 0) && (
                                <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded font-bold">
                                  Primary
                                </span>
                              )}
                              <button
                                onClick={() => handleOpenContactForm(idx)}
                                title="แก้ไขผู้ติดต่อ"
                                className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded border border-slate-800 cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(idx)}
                                title="ลบผู้ติดต่อ"
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded border border-slate-800 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-1 pt-2 border-t border-slate-900 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{contact.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-indigo-400">
                              <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="truncate">{contact.email || '-'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl space-y-2">
                      <User className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">ยังไม่มีรายชื่อผู้ติดต่อสำหรับคู่ค้ารายนี้</p>
                      <button
                        onClick={() => handleOpenContactForm()}
                        className="text-xs font-semibold text-indigo-400 hover:underline inline-block focus:outline-none cursor-pointer"
                      >
                        + เพิ่มผู้ติดต่อคนแรกตอนนี้
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ADDRESS */}
              {detailTab === 'address' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white">สถานที่ตั้งและที่อยู่สำหรับออกเอกสาร (Addresses)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                        <Building className="w-4 h-4" />
                        <span>1. สำนักงานใหญ่ (Headquarters)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {viewingSupplier.address || '88/12 หมู่ 3 ถนนบางนา-ตราด กม.18 ตำบลบางโฉลง อำเภอบางพลี จังหวัดสมุทรปราการ 10540'}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <MapPin className="w-4 h-4" />
                        <span>2. ที่อยู่จัดส่ง (Shipping Address)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        คลังสินค้าและจุดกระจายสินค้า: นิคมอุตสาหกรรมบางพลี จ.สมุทรปราการ (รับสินค้า จันทร์-ศุกร์ 08:30 - 17:00 น.)
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <Receipt className="w-4 h-4" />
                        <span>3. ที่อยู่ออกใบกำกับภาษี (Tax Invoice)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {viewingSupplier.address || 'สำนักงานใหญ่ ตามหนังสือรับรอง ภ.พ.20'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: FINANCIAL */}
              {detailTab === 'financial' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white">ข้อมูลทางการเงินและบัญชีธนาคาร (Financial & Bank Account)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[11px] text-slate-400 font-bold">เงื่อนไขเครดิตทางการค้า</div>
                      <div className="flex justify-between py-1 border-b border-slate-850">
                        <span className="text-slate-400">Credit Term:</span>
                        <span className="font-bold text-white">{viewingSupplier.payment_term || 'Credit 30'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-850">
                        <span className="text-slate-400">Credit Limit:</span>
                        <span className="font-mono font-bold text-emerald-400">฿{(viewingSupplier.credit_limit || 500000).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-850">
                        <span className="text-slate-400">ยอดค้างชำระปัจจุบัน:</span>
                        <span className="font-mono font-bold text-rose-400">฿{((viewingSupplier as any).outstanding || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">วงเงินคงเหลือ (Available):</span>
                        <span className="font-mono font-bold text-indigo-400">
                          ฿{Math.max(0, (viewingSupplier.credit_limit || 500000) - ((viewingSupplier as any).outstanding || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[11px] text-slate-400 font-bold">ข้อมูลบัญชีธนาคารสำหรับจ่ายเงิน (Bank Account)</div>
                      <div className="flex justify-between py-1 border-b border-slate-850">
                        <span className="text-slate-400">ธนาคาร:</span>
                        <span className="font-bold text-white">{viewingSupplier.bank_account?.bank_name || 'ธนาคารกสิกรไทย (KBANK)'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-850">
                        <span className="text-slate-400">เลขที่บัญชี:</span>
                        <span className="font-mono font-bold text-emerald-400">{viewingSupplier.bank_account?.account_number || '741-2-19882-9'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">ชื่อบัญชี:</span>
                        <span className="text-white">{viewingSupplier.bank_account?.account_name || viewingSupplier.supplier_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PR HISTORY */}
              {detailTab === 'pr' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-white">ประวัติใบขอซื้อ (Purchase Requisition - PR)</h4>
                    <span className="text-[11px] text-slate-400">{(viewingSupplier as any).linkedPRs?.length || 0} รายการ</span>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                          <th className="py-2.5 px-3">PR No.</th>
                          <th className="py-2.5 px-3">วันที่</th>
                          <th className="py-2.5 px-3">ผู้ขอซื้อ</th>
                          <th className="py-2.5 px-3 text-right">ยอดเงินรวม</th>
                          <th className="py-2.5 px-3 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {((viewingSupplier as any).linkedPRs || []).length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-6 text-slate-500">ไม่มีประวัติ PR</td></tr>
                        ) : (
                          (viewingSupplier as any).linkedPRs.map((pr: any) => (
                            <tr key={pr.id}>
                              <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{pr.pr_no}</td>
                              <td className="py-2.5 px-3 text-slate-300 font-mono">{pr.date || pr.required_date || '-'}</td>
                              <td className="py-2.5 px-3 text-white">{pr.requested_by || pr.requestor || '-'}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                                ฿{pr.total_amount?.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                                  {pr.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: PO HISTORY */}
              {detailTab === 'po' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-white">ประวัติใบสั่งซื้อ (Purchase Order - PO)</h4>
                    <span className="text-[11px] text-slate-400">{(viewingSupplier as any).linkedOrders?.length || 0} รายการ</span>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                          <th className="py-2.5 px-3">PO No.</th>
                          <th className="py-2.5 px-3">วันที่สั่งซื้อ</th>
                          <th className="py-2.5 px-3">อ้างอิง PR</th>
                          <th className="py-2.5 px-3 text-right">ยอดสั่งซื้อสุทธิ</th>
                          <th className="py-2.5 px-3 text-center">สถานะ PO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {((viewingSupplier as any).linkedOrders || []).length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-6 text-slate-500">ไม่มีประวัติ PO</td></tr>
                        ) : (
                          (viewingSupplier as any).linkedOrders.map((po: any) => (
                            <tr key={po.id}>
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{po.po_no}</td>
                              <td className="py-2.5 px-3 text-slate-300 font-mono">{po.date || po.po_date || '-'}</td>
                              <td className="py-2.5 px-3 font-mono text-cyan-400">{po.pr_no || '-'}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                ฿{po.total_amount?.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
                                  {po.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: PURCHASE HISTORY */}
              {detailTab === 'purchase_history' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white">ประวัติรายการสินค้าที่เคยสั่งซื้อ (Purchased Items Log)</h4>
                  <div className="space-y-2">
                    {((viewingSupplier as any).linkedOrders || []).flatMap((po: any) => po.items || []).map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div>
                          <div className="font-bold text-white text-xs">{it.description}</div>
                          <div className="text-[10px] text-slate-500">จำนวน: {it.qty || it.quantity || 1} {it.unit || 'ชิ้น'} • ราคาต่อหน่วย: ฿{it.unit_price?.toLocaleString()}</div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 text-xs">฿{it.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                    {((viewingSupplier as any).linkedOrders || []).flatMap((po: any) => po.items || []).length === 0 && (
                      <div className="text-center py-6 text-slate-500">ยังไม่มีประวัติการซื้อสินค้า</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: DOCUMENTS */}
              {detailTab === 'documents' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-white">เอกสารประกอบคู่ค้า (Registered Documents)</h4>
                    <button
                      onClick={() => onToast('รองรับการอัปโหลดไฟล์เอกสาร PDF/รูปภาพ', 'success')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                    >
                      + อัปโหลดเอกสาร
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(viewingSupplier.documents || [
                      { id: 'doc-1', name: 'หนังสือรับรองบริษัท (ภพ.20).pdf', type: 'PDF', uploaded_at: '2026-01-10', file_size: '1.4 MB' },
                      { id: 'doc-2', name: 'สำเนาหน้าสมุดบัญชีธนาคาร (Bank Book).pdf', type: 'PDF', uploaded_at: '2026-01-10', file_size: '850 KB' }
                    ]).map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          <div>
                            <div className="font-bold text-white text-xs">{doc.name}</div>
                            <div className="text-[10px] text-slate-500">ขนาด: {doc.file_size || '1 MB'} • วันที่อัปโหลด: {doc.uploaded_at}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => onToast(`ดาวน์โหลดเอกสาร ${doc.name} เรียบร้อย`, 'success')}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 9: ACTIVITY LOG */}
              {detailTab === 'activity' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white">ประวัติการแก้ไขและกิจกรรม (Audit Trail & Activity Log)</h4>
                  <div className="space-y-2">
                    {(viewingSupplier.activity_logs || [
                      { id: 'log-1', action: 'สร้างบัญชีคู่ค้าในระบบ', user: 'Admin', timestamp: '2026-01-10 08:00:00' },
                      { id: 'log-2', action: 'อนุมัติสถานะเป็น Active', user: 'Manager (Saranya)', timestamp: '2026-01-11 09:30:00' },
                      { id: 'log-3', action: 'อัปเดตวงเงินเครดิตเป็น ฿500,000', user: 'Finance Admin', timestamp: '2026-02-01 14:15:00' }
                    ]).map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-white font-medium text-xs">{log.action}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">โดย {log.user} • {log.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ADD / EDIT SUPPLIER                                 */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                {editingSupplier ? `แก้ไขข้อมูลผู้ขาย: ${formCode}` : 'เพิ่มบัญชีคู่ค้าใหม่ (Register New Supplier)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">รหัสผู้ขาย (Supplier Code)</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-indigo-400 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">ชื่อบริษัท / Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <input
                    type="text"
                    value={formTaxId}
                    onChange={e => setFormTaxId(e.target.value)}
                    placeholder="เลข 13 หลัก"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">ประเภทผู้ขาย (Supplier Type)</label>
                  <select
                    value={formSupplierType}
                    onChange={e => setFormSupplierType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Distributor">Distributor (ตัวแทนจำหน่าย)</option>
                    <option value="Manufacturer">Manufacturer (ผู้ผลิต)</option>
                    <option value="Wholesaler">Wholesaler (ค้าส่ง)</option>
                    <option value="Service Provider">Service Provider (บริการ)</option>
                    <option value="Subcontractor">Subcontractor (ผู้รับเหมาช่วง)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">สถานะคู่ค้า (Status)</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Active">Active (เปิดใช้งาน)</option>
                    <option value="Inactive">Inactive (ปิดใช้งาน)</option>
                    <option value="Pending">Pending (รอตรวจสอบ)</option>
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">ผู้ติดต่อหลัก (Contact Person)</label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={e => setFormContactPerson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">เบอร์โทรศัพท์ (Phone)</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">อีเมล (Email)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Financial & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">เงื่อนไขชำระเงิน (Payment Term)</label>
                  <select
                    value={formPaymentTerm}
                    onChange={e => setFormPaymentTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Cash">Cash (เงินสด / โอนก่อนส่ง)</option>
                    <option value="Credit 15">Credit 15 วัน</option>
                    <option value="Credit 30">Credit 30 วัน</option>
                    <option value="Credit 45">Credit 45 วัน</option>
                    <option value="Credit 60">Credit 60 วัน</option>
                    <option value="Credit 90">Credit 90 วัน</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">วงเงินเครดิต (Credit Limit - บาท)</label>
                  <input
                    type="number"
                    value={formCreditLimit}
                    onChange={e => setFormCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Bank Account */}
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 space-y-2">
                <span className="text-[11px] font-bold text-white">ข้อมูลบัญชีธนาคารสำหรับโอนจ่ายเงิน</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="ชื่อธนาคาร"
                      value={formBankName}
                      onChange={e => setFormBankName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="เลขที่บัญชี"
                      value={formBankAccNo}
                      onChange={e => setFormBankAccNo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-400 font-bold"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="ชื่อบัญชี"
                      value={formBankAccName}
                      onChange={e => setFormBankAccName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">ที่อยู่สำนักงานใหญ่</label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">บันทึกเพิ่มเติม / หมายเหตุ</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="เช่น มาตรฐาน API, วาล์วอุตสาหกรรม, ท่อสเปกพิเศษ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  {editingSupplier ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มคู่ค้า'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 7: CONTACT PERSON MODAL (matching CustomerView)       */}
      {/* ============================================================ */}
      {isContactFormOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingContactIndex !== null ? 'แก้ไขข้อมูลผู้ติดต่อคู่ค้า' : 'เพิ่มผู้ติดต่อคู่ค้าใหม่'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsContactFormOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-5 space-y-4">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-300 block">
                  ชื่อ-นามสกุล ผู้ติดต่อ <span className="text-rose-400">*</span>
                </label>
                <input
                  id="form-supplier-contact-name"
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="เช่น คุณสมชาย วิทยาพงษ์"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-300 block">ตำแหน่ง / หน้าที่</label>
                <input
                  id="form-supplier-contact-position"
                  type="text"
                  value={contactPosition}
                  onChange={(e) => setContactPosition(e.target.value)}
                  placeholder="เช่น ผู้จัดการฝ่ายขาย, เจ้าหน้าที่ประสานงานสินค้า"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-300 block">
                  เบอร์โทรศัพท์ <span className="text-rose-400">*</span>
                </label>
                <input
                  id="form-supplier-contact-phone"
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="เช่น 02-316-4455 หรือ 081-234-5678"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-300 block">อีเมลติดต่อ</label>
                <input
                  id="form-supplier-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="เช่น somchai@supplier.co.th"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsContactFormOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  id="btn-submit-supplier-contact"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-sm cursor-pointer"
                >
                  บันทึกผู้ติดต่อ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
