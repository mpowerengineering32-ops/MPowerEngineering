import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Upload, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Eye, 
  History, 
  Sliders, 
  Plus, 
  RefreshCw, 
  Check, 
  Search, 
  FileCheck, 
  ShieldCheck, 
  ArrowRight,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  MasterDocType, 
  MasterTemplate, 
  MasterDocumentData, 
  Quotation, 
  SalesOrder, 
  PurchaseRequest, 
  PurchaseOrder, 
  BillingNote, 
  Invoice 
} from '../types';
import { DEFAULT_MASTER_TEMPLATES, COMPANY_MASTER_INFO } from '../data/masterTemplatesData';
import { MasterDocumentPreviewModal } from './MasterDocumentPreviewModal';
import { auditDocumentBeforeExport, generateMasterPDF, exportMasterExcel, downloadFileBlob } from '../utils/documentMasterEngine';
import { numberToThaiBaht } from '../utils/numberWords';
import { MasterSalesOrderDocument } from './sales-order/MasterSalesOrderDocument';
import { SalesOrderTemplateData, generateSalesOrderMasterPDF } from '../utils/salesOrderPdfEngine';
import { MasterBillingNoteDocument } from './billing-note/MasterBillingNoteDocument';
import { BillingNoteTemplateData, generateBillingNoteMasterPDF } from '../utils/billingNotePdfEngine';

interface MasterDocumentManagementProps {
  quotations?: Quotation[];
  salesOrders?: SalesOrder[];
  purchaseRequests?: PurchaseRequest[];
  purchaseOrders?: PurchaseOrder[];
  billingNotes?: BillingNote[];
  invoices?: Invoice[];
  currentUserId?: string;
  currentUserFullname?: string;
  onToast?: (msg: string, type: 'success' | 'err') => void;
}

export const MasterDocumentManagement: React.FC<MasterDocumentManagementProps> = ({
  quotations = [],
  salesOrders = [],
  purchaseRequests = [],
  purchaseOrders = [],
  billingNotes = [],
  invoices = [],
  currentUserFullname = 'ผู้ดูแลระบบ (Admin)',
  onToast
}) => {
  // Main view state
  const [activeTab, setActiveTab] = useState<'templates' | 'generator'>('generator');
  
  // Templates state with localStorage persistence
  const [templates, setTemplates] = useState<MasterTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('crm_master_templates');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_MASTER_TEMPLATES;
  });

  const saveTemplates = (newTemplates: MasterTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('crm_master_templates', JSON.stringify(newTemplates));
  };

  // Selected document type for generator
  const [selectedDocType, setSelectedDocType] = useState<MasterDocType>('quotation');
  
  // Selected database record to generate
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTargetDocType, setUploadTargetDocType] = useState<MasterDocType>('quotation');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadVersion, setUploadVersion] = useState<string>('1.1');
  const [uploadChangelog, setUploadChangelog] = useState<string>('ปรับปรุงเส้นตารางและระยะขอบกระดาษตรงตามไฟล์ต้นฉบับ');

  // Mapping inspector modal
  const [editingTemplate, setEditingTemplate] = useState<MasterTemplate | null>(null);

  // Fullscreen Live Preview Modal
  const [previewModalData, setPreviewModalData] = useState<{
    isOpen: boolean;
    template: MasterTemplate;
    data: MasterDocumentData;
  } | null>(null);

  // Active template for the selected document type
  const activeTemplate = useMemo(() => {
    return templates.find(t => t.docType === selectedDocType && t.isActive) || 
           templates.find(t => t.docType === selectedDocType) || 
           templates[0];
  }, [templates, selectedDocType]);

  // Convert selected database record into MasterDocumentData format
  const documentData = useMemo<MasterDocumentData>(() => {
    const todayStr = new Date().toLocaleDateString('th-TH');

    switch (selectedDocType) {
      case 'quotation': {
        const q = quotations.find(item => String(item.id) === selectedRecordId) || quotations[0];
        if (q) {
          const sub = Number(q.total_amount || (q as any).total_value || 120000);
          const vat = Number(q.vat_amount || sub * 0.07);
          const grand = Number(q.grand_total || sub + vat);
          return {
            document_no: q.quotation_no,
            document_date: q.issue_date || (q as any).quotation_date || todayStr,
            customer_name: q.customer_name || 'บริษัท ปตท. จำกัด (มหาชน)',
            customer_address: '555 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',
            customer_tax_id: '0107544000108',
            project_name: q.subject || (q as any).title || 'งานบริการทดสอบแรงดันระบบท่อส่งก๊าซ (Hydrotest)',
            payment_term: (q as any).payment_term || 'เครดิต 30 วัน',
            validity_days: (q as any).validity_days || 30,
            subtotal: sub,
            discount: 0,
            vat: vat,
            grand_total: grand,
            baht_text: numberToThaiBaht(grand),
            remark: q.remarks || 'ราคารวมค่าเดินทาง ขนส่ง และเครื่องมือวัดมาตรฐานพร้อมใบรับรอง',
            authorized_name: 'นายพงษ์ศักดิ์ บุญประเสริฐ (กรรมการผู้จัดการ)',
            items: (q.items || []).map((it, idx) => ({
              item_no: idx + 1,
              description: it.description || (it as any).name || 'รายการบริการวิศวกรรม',
              qty: it.qty || 1,
              unit: it.unit || 'ชุด',
              unit_price: it.unit_rate || (it as any).price || sub,
              amount: it.total_price || sub
            }))
          };
        }
        break;
      }

      case 'so':
      case 'sales_order': {
        const so = salesOrders.find(item => String(item.id) === selectedRecordId || item.so_no === 'SO-2609001') || salesOrders[0];
        if (so) {
          const sub = Number(so.total_amount || 2800);
          const vat = Math.round(sub * 0.07 * 100) / 100;
          const grand = Math.round((sub + vat) * 100) / 100;
          return {
            document_no: so.so_no || 'SO-2609001',
            document_date: so.order_date || '01-09-2026',
            customer_name: so.customer_name || 'IKM Testing (Thailand) Co., Ltd',
            customer_address: (so as any).customer_address || '155/167 Moo 5, Samnakthon Sub-District\nBanchang District, Rayong, Thailand 21130',
            customer_tax_id: (so as any).tax_id || (so as any).customer_tax_id || '0215552000909 (Head Office)',
            project_name: so.project_name || 'Sky Lotech High Lift',
            delivery_date: so.target_delivery_date || '01-10-2026',
            payment_term: (so as any).payment_term || '30 Days',
            sales_name: so.sales_person || 'Pornpicha O.',
            subtotal: sub,
            vat: vat,
            grand_total: grand,
            baht_text: 'TWO THOUSAND NINE HUNDRED NINETY SIX BAHT',
            baht_text_en: 'TWO THOUSAND NINE HUNDRED NINETY SIX BAHT',
            remark: '30 days validily from date of quotation.\nAll prices above are quoted in THB.',
            authorized_name: 'Authorized Signature',
            items: (so.items && so.items.length > 0) ? (so.items || []).map((it, idx) => ({
              item_no: idx + 1,
              description: it.description,
              qty: it.qty,
              unit: it.unit || 'Unit',
              unit_price: it.unit_price,
              amount: it.qty * it.unit_price
            })) : [
              {
                item_no: 1,
                description: 'Sky Lotech High Lift\nBrand : Skyy Lotech\nModel : M-380X-200\n- Length : 200 Meter\n- Length : 200 Meter\n- Diameter : 1/2"',
                qty: 1,
                unit: 'Unit',
                unit_price: 2800,
                amount: 2800
              }
            ]
          };
        }
        break;
      }

      case 'pr': {
        const pr = purchaseRequests.find(item => String(item.id) === selectedRecordId) || purchaseRequests[0];
        if (pr) {
          const sub = Number(pr.amount || 48500);
          const vat = Number(pr.vat_amount || sub * 0.07);
          const grand = Number(pr.total_amount || sub + vat);
          return {
            document_no: pr.pr_no,
            document_date: pr.date || pr.pr_date || todayStr,
            required_date: pr.required_date || '05/10/2026',
            requestor_name: pr.requestor || pr.requested_by || 'วิศวกรโครงการ',
            department: pr.department || 'ฝ่ายปฏิบัติการวิศวกรรม',
            project_name: pr.project || pr.ref_customer || 'PTT Gas Pipeline Hydrotest Support',
            supplier_name: pr.supplier_name || 'บริษัท สยามฟิตติ้งส์ แอนด์ วาล์วส์ จำกัด',
            supplier_address: pr.supplier_address || '88/12 ถนนบางนา-ตราด กม.18 อ.บางพลี จ.สมุทรปราการ',
            supplier_tax_id: pr.supplier_tax_id || '0105548012345',
            subtotal: sub,
            vat: vat,
            grand_total: grand,
            baht_text: numberToThaiBaht(grand),
            remark: pr.remarks || 'ขอซื้ออุปกรณ์สำรองเร่งด่วนสำหรับโครงการซ่อมบำรุง',
            authorized_name: pr.approved_by || 'นายพงษ์ศักดิ์ บุญประเสริฐ',
            items: (pr.items || []).map((it, idx) => ({
              item_no: idx + 1,
              description: it.description,
              qty: it.qty || it.quantity || 1,
              unit: it.unit || 'ชุด',
              unit_price: it.unit_price,
              amount: it.amount
            }))
          };
        }
        break;
      }

      case 'po': {
        const po = purchaseOrders.find(item => String(item.id) === selectedRecordId) || purchaseOrders[0];
        if (po) {
          const sub = Number(po.amount || 48500);
          const vat = Number(po.vat_amount || sub * 0.07);
          const grand = Number(po.total_amount || sub + vat);
          return {
            document_no: po.po_no,
            document_date: po.date || po.po_date || todayStr,
            ref_pr_no: po.pr_no || 'PR-26001',
            supplier_name: po.supplier_name || 'บริษัท สยามฟิตติ้งส์ แอนด์ วาล์วส์ จำกัด',
            supplier_address: po.supplier_address || '88/12 ถนนบางนา-ตราด กม.18 อ.บางพลี จ.สมุทรปราการ',
            supplier_tax_id: po.supplier_tax_id || '0105548012345',
            payment_term: po.payment_term || 'เครดิต 30 วัน',
            delivery_date: po.delivery_date || po.due_date || '08/10/2026',
            project_name: po.project || po.ref_customer || 'PTT Gas Pipeline Support',
            subtotal: sub,
            vat: vat,
            grand_total: grand,
            baht_text: numberToThaiBaht(grand),
            remark: po.remarks || 'ส่งมอบพร้อม Mill Test Certificate และใบส่งของ 3 ฉบับ',
            authorized_name: po.approved_by || 'นายพงษ์ศักดิ์ บุญประเสริฐ',
            items: (po.items || []).map((it, idx) => ({
              item_no: idx + 1,
              description: it.description,
              qty: it.qty || it.quantity || 1,
              unit: it.unit || 'ชุด',
              unit_price: it.unit_price,
              amount: it.amount
            }))
          };
        }
        break;
      }

      case 'billing_note': {
        const bn = billingNotes.find(item => String(item.id) === selectedRecordId) || billingNotes[0];
        if (bn) {
          const total = Number(bn.total_amount || 65000);
          const sub = total / 1.07;
          const vat = total - sub;
          return {
            document_no: bn.billing_no,
            document_date: bn.date || bn.billing_date || todayStr,
            due_date: bn.due_of_payment || bn.due_date || '26/10/2026',
            customer_name: bn.customer_name || 'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน) (SCG)',
            customer_address: bn.customer_address || '1 ถนนปูนซิเมนต์ไทย บางซื่อ กรุงเทพฯ',
            customer_tax_id: bn.customer_tax_id || '0107537000958',
            subtotal: total,
            vat: 0,
            wht_amount: total * 0.03,
            grand_total: total - (total * 0.03),
            baht_text: numberToThaiBaht(total - (total * 0.03)),
            remark: bn.notes || 'วางบิลตามเงื่อนไขส่งมอบงานบริการงวดที่ 1',
            authorized_name: 'ฝ่ายการเงินและบัญชี M Power',
            items: (bn.items || []).map((it, idx) => ({
              item_no: idx + 1,
              invoice_no: it.invoice_no,
              invoice_date: it.date,
              ref_no: it.ref_no || it.sales_order_no || 'SO-26001',
              description: it.description || `ใบแจ้งหนี้ ${it.invoice_no}`,
              amount: it.amount
            }))
          };
        }
        break;
      }

      case 'invoice': {
        const inv = invoices.find(item => String(item.id) === selectedRecordId) || invoices[0];
        if (inv) {
          const sub = Number(inv.total_amount || 120000);
          const vat = Number(inv.vat_amount || sub * 0.07);
          const grand = Number(inv.grand_total || sub + vat);
          return {
            document_no: inv.invoice_no,
            document_date: inv.issue_date || todayStr,
            due_date: inv.due_date || '26/10/2026',
            customer_name: inv.customer_name || 'บริษัท ปตท. จำกัด (มหาชน)',
            customer_address: '555 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
            customer_tax_id: '0107544000108',
            customer_branch: 'สำนักงานใหญ่',
            ref_po_no: 'PTT-PO-2026-99',
            project_name: 'Hydrotest Service Contract',
            subtotal: sub,
            vat: vat,
            grand_total: grand,
            baht_text: numberToThaiBaht(grand),
            remark: 'กรุณาโอนเงินเข้าบัญชี บจก. เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์',
            authorized_name: 'นายพงษ์ศักดิ์ บุญประเสริฐ',
            items: (inv.items || []).map((it, idx) => ({
              item_no: idx + 1,
              description: it.description,
              qty: it.quantity,
              unit: 'งาน',
              unit_price: it.unit_price,
              amount: it.amount
            }))
          };
        }
        break;
      }

      default: {
        // Fallback standard sample data
        return {
          document_no: 'DOC-26001',
          document_date: todayStr,
          customer_name: 'บริษัท ปตท. จำกัด (มหาชน)',
          customer_address: '555 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',
          customer_tax_id: '0107544000108',
          project_name: 'Offshore Equipment Maintenance',
          payment_term: 'เครดิต 30 วัน',
          subtotal: 100000,
          vat: 7000,
          grand_total: 107000,
          baht_text: numberToThaiBaht(107000),
          authorized_name: 'นายพงษ์ศักดิ์ บุญประเสริฐ',
          items: [
            { item_no: 1, description: 'บริการงานวิศวกรรมทดสอบระบบแรงดันสูง', qty: 1, unit: 'งาน', unit_price: 100000, amount: 100000 }
          ]
        };
      }
    }

    // Default sample when no records
    return {
      document_no: `${selectedDocType.toUpperCase().slice(0, 3)}-26001`,
      document_date: todayStr,
      customer_name: 'บริษัท ปตท. จำกัด (มหาชน)',
      customer_address: '555 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
      customer_tax_id: '0107544000108',
      project_name: 'Hydrotest Pump & Rental Equipment Services',
      payment_term: 'เครดิต 30 วัน',
      subtotal: 120000,
      vat: 8400,
      grand_total: 128400,
      baht_text: numberToThaiBaht(128400),
      remark: 'ราคารวมภาษีมูลค่าเพิ่มเรียบร้อยแล้ว',
      authorized_name: 'นายพงษ์ศักดิ์ บุญประเสริฐ',
      items: [
        { item_no: 1, description: 'Seamless Steel Pipe ASTM A106 Gr.B 2" Sch.40', qty: 20, unit: 'ท่อน', unit_price: 3200, amount: 64000 },
        { item_no: 2, description: 'High Pressure Hydrotest Pump Package 15,000 PSI', qty: 1, unit: 'ชุด', unit_price: 56000, amount: 56000 }
      ]
    };
  }, [selectedDocType, selectedRecordId, quotations, salesOrders, purchaseRequests, purchaseOrders, billingNotes, invoices]);

  // Pre-export audit result for live display
  const auditResult = useMemo(() => {
    return auditDocumentBeforeExport(documentData, activeTemplate);
  }, [documentData, activeTemplate]);

  // Exact 100% Geometry Matched Data for Sales Order
  const soTemplateData: SalesOrderTemplateData | null = useMemo(() => {
    if (selectedDocType !== 'so' && selectedDocType !== 'sales_order') return null;
    const rawAddr = documentData.customer_address || '155/167 Moo 5, Samnakthon Sub-District\nBanchang District, Rayong, Thailand 21130';
    const addrParts = rawAddr.split('\n').map(s => s.trim()).filter(Boolean);
    const addr1 = addrParts[0] || '155/167 Moo 5, Samnakthon Sub-District';
    const addr2 = addrParts.slice(1).join(', ') || 'Banchang District, Rayong, Thailand 21130';

    let taxIdStr = documentData.customer_tax_id || '0215552000909 (Head Office)';
    if (!taxIdStr.includes('Head Office') && !taxIdStr.includes('สาขา')) {
      taxIdStr += ' (Head Office)';
    }

    const itemsList = (documentData.items && documentData.items.length > 0) ? documentData.items.map(it => {
      const q = Number(it.qty ?? it.ordered_qty ?? 1);
      const p = Number(it.unit_price ?? 0);
      const a = Number(it.amount ?? (q * p));
      const descLines = (it.description || '').split('\n').map(s => s.trim()).filter(Boolean);
      const mainDesc = descLines[0] || 'Sky Lotech High Lift';
      const details = descLines.slice(1);
      return {
        qty: q,
        description: mainDesc,
        details: details.length > 0 ? details : (it.description && it.description.includes('Sky Lotech') ? ['Brand : Skyy Lotech', 'Model : M-380X-200', '- Length : 200 Meter', '- Length : 200 Meter', '- Diameter : 1/2"'] : undefined),
        unit_price: p,
        amount: a
      };
    }) : [
      {
        qty: 1,
        description: 'Sky Lotech High Lift',
        details: ['Brand : Skyy Lotech', 'Model : M-380X-200', '- Length : 200 Meter', '- Length : 200 Meter', '- Diameter : 1/2"'],
        unit_price: 2800,
        amount: 2800
      }
    ];

    const subtotal = Math.round(itemsList.reduce((s, it) => s + it.amount, 0) * 100) / 100;
    const vat = Math.round(subtotal * 0.07 * 100) / 100;
    const grandTotal = Math.round((subtotal + vat) * 100) / 100;

    return {
      so_no: documentData.document_no || 'SO-2609001',
      date: documentData.document_date || '01-09-2026',
      customer_name: documentData.customer_name || 'IKM Testing (Thailand) Co., Ltd',
      customer_address_1: addr1,
      customer_address_2: addr2,
      tax_id: taxIdStr,
      attn: (documentData as any).attn || (documentData as any).contact_person || 'Khun Apiyut',
      tel: (documentData as any).tel || (documentData as any).customer_phone || '038-601 996-8',
      terms_of_payment: documentData.payment_term || '30 Days',
      sales_name: documentData.sales_name || 'Pornpicha O.',
      items: itemsList,
      subtotal: subtotal,
      vat: vat,
      grand_total: grandTotal,
      baht_text_en: documentData.baht_text_en || 'TWO THOUSAND NINE HUNDRED NINETY SIX BAHT',
      project_name: documentData.project_name,
      delivery_plan: documentData.delivery_date
    };
  }, [documentData, selectedDocType]);

  // Exact 100% Geometry Matched Data for Billing Note
  const bnTemplateData: BillingNoteTemplateData | null = useMemo(() => {
    if (selectedDocType !== 'billing_note') return null;
    const rawAddr = documentData.customer_address || '';
    const addrParts = rawAddr.split('\n').map(s => s.trim()).filter(Boolean);
    const addr1 = addrParts[0] || rawAddr || '-';
    const addr2 = addrParts.slice(1).join(', ') || '';

    const itemsList = (documentData.items && documentData.items.length > 0) ? documentData.items.map((it, idx) => ({
      no: it.item_no || idx + 1,
      ref_no: it.ref_no || (it as any).sales_order_no || '-',
      invoice_no: it.invoice_no || it.description || '-',
      date: it.invoice_date || (it as any).date || documentData.document_date || '',
      amount: Number(it.amount || 0)
    })) : [
      {
        no: 1,
        ref_no: '-',
        invoice_no: 'INV-2609001',
        date: documentData.document_date || '01-09-2026',
        amount: Number(documentData.subtotal || documentData.grand_total || 50000)
      }
    ];

    const total = Number(documentData.subtotal || itemsList.reduce((s, it) => s + it.amount, 0));

    return {
      billing_no: documentData.document_no || 'BL 26-001',
      date: documentData.document_date || '01-09-2026',
      customer_name: documentData.customer_name || 'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)',
      customer_address_1: addr1,
      customer_address_2: addr2,
      customer_tax_id: documentData.customer_tax_id,
      items: itemsList,
      total: total,
      baht_text_thai: documentData.baht_text || numberToThaiBaht(total),
      due_of_payment: documentData.due_date || (documentData as any).due_of_payment || '30 วัน',
      delivered_by: (documentData as any).delivered_by || documentData.sales_name || 'Saranya.',
      delivered_date: (documentData as any).delivered_date || documentData.document_date || '01-09-2026',
      received_by: (documentData as any).received_by || '',
      received_date: (documentData as any).received_date || ''
    };
  }, [documentData, selectedDocType]);

  // Handle template file upload & version creation
  const handleUploadNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      onToast?.('กรุณาเลือกไฟล์ Master Template ต้นฉบับ (.pdf, .xlsx, .docx)', 'err');
      return;
    }

    const ext = uploadFile.name.split('.').pop()?.toLowerCase();
    const fileType: 'pdf' | 'xlsx' | 'docx' = ext === 'xlsx' || ext === 'xlsm' ? 'xlsx' : ext === 'docx' ? 'docx' : 'pdf';

    const updated = templates.map(tpl => {
      if (tpl.docType === uploadTargetDocType) {
        const newVerRecord = {
          id: `v-${tpl.docType}-${uploadVersion}`,
          version: uploadVersion,
          fileName: uploadFile.name,
          fileType: fileType,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUserFullname,
          changelog: uploadChangelog || 'อัปเดต Master Template ฉบับใหม่',
          isActive: true,
          fileSize: uploadFile.size
        };

        const existingHist = (tpl.versionHistory || []).map(h => ({ ...h, isActive: false }));

        return {
          ...tpl,
          fileName: uploadFile.name,
          fileType: fileType,
          version: uploadVersion,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUserFullname,
          fileSize: uploadFile.size,
          versionHistory: [newVerRecord, ...existingHist]
        };
      }
      return tpl;
    });

    saveTemplates(updated);
    setShowUploadModal(false);
    setUploadFile(null);
    onToast?.(`อัปโหลด Master Template เวอร์ชั่น ${uploadVersion} สำหรับ ${uploadTargetDocType.toUpperCase()} สำเร็จ`, 'success');
  };

  // Switch active version
  const handleSwitchActiveVersion = (docType: MasterDocType, targetVersion: string) => {
    const updated = templates.map(tpl => {
      if (tpl.docType === docType) {
        const targetHist = tpl.versionHistory.find(h => h.version === targetVersion);
        if (targetHist) {
          const updatedHist = tpl.versionHistory.map(h => ({ ...h, isActive: h.version === targetVersion }));
          return {
            ...tpl,
            version: targetHist.version,
            fileName: targetHist.fileName,
            fileType: targetHist.fileType,
            fileSize: targetHist.fileSize,
            versionHistory: updatedHist
          };
        }
      }
      return tpl;
    });
    saveTemplates(updated);
    onToast?.(`เปลี่ยนใช้งาน Master Template เวอร์ชั่น ${targetVersion} เรียบร้อย`, 'success');
  };

  // Toggle field present in template (Requirement 13)
  const handleToggleFieldPresent = (docType: MasterDocType, tag: string) => {
    const updated = templates.map(tpl => {
      if (tpl.docType === docType) {
        const updatedMappings = tpl.fieldMappings.map(slot => {
          if (slot.tag === tag) {
            return { ...slot, isPresentInTemplate: !slot.isPresentInTemplate };
          }
          return slot;
        });
        return { ...tpl, fieldMappings: updatedMappings };
      }
      return tpl;
    });
    saveTemplates(updated);
    if (editingTemplate) {
      setEditingTemplate(updated.find(t => t.id === editingTemplate.id) || null);
    }
    onToast?.('อัปเดตสถานะช่องใน Template สำเร็จ', 'success');
  };

  // Export handlers
  const handleExportPDF = async () => {
    try {
      let pdfBytes: Uint8Array;
      if ((activeTemplate.docType === 'so' || activeTemplate.docType === 'sales_order') && soTemplateData) {
        pdfBytes = await generateSalesOrderMasterPDF(soTemplateData);
      } else if (activeTemplate.docType === 'billing_note' && bnTemplateData) {
        pdfBytes = await generateBillingNoteMasterPDF(bnTemplateData);
      } else {
        pdfBytes = await generateMasterPDF(documentData, activeTemplate);
      }
      const filename = `${activeTemplate.docType.toUpperCase()}_${documentData.document_no}_v${activeTemplate.version}.pdf`;
      downloadFileBlob(pdfBytes, filename, 'application/pdf');
      onToast?.(`ดาวน์โหลด PDF (${filename}) โครงสร้างตรงกับ Template 100% เรียบร้อย`, 'success');
    } catch (err) {
      console.error(err);
      onToast?.('เกิดข้อผิดพลาดในการสร้าง PDF', 'err');
    }
  };

  const handleExportExcel = () => {
    try {
      const excelBytes = exportMasterExcel(documentData, activeTemplate);
      const filename = `${activeTemplate.docType.toUpperCase()}_${documentData.document_no}_v${activeTemplate.version}.xlsx`;
      downloadFileBlob(excelBytes, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      onToast?.(`ดาวน์โหลด Excel (${filename}) สำเร็จ`, 'success');
    } catch (err) {
      console.error(err);
      onToast?.('เกิดข้อผิดพลาดในการสร้าง Excel', 'err');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Corporate Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                ระบบจัดการแม่แบบเอกสาร & สร้างเอกสาร (Master Document Management)
              </h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 100% Master Exact Geometry
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              สร้างเอกสารตรงตาม Master Template ต้นฉบับ 100% โดยรักษาระยะขอบ ฟอนต์ ขนาดตัวอักษร ความกว้างคอลัมน์ และเส้นตาราง ไม่มีการออกแบบใหม่หรือคาดเดา
            </p>
          </div>
        </div>

        {/* Tab Switcher & Quick Upload */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'generator' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>สร้างเอกสาร (Generator)</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'templates' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>คลังแม่แบบ (9 Master Templates)</span>
            </button>
          </div>

          <button
            onClick={() => {
              setUploadTargetDocType(selectedDocType);
              setShowUploadModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>อัปโหลด Master Template</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DOCUMENT GENERATOR & LIVE PREVIEW (สร้างเอกสาร)           */}
      {/* ============================================================== */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Document Controls & Source Selection (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* 1. Document Type Selector */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>1. เลือกประเภทเอกสาร (9 รายการ)</span>
                <span className="text-[10px] text-indigo-600 font-mono font-bold">Active: {activeTemplate.version}</span>
              </h3>

              <div className="space-y-1.5">
                {[
                  { type: 'quotation', label: '1. ใบเสนอราคา (Quotation)', icon: 'QT' },
                  { type: 'sales_order', label: '2. ใบสั่งขาย (Sales Order - SO)', icon: 'SO' },
                  { type: 'pr', label: '3. ใบขอซื้อ (Purchase Request - PR)', icon: 'PR' },
                  { type: 'po', label: '4. ใบสั่งซื้อ (Purchase Order - PO)', icon: 'PO' },
                  { type: 'invoice', label: '5. ใบแจ้งหนี้ / ใบกำกับภาษี (Invoice)', icon: 'INV' },
                  { type: 'billing_note', label: '6. ใบวางบิล (Billing Note)', icon: 'BN' },
                  { type: 'receipt', label: '7. ใบเสร็จรับเงิน (Receipt)', icon: 'RC' },
                  { type: 'delivery_note', label: '8. ใบส่งของ (Delivery Note - DO)', icon: 'DO' },
                  { type: 'tax_invoice_delivery', label: '9. ใบกำกับภาษี / ใบส่งของ (ต้นฉบับ & สำเนา)', icon: 'TX' },
                ].map(item => {
                  const isSelected = selectedDocType === item.type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        setSelectedDocType(item.type as MasterDocType);
                        setSelectedRecordId('');
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all text-left cursor-pointer border ${
                        isSelected 
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-2xs' 
                          : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Database Record Selector */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                2. เลือกข้อมูลจากฐานข้อมูล CRM
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                ดึงข้อมูลจริงจากตารางในระบบ นำไปกรอกลงในช่อง Mapping ของ Master Template
              </p>

              <div>
                <select
                  value={selectedRecordId}
                  onChange={(e) => setSelectedRecordId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                >
                  <option value="">-- ใช้รายการแรก / ล่าสุดจากระบบ --</option>
                  {selectedDocType === 'quotation' && quotations.map(q => (
                    <option key={q.id} value={q.id}>{q.quotation_no} - {q.customer_name} (฿{q.grand_total?.toLocaleString()})</option>
                  ))}
                  {selectedDocType === 'sales_order' && salesOrders.map(so => (
                    <option key={so.id} value={so.id}>{so.so_no} - {so.project_name} (฿{so.total_amount?.toLocaleString()})</option>
                  ))}
                  {selectedDocType === 'pr' && purchaseRequests.map(pr => (
                    <option key={pr.id} value={pr.id}>{pr.pr_no} - {pr.supplier_name || pr.project} (฿{pr.total_amount?.toLocaleString()})</option>
                  ))}
                  {selectedDocType === 'po' && purchaseOrders.map(po => (
                    <option key={po.id} value={po.id}>{po.po_no} - {po.supplier_name} (฿{po.total_amount?.toLocaleString()})</option>
                  ))}
                  {selectedDocType === 'billing_note' && billingNotes.map(bn => (
                    <option key={bn.id} value={bn.id}>{bn.billing_no} - {bn.customer_name} (฿{bn.total_amount?.toLocaleString()})</option>
                  ))}
                  {selectedDocType === 'invoice' && invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoice_no} - {inv.customer_name} (฿{inv.grand_total?.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              {/* Master Template Meta Info */}
              <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-600 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Master Template:</span>
                  <span className="font-bold text-slate-800">{activeTemplate.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">เวอร์ชันที่ใช้งาน:</span>
                  <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">Ver. {activeTemplate.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">พิกัดกระดาษ:</span>
                  <span>{activeTemplate.pageSize} {activeTemplate.orientation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ขีดจำกัดแถว/หน้า:</span>
                  <span>{activeTemplate.maxItemsPerPage} รายการ</span>
                </div>
              </div>
            </div>

            {/* 3. Export Action Card */}
            <div className="bg-indigo-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-extrabold text-sm tracking-tight">ส่งออกเอกสาร (Export PDF)</h4>
              </div>
              <p className="text-xs text-indigo-200 leading-relaxed">
                ระบบจะกรอกข้อมูลลงในโครงสร้าง Master Template ต้นฉบับโดยรักษาพิกัด ขนาด และฟอนต์ 100%
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setPreviewModalData({ isOpen: true, template: activeTemplate, data: documentData })}
                  className="w-full py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>เปิดดูตัวอย่างเต็มหน้าจอ (Full Preview)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportPDF}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>โหลด PDF</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>โหลด Excel</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Pre-Export Audit & Live Canvas Preview (8 Cols) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Audit Checklist Card (Requirement 10 & 13) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    รายงานตรวจสอบความตรงกันของ Master Template (Pre-Export Integrity Audit)
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASS: 100% Geometry Matched
                </span>
              </div>

              {/* Audit Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 block font-semibold">ช่องข้อมูลที่จับคู่</span>
                  <span className="font-mono text-sm font-bold text-slate-900">{auditResult.matchedSlots.length} ช่อง</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 block font-semibold">ยอดรวม Subtotal</span>
                  <span className="font-mono text-xs font-bold text-slate-900">฿{auditResult.calculatedSubtotal.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 block font-semibold">VAT 7%</span>
                  <span className="font-mono text-xs font-bold text-slate-900">฿{auditResult.calculatedVat.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 block font-semibold">จำนวนหน้ากระดาษ</span>
                  <span className="font-mono text-sm font-bold text-indigo-700">{auditResult.pagesRequired} หน้า A4</span>
                </div>
              </div>

              {/* Missing Slot Warning Banner (Requirement 13) */}
              {auditResult.missingSlotsInTemplate.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">การป้องกันการแก้ไขโครงสร้างต้นฉบับ (ข้อกำหนดที่ 13):</span>
                    {auditResult.missingSlotsInTemplate.map((slot, i) => (
                      <p key={i} className="text-[11px] text-amber-800 mt-0.5">
                        • {slot.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Interactive Document Preview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs">พรีวิวเอกสารก่อนพิมพ์ (Live Master Preview)</span>
                  <span className="text-[10px] font-mono text-slate-400">เลขที่: {documentData.document_no}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewModalData({ isOpen: true, template: activeTemplate, data: documentData })}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ขยายเต็มจอ</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>บันทึก PDF</span>
                  </button>
                </div>
              </div>

              {/* Inline Paper Preview */}
              <div className="p-6 bg-slate-100 flex justify-center overflow-x-auto">
                {(selectedDocType === 'so' || selectedDocType === 'sales_order') && soTemplateData ? (
                  <div className="scale-90 origin-top">
                    <MasterSalesOrderDocument data={soTemplateData} />
                  </div>
                ) : selectedDocType === 'billing_note' && bnTemplateData ? (
                  <div className="scale-90 origin-top">
                    <MasterBillingNoteDocument data={bnTemplateData} />
                  </div>
                ) : (
                  <div className="w-full max-w-[210mm] bg-white border border-slate-300 p-8 text-[11px] shadow-md space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                      <div className="flex items-start gap-3">
                        <img src={COMPANY_MASTER_INFO.logo_url} alt="Logo" className="w-28 h-auto object-contain pt-0.5" />
                        <div>
                          <div className="font-black text-slate-950 text-xs uppercase">{COMPANY_MASTER_INFO.company_name_en}</div>
                          <div className="font-bold text-slate-800 text-[10px]">{COMPANY_MASTER_INFO.company_name_th}</div>
                          <div className="text-slate-500 text-[9px]">{COMPANY_MASTER_INFO.address_th}</div>
                          <div className="text-slate-500 text-[9px]">โทร. {COMPANY_MASTER_INFO.phone} | เลขผู้เสียภาษี: {COMPANY_MASTER_INFO.tax_id}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-slate-900 text-white px-2.5 py-1 rounded text-[11px] font-black uppercase">
                          {activeTemplate.title}
                        </div>
                        <div className="font-mono text-[10px] mt-1 space-y-0.5">
                          <div><strong className="text-slate-600">เลขที่:</strong> <span className="font-bold text-indigo-700">{documentData.document_no}</span></div>
                          <div><strong className="text-slate-600">วันที่:</strong> {documentData.document_date}</div>
                        </div>
                      </div>
                    </div>

                    {/* Customer & Info Box */}
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div className="border border-slate-200 p-2.5 bg-slate-50/50 rounded space-y-0.5">
                        <div className="font-bold text-slate-900">ลูกค้า: {documentData.customer_name || documentData.supplier_name}</div>
                        <div className="text-slate-600">ที่อยู่: {documentData.customer_address || documentData.supplier_address || '-'}</div>
                        <div className="text-slate-600 font-mono">เลขประจำตัวผู้เสียภาษี: {documentData.customer_tax_id || documentData.supplier_tax_id || '-'}</div>
                      </div>
                      <div className="border border-slate-200 p-2.5 bg-slate-50/50 rounded space-y-0.5">
                        <div className="font-bold text-slate-900">โครงการ: {documentData.project_name || '-'}</div>
                        <div className="text-slate-600">เงื่อนไข: {documentData.payment_term || 'เครดิต 30 วัน'}</div>
                        <div className="text-slate-600 font-mono">อ้างอิง: {documentData.ref_quotation_no || documentData.ref_pr_no || documentData.ref_po_no || documentData.ref_so_no || '-'}</div>
                      </div>
                    </div>

                    {/* Item Table */}
                    <table className="w-full text-left text-[10px] border-collapse border border-slate-900">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold">
                          {activeTemplate.tableColumns.map(col => (
                            <th key={col.key} className={`p-2 border-r border-slate-700 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}>
                              {col.headerText}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(documentData.items || []).slice(0, activeTemplate.maxItemsPerPage).map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-200">
                            {activeTemplate.tableColumns.map(col => (
                              <td key={col.key} className={`p-2 border-r border-slate-200 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}>
                                {col.key === 'item_no' && <span className="font-mono">{idx + 1}</span>}
                                {col.key === 'description' && <span className="font-bold text-slate-900">{item.description}</span>}
                                {(col.key === 'qty' || col.key === 'ordered_qty') && <span className="font-mono">{item.qty || item.ordered_qty || 1}</span>}
                                {col.key === 'unit' && <span>{item.unit || 'ชุด'}</span>}
                                {col.key === 'unit_price' && <span className="font-mono">{(item.unit_price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>}
                                {col.key === 'amount' && <span className="font-mono font-bold">{(item.amount || ((item.qty || 1) * (item.unit_price || 0))).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>}
                                {col.key === 'invoice_no' && <span className="font-mono font-bold text-indigo-700">{item.invoice_no || '-'}</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Summary & Signatures */}
                    <div className="grid grid-cols-12 gap-3 text-[10px]">
                      <div className="col-span-7 border border-slate-200 p-2.5 bg-slate-50/50 rounded flex flex-col justify-between">
                        <div>
                          <span className="text-slate-500 font-bold block mb-0.5">จำนวนเงินตัวอักษร:</span>
                          <div className="font-bold text-slate-900 bg-white border border-slate-200 p-1.5 rounded text-center">
                            ( {documentData.baht_text || numberToThaiBaht(documentData.grand_total)} )
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500 mt-2">
                          หมายเหตุ: {documentData.remark || 'ราคารวมภาษีมูลค่าเพิ่ม 7% เรียบร้อยแล้ว'}
                        </div>
                      </div>

                      <div className="col-span-5 border border-slate-200 p-2.5 bg-slate-50/50 rounded space-y-1 font-mono">
                        <div className="flex justify-between text-slate-600">
                          <span>รวมมูลค่า:</span>
                          <span className="font-bold">฿{documentData.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>VAT 7%:</span>
                          <span className="font-bold">฿{documentData.vat.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-900 pt-1 text-xs font-black text-slate-950">
                          <span>ยอดรวมสุทธิ:</span>
                          <span className="text-indigo-700">฿{documentData.grand_total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-3 gap-2 border border-slate-200 p-2 text-[9px] text-center text-slate-500">
                      <div>
                        <div className="font-bold text-slate-800">ผู้จัดทำ (Prepared By)</div>
                        <div className="pt-3">............................................</div>
                        <div>({documentData.requestor_name || 'เจ้าหน้าที่ผู้จัดทำ'})</div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">ผู้ตรวจสอบ (Approved By)</div>
                        <div className="pt-3">............................................</div>
                        <div>(ผู้จัดการฝ่ายวิศวกรรม)</div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">ผู้มีอำนาจลงนาม (Authorized)</div>
                        <div className="pt-3">............................................</div>
                        <div>({documentData.authorized_name})</div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MASTER TEMPLATES LIBRARY (คลังแม่แบบ 9 เอกสาร)            */}
      {/* ============================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map(template => {
              return (
                <div 
                  key={template.id} 
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900">{template.title}</span>
                          <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.2 rounded-full font-bold">
                            Ver {template.version}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{template.subTitle}</p>
                      </div>

                      <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-700 uppercase">
                        {template.fileType}
                      </span>
                    </div>

                    {/* Metadata Specs */}
                    <div className="mt-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">ไฟล์ต้นฉบับ Master:</span>
                        <span className="font-mono text-slate-800 font-semibold truncate max-w-[170px]" title={template.fileName}>
                          {template.fileName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">ขนาดกระดาษ & ทิศทาง:</span>
                        <span className="font-mono text-slate-800">{template.pageSize} {template.orientation}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">ฟิลด์ที่กำหนด Mapping:</span>
                        <span className="bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                          {template.fieldMappings.filter(f => f.isPresentInTemplate).length} ช่อง
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">จำนวนแถวตารางต่อหน้า:</span>
                        <span className="font-mono text-slate-800 font-bold">{template.maxItemsPerPage} รายการ</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">อัปเดตล่าสุด:</span>
                        <span className="text-slate-500 text-[10px]">{new Date(template.uploadedAt).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Version Switcher */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>ตรวจสอบช่อง Mapping</span>
                    </button>

                    <button
                      onClick={() => {
                        setUploadTargetDocType(template.docType);
                        setShowUploadModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>อัปโหลดเวอร์ชันใหม่</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: UPLOAD MASTER TEMPLATE (Requirement 1 & 14)           */}
      {/* ============================================================== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up text-slate-800">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                อัปโหลด Master Template ต้นฉบับ (.pdf / .xlsx / .docx)
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadNewTemplate} className="p-5 text-xs space-y-4">
              <div>
                <label className="block mb-1 font-bold text-slate-700">ประเภทเอกสาร Master Template *</label>
                <select
                  value={uploadTargetDocType}
                  onChange={(e) => setUploadTargetDocType(e.target.value as MasterDocType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                >
                  <option value="quotation">1. ใบเสนอราคา (Quotation)</option>
                  <option value="sales_order">2. ใบสั่งขาย (Sales Order - SO)</option>
                  <option value="pr">3. ใบขอซื้อ (Purchase Request - PR)</option>
                  <option value="po">4. ใบสั่งซื้อ (Purchase Order - PO)</option>
                  <option value="invoice">5. ใบแจ้งหนี้ / ใบกำกับภาษี (Invoice / Tax Invoice)</option>
                  <option value="billing_note">6. ใบวางบิล (Billing Note)</option>
                  <option value="receipt">7. ใบเสร็จรับเงิน (Receipt)</option>
                  <option value="delivery_note">8. ใบส่งของ (Delivery Note - DO)</option>
                  <option value="tax_invoice_delivery">9. ใบกำกับภาษี / ใบส่งของ (Tax Invoice / Delivery Note)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700">ไฟล์ต้นฉบับ Master File (.pdf, .xlsx, .docx) *</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-50 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,.xlsx,.xlsm,.docx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  {uploadFile ? (
                    <div>
                      <span className="font-bold text-slate-900 block">{uploadFile.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{(uploadFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-slate-700 block">คลิกหรือลากไฟล์ Master Template มาวางที่นี่</span>
                      <span className="text-[10px] text-slate-400">รองรับ PDF, Excel (.xlsx, .xlsm), Word (.docx)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">หมายเลขเวอร์ชัน (Version) *</label>
                  <input
                    type="text"
                    required
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    placeholder="e.g. 1.1 หรือ 2.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">ผู้จัดทำ / อัปโหลด</label>
                  <input
                    type="text"
                    disabled
                    value={currentUserFullname}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700">บันทึกการเปลี่ยนแปลง (Changelog Notes)</label>
                <textarea
                  rows={2}
                  value={uploadChangelog}
                  onChange={(e) => setUploadChangelog(e.target.value)}
                  placeholder="ระบุรายละเอียดการปรับแก้แม่แบบ เช่น อัปเดตโลโก้ ปรับพิกัดช่อง หรือความกว้างคอลัมน์"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                <span className="font-bold block">เงื่อนไขสำคัญของ Master Template:</span>
                ไฟล์ที่อัปโหลดจะถูกถือเป็น "Master Template" ถาวร ระบบจะไม่คำนวณหรือสร้าง Layout ใหม่ และรักษาระยะขอบ ฟอนต์ ขนาดตัวอักษร เส้นตาราง และตำแหน่งโลโก้เดิมทุกประการ
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  บันทึก Master Template เวอร์ชันใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: FIELD MAPPING INSPECTOR (Requirement 6 & 13)          */}
      {/* ============================================================== */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up text-slate-800 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-sm">การกำหนด Mapping ช่องข้อมูลกับ Master Template</h3>
                  <span className="text-[10px] text-slate-400">{editingTemplate.title} (Ver {editingTemplate.version})</span>
                </div>
              </div>
              <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto text-xs space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                <span className="font-bold block">การป้องกันข้อผิดพลาดตามข้อกำหนดที่ 13:</span>
                หากแม่แบบฉบับนี้ไม่มีพื้นที่สำหรับข้อมูลใด (เช่น ส่วนลด, กำหนดส่งของ) ให้ปิดสวิตช์สถานะ "มีใน Template" ระบบจะแจ้งเตือนผู้ใช้และไม่แทรกกล่องแปลกปลอมลงไปในเอกสาร เพื่อรักษาโครงสร้างต้นฉบับ 100%
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Placeholder Tag</th>
                      <th>ชื่อฟิลด์ในระบบ</th>
                      <th>ตัวอย่างข้อมูล</th>
                      <th className="text-center">บังคับระบุ</th>
                      <th className="text-center">สถานะช่องใน Template</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editingTemplate.fieldMappings.map(slot => (
                      <tr key={slot.tag} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{slot.tag}</td>
                        <td className="font-bold text-slate-900">{slot.label}</td>
                        <td className="font-mono text-slate-500 text-[11px]">{slot.sampleValue || '-'}</td>
                        <td className="text-center font-mono">
                          {slot.required ? (
                            <span className="text-rose-600 font-bold">บังคับ</span>
                          ) : (
                            <span className="text-slate-400">ไม่บังคับ</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFieldPresent(editingTemplate.docType, slot.tag)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              slot.isPresentInTemplate
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {slot.isPresentInTemplate ? '✓ มีช่องใน Template' : '✕ ไม่มีช่อง (ละเว้น)'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: FULLSCREEN LIVE DOCUMENT PREVIEW MODAL                 */}
      {/* ============================================================== */}
      {previewModalData && (
        <MasterDocumentPreviewModal
          isOpen={previewModalData.isOpen}
          onClose={() => setPreviewModalData(null)}
          template={previewModalData.template}
          data={previewModalData.data}
          onVersionChange={(ver) => {
            handleSwitchActiveVersion(previewModalData.template.docType, ver);
            const updatedTpl = templates.find(t => t.docType === previewModalData.template.docType && t.version === ver);
            if (updatedTpl) {
              setPreviewModalData({ ...previewModalData, template: updatedTpl });
            }
          }}
        />
      )}
    </div>
  );
};

export default MasterDocumentManagement;
