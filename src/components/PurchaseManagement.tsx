import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseRequest, PurchaseOrder, Supplier, Customer, UserRole } from '../types';
import { MetricCard } from './common/MetricCard';
import { numberToEnglishWords, numberToThaiBaht, numberToEnglishBaht } from '../utils/numberWords';
import { MasterDocumentPreviewModal } from './MasterDocumentPreviewModal';
import { DEFAULT_MASTER_TEMPLATES } from '../data/masterTemplatesData';
import { MasterPurchaseOrderDocument } from './purchase-order/MasterPurchaseOrderDocument';
import { PurchaseOrderGenerateModal } from './purchase-order/PurchaseOrderGenerateModal';
import { preparePurchaseOrderTemplateData, generatePurchaseOrderMasterPDF } from '../utils/purchaseOrderPdfEngine';
import { MasterPurchaseRequestDocument } from './purchase-request/MasterPurchaseRequestDocument';
import { PurchaseRequestGenerateModal } from './purchase-request/PurchaseRequestGenerateModal';
import { preparePurchaseRequestTemplateData, generatePurchaseRequestMasterPDF } from '../utils/purchaseRequestPdfEngine';
import {
  FileCheck2,
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  Printer,
  Check,
  X,
  ShieldAlert,
  Lock,
  ArrowRight,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  RefreshCw,
  Download,
  TrendingUp,
  XCircle,
  PackageCheck,
  DollarSign,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  AlertTriangle,
  Copy,
  Link2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface PurchaseManagementProps {
  purchaseRequests?: PurchaseRequest[];
  purchaseOrders?: PurchaseOrder[];
  suppliers?: Supplier[];
  customers?: Customer[];
  onAddPR: (payload: Omit<PurchaseRequest, 'id' | 'created_at'>) => Promise<any>;
  onUpdatePR: (id: string, updates: Partial<PurchaseRequest>) => Promise<any>;
  onDeletePR: (id: string) => Promise<any>;
  onApprovePRtoPO: (prId: string) => Promise<any>;
  onAddPO: (payload: Omit<PurchaseOrder, 'id' | 'created_at'>) => Promise<any>;
  onUpdatePO: (id: string, updates: Partial<PurchaseOrder>) => Promise<any>;
  onDeletePO: (id: string) => Promise<any>;
  onToast: (msg: string, type: 'success' | 'err') => void;
  currentRole: UserRole;
  currentUserId: string;
  currentUserFullname: string;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export default function PurchaseManagement({
  purchaseRequests = [],
  purchaseOrders = [],
  suppliers = [],
  customers = [],
  onAddPR,
  onUpdatePR,
  onDeletePR,
  onApprovePRtoPO,
  onAddPO,
  onUpdatePO,
  onDeletePO,
  onToast,
  currentRole,
  currentUserFullname,
  onRefresh,
  isLoading
}: PurchaseManagementProps) {
  // Navigation Tabs (Workflow stages)
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'PR_LIST' | 'PO_LIST' | 'PENDING_APPROVAL' | 'PENDING_RECEIPT' | 'COMPLETED'
  >('ALL');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocType, setFilterDocType] = useState<'All' | 'PR' | 'PO'>('All');
  const [filterSupplier, setFilterSupplier] = useState('All');
  const [filterRequester, setFilterRequester] = useState('All');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Selected Checkboxes
  const [selectedPRIds, setSelectedPRIds] = useState<string[]>([]);
  const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);

  // Modals & View States
  const [isPRFormOpen, setIsPRFormOpen] = useState(false);
  const [editingPR, setEditingPR] = useState<PurchaseRequest | null>(null);
  const [viewingPR, setViewingPR] = useState<PurchaseRequest | null>(null);
  const [generatingPR, setGeneratingPR] = useState<PurchaseRequest | null>(null);

  const [isPOFormOpen, setIsPOFormOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [generatingPO, setGeneratingPO] = useState<PurchaseOrder | null>(null);

  // Master Template Exact Preview Modals
  const [masterPreviewPR, setMasterPreviewPR] = useState<PurchaseRequest | null>(null);
  const [masterPreviewPO, setMasterPreviewPO] = useState<PurchaseOrder | null>(null);

  // PR Form fields
  const [prNo, setPrNo] = useState('');
  const [prDate, setPrDate] = useState(new Date().toISOString().split('T')[0]);
  const [prDueDate, setPrDueDate] = useState('Credit 30');
  const [prSupplierId, setPrSupplierId] = useState('');
  const [prSupplierName, setPrSupplierName] = useState('');
  const [prSupplierAddress, setPrSupplierAddress] = useState('');
  const [prSupplierTaxId, setPrSupplierTaxId] = useState('');
  const [prSupplierPhone, setPrSupplierPhone] = useState('');
  const [prSupplierAttn, setPrSupplierAttn] = useState('');
  const [prSalesName, setPrSalesName] = useState('Praiya');
  const [prRefCustomer, setPrRefCustomer] = useState('Promt Solution');
  const [prRemarks, setPrRemarks] = useState('');
  const [prDeliveryNote, setPrDeliveryNote] = useState('* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด');
  const [prItems, setPrItems] = useState([
    {
      item_no: 1,
      description: 'Sky Lotech High Lift\nBrand : Skyy Lotech\nModel : M-380X-200',
      quantity: 1,
      unit_price: 38200,
      amount: 38200
    }
  ]);

  // PO Direct Create Form Fields
  const [poNo, setPoNo] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [poDueDate, setPoDueDate] = useState('Credit 30');
  const [poRefPR, setPoRefPR] = useState('');
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poSupplierName, setPoSupplierName] = useState('');
  const [poSupplierAddress, setPoSupplierAddress] = useState('');
  const [poSupplierTaxId, setPoSupplierTaxId] = useState('');
  const [poSupplierPhone, setPoSupplierPhone] = useState('');
  const [poSupplierAttn, setPoSupplierAttn] = useState('');
  const [poRefCustomer, setPoRefCustomer] = useState('Promt Solution');
  const [poPaymentTerm, setPoPaymentTerm] = useState('Credit 30');
  const [poRemarks, setPoRemarks] = useState('');
  const [poDeliveryNote, setPoDeliveryNote] = useState('* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด');
  const [poItems, setPoItems] = useState([
    {
      item_no: 1,
      description: 'Industrial Safety Valves & Pressure Gauges',
      quantity: 2,
      unit_price: 15000,
      amount: 30000
    }
  ]);

  // Inline Note/Remarks Editing states for PR and PO views
  const [isEditingPRNotes, setIsEditingPRNotes] = useState(false);
  const [tempPRRemarks, setTempPRRemarks] = useState('');
  const [tempPRDeliveryNote, setTempPRDeliveryNote] = useState('');

  const [isEditingPONotes, setIsEditingPONotes] = useState(false);
  const [tempPORemarks, setTempPORemarks] = useState('');
  const [tempPODeliveryNote, setTempPODeliveryNote] = useState('');

  useEffect(() => {
    if (viewingPR) {
      setTempPRRemarks(viewingPR.remarks || '');
      setTempPRDeliveryNote(viewingPR.delivery_note || '* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด');
      setIsEditingPRNotes(false);
    }
  }, [viewingPR]);

  useEffect(() => {
    if (viewingPO) {
      setTempPORemarks(viewingPO.remarks || '');
      setTempPODeliveryNote(viewingPO.delivery_note || '* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด');
      setIsEditingPONotes(false);
    }
  }, [viewingPO]);

  const isAdmin = currentRole === 'Admin' || currentRole === 'System Administrator' || (currentRole as string) === 'Administrator';
  const isManagement = currentRole === 'Management';
  const canCreate = !isManagement;

  // Supplier selection in PR Form
  const handleSupplierSelectInPR = (supId: string) => {
    setPrSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      setPrSupplierName(sup.supplier_name);
      setPrSupplierAddress(sup.address || '');
      setPrSupplierTaxId(sup.tax_id || '');
      setPrSupplierPhone(sup.phone || '');
      setPrSupplierAttn(sup.contact_person || '');
      setPrDueDate(sup.payment_term || 'Credit 30');
    }
  };

  // Supplier selection in PO Form
  const handleSupplierSelectInPO = (supId: string) => {
    setPoSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      setPoSupplierName(sup.supplier_name);
      setPoSupplierAddress(sup.address || '');
      setPoSupplierTaxId(sup.tax_id || '');
      setPoSupplierPhone(sup.phone || '');
      setPoSupplierAttn(sup.contact_person || '');
      setPoPaymentTerm(sup.payment_term || 'Credit 30');
    }
  };

  // Calculations for PR
  const calculatedPRSubtotal = useMemo(() => {
    return prItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  }, [prItems]);
  const calculatedPRVat = useMemo(() => Math.round(calculatedPRSubtotal * 0.07), [calculatedPRSubtotal]);
  const calculatedPRTotal = calculatedPRSubtotal + calculatedPRVat;

  // Calculations for PO
  const calculatedPOSubtotal = useMemo(() => {
    return poItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  }, [poItems]);
  const calculatedPOVat = useMemo(() => Math.round(calculatedPOSubtotal * 0.07), [calculatedPOSubtotal]);
  const calculatedPOTotal = calculatedPOSubtotal + calculatedPOVat;

  // KPIs (7 Cards requested)
  const prTotalCount = (purchaseRequests || []).length;
  const prPendingCount = (purchaseRequests || []).filter(pr => pr.status === 'Pending Approval').length;
  const prApprovedCount = (purchaseRequests || []).filter(pr => pr.status === 'Approved' || pr.status === 'Converted to PO').length;
  const prRejectedCount = (purchaseRequests || []).filter(pr => pr.status === 'Rejected').length;

  const poTotalCount = (purchaseOrders || []).length;
  const poPendingReceiptCount = (purchaseOrders || []).filter(po => po.status === 'PO Issued' || po.status === 'Partially Received' || po.status === 'Approved' || po.status === 'Pending').length;
  const poTotalAmount = (purchaseOrders || []).reduce((acc, po) => acc + (Number(po.total_amount) || 0), 0);

  // Requester unique list
  const requestersList = useMemo(() => {
    const set = new Set<string>();
    (purchaseRequests || []).forEach(pr => {
      if (pr.requested_by) set.add(pr.requested_by);
      if (pr.sales_name) set.add(pr.sales_name);
    });
    return Array.from(set);
  }, [purchaseRequests]);

  // Unified combined document list for filtering and tab views
  const combinedDocuments = useMemo(() => {
    const list: Array<{
      type: 'PR' | 'PO';
      id: string;
      docNo: string;
      refNo: string;
      date: string;
      supplierName: string;
      supplierAttn: string;
      requester: string;
      refCustomer: string;
      totalAmount: number;
      status: string;
      raw: PurchaseRequest | PurchaseOrder;
    }> = [];

    (purchaseRequests || []).forEach(pr => {
      list.push({
        type: 'PR',
        id: pr.id,
        docNo: pr.pr_no || 'PR-Draft',
        refNo: pr.converted_po_no || '-',
        date: pr.date || pr.pr_date || pr.required_date || (pr.created_at ? pr.created_at.split('T')[0] : '') || '-',
        supplierName: pr.supplier_name || 'Unspecified Supplier',
        supplierAttn: pr.supplier_attn || '-',
        requester: pr.requested_by || pr.sales_name || 'Staff',
        refCustomer: pr.ref_customer || '-',
        totalAmount: Number(pr.total_amount || pr.amount || 0),
        status: pr.status || 'Pending Approval',
        raw: pr
      });
    });

    (purchaseOrders || []).forEach(po => {
      list.push({
        type: 'PO',
        id: po.id,
        docNo: po.po_no || 'PO-Draft',
        refNo: po.pr_no || '-',
        date: po.date || po.po_date || po.order_date || (po.created_at ? po.created_at.split('T')[0] : '') || '-',
        supplierName: po.supplier_name || 'Unspecified Supplier',
        supplierAttn: po.supplier_attn || '-',
        requester: po.approved_by || po.prepared_by || 'Purchasing Admin',
        refCustomer: po.ref_customer || '-',
        totalAmount: Number(po.total_amount || po.amount || 0),
        status: po.status || 'PO Issued',
        raw: po
      });
    });

    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [purchaseRequests, purchaseOrders]);

  // Filtered List based on Active Tab and Filter Panel
  const filteredList = useMemo(() => {
    return combinedDocuments.filter(doc => {
      // 1. Tab check
      if (activeTab === 'PR_LIST' && doc.type !== 'PR') return false;
      if (activeTab === 'PO_LIST' && doc.type !== 'PO') return false;
      if (activeTab === 'PENDING_APPROVAL' && (doc.type !== 'PR' || doc.status !== 'Pending Approval')) return false;
      if (activeTab === 'PENDING_RECEIPT' && (doc.type !== 'PO' || (doc.status === 'Completed' || doc.status === 'Cancelled'))) return false;
      if (activeTab === 'COMPLETED' && doc.status !== 'Completed' && doc.status !== 'Converted to PO') return false;

      // 2. Doc Type filter
      if (filterDocType !== 'All' && doc.type !== filterDocType) return false;

      // 3. Search Term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchSearch =
          (doc.docNo || '').toLowerCase().includes(term) ||
          (doc.supplierName || '').toLowerCase().includes(term) ||
          (doc.refNo || '').toLowerCase().includes(term) ||
          (doc.requester || '').toLowerCase().includes(term) ||
          (doc.refCustomer || '').toLowerCase().includes(term);
        if (!matchSearch) return false;
      }

      // 4. Supplier
      if (filterSupplier !== 'All' && doc.supplierName !== filterSupplier) return false;

      // 5. Requester
      if (filterRequester !== 'All' && doc.requester !== filterRequester) return false;

      // 6. Status
      if (filterStatus !== 'All' && doc.status !== filterStatus) return false;

      // 7. Dates
      if (filterDateFrom && doc.date < filterDateFrom) return false;
      if (filterDateTo && doc.date > filterDateTo) return false;

      // 8. Project / Customer
      if (filterProject && !(doc.refCustomer || '').toLowerCase().includes(filterProject.toLowerCase())) return false;

      return true;
    });
  }, [
    combinedDocuments,
    activeTab,
    filterDocType,
    searchTerm,
    filterSupplier,
    filterRequester,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterProject
  ]);

  // Open PR Add
  const handleOpenAddPR = () => {
    setEditingPR(null);
    const nextSeq = purchaseRequests.length + 1;
    setPrNo(`PR-2609${String(nextSeq).padStart(3, '0')}`);
    setPrDate(new Date().toISOString().split('T')[0]);
    setPrDueDate('Credit 30');
    if (suppliers.length > 0) {
      handleSupplierSelectInPR(suppliers[0].id);
    } else {
      setPrSupplierId('');
      setPrSupplierName('Thai Pipe & Fittings Co., Ltd.');
      setPrSupplierAddress('88/12 Moo 3, Bangna-Trad, Samut Prakan');
      setPrSupplierTaxId('0105531001234');
      setPrSupplierPhone('02-316-4455');
      setPrSupplierAttn('คุณสมชาย วิทยาพงษ์');
    }
    setPrSalesName(currentUserFullname || 'Praiya');
    setPrRefCustomer('Promt Solution');
    setPrRemarks('');
    setPrDeliveryNote('* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด');
    setPrItems([
      {
        item_no: 1,
        description: 'Sky Lotech High Lift M-380X-200',
        quantity: 1,
        unit_price: 38200,
        amount: 38200
      }
    ]);
    setIsPRFormOpen(true);
  };

  // Open PR Edit
  const handleOpenEditPR = (pr: PurchaseRequest) => {
    setEditingPR(pr);
    setPrNo(pr.pr_no);
    setPrDate(pr.date);
    setPrDueDate(pr.due_date);
    setPrSupplierId(pr.supplier_id);
    setPrSupplierName(pr.supplier_name);
    setPrSupplierAddress(pr.supplier_address || '');
    setPrSupplierTaxId(pr.supplier_tax_id || '');
    setPrSupplierPhone(pr.supplier_phone || '');
    setPrSupplierAttn(pr.supplier_attn || '');
    setPrSalesName(pr.sales_name);
    setPrRefCustomer(pr.ref_customer);
    setPrRemarks(pr.remarks || '');
    setPrDeliveryNote(pr.delivery_note || '* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด');
    setPrItems(
      (pr.items || []).map(it => ({
        item_no: it.item_no || 1,
        description: it.description || '',
        quantity: Number(it.quantity ?? it.qty ?? 1),
        unit_price: Number(it.unit_price || 0),
        amount: Number(it.amount || 0)
      }))
    );
    setIsPRFormOpen(true);
  };

  // Save PR
  const handleSavePR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prSupplierName.trim()) {
      onToast('กรุณาระบุข้อมูล Supplier', 'err');
      return;
    }
    if (prItems.length === 0) {
      onToast('กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ', 'err');
      return;
    }

    try {
      if (editingPR) {
        await onUpdatePR(editingPR.id, {
          pr_no: prNo,
          date: prDate,
          due_date: prDueDate,
          supplier_id: prSupplierId,
          supplier_name: prSupplierName,
          supplier_address: prSupplierAddress,
          supplier_tax_id: prSupplierTaxId,
          supplier_phone: prSupplierPhone,
          supplier_attn: prSupplierAttn,
          sales_name: prSalesName,
          ref_customer: prRefCustomer,
          remarks: prRemarks,
          delivery_note: prDeliveryNote,
          items: prItems,
          amount: calculatedPRSubtotal,
          vat_amount: calculatedPRVat,
          total_amount: calculatedPRTotal
        });
        onToast(`อัปเดตข้อมูลใบขอซื้อ PR ${prNo} สำเร็จ`, 'success');
      } else {
        await onAddPR({
          pr_no: prNo,
          date: prDate,
          due_date: prDueDate,
          supplier_id: prSupplierId,
          supplier_name: prSupplierName,
          supplier_address: prSupplierAddress,
          supplier_tax_id: prSupplierTaxId,
          supplier_phone: prSupplierPhone,
          supplier_attn: prSupplierAttn,
          sales_name: prSalesName,
          ref_customer: prRefCustomer,
          remarks: prRemarks,
          delivery_note: prDeliveryNote,
          items: prItems,
          amount: calculatedPRSubtotal,
          vat_amount: calculatedPRVat,
          total_amount: calculatedPRTotal,
          status: 'Pending Approval',
          requested_by: currentUserFullname || 'Praiya'
        });
        onToast(`สร้างใบขอซื้อ PR ${prNo} เรียบร้อย (รอ Admin อนุมัติ)`, 'success');
      }
      setIsPRFormOpen(false);
    } catch (err: any) {
      onToast(err?.message || 'เกิดข้อผิดพลาดในการบันทึก PR', 'err');
    }
  };

  // Open Direct PO Create
  const handleOpenAddPO = () => {
    setEditingPO(null);
    const nextSeq = purchaseOrders.length + 1;
    setPoNo(`PO-2609${String(nextSeq).padStart(3, '0')}`);
    setPoDate(new Date().toISOString().split('T')[0]);
    setPoDueDate('Credit 30');
    setPoRefPR('');
    if (suppliers.length > 0) {
      handleSupplierSelectInPO(suppliers[0].id);
    } else {
      setPoSupplierId('');
      setPoSupplierName('Eastern Technical Safety Equipment Ltd.');
      setPoSupplierAddress('140 Sukhumvit Rd., Map Ta Phut, Rayong');
      setPoSupplierTaxId('0215549005678');
      setPoSupplierPhone('038-683-112');
      setPoSupplierAttn('คุณกนกวรรณ จิตต์ดี');
    }
    setPoRefCustomer('Promt Solution');
    setPoPaymentTerm('Credit 30');
    setPoRemarks('สั่งซื้อโดยตรงตามอนุมัติฝ่ายจัดซื้อ');
    setPoDeliveryNote('* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด');
    setPoItems([
      {
        item_no: 1,
        description: 'Safety Valves and Pipeline Instruments',
        quantity: 2,
        unit_price: 15000,
        amount: 30000
      }
    ]);
    setIsPOFormOpen(true);
  };

  // Save PO
  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierName.trim()) {
      onToast('กรุณาระบุข้อมูลคู่ค้าในใบสั่งซื้อ PO', 'err');
      return;
    }

    try {
      if (editingPO) {
        await onUpdatePO(editingPO.id, {
          po_no: poNo,
          date: poDate,
          supplier_id: poSupplierId,
          supplier_name: poSupplierName,
          supplier_address: poSupplierAddress,
          supplier_tax_id: poSupplierTaxId,
          supplier_phone: poSupplierPhone,
          supplier_attn: poSupplierAttn,
          ref_customer: poRefCustomer,
          items: poItems,
          amount: calculatedPOSubtotal,
          vat_amount: calculatedPOVat,
          total_amount: calculatedPOTotal,
          remarks: poRemarks,
          delivery_note: poDeliveryNote
        });
        onToast(`แก้ไขใบสั่งซื้อ PO ${poNo} เรียบร้อย`, 'success');
      } else {
        await onAddPO({
          po_no: poNo,
          pr_no: poRefPR || undefined,
          date: poDate,
          supplier_id: poSupplierId,
          supplier_name: poSupplierName,
          supplier_address: poSupplierAddress,
          supplier_tax_id: poSupplierTaxId,
          supplier_phone: poSupplierPhone,
          supplier_attn: poSupplierAttn,
          ref_customer: poRefCustomer,
          items: poItems,
          amount: calculatedPOSubtotal,
          vat_amount: calculatedPOVat,
          total_amount: calculatedPOTotal,
          status: 'PO Issued',
          sales_name: currentUserFullname || 'Purchasing Admin',
          prepared_by: currentUserFullname || 'Purchasing Admin',
          due_date: poDueDate || 'Credit 30',
          approved_by: currentUserFullname || 'Admin',
          remarks: poRemarks,
          delivery_note: poDeliveryNote
        });

        // Link and update the referenced PR if selected
        if (poRefPR) {
          const matchedPR = purchaseRequests.find(p => p.pr_no === poRefPR);
          if (matchedPR) {
            await onUpdatePR(matchedPR.id, {
              status: 'Converted to PO',
              po_no: poNo,
              remarks: `${matchedPR.remarks || ''}\n[แปลงเป็น PO ${poNo} วันที่ ${poDate}]`.trim()
            });
          }
        }

        onToast(`สร้างใบสั่งซื้อ PO ${poNo} สำเร็จ`, 'success');
      }
      setIsPOFormOpen(false);
    } catch (err: any) {
      onToast(err?.message || 'บันทึกใบสั่งซื้อ PO ไม่สำเร็จ', 'err');
    }
  };

  // Convert PR to PO (Workflow mirroring Quotation -> Sales Order)
  const handleConvertPRtoPO = async (pr: PurchaseRequest) => {
    // 1. Status Validation: Mirroring Quotation -> Sales Order where quotation must be Approved first
    if (pr.status !== 'Approved' && pr.status !== 'Converted to PO') {
      // If PR is not approved, validate Admin role
      if (!isAdmin) {
        onToast(
          `⚠️ ไม่สามารถแปลงเป็น PO ได้: ใบขอซื้อ ${pr.pr_no} อยู่ในสถานะ "${pr.status}" ยังไม่ได้รับการอนุมัติ (ต้องได้รับการอนุมัติโดยผู้ดูแลระบบ Admin ก่อน ตามกระบวนการเดียวกับ QT -> Sale Order)`,
          'err'
        );
        return;
      }

      // If user IS Admin, confirm approval first before conversion
      const confirmApprove = window.confirm(
        `ใบขอซื้อ ${pr.pr_no} อยู่ในสถานะ "${pr.status}"\n\nในฐานะผู้ดูแลระบบ (Admin) คุณต้องการอนุมัติ PR นี้และดำเนินการแปลงเป็นใบสั่งซื้อ (PO) เลยหรือไม่?`
      );
      if (!confirmApprove) return;

      try {
        await onUpdatePR(pr.id, {
          status: 'Approved',
          approved_by: currentUserFullname || 'Admin',
          approved_at: new Date().toISOString()
        });
        pr.status = 'Approved';
        pr.approved_by = currentUserFullname || 'Admin';
        pr.approved_at = new Date().toISOString();
        onToast(`อนุมัติใบขอซื้อ ${pr.pr_no} เรียบร้อยแล้ว กำลังเปิดแบบฟอร์มออกใบสั่งซื้อ PO`, 'success');
      } catch (err: any) {
        onToast(err?.message || 'เกิดข้อผิดพลาดในการอนุมัติ PR', 'err');
        return;
      }
    }

    // 2. Pre-fill PO creation form mirroring Sales Order creation
    setEditingPO(null);
    const nextSeq = purchaseOrders.length + 1;
    setPoNo(`PO-2609${String(nextSeq).padStart(3, '0')}`);
    setPoDate(new Date().toISOString().split('T')[0]);
    setPoDueDate(pr.due_date || 'Credit 30');
    setPoRefPR(pr.pr_no);
    setPoSupplierId(pr.supplier_id || '');
    setPoSupplierName(pr.supplier_name);
    setPoSupplierAddress(pr.supplier_address || '');
    setPoSupplierTaxId(pr.supplier_tax_id || '');
    setPoSupplierPhone(pr.supplier_phone || '');
    setPoSupplierAttn(pr.supplier_attn || '');
    setPoRefCustomer(pr.ref_customer || '');
    setPoPaymentTerm(pr.due_date || 'Credit 30');
    setPoRemarks(
      pr.remarks
        ? `อ้างอิงใบขอซื้อ ${pr.pr_no} (อนุมัติโดย ${pr.approved_by || 'Admin'}): ${pr.remarks}`
        : `อ้างอิงใบขอซื้อ ${pr.pr_no} (ผ่านการอนุมัติโดย ${pr.approved_by || 'Admin'})`
    );
    setPoDeliveryNote(pr.delivery_note || '* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด');
    setPoItems(
      (pr.items || []).map((it, idx) => ({
        item_no: it.item_no || idx + 1,
        description: it.description || '',
        quantity: Number(it.quantity ?? it.qty ?? 1),
        unit_price: Number(it.unit_price || 0),
        amount: Number(it.amount || 0)
      }))
    );
    setIsPOFormOpen(true);
    onToast(`ดึงข้อมูลจาก PR ${pr.pr_no} ที่อนุมัติแล้ว เข้าสู่ฟอร์มออกใบสั่งซื้อ PO สำเร็จ (กระบวนการเดียวกับ QT -> SO)`, 'success');
  };

  // Auto-fill PO form when selecting a PR from the dropdown inside PO modal
  const handlePRSelectInPO = (selectedPrNo: string) => {
    setPoRefPR(selectedPrNo);
    if (!selectedPrNo) return;
    const pr = purchaseRequests.find(p => p.pr_no === selectedPrNo);
    if (pr) {
      // Status validation for Admin-only approval
      if (pr.status !== 'Approved' && pr.status !== 'Converted to PO') {
        if (!isAdmin) {
          onToast(
            `⚠️ สิทธิ์ไม่เพียงพอ: ใบขอซื้อ ${pr.pr_no} อยู่ในสถานะ "${pr.status}" ยังไม่ได้รับการอนุมัติโดย Admin (ต้องได้รับการอนุมัติก่อนจึงจะดึงข้อมูลมาออก PO ได้)`,
            'err'
          );
          setPoRefPR('');
          return;
        } else {
          onToast(`เลือก PR ${pr.pr_no} (สถานะ: ${pr.status}) — ผ่านการยืนยันสิทธิ์โดย Admin`, 'success');
        }
      }

      if (pr.supplier_id) setPoSupplierId(pr.supplier_id);
      if (pr.supplier_name) setPoSupplierName(pr.supplier_name);
      if (pr.supplier_address) setPoSupplierAddress(pr.supplier_address);
      if (pr.supplier_tax_id) setPoSupplierTaxId(pr.supplier_tax_id);
      if (pr.supplier_phone) setPoSupplierPhone(pr.supplier_phone);
      if (pr.supplier_attn) setPoSupplierAttn(pr.supplier_attn);
      if (pr.ref_customer) setPoRefCustomer(pr.ref_customer);
      if (pr.due_date) {
        setPoDueDate(pr.due_date);
        setPoPaymentTerm(pr.due_date);
      }
      if (pr.delivery_note) setPoDeliveryNote(pr.delivery_note);
      if (pr.items && pr.items.length > 0) {
        setPoItems(
          pr.items.map((it, idx) => ({
            item_no: it.item_no || idx + 1,
            description: it.description || '',
            quantity: Number(it.quantity ?? it.qty ?? 1),
            unit_price: Number(it.unit_price || 0),
            amount: Number(it.amount || 0)
          }))
        );
      }
      onToast(`เชื่อมโยงรายการสินค้าและคู่ค้าจาก ${pr.pr_no} สำเร็จ`, 'success');
    }
  };

  // Duplicate PR (mirroring Quotation Duplicate)
  const handleDuplicatePR = async (pr: PurchaseRequest) => {
    if (!window.confirm(`คุณมั่นใจหรือไม่ที่จะทำสำเนาใบขอซื้อ ${pr.pr_no} เป็นฉบับใหม่?`)) return;
    const nextSeq = purchaseRequests.length + 1;
    const newPrNo = `PR-2609${String(nextSeq).padStart(3, '0')}`;
    try {
      await onAddPR({
        pr_no: newPrNo,
        date: new Date().toISOString().split('T')[0],
        due_date: pr.due_date || 'Credit 30',
        supplier_id: pr.supplier_id || '',
        supplier_name: pr.supplier_name,
        supplier_address: pr.supplier_address,
        supplier_tax_id: pr.supplier_tax_id,
        supplier_phone: pr.supplier_phone,
        supplier_attn: pr.supplier_attn,
        sales_name: pr.sales_name || currentUserFullname || 'Purchasing Admin',
        ref_customer: pr.ref_customer,
        remarks: `[สำเนาจาก ${pr.pr_no}] ${pr.remarks || ''}`.trim(),
        delivery_note: pr.delivery_note,
        items: pr.items ? pr.items.map(it => ({ ...it })) : [],
        amount: pr.amount,
        vat_amount: pr.vat_amount,
        total_amount: pr.total_amount,
        status: 'Pending Approval',
        requested_by: currentUserFullname || 'Purchasing Admin'
      });
      onToast(`คัดลอกใบขอซื้อเป็น ${newPrNo} สำเร็จ`, 'success');
    } catch (err: any) {
      onToast('เกิดข้อผิดพลาดในการคัดลอก PR', 'err');
    }
  };

  // Duplicate PO (mirroring Sales Order Duplicate)
  const handleDuplicatePO = async (po: PurchaseOrder) => {
    if (!window.confirm(`คุณมั่นใจหรือไม่ที่จะทำสำเนาใบสั่งซื้อ ${po.po_no} เป็นฉบับใหม่?`)) return;
    const nextSeq = purchaseOrders.length + 1;
    const newPoNo = `PO-2609${String(nextSeq).padStart(3, '0')}`;
    try {
      await onAddPO({
        po_no: newPoNo,
        pr_no: po.pr_no,
        date: new Date().toISOString().split('T')[0],
        due_date: po.due_date || 'Credit 30',
        supplier_id: po.supplier_id || '',
        supplier_name: po.supplier_name,
        supplier_address: po.supplier_address,
        supplier_tax_id: po.supplier_tax_id,
        supplier_phone: po.supplier_phone,
        supplier_attn: po.supplier_attn,
        ref_customer: po.ref_customer,
        sales_name: currentUserFullname || 'Purchasing Admin',
        prepared_by: currentUserFullname || 'Purchasing Admin',
        approved_by: currentUserFullname || 'Admin',
        remarks: `[สำเนาจาก ${po.po_no}] ${po.remarks || ''}`.trim(),
        delivery_note: po.delivery_note,
        items: po.items ? po.items.map(it => ({ ...it })) : [],
        amount: po.amount,
        vat_amount: po.vat_amount,
        total_amount: po.total_amount,
        status: 'PO Issued'
      });
      onToast(`คัดลอกใบสั่งซื้อเป็น ${newPoNo} สำเร็จ`, 'success');
    } catch (err: any) {
      onToast('เกิดข้อผิดพลาดในการคัดลอก PO', 'err');
    }
  };

  // Approve PR (Admin-only approval validation)
  const handleApprovePR = async (pr: PurchaseRequest) => {
    if (!isAdmin) {
      onToast('⚠️ สิทธิ์ไม่เพียงพอ: การอนุมัติใบขอซื้อ (PR Approval) เพื่อแปลงเป็น PO สามารถทำได้โดยผู้ดูแลระบบ (Admin) เท่านั้น', 'err');
      return;
    }

    if (pr.status === 'Approved') {
      onToast(`ใบขอซื้อ ${pr.pr_no} ได้รับการอนุมัติแล้ว พร้อมสำหรับแปลงเป็น PO`, 'success');
      return;
    }

    if (pr.status === 'Converted to PO') {
      onToast(`ใบขอซื้อ ${pr.pr_no} ได้แปลงเป็นใบสั่งซื้อ PO เรียบร้อยแล้ว`, 'success');
      return;
    }

    if (!window.confirm(`ยืนยันการอนุมัติใบขอซื้อ PR ${pr.pr_no} สำหรับคู่ค้า ${pr.supplier_name} (ยอดสุทธิ ฿${(pr.total_amount || pr.amount || 0).toLocaleString()}) โดยผู้ดูแลระบบ (${currentUserFullname || 'Admin'})?`)) {
      return;
    }

    try {
      await onUpdatePR(pr.id, {
        status: 'Approved',
        approved_by: currentUserFullname || 'Admin',
        approved_at: new Date().toISOString()
      });
      onToast(`อนุมัติใบขอซื้อ PR ${pr.pr_no} เรียบร้อยแล้ว (สถานะ: Approved) พร้อมสำหรับแปลงเป็นใบสั่งซื้อ PO`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'เกิดข้อผิดพลาดในการอนุมัติ', 'err');
    }
  };

  // Reject PR
  const handleRejectPR = async (pr: PurchaseRequest) => {
    if (!isAdmin) {
      onToast('Admin เท่านั้นที่สามารถ Reject PR ได้', 'err');
      return;
    }

    const reason = window.prompt(`ระบุเหตุผลในการไม่อนุมัติ (Reject) PR ${pr.pr_no}:`, 'งบประมาณเกินกำหนด / เอกสารไม่ครบถ้วน');
    if (reason === null) return;

    try {
      await onUpdatePR(pr.id, {
        status: 'Rejected',
        remarks: `${pr.remarks || ''}\n[Rejected by Admin]: ${reason}`.trim()
      });
      onToast(`ปฏิเสธ (Reject) PR ${pr.pr_no} เรียบร้อย`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'ไม่สามารถ Reject ได้', 'err');
    }
  };

  // Mark PO as Received / Completed
  const handleReceivePO = async (po: PurchaseOrder) => {
    if (!window.confirm(`ยืนยันการรับสินค้าตามใบสั่งซื้อ PO ${po.po_no}?`)) return;

    try {
      await onUpdatePO(po.id, {
        status: 'Completed'
      });
      onToast(`บันทึกรับสินค้าสำหรับ PO ${po.po_no} สมบูรณ์ (Completed)`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'บันทึกรับสินค้าไม่สำเร็จ', 'err');
    }
  };

  // Export CSV
  const handleExportExcel = () => {
    const headers = ['Doc Type', 'Document No', 'Date', 'Supplier Name', 'Ref / Customer', 'Total Amount', 'Status', 'Requester / Approved By'];
    const rows = filteredList.map(d => [
      d.type,
      d.docNo,
      d.date,
      `"${d.supplierName.replace(/"/g, '""')}"`,
      `"${d.refCustomer.replace(/"/g, '""')}"`,
      d.totalAmount,
      d.status,
      `"${d.requester}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Procurement_PR_PO_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('ส่งออกไฟล์รายการ PR/PO สำเร็จ', 'success');
  };

  // Print Handling
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="procurement-page">
      {/* ============================================================ */}
      {/* SECTION 1: DASHBOARD & WORKFLOW VISUALIZATION                */}
      {/* ============================================================ */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </span>
              PR / PO Management — จัดซื้อและสั่งจ้าง
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Procurement Workflow • ขอซื้อ (PR) → ตรวจสอบและอนุมัติ (Admin) → ออกใบสั่งซื้อ (PO) → ตรวจรับสินค้า (Receipt)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
              สิทธิ์ของคุณ: <b className="text-amber-700">{currentRole}</b> | สั่งซื้อสะสม <b className="text-emerald-700">฿{poTotalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</b>
            </span>
          </div>
        </div>

        {/* 7 Summary Cards as requested */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <MetricCard
            id="kpi-pr-total"
            title="PR ทั้งหมด"
            value={prTotalCount}
            subtext="ใบขอซื้อในระบบ"
            icon={FileText}
            colorScheme="amber"
          />
          <MetricCard
            id="kpi-pr-pending"
            title="PR รออนุมัติ"
            value={prPendingCount}
            subtext="รอ Admin พิจารณา"
            icon={Clock}
            colorScheme="rose"
            badge={prPendingCount > 0 ? `${prPendingCount} รอ` : undefined}
          />
          <MetricCard
            id="kpi-pr-approved"
            title="PR อนุมัติแล้ว"
            value={prApprovedCount}
            subtext="ผ่านการตรวจสอบ"
            icon={CheckCircle2}
            colorScheme="emerald"
          />
          <MetricCard
            id="kpi-pr-rejected"
            title="PR ไม่อนุมัติ"
            value={prRejectedCount}
            subtext="ปฏิเสธ/แก้ไข"
            icon={XCircle}
            colorScheme="slate"
          />
          <MetricCard
            id="kpi-po-total"
            title="PO ทั้งหมด"
            value={poTotalCount}
            subtext="ใบสั่งซื้อที่ออกแล้ว"
            icon={ShoppingCart}
            colorScheme="indigo"
          />
          <MetricCard
            id="kpi-po-pending-receipt"
            title="PO รอรับของ"
            value={poPendingReceiptCount}
            subtext="กำลังจัดส่ง"
            icon={PackageCheck}
            colorScheme="cyan"
          />
          <MetricCard
            id="kpi-po-amount"
            title="ยอดสั่งซื้อสะสม"
            value={`฿${(poTotalAmount / 1000).toFixed(0)}k`}
            subtext={`฿${poTotalAmount.toLocaleString('th-TH')}`}
            icon={DollarSign}
            colorScheme="emerald"
          />
        </div>

        {/* Workflow Lifecycle Step Indicator */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mt-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              Procurement Lifecycle & Audit Flow (กระบวนการจัดซื้อ)
            </span>
            <span className="text-[11px] text-slate-500">ระบบควบคุมสิทธิ์และขั้นตอนอัตโนมัติ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-amber-200">
                1
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900">1. ขอซื้อ (PR)</div>
                <div className="text-[10px] text-slate-500">ผู้ขอซื้อสร้างใบขอราคา/เสนอซื้อ</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                2
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900">2. อนุมัติ (Admin)</div>
                <div className="text-[10px] text-slate-500">ตรวจสอบงบประมาณและกดอนุมัติ</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                3
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900">3. สั่งซื้อ (PO)</div>
                <div className="text-[10px] text-slate-500">ระบบสร้าง PO อ้างอิง PR ส่งคู่ค้า</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                4
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900">4. รับสินค้า & ตรวจรับ</div>
                <div className="text-[10px] text-slate-500">บันทึกรับของเข้าคลัง (Completed)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Alert Banner for Non-Admin */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            คุณกำลังใช้งานในบทบาท <strong>{currentRole}</strong> (สามารถสร้างใบขอซื้อ PR ได้ แต่สิทธิ์การ <strong>Approve อนุมัติ PR เป็น PO สงวนไว้สำหรับ Admin เท่านั้น</strong>)
          </span>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: TOOLBAR                                           */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <button
              id="btn-create-pr"
              onClick={handleOpenAddPR}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้าง PR (ขอซื้อ)</span>
            </button>
          )}

          {canCreate && (
            <button
              id="btn-create-po"
              onClick={handleOpenAddPO}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้าง PO (สั่งซื้อ)</span>
            </button>
          )}
        </div>

        {/* Secondary Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-export-procurement-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer"
            title="ส่งออกรายการเป็น Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            id="btn-print-procurement"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer"
            title="พิมพ์หน้ารายการ"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>

          {onRefresh && (
            <button
              id="btn-refresh-procurement"
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'กำลังโหลด...' : 'Refresh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: TABS & FILTER PANEL                               */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Navigation Tabs (6 requested tabs) */}
        <div className="flex overflow-x-auto border-b border-slate-200 pb-3 gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'ทั้งหมด (All)', count: combinedDocuments.length },
            { id: 'PR_LIST', label: 'ใบขอซื้อ (PRs)', count: prTotalCount },
            { id: 'PO_LIST', label: 'ใบสั่งซื้อ (POs)', count: poTotalCount },
            { id: 'PENDING_APPROVAL', label: 'รออนุมัติ (Pending Approval)', count: prPendingCount, highlight: prPendingCount > 0 },
            { id: 'PENDING_RECEIPT', label: 'รอรับสินค้า (Pending Receipt)', count: poPendingReceiptCount },
            { id: 'COMPLETED', label: 'เสร็จสมบูรณ์ (Completed)', count: combinedDocuments.filter(d => d.status === 'Completed' || d.status === 'Converted to PO').length }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive
                    ? 'bg-amber-700 text-amber-100 border border-amber-500'
                    : tab.highlight
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Search Term */}
          <div className="lg:col-span-2">
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">ค้นหา (เลขที่, คู่ค้า, ผู้ขอ, โครงการ)</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหาเลขที่ PR, PO, ซัพพลายเออร์..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">Supplier (คู่ค้า)</label>
            <select
              value={filterSupplier}
              onChange={e => setFilterSupplier(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">ทุกซัพพลายเออร์</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.supplier_name}>{s.supplier_name}</option>
              ))}
            </select>
          </div>

          {/* Requester */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">ผู้ขอซื้อ / Sales</label>
            <select
              value={filterRequester}
              onChange={e => setFilterRequester(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">ทุกคน</option>
              {requestersList.map((req, idx) => (
                <option key={idx} value={req}>{req}</option>
              ))}
            </select>
          </div>

          {/* Document Type */}
          <div>
            <label className="text-[10px] text-slate-600 font-semibold mb-1 block">ประเภทเอกสาร</label>
            <select
              value={filterDocType}
              onChange={e => setFilterDocType(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">ทั้ง PR และ PO</option>
              <option value="PR">เฉพาะ PR (ใบขอซื้อ)</option>
              <option value="PO">เฉพาะ PO (ใบสั่งซื้อ)</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="flex flex-col justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDocType('All');
                setFilterSupplier('All');
                setFilterRequester('All');
                setFilterProject('');
                setFilterStatus('All');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
              className="w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: PROCUREMENT WORKFLOW TABLE                        */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-900">
              รายการเอกสารจัดซื้อ ({filteredList.length} รายการ)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            แสดงตามแท็บ <b className="text-amber-700">{activeTab}</b>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-16 text-center">ประเภท</th>
                <th className="py-3 px-3 font-mono">เลขที่เอกสาร</th>
                <th className="py-3 px-3 font-mono">อ้างอิง PR/PO</th>
                <th className="py-3 px-3">วันที่</th>
                <th className="py-3 px-3">Supplier / คู่ค้า</th>
                <th className="py-3 px-3">ผู้ขอซื้อ / Requester</th>
                <th className="py-3 px-3">ลูกค้า / โครงการ</th>
                <th className="py-3 px-3 text-right">ยอดรวมสุทธิ</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-3 text-center w-36">การอนุมัติ / Workflow</th>
                <th className="py-3 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400 text-xs">
                    ไม่พบเอกสารจัดซื้อตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredList.map(doc => {
                  const isPR = doc.type === 'PR';
                  const isPO = doc.type === 'PO';

                  return (
                    <tr
                      key={`${doc.type}-${doc.id}`}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => {
                        if (isPR) setViewingPR(doc.raw as PurchaseRequest);
                        else setViewingPO(doc.raw as PurchaseOrder);
                      }}
                    >
                      {/* Document Type Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold font-mono ${
                          isPR
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {doc.type}
                        </span>
                      </td>

                      {/* Document Number */}
                      <td className="py-3.5 px-3 font-mono font-bold">
                        <span className={isPR ? 'text-amber-700' : 'text-indigo-700'}>
                          {doc.docNo}
                        </span>
                      </td>

                      {/* Linked Reference */}
                      <td className="py-3.5 px-3 font-mono text-slate-500" onClick={e => e.stopPropagation()}>
                        {doc.refNo && doc.refNo !== '-' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isPR) {
                                const foundPO = purchaseOrders.find(p => p.po_no === doc.refNo);
                                if (foundPO) setViewingPO(foundPO);
                                else onToast(`ไม่พบเอกสาร ${doc.refNo}`, 'err');
                              } else {
                                const foundPR = purchaseRequests.find(p => p.pr_no === doc.refNo);
                                if (foundPR) setViewingPR(foundPR);
                                else onToast(`ไม่พบเอกสาร ${doc.refNo}`, 'err');
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs hover:underline text-amber-600 hover:text-amber-700 font-bold transition cursor-pointer"
                            title={`คลิกเพื่อดูเอกสารอ้างอิง ${doc.refNo}`}
                          >
                            <Link2 className="w-3 h-3 text-amber-600" />
                            {doc.refNo}
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {doc.date}
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <div className="font-bold text-slate-900 truncate">{doc.supplierName}</div>
                        <div className="text-[10px] text-slate-500">Attn: {doc.supplierAttn}</div>
                      </td>

                      {/* Requester */}
                      <td className="py-3.5 px-3 text-slate-700">
                        {doc.requester}
                      </td>

                      {/* Project / Ref Customer */}
                      <td className="py-3.5 px-3 text-slate-700 truncate max-w-[140px]">
                        {doc.refCustomer}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ฿{doc.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.status === 'Approved' || doc.status === 'Converted to PO' || doc.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : doc.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : doc.status === 'Pending Approval'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {doc.status}
                        </span>
                      </td>

                      {/* Workflow Action column */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {isPR && doc.status === 'Pending Approval' ? (
                          <div className="flex items-center justify-center gap-1">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={() => handleApprovePR(doc.raw as PurchaseRequest)}
                                  title="อนุมัติ PR (Admin Approve - สถานะเปลี่ยนเป็น Approved)"
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                                >
                                  <Check className="w-3 h-3" />
                                  อนุมัติ PR
                                </button>
                                <button
                                  onClick={() => handleConvertPRtoPO(doc.raw as PurchaseRequest)}
                                  title="อนุมัติและแปลงเป็น PO ทันที (กระบวนการเดียวกับ QT -> Sale Order)"
                                  className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  แปลงเป็น PO
                                </button>
                                <button
                                  onClick={() => handleRejectPR(doc.raw as PurchaseRequest)}
                                  title="ปฏิเสธ (Reject) PR"
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span
                                title="รอผู้ดูแลระบบ (Admin) อนุมัติ จึงจะสามารถแปลงเป็น PO ได้"
                                className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-amber-700 rounded text-[11px] font-medium flex items-center gap-1 cursor-not-allowed"
                              >
                                <Lock className="w-3 h-3 text-amber-600" />
                                รอ Admin อนุมัติ
                              </span>
                            )}
                          </div>
                        ) : isPR && doc.status === 'Approved' ? (
                          <button
                            onClick={() => handleConvertPRtoPO(doc.raw as PurchaseRequest)}
                            title="สร้างใบสั่งซื้อ PO จาก PR ที่อนุมัติแล้ว (กระบวนการเดียวกับ QT -> Sale Order)"
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold flex items-center gap-1.5 mx-auto transition cursor-pointer shadow-sm"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            แปลงเป็น PO
                          </button>
                        ) : isPR && doc.status === 'Converted to PO' ? (
                          <button
                            onClick={() => {
                              const rawPr = doc.raw as PurchaseRequest;
                              const foundPO = purchaseOrders.find(
                                p => p.pr_no === rawPr.pr_no || p.po_no === rawPr.converted_po_no || p.po_no === rawPr.po_no
                              );
                              if (foundPO) setViewingPO(foundPO);
                              else onToast(`ไม่พบเอกสาร PO ที่ผูกกับ ${doc.docNo}`, 'err');
                            }}
                            title="เปิดดูใบสั่งซื้อ PO ที่แปลงแล้ว"
                            className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded text-[10.5px] font-bold flex items-center gap-1 mx-auto transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            แปลงเป็น PO แล้ว
                          </button>
                        ) : isPO && doc.status !== 'Completed' && doc.status !== 'Cancelled' ? (
                          <button
                            onClick={() => handleReceivePO(doc.raw as PurchaseOrder)}
                            className="px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 rounded text-[11px] font-bold flex items-center gap-1 mx-auto transition cursor-pointer"
                            title="บันทึกการรับสินค้าครบถ้วน"
                          >
                            <PackageCheck className="w-3 h-3 text-cyan-600" />
                            รับของ (Receive)
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            สมบูรณ์
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              if (isPR) setViewingPR(doc.raw as PurchaseRequest);
                              else setViewingPO(doc.raw as PurchaseOrder);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="ดูเอกสาร"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate action button (mirroring QT / Sale Order) */}
                          {isPR ? (
                            <button
                              onClick={() => handleDuplicatePR(doc.raw as PurchaseRequest)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="ทำสำเนาใบขอซื้อ PR (Duplicate)"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDuplicatePO(doc.raw as PurchaseOrder)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="ทำสำเนาใบสั่งซื้อ PO (Duplicate)"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Master Generator Button */}
                          {isPR ? (
                            <button
                              onClick={() => setGeneratingPR(doc.raw as PurchaseRequest)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="สร้าง / ดาวน์โหลด PDF ใบขอซื้อ PR Master Template (100% Match)"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setGeneratingPO(doc.raw as PurchaseOrder)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="สร้าง / ดาวน์โหลด PDF ใบสั่งซื้อ PO Master Template (100% Match)"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            </button>
                          )}

                          {canCreate && isPR && doc.status === 'Pending Approval' && (
                            <button
                              onClick={() => handleOpenEditPR(doc.raw as PurchaseRequest)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="แก้ไข PR"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (isPR) setViewingPR(doc.raw as PurchaseRequest);
                              else setViewingPO(doc.raw as PurchaseOrder);
                              setTimeout(() => window.print(), 300);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="พิมพ์เอกสาร PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`คุณแน่ใจว่าต้องการลบเอกสาร ${doc.docNo}?`)) {
                                  if (isPR) await onDeletePR(doc.id);
                                  else await onDeletePO(doc.id);
                                  onToast(`ลบเอกสาร ${doc.docNo} เรียบร้อย`, 'success');
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

        {/* Table footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            แสดง {filteredList.length} จากทั้งหมด {combinedDocuments.length} รายการ
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold">1</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: VIEW PR DETAILS (OFFICIAL FORM)                     */}
      {/* ============================================================ */}
      {viewingPR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
                  <FileCheck2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ใบขอซื้อ (Purchase Request - PR)</h3>
                  <p className="text-[10px] text-slate-500 font-mono">{viewingPR.pr_no}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const linkedPO = purchaseOrders.find(
                    p => p.po_no === viewingPR.po_no || p.po_no === viewingPR.converted_po_no || p.pr_no === viewingPR.pr_no
                  );
                  if (linkedPO) {
                    return (
                      <button
                        onClick={() => {
                          setViewingPR(null);
                          setViewingPO(linkedPO);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="เปิดดูใบสั่งซื้อที่ออกแล้ว"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ดูใบสั่งซื้อ {linkedPO.po_no}</span>
                      </button>
                    );
                  }
                  if (viewingPR.status === 'Approved') {
                    return (
                      <button
                        onClick={() => {
                          const pr = viewingPR;
                          setViewingPR(null);
                          handleConvertPRtoPO(pr);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="แปลงเป็น PO / สร้างใบสั่งซื้อจาก PR ที่อนุมัติแล้ว"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>แปลงเป็น PO</span>
                      </button>
                    );
                  }
                  if (viewingPR.status === 'Pending Approval') {
                    if (isAdmin) {
                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const pr = viewingPR;
                              setViewingPR(null);
                              handleApprovePR(pr);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title="อนุมัติ PR (Admin Approve)"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>อนุมัติ PR</span>
                          </button>
                          <button
                            onClick={() => {
                              const pr = viewingPR;
                              setViewingPR(null);
                              handleConvertPRtoPO(pr);
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title="อนุมัติและแปลงเป็น PO ทันที (กระบวนการเดียวกับ QT -> Sale Order)"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>แปลงเป็น PO</span>
                          </button>
                          <button
                            onClick={() => {
                              const pr = viewingPR;
                              setViewingPR(null);
                              handleRejectPR(pr);
                            }}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            title="ไม่อนุมัติ (Reject PR)"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-amber-700 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-not-allowed"
                          title="รอผู้ดูแลระบบ (Admin) อนุมัติ จึงจะสามารถแปลงเป็น PO ได้"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>รอ Admin อนุมัติ</span>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
                <button
                  onClick={() => setIsEditingPRNotes(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isEditingPRNotes
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                  title="ใส่ข้อความ / แก้ไขหมายเหตุและข้อความจัดส่ง"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditingPRNotes ? 'ปิดตัวแก้ไขโน้ต' : 'แก้ไขหมายเหตุ/โน้ต'}</span>
                </button>
                <button
                  onClick={() => setGeneratingPR(viewingPR)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-amber-200 shadow-2xs"
                  title="สร้าง PR ผ่าน Master Template Generator (100% Match)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Master Generator</span>
                </button>
                <button
                  onClick={async () => {
                    try {
                      const data = preparePurchaseRequestTemplateData(
                        {
                          ...viewingPR,
                          remarks: tempPRRemarks,
                          delivery_note: tempPRDeliveryNote
                        },
                        suppliers.find(s => s.id === viewingPR.supplier_id || s.supplier_name === viewingPR.supplier_name)
                      );
                      const pdfBytes = await generatePurchaseRequestMasterPDF(data);
                      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Purchase_Request_${data.pr_no.replace(/[\s/]/g, '_')}_MPOWER_MASTER.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      onToast(`ดาวน์โหลดเอกสารใบขอซื้อ ${data.pr_no} สำเร็จ (100% Match)`, 'success');
                    } catch (err: any) {
                      console.error('PDF export error:', err);
                      onToast('เกิดข้อผิดพลาดในการดาวน์โหลด PDF', 'err');
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="ดาวน์โหลดไฟล์ PDF ตรงตาม PR.pdf 100%"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  <span>พิมพ์ PR</span>
                </button>
                <button
                  onClick={() => setViewingPR(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Note Editor Drawer for PR */}
            {isEditingPRNotes && (
              <div className="bg-amber-50/80 border-b border-amber-200 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4 text-amber-700" />
                    แก้ไขข้อความ / โน้ตกำกับในใบขอซื้อ (PR Notes & Delivery Remark)
                  </span>
                  <span className="text-[11px] text-amber-700">ข้อความจะอัปเดตลงในตัวอย่างเอกสารและไฟล์ PDF ทันที</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      หมายเหตุ (Remarks)
                    </label>
                    <textarea
                      rows={2}
                      value={tempPRRemarks}
                      onChange={e => setTempPRRemarks(e.target.value)}
                      placeholder="ระบุหมายเหตุหรือข้อความเพิ่มเติมสำหรับ PR..."
                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ข้อความการจัดส่ง (Delivery Remark / จัดส่งตามที่อยู่)
                    </label>
                    <textarea
                      rows={2}
                      value={tempPRDeliveryNote}
                      onChange={e => setTempPRDeliveryNote(e.target.value)}
                      placeholder="ข้อความสีแดงท้ายตาราง เช่น กรุณาจัดส่งสินค้าตามชื่อ-ที่อยู่..."
                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditingPRNotes(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    ปิด
                  </button>
                  <button
                    onClick={async () => {
                      if (!viewingPR) return;
                      const updated = {
                        ...viewingPR,
                        remarks: tempPRRemarks,
                        delivery_note: tempPRDeliveryNote
                      };
                      setViewingPR(updated);
                      try {
                        await onUpdatePR(viewingPR.id, { remarks: tempPRRemarks, delivery_note: tempPRDeliveryNote });
                        if (onRefresh) await onRefresh();
                        onToast('บันทึกข้อความ/หมายเหตุลงในเอกสาร PR เรียบร้อย', 'success');
                      } catch (e) {
                        onToast('เกิดข้อผิดพลาดในการบันทึกโน้ต', 'err');
                      }
                      setIsEditingPRNotes(false);
                    }}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    บันทึกข้อความลงเอกสาร
                  </button>
                </div>
              </div>
            )}

            {/* PR Printable Sheet (100% Geometry Matched to PR.pdf) */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/60 flex justify-center">
              <MasterPurchaseRequestDocument
                data={preparePurchaseRequestTemplateData(
                  {
                    ...viewingPR,
                    remarks: tempPRRemarks,
                    delivery_note: tempPRDeliveryNote
                  },
                  suppliers.find(s => s.id === viewingPR.supplier_id || s.supplier_name === viewingPR.supplier_name)
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: VIEW PO DETAILS (OFFICIAL FORM)                     */}
      {/* ============================================================ */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ใบสั่งซื้อ (Purchase Order - PO)</h3>
                  <p className="text-[10px] text-slate-500 font-mono">{viewingPO.po_no} {viewingPO.pr_no ? `(อ้างอิง PR: ${viewingPO.pr_no})` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  if (viewingPO.pr_no) {
                    const linkedPR = purchaseRequests.find(p => p.pr_no === viewingPO.pr_no);
                    if (linkedPR) {
                      return (
                        <button
                          onClick={() => {
                            setViewingPO(null);
                            setViewingPR(linkedPR);
                          }}
                          className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="เปิดดูใบขอซื้อที่อ้างอิง"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>ดู PR: {linkedPR.pr_no}</span>
                        </button>
                      );
                    }
                  }
                  return null;
                })()}
                {viewingPO.status !== 'Completed' && (
                  <button
                    onClick={() => {
                      const po = viewingPO;
                      setViewingPO(null);
                      handleReceivePO(po);
                    }}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>บันทึกรับของ (Receive)</span>
                  </button>
                )}
                <button
                  onClick={() => setIsEditingPONotes(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isEditingPONotes
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                  }`}
                  title="ใส่ข้อความ / แก้ไขหมายเหตุและข้อความจัดส่ง"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditingPONotes ? 'ปิดตัวแก้ไขโน้ต' : 'แก้ไขหมายเหตุ/โน้ต'}</span>
                </button>
                <button
                  onClick={() => setGeneratingPO(viewingPO)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-indigo-200 shadow-2xs"
                  title="สร้าง PO ผ่าน Master Template Generator (100% Match)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Master Generator</span>
                </button>
                <button
                  onClick={async () => {
                    try {
                      const data = preparePurchaseOrderTemplateData(
                        {
                          ...viewingPO,
                          remarks: tempPORemarks,
                          delivery_note: tempPODeliveryNote
                        },
                        suppliers.find(s => s.id === viewingPO.supplier_id || s.supplier_name === viewingPO.supplier_name)
                      );
                      const pdfBytes = await generatePurchaseOrderMasterPDF(data);
                      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Purchase_Order_${data.po_no.replace(/[\s/]/g, '_')}_MPOWER_MASTER.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      onToast(`ดาวน์โหลดเอกสารใบสั่งซื้อ ${data.po_no} สำเร็จ (100% Match)`, 'success');
                    } catch (err: any) {
                      console.error('PDF export error:', err);
                      onToast('เกิดข้อผิดพลาดในการดาวน์โหลด PDF', 'err');
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="ดาวน์โหลดไฟล์ PDF ตรงตาม PO.pdf 100%"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>พิมพ์ PO</span>
                </button>
                <button
                  onClick={() => setViewingPO(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Note Editor Drawer for PO */}
            {isEditingPONotes && (
              <div className="bg-indigo-50/80 border-b border-indigo-200 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4 text-indigo-700" />
                    แก้ไขข้อความ / โน้ตกำกับในใบสั่งซื้อ (PO Notes & Delivery Remark)
                  </span>
                  <span className="text-[11px] text-indigo-700">ข้อความจะอัปเดตลงในตัวอย่างเอกสารและไฟล์ PDF ทันที</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      หมายเหตุ (Remarks)
                    </label>
                    <textarea
                      rows={2}
                      value={tempPORemarks}
                      onChange={e => setTempPORemarks(e.target.value)}
                      placeholder="ระบุหมายเหตุหรือข้อความเพิ่มเติมสำหรับ PO..."
                      className="w-full bg-white border border-indigo-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ข้อความการจัดส่ง (Delivery Remark / จัดส่งตามที่อยู่)
                    </label>
                    <textarea
                      rows={2}
                      value={tempPODeliveryNote}
                      onChange={e => setTempPODeliveryNote(e.target.value)}
                      placeholder="ข้อความสีแดงท้ายตาราง เช่น กรุณาจัดส่งสินค้าตามชื่อ-ที่อยู่..."
                      className="w-full bg-white border border-indigo-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditingPONotes(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    ปิด
                  </button>
                  <button
                    onClick={async () => {
                      if (!viewingPO) return;
                      const updated = {
                        ...viewingPO,
                        remarks: tempPORemarks,
                        delivery_note: tempPODeliveryNote
                      };
                      setViewingPO(updated);
                      try {
                        await onUpdatePO(viewingPO.id, { remarks: tempPORemarks, delivery_note: tempPODeliveryNote });
                        if (onRefresh) await onRefresh();
                        onToast('บันทึกข้อความ/หมายเหตุลงในเอกสาร PO เรียบร้อย', 'success');
                      } catch (e) {
                        onToast('เกิดข้อผิดพลาดในการบันทึกโน้ต', 'err');
                      }
                      setIsEditingPONotes(false);
                    }}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    บันทึกข้อความลงเอกสาร
                  </button>
                </div>
              </div>
            )}

            {/* PO Printable Sheet (100% Geometry Matched to PO.pdf) */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/60 flex justify-center">
              <MasterPurchaseOrderDocument
                data={preparePurchaseOrderTemplateData(
                  {
                    ...viewingPO,
                    remarks: tempPORemarks,
                    delivery_note: tempPODeliveryNote
                  },
                  suppliers.find(s => s.id === viewingPO.supplier_id || s.supplier_name === viewingPO.supplier_name)
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: CREATE / EDIT PR FORM                               */}
      {/* ============================================================ */}
      {isPRFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-600" />
                {editingPR ? `แก้ไขใบขอซื้อ: ${prNo}` : 'สร้างใบขอซื้อใหม่ (New Purchase Request - PR)'}
              </h3>
              <button
                onClick={() => setIsPRFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePR} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">เลขที่ PR</label>
                  <input
                    type="text"
                    required
                    value={prNo}
                    onChange={e => setPrNo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-amber-700 font-bold focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">วันที่ขอซื้อ</label>
                  <input
                    type="date"
                    required
                    value={prDate}
                    onChange={e => setPrDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">เงื่อนไขชำระเงิน (Due / Term)</label>
                  <input
                    type="text"
                    value={prDueDate}
                    onChange={e => setPrDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Supplier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">เลือก Supplier จากทะเบียนคู่ค้า</label>
                  <select
                    value={prSupplierId}
                    onChange={e => handleSupplierSelectInPR(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="">-- เลือกคู่ค้า (Auto-fill) --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">ชื่อคู่ค้า (Vendor Name)</label>
                  <input
                    type="text"
                    required
                    value={prSupplierName}
                    onChange={e => setPrSupplierName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">รายการสินค้าที่ขอซื้อ (PR Items)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPrItems([
                        ...prItems,
                        {
                          item_no: prItems.length + 1,
                          description: '',
                          quantity: 1,
                          unit_price: 0,
                          amount: 0
                        }
                      ]);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3 text-amber-600" />
                    เพิ่มรายการสินค้า
                  </button>
                </div>

                <div className="space-y-2">
                  {prItems.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-slate-200">
                      <div className="col-span-1 text-center font-mono text-slate-400">{idx + 1}</div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="รายละเอียดสินค้า/รุ่น"
                          value={it.description}
                          onChange={e => {
                            const arr = [...prItems];
                            arr[idx].description = e.target.value;
                            setPrItems(arr);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="จำนวน"
                          value={it.quantity}
                          onChange={e => {
                            const arr = [...prItems];
                            arr[idx].quantity = Number(e.target.value);
                            arr[idx].amount = arr[idx].quantity * arr[idx].unit_price;
                            setPrItems(arr);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 text-center focus:bg-white focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="ราคา/หน่วย"
                          value={it.unit_price}
                          onChange={e => {
                            const arr = [...prItems];
                            arr[idx].unit_price = Number(e.target.value);
                            arr[idx].amount = arr[idx].quantity * arr[idx].unit_price;
                            setPrItems(arr);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-amber-700 font-mono font-bold text-right focus:bg-white focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {prItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPrItems(prItems.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-600">ยอดรวมสุทธิ (Grand Total รวม VAT 7%):</span>
                  <span className="text-sm font-mono font-black text-amber-700">
                    ฿{calculatedPRTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Remarks & Delivery Note Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                <div>
                  <label className="text-[10px] text-slate-700 font-bold mb-1 block">หมายเหตุ (Remarks;)</label>
                  <textarea
                    rows={2}
                    value={prRemarks}
                    onChange={e => setPrRemarks(e.target.value)}
                    placeholder="ระบุหมายเหตุ เช่น ด่วนมาก, ใช้สำหรับโครงการ..."
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-700 font-bold mb-1 block">ข้อความจัดส่ง (Delivery Remark)</label>
                  <textarea
                    rows={2}
                    value={prDeliveryNote}
                    onChange={e => setPrDeliveryNote(e.target.value)}
                    placeholder="ข้อความจัดส่ง เช่น กรุณาจัดส่งสินค้าตามชื่อ-ที่อยู่..."
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPRFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  {editingPR ? 'บันทึกการแก้ไข' : 'ส่งขออนุมัติ PR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: DIRECT CREATE PO FORM                               */}
      {/* ============================================================ */}
      {isPOFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                สร้างใบสั่งซื้อ (Purchase Order - PO)
              </h3>
              <button
                onClick={() => setIsPOFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">เลขที่ PO</label>
                  <input
                    type="text"
                    required
                    value={poNo}
                    onChange={e => setPoNo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-indigo-700 font-bold focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">วันที่สั่งซื้อ</label>
                  <input
                    type="date"
                    required
                    value={poDate}
                    onChange={e => setPoDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">
                    ดึงข้อมูลจาก PR (Link from PR)
                  </label>
                  <select
                    value={poRefPR}
                    onChange={e => handlePRSelectInPO(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-amber-700 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- ไม่ผูกกับ PR (Direct PO) --</option>
                    {purchaseRequests.filter(pr => pr.status === 'Approved').length > 0 && (
                      <optgroup label="✓ PR ที่อนุมัติแล้ว (Approved - พร้อมออก PO)">
                        {purchaseRequests
                          .filter(pr => pr.status === 'Approved')
                          .map(pr => (
                            <option key={pr.id} value={pr.pr_no}>
                              [✓ Approved] {pr.pr_no} • {pr.supplier_name} (฿{(pr.total_amount || pr.amount || 0).toLocaleString()})
                            </option>
                          ))}
                      </optgroup>
                    )}
                    {purchaseRequests.filter(pr => pr.status === 'Pending Approval' || pr.status === 'Draft').length > 0 && (
                      <optgroup label="⏳ PR ที่รอ Admin อนุมัติ (Pending Approval)">
                        {purchaseRequests
                          .filter(pr => pr.status === 'Pending Approval' || pr.status === 'Draft')
                          .map(pr => (
                            <option key={pr.id} value={pr.pr_no}>
                              [รอ Admin อนุมัติ] {pr.pr_no} • {pr.supplier_name} (฿{(pr.total_amount || pr.amount || 0).toLocaleString()})
                            </option>
                          ))}
                      </optgroup>
                    )}
                    {purchaseRequests.filter(pr => pr.status === 'Converted to PO').length > 0 && (
                      <optgroup label="📋 PR ที่แปลงเป็น PO แล้ว (Converted)">
                        {purchaseRequests
                          .filter(pr => pr.status === 'Converted to PO')
                          .map(pr => (
                            <option key={pr.id} value={pr.pr_no}>
                              [Converted] {pr.pr_no} • {pr.supplier_name} (PO: {pr.converted_po_no || pr.po_no})
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Supplier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">เลือก Supplier</label>
                  <select
                    value={poSupplierId}
                    onChange={e => handleSupplierSelectInPO(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- เลือกคู่ค้า (Auto-fill) --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold mb-1 block">ชื่อคู่ค้า (Vendor Name)</label>
                  <input
                    type="text"
                    required
                    value={poSupplierName}
                    onChange={e => setPoSupplierName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">รายการสั่งซื้อ (PO Items)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPoItems([
                        ...poItems,
                        {
                          item_no: poItems.length + 1,
                          description: '',
                          quantity: 1,
                          unit_price: 0,
                          amount: 0
                        }
                      ]);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3 text-indigo-600" />
                    เพิ่มรายการสินค้า
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-slate-200">
                      <div className="col-span-1 text-center font-mono text-slate-400">{idx + 1}</div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="รายละเอียดสินค้า"
                          value={it.description}
                          onChange={e => {
                            const arr = [...poItems];
                            arr[idx].description = e.target.value;
                            setPoItems(arr);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="จำนวน"
                          value={it.quantity}
                          onChange={e => {
                            const arr = [...poItems];
                            arr[idx].quantity = Number(e.target.value);
                            arr[idx].amount = arr[idx].quantity * arr[idx].unit_price;
                            setPoItems(arr);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 text-center focus:bg-white focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="ราคา/หน่วย"
                          value={it.unit_price}
                          onChange={e => {
                            const arr = [...poItems];
                            arr[idx].unit_price = Number(e.target.value);
                            arr[idx].amount = arr[idx].quantity * arr[idx].unit_price;
                            setPoItems(arr);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-indigo-700 font-mono font-bold text-right focus:bg-white focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-600">ยอดรวมสุทธิ (Grand Total รวม VAT 7%):</span>
                  <span className="text-sm font-mono font-black text-indigo-700">
                    ฿{calculatedPOTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Remarks & Delivery Note Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-200">
                <div>
                  <label className="text-[10px] text-slate-700 font-bold mb-1 block">หมายเหตุ (Remarks;)</label>
                  <textarea
                    rows={2}
                    value={poRemarks}
                    onChange={e => setPoRemarks(e.target.value)}
                    placeholder="ระบุหมายเหตุ เช่น สั่งซื้อตามอนุมัติฝ่ายจัดซื้อ..."
                    className="w-full bg-white border border-indigo-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-700 font-bold mb-1 block">ข้อความจัดส่ง (Delivery Remark)</label>
                  <textarea
                    rows={2}
                    value={poDeliveryNote}
                    onChange={e => setPoDeliveryNote(e.target.value)}
                    placeholder="ข้อความจัดส่ง เช่น กรุณาจัดส่งสินค้าตามชื่อ-ที่อยู่..."
                    className="w-full bg-white border border-indigo-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPOFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  ยืนยันสร้าง PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Master Template Exact PR Preview Modal */}
      {masterPreviewPR && (
        <MasterDocumentPreviewModal
          isOpen={!!masterPreviewPR}
          onClose={() => setMasterPreviewPR(null)}
          template={DEFAULT_MASTER_TEMPLATES[2]}
          data={{
            document_no: masterPreviewPR.pr_no,
            document_date: masterPreviewPR.date || masterPreviewPR.pr_date || '',
            required_date: masterPreviewPR.required_date || '',
            requestor_name: masterPreviewPR.requestor || masterPreviewPR.requested_by || masterPreviewPR.sales_name || '',
            department: masterPreviewPR.department || 'ฝ่ายปฏิบัติการวิศวกรรม',
            project_name: masterPreviewPR.project || masterPreviewPR.ref_customer || '',
            supplier_name: masterPreviewPR.supplier_name || '',
            supplier_address: masterPreviewPR.supplier_address || '',
            supplier_tax_id: masterPreviewPR.supplier_tax_id || '',
            subtotal: masterPreviewPR.amount,
            vat: masterPreviewPR.vat_amount || masterPreviewPR.amount * 0.07,
            grand_total: masterPreviewPR.total_amount,
            baht_text: numberToThaiBaht(masterPreviewPR.total_amount),
            remark: masterPreviewPR.remarks || masterPreviewPR.delivery_note || '',
            authorized_name: masterPreviewPR.approved_by || 'นายพงษ์ศักดิ์ บุญประเสริฐ',
            items: (masterPreviewPR.items || []).map((it, idx) => ({
              item_no: idx + 1,
              description: it.description,
              qty: it.quantity || it.qty || 1,
              unit: it.unit || 'ชุด',
              unit_price: it.unit_price,
              amount: it.amount
            }))
          }}
        />
      )}

      {/* Master Template Exact PO Preview Modal */}
      {masterPreviewPO && (
        <MasterDocumentPreviewModal
          isOpen={!!masterPreviewPO}
          onClose={() => setMasterPreviewPO(null)}
          template={DEFAULT_MASTER_TEMPLATES[3]}
          data={{
            document_no: masterPreviewPO.po_no,
            document_date: masterPreviewPO.date || masterPreviewPO.po_date || '',
            ref_pr_no: masterPreviewPO.pr_no || '',
            supplier_name: masterPreviewPO.supplier_name,
            supplier_address: masterPreviewPO.supplier_address || '',
            supplier_tax_id: masterPreviewPO.supplier_tax_id || '',
            payment_term: masterPreviewPO.payment_term || 'เครดิต 30 วัน',
            delivery_date: masterPreviewPO.delivery_date || masterPreviewPO.due_date || '',
            project_name: masterPreviewPO.project || masterPreviewPO.ref_customer || '',
            subtotal: masterPreviewPO.amount,
            vat: masterPreviewPO.vat_amount || masterPreviewPO.amount * 0.07,
            grand_total: masterPreviewPO.total_amount,
            baht_text: numberToThaiBaht(masterPreviewPO.total_amount),
            remark: masterPreviewPO.remarks || masterPreviewPO.delivery_note || '',
            authorized_name: masterPreviewPO.approved_by || 'นายพงษ์ศักดิ์ บุญประเสริฐ',
            items: (masterPreviewPO.items || []).map((it, idx) => ({
              item_no: idx + 1,
              description: it.description,
              qty: it.quantity || it.qty || 1,
              unit: it.unit || 'ชุด',
              unit_price: it.unit_price,
              amount: it.amount
            }))
          }}
        />
      )}

      {/* Purchase Request Master Generator Modal (100% Geometry Matched to PR.pdf) */}
      {generatingPR && (
        <PurchaseRequestGenerateModal
          isOpen={!!generatingPR}
          onClose={() => setGeneratingPR(null)}
          purchaseRequest={generatingPR}
          supplier={suppliers.find(s => s.id === generatingPR.supplier_id || s.supplier_name === generatingPR.supplier_name)}
          onToast={onToast}
        />
      )}

      {/* Purchase Order Master Generator Modal (100% Geometry Matched to PO.pdf) */}
      {generatingPO && (
        <PurchaseOrderGenerateModal
          isOpen={!!generatingPO}
          onClose={() => setGeneratingPO(null)}
          purchaseOrder={generatingPO}
          supplier={suppliers.find(s => s.id === generatingPO.supplier_id || s.supplier_name === generatingPO.supplier_name)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
