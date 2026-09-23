import React, { useState, useMemo } from 'react';
import { BillingNote, BillingNoteItem, Customer, Invoice, UserRole, BillingNotePaymentRecord } from '../types';
import { MetricCard } from './common/MetricCard';
import { BillingNoteTemplate } from './templates/BillingNoteTemplate';
import { numberToThaiBaht } from '../utils/numberWords';
import {
  FileText,
  Receipt,
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
  ArrowUpDown,
  MoreVertical,
  ChevronDown,
  TrendingUp,
  User,
  ArrowRight,
  ExternalLink,
  ChevronRight,
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

interface BillingManagementProps {
  billingNotes?: BillingNote[];
  customers?: Customer[];
  invoices?: Invoice[];
  onAdd: (payload: Omit<BillingNote, 'id' | 'created_at'>) => Promise<any>;
  onUpdate: (id: string, updates: Partial<BillingNote>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onToast: (msg: string, type: 'success' | 'err') => void;
  currentRole: UserRole;
  currentUserId?: string;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export default function BillingManagement({
  billingNotes = [],
  customers = [],
  invoices = [],
  onAdd,
  onUpdate,
  onDelete,
  onToast,
  currentRole,
  onRefresh,
  isLoading
}: BillingManagementProps) {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterDueDateFrom, setFilterDueDateFrom] = useState('');
  const [filterDueDateTo, setFilterDueDateTo] = useState('');
  const [filterSalesperson, setFilterSalesperson] = useState('All');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('All');
  const [filterSalesOrder, setFilterSalesOrder] = useState('');
  const [filterInvoice, setFilterInvoice] = useState('');

  // Modals & View Modes
  const [viewMode, setViewMode] = useState<'table' | 'template'>('table');
  const [selectedTemplateBilling, setSelectedTemplateBilling] = useState<BillingNote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<BillingNote | null>(null);
  const [viewingBilling, setViewingBilling] = useState<BillingNote | null>(null);
  const [paymentModalBilling, setPaymentModalBilling] = useState<BillingNote | null>(null);

  // Selected Checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Payment Recording State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Transfer' | 'Cash' | 'Cheque' | 'Credit Card'>('Transfer');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentRefNo, setPaymentRefNo] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Form State
  const [formBillingNo, setFormBillingNo] = useState('');
  const [formBillingDate, setFormBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerAddress, setFormCustomerAddress] = useState('');
  const [formCustomerTaxId, setFormCustomerTaxId] = useState('');
  const [formSalesOrderNo, setFormSalesOrderNo] = useState('');
  const [formSalesperson, setFormSalesperson] = useState('Saranya (Admin)');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDeliveredBy, setFormDeliveredBy] = useState('Saranya.');
  const [formDeliveredDate, setFormDeliveredDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReceivedBy, setFormReceivedBy] = useState('');
  const [formReceivedDate, setFormReceivedDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<BillingNote['status']>('Issued');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Transfer' | 'Cash' | 'Cheque' | 'Credit Card'>('Transfer');

  // Form Detail Items
  const [formItems, setFormItems] = useState<BillingNoteItem[]>([
    {
      no: 1,
      ref_no: '',
      invoice_no: 'INV-2609001',
      sales_order_no: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      amount: 50000
    }
  ]);

  const canModify = currentRole !== 'Management';
  const canDelete = currentRole === 'Admin' || currentRole === 'System Administrator' || (currentRole as string) === 'Administrator';

  // Salespersons list
  const salespersonsList = useMemo(() => {
    const list = new Set<string>();
    billingNotes.forEach(b => {
      if (b.salesperson) list.add(b.salesperson);
      if (b.delivered_by) list.add(b.delivered_by);
    });
    return Array.from(list);
  }, [billingNotes]);

  // Compute calculated amounts for each note
  const enrichedNotes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return billingNotes.map(b => {
      const total = Number(b.total_amount) || 0;
      // Calculate paid from payments if any, or default from paid_amount/status
      let paid = b.paid_amount;
      if (paid === undefined) {
        if (b.payments && b.payments.length > 0) {
          paid = b.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        } else if (b.status === 'Paid') {
          paid = total;
        } else if (b.status === 'Partially Paid') {
          paid = total * 0.5;
        } else {
          paid = 0;
        }
      }
      const outstanding = Math.max(0, total - (paid || 0));

      // Overdue check
      const dueDate = b.due_date || b.due_of_payment || '';
      const isOverdue = dueDate && dueDate < today && outstanding > 0 && b.status !== 'Paid';
      const effectiveStatus: BillingNote['status'] = isOverdue && b.status !== 'Draft' && b.status !== 'Cancelled'
        ? 'Overdue'
        : (b.status || 'Issued');

      return {
        ...b,
        total_amount: total,
        paid_amount: paid,
        outstanding_amount: outstanding,
        effectiveStatus,
        dueDate
      };
    });
  }, [billingNotes]);

  // KPIs
  const totalCount = enrichedNotes.length;
  const draftCount = enrichedNotes.filter(b => b.effectiveStatus === 'Draft' || b.effectiveStatus === 'Pending').length;
  const issuedCount = enrichedNotes.filter(b => b.effectiveStatus === 'Issued' || b.effectiveStatus === 'Delivered').length;
  const totalOutstanding = enrichedNotes.reduce((acc, b) => acc + (b.outstanding_amount || 0), 0);
  const overdueNotes = enrichedNotes.filter(b => b.effectiveStatus === 'Overdue');
  const overdueCount = overdueNotes.length;
  const overdueAmount = overdueNotes.reduce((acc, b) => acc + (b.outstanding_amount || 0), 0);
  const totalPaid = enrichedNotes.reduce((acc, b) => acc + (b.paid_amount || 0), 0);

  // Top 5 Customers with Outstanding
  const topOutstandingCustomers = useMemo(() => {
    const map: { [cust: string]: number } = {};
    enrichedNotes.forEach(b => {
      if (b.outstanding_amount > 0) {
        map[b.customer_name] = (map[b.customer_name] || 0) + b.outstanding_amount;
      }
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [enrichedNotes]);

  // Monthly Billing Data for Chart
  const monthlyBillingData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = '2026';
    const monthTotals: { [key: string]: number } = {};
    months.forEach(m => { monthTotals[m] = 0; });

    enrichedNotes.forEach(b => {
      const d = b.date || b.billing_date || '';
      if (d) {
        const dateObj = new Date(d);
        if (!isNaN(dateObj.getTime())) {
          const monthIdx = dateObj.getMonth();
          monthTotals[months[monthIdx]] += b.total_amount;
        }
      }
    });

    return months.map(m => ({ month: m, amount: monthTotals[m] }));
  }, [enrichedNotes]);

  // Status breakdown data for chart
  const statusChartData = useMemo(() => {
    const counts: { [key: string]: number } = {
      'Draft/Pending': 0,
      'Issued': 0,
      'Partially Paid': 0,
      'Paid': 0,
      'Overdue': 0,
      'Cancelled': 0
    };

    enrichedNotes.forEach(b => {
      if (b.effectiveStatus === 'Draft' || b.effectiveStatus === 'Pending') counts['Draft/Pending']++;
      else if (b.effectiveStatus === 'Issued' || b.effectiveStatus === 'Delivered') counts['Issued']++;
      else if (b.effectiveStatus === 'Partially Paid') counts['Partially Paid']++;
      else if (b.effectiveStatus === 'Paid') counts['Paid']++;
      else if (b.effectiveStatus === 'Overdue') counts['Overdue']++;
      else if (b.effectiveStatus === 'Cancelled') counts['Cancelled']++;
    });

    return [
      { name: 'วางบิลแล้ว (Issued)', value: counts['Issued'], color: '#10b981' },
      { name: 'ชำระแล้ว (Paid)', value: counts['Paid'], color: '#3b82f6' },
      { name: 'ชำระบางส่วน (Partial)', value: counts['Partially Paid'], color: '#8b5cf6' },
      { name: 'เกินกำหนด (Overdue)', value: counts['Overdue'], color: '#ef4444' },
      { name: 'ร่าง/รอดำเนินการ', value: counts['Draft/Pending'], color: '#f59e0b' }
    ].filter(item => item.value > 0);
  }, [enrichedNotes]);

  // Upcoming due notes (Due in next 7-14 days)
  const upcomingDueNotes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return enrichedNotes
      .filter(b => b.dueDate >= today && b.outstanding_amount > 0 && b.effectiveStatus !== 'Paid')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [enrichedNotes]);

  // Filtered List
  const filteredList = useMemo(() => {
    return enrichedNotes.filter(b => {
      const matchSearch =
        (b.billing_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.salesperson && b.salesperson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.sales_order_no && b.sales_order_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.items || []).some(it =>
          (it.invoice_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (it.ref_no && it.ref_no.toLowerCase().includes(searchTerm.toLowerCase()))
        );

      const matchCustomer = filterCustomer === 'All' || b.customer_name === filterCustomer;
      const matchStatus = filterStatus === 'All' ||
        b.effectiveStatus === filterStatus ||
        (filterStatus === 'Issued' && b.effectiveStatus === 'Delivered') ||
        (filterStatus === 'Draft' && b.effectiveStatus === 'Pending');

      const bDate = b.date || b.billing_date || '';
      const matchDateFrom = !filterDateFrom || (bDate >= filterDateFrom);
      const matchDateTo = !filterDateTo || (bDate <= filterDateTo);

      const dDate = b.dueDate;
      const matchDueDateFrom = !filterDueDateFrom || (dDate >= filterDueDateFrom);
      const matchDueDateTo = !filterDueDateTo || (dDate <= filterDueDateTo);

      const matchSalesperson = filterSalesperson === 'All' || b.salesperson === filterSalesperson || b.delivered_by === filterSalesperson;
      const matchPaymentMethod = filterPaymentMethod === 'All' || b.payment_method === filterPaymentMethod;

      const matchSO = !filterSalesOrder ||
        (b.sales_order_no && b.sales_order_no.toLowerCase().includes(filterSalesOrder.toLowerCase())) ||
        b.items.some(it => it.sales_order_no?.toLowerCase().includes(filterSalesOrder.toLowerCase()) || it.ref_no?.toLowerCase().includes(filterSalesOrder.toLowerCase()));

      const matchInvoice = !filterInvoice ||
        b.items.some(it => it.invoice_no.toLowerCase().includes(filterInvoice.toLowerCase()));

      return (
        matchSearch &&
        matchCustomer &&
        matchStatus &&
        matchDateFrom &&
        matchDateTo &&
        matchDueDateFrom &&
        matchDueDateTo &&
        matchSalesperson &&
        matchPaymentMethod &&
        matchSO &&
        matchInvoice
      );
    });
  }, [
    enrichedNotes,
    searchTerm,
    filterCustomer,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterDueDateFrom,
    filterDueDateTo,
    filterSalesperson,
    filterPaymentMethod,
    filterSalesOrder,
    filterInvoice
  ]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCustomer('All');
    setFilterStatus('All');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDueDateFrom('');
    setFilterDueDateTo('');
    setFilterSalesperson('All');
    setFilterPaymentMethod('All');
    setFilterSalesOrder('');
    setFilterInvoice('');
  };

  const MAX_ITEMS = 10;
  const [formIncludeVat, setFormIncludeVat] = useState(false);

  // Open Create Form
  const handleOpenAdd = () => {
    setEditingBilling(null);
    const nextSeq = billingNotes.length + 1;
    setFormBillingNo(`BN-26${String(nextSeq).padStart(4, '0')}`);
    setFormBillingDate(new Date().toISOString().split('T')[0]);
    setFormCustomerId('');
    setFormCustomerName(customers[0]?.customer_name || 'บริษัท พีทีที ดิจิตอล โซลูชั่น จำกัด');
    setFormCustomerAddress(customers[0]?.address || '555 อาคารเอนเนอร์ยี่คอมเพล็กซ์ ถนนวิภาวดีรังสิต จตุจักร กรุงเทพฯ');
    setFormCustomerTaxId(customers[0]?.tax_id || '0105549005678');
    setFormSalesOrderNo('');
    setFormSalesperson('Saranya (Admin)');
    // Default Due Date: 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormDueDate(d.toISOString().split('T')[0]);
    setFormDeliveredBy('Saranya.');
    setFormDeliveredDate(new Date().toISOString().split('T')[0]);
    setFormReceivedBy('');
    setFormReceivedDate('');
    setFormNotes('');
    setFormStatus('Issued');
    setFormPaymentMethod('Transfer');
    setFormIncludeVat(false);
    setFormItems([
      {
        no: 1,
        ref_no: 'SO-26001',
        invoice_no: 'INV-2609001',
        sales_order_no: 'SO-26001',
        description: 'งานบริการทดสอบทางวิศวกรรม (Engineering Testing Services)',
        date: new Date().toISOString().split('T')[0],
        amount: 45000
      }
    ]);
    setIsModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (bl: BillingNote) => {
    setEditingBilling(bl);
    setFormBillingNo(bl.billing_no);
    setFormBillingDate(bl.date || bl.billing_date || new Date().toISOString().split('T')[0]);
    setFormCustomerId(bl.customer_id || '');
    setFormCustomerName(bl.customer_name);
    setFormCustomerAddress(bl.customer_address || '');
    setFormCustomerTaxId(bl.customer_tax_id || '');
    setFormSalesOrderNo(bl.sales_order_no || '');
    setFormSalesperson(bl.salesperson || bl.delivered_by || 'Saranya (Admin)');
    setFormDueDate(bl.due_date || bl.due_of_payment || '');
    setFormDeliveredBy(bl.delivered_by);
    setFormDeliveredDate(bl.delivered_date);
    setFormReceivedBy(bl.received_by || '');
    setFormReceivedDate(bl.received_date || '');
    setFormNotes(bl.notes || '');
    setFormStatus(bl.status);
    setFormPaymentMethod(bl.payment_method || 'Transfer');
    setFormIncludeVat(false);
    setFormItems(
      bl.items && bl.items.length > 0
        ? bl.items.slice(0, MAX_ITEMS).map((it, idx) => ({
            no: it.no || (idx + 1),
            ref_no: it.ref_no || '',
            invoice_no: it.invoice_no || '',
            sales_order_no: it.sales_order_no || '',
            description: it.description || '',
            date: it.date || bl.date || '',
            amount: Number(it.amount || 0)
          }))
        : [
            {
              no: 1,
              ref_no: '',
              invoice_no: 'INV-2609001',
              sales_order_no: '',
              description: 'งานบริการทางวิศวกรรม',
              date: bl.date,
              amount: bl.total_amount
            }
          ]
    );
    setIsModalOpen(true);
  };

  // Customer Select in Form
  const handleCustomerSelect = (id: string) => {
    setFormCustomerId(id);
    const cus = customers.find(c => c.id === id);
    if (cus) {
      setFormCustomerName(cus.customer_name);
      setFormCustomerAddress(cus.address || '');
      setFormCustomerTaxId(cus.tax_id || '');
    }
  };

  // Form total calculated in real-time (Subtotal, VAT, Total & Thai Baht words)
  const formSubtotal = useMemo(() => {
    return formItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  }, [formItems]);

  const formVat = useMemo(() => {
    return formIncludeVat ? Math.round(formSubtotal * 0.07 * 100) / 100 : 0;
  }, [formIncludeVat, formSubtotal]);

  const formCalculatedTotal = useMemo(() => {
    return Math.round((formSubtotal + formVat) * 100) / 100;
  }, [formSubtotal, formVat]);

  const formThaiBahtText = useMemo(() => {
    return numberToThaiBaht(formCalculatedTotal);
  }, [formCalculatedTotal]);

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim()) {
      onToast('กรุณาระบุชื่อลูกค้าในใบวางบิล', 'err');
      return;
    }
    if (formItems.length === 0) {
      onToast('กรุณาระบุรายการใบแจ้งหนี้อย่างน้อย 1 รายการ', 'err');
      return;
    }
    if (formItems.length > MAX_ITEMS) {
      onToast(`รายการในใบวางบิลรองรับสูงสุด ${MAX_ITEMS} รายการเท่านั้น (ปัจจุบันมี ${formItems.length} รายการ)`, 'err');
      return;
    }
    if (formCalculatedTotal <= 0) {
      onToast('กรุณาระบุจำนวนเงินในรายการใบแจ้งหนี้ให้มากกว่า 0 บาท (ระบบจะ sum ยอด Total ให้อัตโนมัติ)', 'err');
      return;
    }

    try {
      if (editingBilling) {
        await onUpdate(editingBilling.id, {
          billing_no: formBillingNo,
          date: formBillingDate,
          billing_date: formBillingDate,
          customer_id: formCustomerId,
          customer_name: formCustomerName,
          customer_address: formCustomerAddress,
          customer_tax_id: formCustomerTaxId,
          sales_order_no: formSalesOrderNo,
          salesperson: formSalesperson,
          due_of_payment: formDueDate,
          due_date: formDueDate,
          total_amount: formCalculatedTotal,
          delivered_by: formDeliveredBy,
          delivered_date: formDeliveredDate,
          received_by: formReceivedBy,
          received_date: formReceivedDate,
          notes: formNotes,
          items: formItems,
          status: formStatus,
          payment_method: formPaymentMethod
        });
        onToast(`อัปเดตใบวางบิล ${formBillingNo} สำเร็จ`, 'success');
      } else {
        await onAdd({
          billing_no: formBillingNo,
          date: formBillingDate,
          billing_date: formBillingDate,
          customer_id: formCustomerId,
          customer_name: formCustomerName,
          customer_address: formCustomerAddress,
          customer_tax_id: formCustomerTaxId,
          sales_order_no: formSalesOrderNo,
          salesperson: formSalesperson,
          due_of_payment: formDueDate,
          due_date: formDueDate,
          total_amount: formCalculatedTotal,
          paid_amount: formStatus === 'Paid' ? formCalculatedTotal : 0,
          outstanding_amount: formStatus === 'Paid' ? 0 : formCalculatedTotal,
          delivered_by: formDeliveredBy,
          delivered_date: formDeliveredDate,
          received_by: formReceivedBy,
          received_date: formReceivedDate,
          notes: formNotes,
          items: formItems,
          status: formStatus,
          payment_method: formPaymentMethod,
          payments: []
        });
        onToast(`สร้างใบวางบิล ${formBillingNo} สำเร็จ`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      onToast(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'err');
    }
  };

  // Open Payment Recording Modal
  const handleOpenPayment = (bl: any) => {
    setPaymentModalBilling(bl);
    setPaymentAmount(bl.outstanding_amount || bl.total_amount || 0);
    setPaymentMethod(bl.payment_method || 'Transfer');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRefNo(`TRX-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentNotes('');
  };

  // Submit Payment Record
  const handleSavePayment = async () => {
    if (!paymentModalBilling) return;
    if (paymentAmount <= 0) {
      onToast('ยอดชำระต้องมากกว่า 0 บาท', 'err');
      return;
    }

    const currentPaid = paymentModalBilling.paid_amount || 0;
    const newPaid = currentPaid + paymentAmount;
    const total = paymentModalBilling.total_amount || 0;
    const newOutstanding = Math.max(0, total - newPaid);
    const newStatus: BillingNote['status'] = newOutstanding <= 0 ? 'Paid' : 'Partially Paid';

    const newPaymentRecord: BillingNotePaymentRecord = {
      id: `pay_${Date.now()}`,
      date: paymentDate,
      amount: paymentAmount,
      payment_method: paymentMethod,
      reference_no: paymentRefNo,
      recorded_by: 'Finance Staff',
      notes: paymentNotes
    };

    const existingPayments = paymentModalBilling.payments || [];
    const updatedPayments = [...existingPayments, newPaymentRecord];

    try {
      await onUpdate(paymentModalBilling.id, {
        paid_amount: newPaid,
        outstanding_amount: newOutstanding,
        status: newStatus,
        payments: updatedPayments
      });
      onToast(`บันทึกรับชำระ ฿${paymentAmount.toLocaleString()} ให้กับ ${paymentModalBilling.billing_no} เรียบร้อย`, 'success');
      setPaymentModalBilling(null);
    } catch (err: any) {
      onToast(err?.message || 'บันทึกรับชำระไม่สำเร็จ', 'err');
    }
  };

  // Print Handling
  const handlePrint = () => {
    window.print();
  };

  // Export CSV/Excel simulation
  const handleExportExcel = () => {
    const headers = ['Billing No', 'Billing Date', 'Customer', 'Due Date', 'Total Amount', 'Paid Amount', 'Outstanding', 'Status', 'Salesperson'];
    const rows = filteredList.map(b => [
      b.billing_no,
      b.date || b.billing_date,
      `"${b.customer_name.replace(/"/g, '""')}"`,
      b.dueDate,
      b.total_amount,
      b.paid_amount || 0,
      b.outstanding_amount || 0,
      b.effectiveStatus,
      b.salesperson || b.delivered_by || '-'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Billing_Notes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('ส่งออกไฟล์รายการใบวางบิลเรียบร้อยแล้ว', 'success');
  };

  // Select all checkboxes toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map(b => b.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6" id="billing-notes-page">
      {/* ============================================================ */}
      {/* SECTION 1: DASHBOARD & SUMMARY CARDS                         */}
      {/* ============================================================ */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl">
                <Receipt className="w-5 h-5" />
              </span>
              Billing Notes — ใบวางบิล
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              ควบคุมการวางบิล • บริหารลูกหนี้การค้า • ติดตามกำหนดชำระเงิน • บันทึกการรับชำระเงิน (Real-time Financial Flow)
            </p>
          </div>

          {/* Quick status summary chip */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 shadow-xs px-3 py-1.5 rounded-xl">
              ทั้งหมด <span className="font-bold text-slate-900">{totalCount}</span> ฉบับ | ค้างชำระ <span className="font-bold text-amber-600">฿{totalOutstanding.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </span>
          </div>
        </div>

        {/* 6 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            id="kpi-billing-total"
            title="ใบวางบิลทั้งหมด"
            value={totalCount}
            subtext="เอกสารในระบบ"
            icon={FileText}
            colorScheme="slate"
          />
          <MetricCard
            id="kpi-billing-draft"
            title="รอวางบิล"
            value={draftCount}
            subtext="ฉบับร่าง/รอดำเนินการ"
            icon={Clock}
            colorScheme="amber"
          />
          <MetricCard
            id="kpi-billing-issued"
            title="วางบิลแล้ว"
            value={issuedCount}
            subtext="ส่งมอบเอกสารแล้ว"
            icon={CheckCircle2}
            colorScheme="emerald"
          />
          <MetricCard
            id="kpi-billing-outstanding"
            title="รอรับชำระ"
            value={`฿${(totalOutstanding / 1000).toFixed(0)}k`}
            subtext={`฿${totalOutstanding.toLocaleString('th-TH')}`}
            icon={DollarSign}
            colorScheme="amber"
          />
          <MetricCard
            id="kpi-billing-overdue"
            title="เกินกำหนด (Overdue)"
            value={overdueCount}
            subtext={`฿${overdueAmount.toLocaleString('th-TH')}`}
            icon={AlertTriangle}
            colorScheme="rose"
            badge={overdueCount > 0 ? `${overdueCount} ใบ` : undefined}
          />
          <MetricCard
            id="kpi-billing-paid"
            title="รับชำระแล้ว"
            value={`฿${(totalPaid / 1000).toFixed(0)}k`}
            subtext={`฿${totalPaid.toLocaleString('th-TH')}`}
            icon={Check}
            colorScheme="blue"
          />
        </div>

        {/* Dashboard Additional Analytics: Charts & Top Debtors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Monthly Billing Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                กราฟยอดวางบิลรายเดือน (Monthly Billing Trend)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">FY 2026</span>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBillingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, 'ยอดวางบิล']}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown Pie Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                สถานะใบวางบิล (Billing Status Ratio)
              </h3>
              <span className="text-[10px] text-slate-500">{enrichedNotes.length} เอกสาร</span>
            </div>
            <div className="h-44 flex items-center justify-center">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: any, name: any) => [`${val} ใบ`, name]}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-500">ไม่มีข้อมูลสถานะ</div>
              )}
            </div>
          </div>

          {/* Top 5 Customers with Outstanding Balance & Upcoming Overdue Alert */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-amber-600" />
                  Top 5 ลูกค้ามียอดค้างชำระสูงสุด
                </h3>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  AR Aging
                </span>
              </div>

              <div className="space-y-2">
                {topOutstandingCustomers.length > 0 ? (
                  topOutstandingCustomers.map((cust, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                        <span className="text-slate-800 truncate font-medium">{cust.name}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-600 text-xs shrink-0">
                        ฿{cust.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    ไม่มีรายการค้างชำระในขณะนี้
                  </div>
                )}
              </div>
            </div>

            {/* Quick alert badge for upcoming due */}
            {upcomingDueNotes.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                <span className="text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  ใกล้ครบกำหนด: <b className="text-slate-900">{upcomingDueNotes[0].billing_no}</b> ({upcomingDueNotes[0].dueDate})
                </span>
                <span className="font-mono text-amber-700 font-bold">฿{upcomingDueNotes[0].outstanding_amount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: TOOLBAR                                           */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {canModify && (
            <button
              id="btn-create-billing"
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างใบวางบิล</span>
            </button>
          )}

          {/* View Mode Switcher: Table vs Template */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              id="btn-view-mode-table"
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>ตารางข้อมูล (Table)</span>
            </button>
            <button
              id="btn-view-mode-template"
              type="button"
              onClick={() => {
                setViewMode('template');
                if (!selectedTemplateBilling && filteredList.length > 0) {
                  setSelectedTemplateBilling(filteredList[0]);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'template'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>เทมเพลตมาตรฐาน (Template View)</span>
            </button>
          </div>

          {/* Bulk Action if items selected */}
          {selectedIds.length > 0 && (
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-medium">
              เลือก {selectedIds.length} รายการ
            </span>
          )}
        </div>

        {/* Secondary Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-preview-default-template"
            onClick={() => {
              const target = selectedTemplateBilling || filteredList[0] || billingNotes[0];
              if (target) setViewingBilling(target);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200 transition cursor-pointer shadow-xs"
            title="ดูเทมเพลตแบบฟอร์มเอกสารใบวางบิลทางการ A4"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>ดูเทมเพลต A4</span>
          </button>

          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer shadow-xs"
            title="ส่งออกรายการใบวางบิลเป็น Excel/CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            id="btn-export-pdf"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer shadow-xs"
            title="พิมพ์หรือบันทึกเป็น PDF"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export PDF</span>
          </button>

          <button
            id="btn-print-billing"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer shadow-xs"
            title="พิมพ์หน้ารายการใบวางบิล"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>

          {onRefresh && (
            <button
              id="btn-refresh-billing"
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer shadow-xs disabled:opacity-50"
              title="ดึงข้อมูลล่าสุด"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'กำลังโหลด...' : 'Refresh'}</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'template' ? (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                เลือกใบวางบิลเพื่อดูเทมเพลต:
              </span>
              <select
                value={selectedTemplateBilling?.id || filteredList[0]?.id || ''}
                onChange={(e) => {
                  const found = enrichedNotes.find(b => b.id === e.target.value);
                  if (found) setSelectedTemplateBilling(found);
                }}
                className="bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer max-w-md"
              >
                {filteredList.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.billing_no} — {b.customer_name} (฿{b.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setViewMode('table')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer border border-slate-200 flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>สลับกลับไปตารางข้อมูล (Table View)</span>
            </button>
          </div>

          {filteredList.length > 0 ? (
            <BillingNoteTemplate
              billingNote={selectedTemplateBilling || filteredList[0]}
              isModal={false}
            />
          ) : (
            <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-2xl text-xs">
              ไม่พบรายการใบวางบิลสำหรับแสดงผล
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ============================================================ */}
          {/* SECTION 3: ADVANCED FILTER PANEL                             */}
          {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">ตัวกรองเอกสาร (Advanced Filters)</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[11px] text-slate-500 hover:text-slate-900 transition font-medium cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">เลขที่ใบวางบิล / คำค้น</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="เลข BN, ลูกค้า, Invoice..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">Customer (ลูกค้า)</label>
            <select
              value={filterCustomer}
              onChange={e => setFilterCustomer(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">ลูกค้าทั้งหมด</option>
              {customers.map(c => (
                <option key={c.id} value={c.customer_name}>{c.customer_name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">Status (สถานะ)</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">ทุกสถานะ</option>
              <option value="Draft">Draft (ฉบับร่าง)</option>
              <option value="Issued">Issued (วางบิลแล้ว)</option>
              <option value="Partially Paid">Partially Paid (ชำระบางส่วน)</option>
              <option value="Paid">Paid (ชำระครบแล้ว)</option>
              <option value="Overdue">Overdue (เกินกำหนด)</option>
              <option value="Cancelled">Cancelled (ยกเลิก)</option>
            </select>
          </div>

          {/* Salesperson */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">Salesperson / ผู้ส่งมอบ</label>
            <select
              value={filterSalesperson}
              onChange={e => setFilterSalesperson(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">พนักงานขายทุกคน</option>
              {salespersonsList.map((sp, idx) => (
                <option key={idx} value={sp}>{sp}</option>
              ))}
            </select>
          </div>

          {/* Billing Date Range */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">วันที่ใบวางบิล From – To</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-1/2 bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400 text-[10px]">-</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-1/2 bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Due Date Range */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">Due Date From – To</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={filterDueDateFrom}
                onChange={e => setFilterDueDateFrom(e.target.value)}
                className="w-1/2 bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400 text-[10px]">-</span>
              <input
                type="date"
                value={filterDueDateTo}
                onChange={e => setFilterDueDateTo(e.target.value)}
                className="w-1/2 bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Sales Order / Invoice */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">Sales Order / Invoice Ref</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="เลข SO"
                value={filterSalesOrder}
                onChange={e => setFilterSalesOrder(e.target.value)}
                className="w-1/2 bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="เลข INV"
                value={filterInvoice}
                onChange={e => setFilterInvoice(e.target.value)}
                className="w-1/2 bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method & Search Button */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">Payment Method & Action</label>
            <div className="flex items-center gap-2">
              <select
                value={filterPaymentMethod}
                onChange={e => setFilterPaymentMethod(e.target.value)}
                className="w-1/2 bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="All">ทุกวิธีชำระ</option>
                <option value="Transfer">Transfer (โอนเงิน)</option>
                <option value="Cheque">Cheque (เช็ค)</option>
                <option value="Cash">Cash (เงินสด)</option>
                <option value="Credit Card">Credit Card</option>
              </select>
              <button
                onClick={handleResetFilters}
                className="w-1/2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer text-center"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: BILLING NOTES TABLE                                */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900">
              รายการใบวางบิล ({filteredList.length} รายการ)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            แสดงผลตามการกรองปัจจุบัน
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredList.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 font-mono">Billing Note No.</th>
                <th className="py-3 px-3">Billing Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Reference Invoice</th>
                <th className="py-3 px-3">Reference SO</th>
                <th className="py-3 px-2 text-center">จำนวนรายการ</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-right">Paid Amount</th>
                <th className="py-3 px-3 text-right">Outstanding</th>
                <th className="py-3 px-3 text-center">Due Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Salesperson</th>
                <th className="py-3 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-10 text-slate-500 text-xs">
                    ไม่พบข้อมูลใบวางบิลตามเงื่อนไขที่กำหนด
                  </td>
                </tr>
              ) : (
                filteredList.map(bl => {
                  const isChecked = selectedIds.includes(bl.id);
                  const invoiceNumbers = bl.items?.map(it => it.invoice_no).join(', ') || '-';
                  const soNumbers = bl.sales_order_no || bl.items?.map(it => it.sales_order_no || it.ref_no).filter(Boolean).join(', ') || '-';

                  return (
                    <tr
                      key={bl.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isChecked ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(bl.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Billing Note No. */}
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-600">
                        <button
                          onClick={() => setViewingBilling(bl)}
                          className="hover:underline text-left cursor-pointer flex items-center gap-1 font-bold"
                        >
                          {bl.billing_no}
                        </button>
                      </td>

                      {/* Billing Date */}
                      <td className="py-3.5 px-3 text-slate-600 font-mono whitespace-nowrap">
                        {bl.date || bl.billing_date}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <div className="font-bold text-slate-900 truncate">{bl.customer_name}</div>
                        {bl.customer_tax_id && (
                          <div className="text-[10px] text-slate-400 font-mono">Tax: {bl.customer_tax_id}</div>
                        )}
                      </td>

                      {/* Reference Invoice */}
                      <td className="py-3.5 px-3 font-mono text-slate-600 max-w-[140px] truncate" title={invoiceNumbers}>
                        {invoiceNumbers}
                      </td>

                      {/* Reference SO */}
                      <td className="py-3.5 px-3 font-mono text-indigo-600 max-w-[120px] truncate" title={soNumbers}>
                        {soNumbers}
                      </td>

                      {/* Number of Items */}
                      <td className="py-3.5 px-2 text-center font-mono text-slate-500">
                        {bl.items?.length || 0}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ฿{bl.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-3 text-right font-mono text-blue-600 whitespace-nowrap font-medium">
                        ฿{(bl.paid_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Outstanding */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-600 whitespace-nowrap">
                        ฿{(bl.outstanding_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-3 text-center font-mono whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          bl.effectiveStatus === 'Overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'text-slate-600'
                        }`}>
                          {bl.dueDate}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          bl.effectiveStatus === 'Paid'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : bl.effectiveStatus === 'Partially Paid'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : bl.effectiveStatus === 'Issued' || bl.effectiveStatus === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : bl.effectiveStatus === 'Overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {bl.effectiveStatus}
                        </span>
                      </td>

                      {/* Salesperson */}
                      <td className="py-3.5 px-3 text-slate-600 truncate max-w-[120px]">
                        {bl.salesperson || bl.delivered_by || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Template */}
                          <button
                            onClick={() => setViewingBilling(bl)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10.5px] font-semibold transition cursor-pointer"
                            title="ดูแบบฟอร์มเทมเพลตใบวางบิลทางการ A4"
                          >
                            <FileText className="w-3 h-3 text-emerald-600" />
                            <span>เทมเพลต</span>
                          </button>

                          {/* Quick View Icon */}
                          <button
                            onClick={() => setViewingBilling(bl)}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="ดูเอกสารใบวางบิล"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          {canModify && (
                            <button
                              onClick={() => handleOpenEdit(bl)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="แก้ไขใบวางบิล"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Print / PDF */}
                          <button
                            onClick={() => {
                              setViewingBilling(bl);
                              setTimeout(() => window.print(), 300);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="พิมพ์ / ดาวน์โหลด PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Record Payment */}
                          {canModify && bl.effectiveStatus !== 'Paid' && (
                            <button
                              onClick={() => handleOpenPayment(bl)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="บันทึกการรับชำระเงิน"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {canDelete && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`คุณแน่ใจว่าต้องการลบใบวางบิล ${bl.billing_no}?`)) {
                                  await onDelete(bl.id);
                                  onToast(`ลบใบวางบิล ${bl.billing_no} เรียบร้อย`, 'success');
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="ลบเอกสาร"
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

        {/* Footer pagination info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            แสดง {filteredList.length} จากทั้งหมด {totalCount} รายการ
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold">1</span>
          </div>
        </div>
      </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: VIEW BILLING NOTE TEMPLATE                          */}
      {/* ============================================================ */}
      {viewingBilling && (
        <BillingNoteTemplate
          billingNote={viewingBilling}
          onClose={() => setViewingBilling(null)}
          isModal={true}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 2: CREATE / EDIT BILLING NOTE                          */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                {editingBilling ? `แก้ไขใบวางบิล: ${formBillingNo}` : 'สร้างใบวางบิลใหม่ (Create Billing Note)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">เลขที่ใบวางบิล (Billing Note No.)</label>
                  <input
                    type="text"
                    required
                    value={formBillingNo}
                    onChange={e => setFormBillingNo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-emerald-600 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">วันที่ใบวางบิล (Date)</label>
                  <input
                    type="date"
                    required
                    value={formBillingDate}
                    onChange={e => setFormBillingDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">กำหนดชำระ (Due Date)</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-amber-600 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Customer Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">เลกลูกค้าจากฐานข้อมูล</label>
                  <select
                    value={formCustomerId}
                    onChange={e => handleCustomerSelect(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- เลือกลูกค้า (Auto-fill) --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.customer_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">ชื่อลูกค้า (Company Name)</label>
                  <input
                    type="text"
                    required
                    value={formCustomerName}
                    onChange={e => setFormCustomerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Customer Address & Tax ID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">ที่อยู่ลูกค้า</label>
                  <input
                    type="text"
                    value={formCustomerAddress}
                    onChange={e => setFormCustomerAddress(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">เลขประจำตัวผู้เสียภาษี</label>
                  <input
                    type="text"
                    value={formCustomerTaxId}
                    onChange={e => setFormCustomerTaxId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Status & Personnel */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">สถานะ</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Draft">Draft (ฉบับร่าง)</option>
                    <option value="Issued">Issued (วางบิลแล้ว)</option>
                    <option value="Partially Paid">Partially Paid (ชำระบางส่วน)</option>
                    <option value="Paid">Paid (ชำระแล้ว)</option>
                    <option value="Overdue">Overdue (เกินกำหนด)</option>
                    <option value="Cancelled">Cancelled (ยกเลิก)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">พนักงานขาย (Salesperson)</label>
                  <input
                    type="text"
                    value={formSalesperson}
                    onChange={e => setFormSalesperson(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">ผู้นำส่งเอกสาร (Delivered By)</label>
                  <input
                    type="text"
                    value={formDeliveredBy}
                    onChange={e => setFormDeliveredBy(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">วิธีชำระเงินที่แนะนำ</label>
                  <select
                    value={formPaymentMethod}
                    onChange={e => setFormPaymentMethod(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Transfer">Transfer (โอนเงินผ่านธนาคาร)</option>
                    <option value="Cheque">Cheque (เช็คลงวันที่)</option>
                    <option value="Cash">Cash (เงินสด)</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">รายการใบแจ้งหนี้ / รายละเอียดที่เรียกเก็บ (Invoice Items)</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        formItems.length >= MAX_ITEMS 
                          ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}>
                        {formItems.length} / {MAX_ITEMS} รายการ
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      พนักงานคีย์รายละเอียดเอง ระบบคำนวณยอดรวม Total ให้อัตโนมัติ (รองรับสูงสุด 10 รายการ)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {formItems.length < MAX_ITEMS ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (formItems.length >= MAX_ITEMS) {
                              onToast('⚠️ แจ้งเตือน: ใบวางบิลรองรับรายการสินค้า/บริการได้สูงสุด 10 รายการเท่านั้น', 'err');
                              return;
                            }
                            setFormItems([
                              ...formItems,
                              {
                                no: formItems.length + 1,
                                ref_no: '',
                                invoice_no: `INV-2609${String(formItems.length + 1).padStart(3, '0')}`,
                                sales_order_no: '',
                                description: '',
                                date: formBillingDate,
                                amount: 0
                              }
                            ]);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          เพิ่มรายการ ({formItems.length}/{MAX_ITEMS})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const remaining = MAX_ITEMS - formItems.length;
                            const newRows = Array.from({ length: remaining }).map((_, i) => ({
                              no: formItems.length + i + 1,
                              ref_no: '',
                              invoice_no: `INV-2609${String(formItems.length + i + 1).padStart(3, '0')}`,
                              sales_order_no: '',
                              description: '',
                              date: formBillingDate,
                              amount: 0
                            }));
                            setFormItems([...formItems, ...newRows]);
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition cursor-pointer shadow-xs"
                          title="สร้างแถวให้ครบ 10 รายการเพื่อคีย์ข้อมูลได้ทันที"
                        >
                          เติมครบ 10 แถว
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onToast('⚠️ แจ้งเตือน: ใบวางบิลรองรับรายการได้สูงสุด 10 รายการเท่านั้น ไม่อนุญาตให้เพิ่มรายการเกินนี้', 'err');
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer transition"
                        title="คลิกเพื่อตรวจสอบข้อจำกัด 10 รายการ"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        จำกัดสูงสุด 10 รายการแล้ว
                      </button>
                    )}

                    {formItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const cleaned = formItems.filter((it, idx) => idx === 0 || it.amount > 0 || it.description?.trim() || it.invoice_no?.trim());
                          setFormItems(cleaned.length > 0 ? cleaned : [formItems[0]]);
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] transition cursor-pointer shadow-xs"
                        title="ลบแถวที่ยังไม่ได้กรอกข้อมูล"
                      >
                        ล้างแถวว่าง
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {formItems.map((it, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-2 shadow-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ลำดับที่ #{idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-500">รายการสินค้า/บริการ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))}
                              className="px-2 py-0.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer flex items-center gap-1"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบ</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 1: Description */}
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Item / Description: รายการสินค้า หรือ รายละเอียดบริการ (เช่น ค่าบริการติดตั้งหม้อแปลงไฟฟ้า หรือ งานสอบเทียบเครื่องมือ)..."
                          value={it.description || ''}
                          onChange={e => {
                            const newArr = [...formItems];
                            newArr[idx].description = e.target.value;
                            setFormItems(newArr);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Row 2: Quantity, Unit, Unit Price, Amount, Invoice Ref */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2">
                          <label className="text-[9px] text-slate-600 font-semibold block mb-0.5">Quantity (จำนวน)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="1"
                            value={it.quantity !== undefined ? it.quantity : (it.amount && it.unit_price ? Math.round((it.amount / it.unit_price) * 100) / 100 : 1)}
                            onChange={e => {
                              const newArr = [...formItems];
                              const qty = e.target.value === '' ? 0 : Number(e.target.value);
                              newArr[idx].quantity = qty;
                              const uPrice = Number(newArr[idx].unit_price) || 0;
                              if (uPrice > 0) {
                                newArr[idx].amount = Math.round(qty * uPrice * 100) / 100;
                              }
                              setFormItems(newArr);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono text-center focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[9px] text-slate-600 font-semibold block mb-0.5">Unit (หน่วย)</label>
                          <input
                            type="text"
                            placeholder="งาน/ชุด/ชิ้น"
                            value={it.unit || 'งาน'}
                            onChange={e => {
                              const newArr = [...formItems];
                              newArr[idx].unit = e.target.value;
                              setFormItems(newArr);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 text-center focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[9px] text-slate-600 font-semibold block mb-0.5">Unit Price (ราคา/หน่วย)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={it.unit_price !== undefined ? it.unit_price : ''}
                            onChange={e => {
                              const newArr = [...formItems];
                              const uPrice = e.target.value === '' ? 0 : Number(e.target.value);
                              newArr[idx].unit_price = uPrice;
                              const qty = newArr[idx].quantity !== undefined ? Number(newArr[idx].quantity) : 1;
                              newArr[idx].amount = Math.round(qty * uPrice * 100) / 100;
                              setFormItems(newArr);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-amber-700 font-mono text-right focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-3">
                          <label className="text-[9px] text-slate-600 font-semibold block mb-0.5">Amount (จำนวนเงิน)</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1 text-xs text-slate-400 font-mono">฿</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={it.amount === 0 ? '' : it.amount}
                              onChange={e => {
                                const newArr = [...formItems];
                                const amt = e.target.value === '' ? 0 : Number(e.target.value);
                                newArr[idx].amount = amt;
                                const qty = Number(newArr[idx].quantity) || 1;
                                if (qty > 0) {
                                  newArr[idx].unit_price = Math.round((amt / qty) * 100) / 100;
                                }
                                setFormItems(newArr);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2.5 py-1 text-xs text-emerald-700 font-mono font-bold text-right focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="col-span-3">
                          <label className="text-[9px] text-slate-600 font-semibold block mb-0.5">Invoice / Ref No.</label>
                          <input
                            type="text"
                            placeholder="INV-xxxx / Ref SO"
                            value={it.invoice_no || it.ref_no || ''}
                            onChange={e => {
                              const newArr = [...formItems];
                              newArr[idx].invoice_no = e.target.value;
                              newArr[idx].ref_no = e.target.value;
                              setFormItems(newArr);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation Summary Footer */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={formIncludeVat}
                          onChange={e => setFormIncludeVat(e.target.checked)}
                          className="rounded border-slate-300 bg-white text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                        <span>รวมภาษีมูลค่าเพิ่ม 7% (VAT 7%)</span>
                      </label>
                      {formIncludeVat && (
                        <span className="font-mono text-emerald-700 font-semibold">
                          (+฿{formVat.toLocaleString('th-TH', { minimumFractionDigits: 2 })})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[11px] text-slate-500 block">ยอดรวมก่อนภาษี (Subtotal)</span>
                        <span className="font-mono font-bold text-slate-800">
                          ฿{formSubtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="pl-4 border-l border-slate-200">
                        <span className="text-[11px] text-emerald-700 font-bold block">ยอดสุทธิรวมทั้งสิ้น (Total Calculated)</span>
                        <span className="text-base font-mono font-black text-emerald-700">
                          ฿{formCalculatedTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thai Baht Words Banner */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-medium">จำนวนเงินตัวอักษร (Thai Baht):</span>
                    <span className="font-semibold text-emerald-900 font-sans">{formThaiBahtText}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] text-slate-600 font-semibold mb-1 block">หมายเหตุ / คำชี้แจงในการวางบิล</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="เช่น กำหนดเวลาชำระเงินตามเงื่อนไขเครดิต หรือหลักฐานแนบส่งมอบงาน..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  {editingBilling ? 'บันทึกการแก้ไข' : 'ยืนยันสร้างใบวางบิล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: RECORD PAYMENT (รับชำระเงิน)                          */}
      {/* ============================================================ */}
      {paymentModalBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                บันทึกการรับชำระเงิน (Record Payment)
              </h3>
              <button
                onClick={() => setPaymentModalBilling(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">เลขที่ใบวางบิล:</span>
                  <span className="font-mono font-bold text-emerald-700">{paymentModalBilling.billing_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ลูกค้า:</span>
                  <span className="font-bold text-slate-900">{paymentModalBilling.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ยอดวางบิลรวม:</span>
                  <span className="font-mono text-slate-900 font-semibold">฿{paymentModalBilling.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                  <span className="text-slate-500">ยอดค้างชำระปัจจุบัน:</span>
                  <span className="font-mono font-bold text-amber-700">฿{(paymentModalBilling.outstanding_amount || paymentModalBilling.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 font-semibold mb-1 block">ยอดที่รับชำระ (บาท)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">วิธีชำระเงิน</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Transfer">Transfer (โอนเงิน)</option>
                    <option value="Cheque">Cheque (เช็ค)</option>
                    <option value="Cash">Cash (เงินสด)</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">วันที่รับเงิน</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 font-semibold mb-1 block">เลขอ้างอิงสลิป / เช็ค (Ref No.)</label>
                <input
                  type="text"
                  placeholder="เช่น TRX-123456 หรือ เช็คเลขที่ 004921"
                  value={paymentRefNo}
                  onChange={e => setPaymentRefNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 font-semibold mb-1 block">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  placeholder="ระบุข้อความถ้ามี"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalBilling(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
                >
                  บันทึกรับเงิน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
