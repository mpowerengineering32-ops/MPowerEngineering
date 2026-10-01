import { MasterDocType, MasterTemplate } from '../types';

export const DEFAULT_MASTER_TEMPLATES: MasterTemplate[] = [
  // 1. Quotation
  {
    id: 'tpl-quotation-v1',
    docType: 'quotation',
    title: 'ใบเสนอราคา (Quotation)',
    subTitle: 'M Power Engineering Solutions Master Template',
    fileName: 'Quotation_Master_Template_MPOWER.pdf',
    fileType: 'pdf',
    version: '1.0',
    isActive: true,
    uploadedAt: '2026-09-25T10:00:00Z',
    uploadedBy: 'System Administrator (mpowerengineering32@gmail.com)',
    fileSize: 184520,
    pageSize: 'A4',
    orientation: 'portrait',
    maxItemsPerPage: 6,
    fieldMappings: [
      { tag: '{{DOCUMENT_NO}}', key: 'document_no', label: 'เลขที่ใบเสนอราคา', required: true, isPresentInTemplate: true, sampleValue: 'QT-26001', category: 'header' },
      { tag: '{{DOCUMENT_DATE}}', key: 'document_date', label: 'วันที่เสนอราคา', required: true, isPresentInTemplate: true, sampleValue: '25/09/2026', category: 'header' },
      { tag: '{{CUSTOMER_NAME}}', key: 'customer_name', label: 'ชื่อบริษัท / ลูกค้า', required: true, isPresentInTemplate: true, sampleValue: 'บริษัท ปตท. จำกัด (มหาชน)', category: 'customer' },
      { tag: '{{CUSTOMER_ADDRESS}}', key: 'customer_address', label: 'ที่อยู่ลูกค้า', required: true, isPresentInTemplate: true, sampleValue: '555 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900', category: 'customer' },
      { tag: '{{CUSTOMER_TAX_ID}}', key: 'customer_tax_id', label: 'เลขประจำตัวผู้เสียภาษี', required: true, isPresentInTemplate: true, sampleValue: '0107544000108', category: 'customer' },
      { tag: '{{PROJECT_NAME}}', key: 'project_name', label: 'ชื่องาน / โครงการ', required: true, isPresentInTemplate: true, sampleValue: 'Hydrotest Pump & Rental Equipment Services', category: 'header' },
      { tag: '{{PAYMENT_TERM}}', key: 'payment_term', label: 'เงื่อนไขการชำระเงิน', required: false, isPresentInTemplate: true, sampleValue: 'เครดิต 30 วัน', category: 'header' },
      { tag: '{{VALIDITY_DAYS}}', key: 'validity_days', label: 'กำหนดยืนราคา (วัน)', required: false, isPresentInTemplate: true, sampleValue: '30 วัน', category: 'header' },
      { tag: '{{SUBTOTAL}}', key: 'subtotal', label: 'จำนวนเงินรวมก่อนภาษี', required: true, isPresentInTemplate: true, sampleValue: '120,000.00', category: 'summary' },
      { tag: '{{DISCOUNT}}', key: 'discount', label: 'ส่วนลดพิเศษ', required: false, isPresentInTemplate: true, sampleValue: '0.00', category: 'summary' },
      { tag: '{{VAT}}', key: 'vat', label: 'ภาษีมูลค่าเพิ่ม 7%', required: true, isPresentInTemplate: true, sampleValue: '8,400.00', category: 'summary' },
      { tag: '{{GRAND_TOTAL}}', key: 'grand_total', label: 'ยอดเงินรวมสุทธิ', required: true, isPresentInTemplate: true, sampleValue: '128,400.00', category: 'summary' },
      { tag: '{{BAHT_TEXT}}', key: 'baht_text', label: 'จำนวนเงินเป็นตัวอักษร', required: true, isPresentInTemplate: true, sampleValue: 'หนึ่งแสนสองหมื่นแปดพันสี่ร้อยบาทถ้วน', category: 'summary' },
      { tag: '{{REMARK}}', key: 'remark', label: 'หมายเหตุ / เงื่อนไขเพิ่มเติม', required: false, isPresentInTemplate: true, sampleValue: 'ราคานี้รวมค่าขนส่งและติดตั้ง ณ หน้างานเรียบร้อยแล้ว', category: 'other' },
      { tag: '{{AUTHORIZED_NAME}}', key: 'authorized_name', label: 'ผู้มีอำนาจลงนาม', required: true, isPresentInTemplate: true, sampleValue: 'นายพงษ์ศักดิ์ บุญประเสริฐ', category: 'sign' },
    ],
    tableColumns: [
      { colIndex: 1, key: 'item_no', headerText: 'ลำดับ', widthPct: 8, align: 'center', excelCol: 'A' },
      { colIndex: 2, key: 'description', headerText: 'รายการ / รายละเอียดสินค้าหรือบริการ (Description)', widthPct: 46, align: 'left', excelCol: 'B' },
      { colIndex: 3, key: 'qty', headerText: 'จำนวน', widthPct: 10, align: 'center', excelCol: 'C' },
      { colIndex: 4, key: 'unit', headerText: 'หน่วย', widthPct: 10, align: 'center', excelCol: 'D' },
      { colIndex: 5, key: 'unit_price', headerText: 'ราคา/หน่วย (บาท)', widthPct: 13, align: 'right', excelCol: 'E' },
      { colIndex: 6, key: 'amount', headerText: 'จำนวนเงิน (บาท)', widthPct: 13, align: 'right', excelCol: 'F' }
    ],
    versionHistory: [
      { id: 'v-qt-1.0', version: '1.0', fileName: 'Quotation_Master_Template_MPOWER.pdf', fileType: 'pdf', uploadedAt: '2026-09-25T10:00:00Z', uploadedBy: 'System Administrator', changelog: 'เวอร์ชันตั้งต้น นำเข้า Master Template ต้นฉบับตรงตามแบบบริษัท', isActive: true, fileSize: 184520 }
    ]
  },

  // 2. Sales Order (Sale Order Master Template)
  {
    id: 'tpl-sales-order-v1',
    docType: 'sales_order',
    title: 'Sale Order',
    subTitle: 'M Power Engineering Solutions Master Template',
    fileName: 'Sale_Order_Master_Template.pdf',
    fileType: 'pdf',
    version: '1.0',
    isActive: true,
    uploadedAt: '2026-09-29T10:15:00Z',
    uploadedBy: 'System Administrator (mpowerengineering32@gmail.com)',
    fileSize: 192300,
    pageSize: 'A4',
    orientation: 'portrait',
    maxItemsPerPage: 6,
    fieldMappings: [
      { tag: '{{DOCUMENT_NO}}', key: 'document_no', label: 'Sale Order No. :', required: true, isPresentInTemplate: true, sampleValue: 'SO-2609001', category: 'header' },
      { tag: '{{DOCUMENT_DATE}}', key: 'document_date', label: 'Date :', required: true, isPresentInTemplate: true, sampleValue: '01-09-2026', category: 'header' },
      { tag: '{{PAYMENT_TERM}}', key: 'payment_term', label: 'Terms of Payment :', required: true, isPresentInTemplate: true, sampleValue: '30 Days', category: 'header' },
      { tag: '{{SALES_NAME}}', key: 'sales_person', label: 'Sales Name :', required: true, isPresentInTemplate: true, sampleValue: 'Pornpicha O.', category: 'header' },
      { tag: '{{CUSTOMER_NAME}}', key: 'customer_name', label: 'Customer :', required: true, isPresentInTemplate: true, sampleValue: 'IKM Testing (Thailand) Co., Ltd', category: 'customer' },
      { tag: '{{CUSTOMER_ADDRESS}}', key: 'customer_address', label: 'Customer Address', required: true, isPresentInTemplate: true, sampleValue: '155/167 Moo 5, Samnakthon Sub-District\nBanchang District, Rayong, Thailand 21130', category: 'customer' },
      { tag: '{{CUSTOMER_TAX_ID}}', key: 'customer_tax_id', label: 'Tax ID:', required: true, isPresentInTemplate: true, sampleValue: '0215552000909 (Head Office)', category: 'customer' },
      { tag: '{{CONTACT_PERSON}}', key: 'contact_person', label: 'Attn:', required: false, isPresentInTemplate: true, sampleValue: 'Khun Apiyut', category: 'customer' },
      { tag: '{{CUSTOMER_PHONE}}', key: 'customer_phone', label: 'Tel:', required: false, isPresentInTemplate: true, sampleValue: '038-601 996-8', category: 'customer' },
      { tag: '{{AMOUNT}}', key: 'subtotal', label: 'AMOUNT', required: true, isPresentInTemplate: true, sampleValue: '2,800.00', category: 'summary' },
      { tag: '{{VAT}}', key: 'vat', label: 'SALES VAT 7%', required: true, isPresentInTemplate: true, sampleValue: '196.00', category: 'summary' },
      { tag: '{{TOTAL_AMOUNT}}', key: 'grand_total', label: 'TOTAL AMOUNT', required: true, isPresentInTemplate: true, sampleValue: '2,996.00', category: 'summary' },
      { tag: '{{BAHT_TEXT_EN}}', key: 'baht_text_en', label: 'English Baht Words', required: true, isPresentInTemplate: true, sampleValue: 'TWO THOUSAND NINE HUNDRED NINETY SIX BAHT', category: 'summary' },
      { tag: '{{PREPARED_BY}}', key: 'prepared_by', label: 'Prepared By', required: true, isPresentInTemplate: true, sampleValue: '......................................................', category: 'sign' },
      { tag: '{{AUTHORIZED_SIGNATURE}}', key: 'authorized_name', label: 'Authorized Signature', required: true, isPresentInTemplate: true, sampleValue: '......................................................', category: 'sign' },
      // Fields in CRM database that have NO SLOT in the Master Template (Rule 12/13)
      { tag: '{{PROJECT_NAME}}', key: 'project_name', label: 'ชื่องาน / แคมเปญโครงการ', required: false, isPresentInTemplate: false, sampleValue: 'Hydrotest Service', category: 'header' },
      { tag: '{{DELIVERY_TERMS}}', key: 'delivery_date', label: 'กำหนดวันส่งมอบงาน (Delivery Terms)', required: false, isPresentInTemplate: false, sampleValue: '15/10/2026', category: 'header' },
      { tag: '{{DISCOUNT}}', key: 'discount', label: 'ส่วนลด (Discount)', required: false, isPresentInTemplate: false, sampleValue: '0.00', category: 'summary' }
    ],
    tableColumns: [
      { colIndex: 1, key: 'qty', headerText: 'Quantity', widthPct: 12, align: 'center', excelCol: 'A' },
      { colIndex: 2, key: 'description', headerText: 'Drescription', widthPct: 56, align: 'left', excelCol: 'B' },
      { colIndex: 3, key: 'unit_price', headerText: 'Unit Price (THB)', widthPct: 16, align: 'right', excelCol: 'C' },
      { colIndex: 4, key: 'amount', headerText: 'Amount (THB)', widthPct: 16, align: 'right', excelCol: 'D' }
    ],
    versionHistory: [
      { id: 'v-so-1.0', version: '1.0', fileName: 'Sale_Order_Master_Template.pdf', fileType: 'pdf', uploadedAt: '2026-09-29T10:15:00Z', uploadedBy: 'System Administrator', changelog: 'Master Template ต้นฉบับตรงตามแบบ 100% พร้อมช่อง Drescription, Amount และ English Baht Words', isActive: true, fileSize: 192300 }
    ]
  },

  // 3. Purchase Request (PR) - Master Template PR.pdf 100% Match
  {
    id: 'tpl-pr-v1',
    docType: 'pr',
    title: 'ใบขอซื้อ (Purchase Request - PR)',
    subTitle: 'M Power Engineering Solutions Master Template (PR.pdf 100%)',
    fileName: 'PR.pdf',
    fileType: 'pdf',
    version: '1.0',
    isActive: true,
    uploadedAt: '2026-09-25T10:30:00Z',
    uploadedBy: 'System Administrator',
    fileSize: 178900,
    pageSize: 'A4',
    orientation: 'portrait',
    maxItemsPerPage: 6,
    fieldMappings: [
      { tag: '{{PR_NO}}', key: 'document_no', label: 'PR. No. :', required: true, isPresentInTemplate: true, sampleValue: '2609001', category: 'header' },
      { tag: '{{PR_DATE}}', key: 'document_date', label: 'Date :', required: true, isPresentInTemplate: true, sampleValue: '01-Sep-26', category: 'header' },
      { tag: '{{DUE_DATE}}', key: 'due_date', label: 'Due Date :', required: true, isPresentInTemplate: true, sampleValue: 'Cash', category: 'header' },
      { tag: '{{SUPPLIER_NAME}}', key: 'supplier_name', label: 'Supplier :', required: true, isPresentInTemplate: true, sampleValue: 'Dacon Trading Co., Ltd. (Head Office)', category: 'customer' },
      { tag: '{{SUPPLIER_ADDRESS}}', key: 'supplier_address', label: 'Address :', required: true, isPresentInTemplate: true, sampleValue: '88/9 Moo 3, Phala, Banchang, Rayong 21130 Thailand', category: 'customer' },
      { tag: '{{SUPPLIER_TAX_ID}}', key: 'supplier_tax_id', label: 'Tax ID No. :', required: true, isPresentInTemplate: true, sampleValue: '0215542000248', category: 'customer' },
      { tag: '{{SUPPLIER_PHONE}}', key: 'supplier_phone', label: 'Tel. :', required: false, isPresentInTemplate: true, sampleValue: '081-8935437', category: 'customer' },
      { tag: '{{ATTN}}', key: 'attn', label: 'Attn. :', required: false, isPresentInTemplate: true, sampleValue: 'Khun Chatcha', category: 'customer' },
      { tag: '{{SALES_NAME}}', key: 'sales_name', label: 'Sales Name :', required: false, isPresentInTemplate: true, sampleValue: 'Praiya', category: 'header' },
      { tag: '{{REF_CUSTOMER}}', key: 'ref_customer', label: 'Ref. Customer :', required: false, isPresentInTemplate: true, sampleValue: 'Promt Solution', category: 'header' },
      { tag: '{{SUBTOTAL}}', key: 'subtotal', label: 'AMOUNT', required: true, isPresentInTemplate: true, sampleValue: '38,200.00', category: 'summary' },
      { tag: '{{VAT}}', key: 'vat', label: 'SALES VAT 7%', required: true, isPresentInTemplate: true, sampleValue: '2,674.00', category: 'summary' },
      { tag: '{{GRAND_TOTAL}}', key: 'grand_total', label: 'TOTAL AMOUNT', required: true, isPresentInTemplate: true, sampleValue: '40,874.00', category: 'summary' },
      { tag: '{{BAHT_TEXT_EN}}', key: 'baht_text_en', label: 'BAHT TEXT (EN)', required: true, isPresentInTemplate: true, sampleValue: 'FORTY THOUSAND EIGHT HUNDRED AND SEVENTY FOUR BAHT ONLY', category: 'summary' },
      { tag: '{{DELIVERY_REMARK}}', key: 'delivery_remark', label: 'Delivery Remark', required: false, isPresentInTemplate: true, sampleValue: '* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด', category: 'other' },
      { tag: '{{REQUESTD_BY}}', key: 'requested_by', label: 'Requestd By', required: true, isPresentInTemplate: true, sampleValue: 'Requestd By', category: 'sign' },
      { tag: '{{APPROVED_BY}}', key: 'approved_by', label: 'Approved By', required: true, isPresentInTemplate: true, sampleValue: 'Approved By', category: 'sign' }
    ],
    tableColumns: [
      { colIndex: 1, key: 'quantity', headerText: 'Quantity', widthPct: 12, align: 'center' },
      { colIndex: 2, key: 'description', headerText: 'Drescription', widthPct: 52, align: 'left' },
      { colIndex: 3, key: 'unit_price', headerText: 'Unit Price (THB)', widthPct: 18, align: 'right' },
      { colIndex: 4, key: 'amount', headerText: 'Amount (THB)', widthPct: 18, align: 'right' }
    ],
    versionHistory: [
      { id: 'v-pr-1.0', version: '1.0', fileName: 'PR.pdf', fileType: 'pdf', uploadedAt: '2026-09-25T10:30:00Z', uploadedBy: 'System Administrator', changelog: 'แม่แบบ PR.pdf Master Template 100% Geometry Matched (Boxed Layout, Requestd By / Approved By)', isActive: true, fileSize: 178900 }
    ]
  },

  // 4. Purchase Order (PO) - Master Template PO.pdf 100% Match
  {
    id: 'tpl-po-v1',
    docType: 'po',
    title: 'ใบสั่งซื้อ (Purchase Order - PO)',
    subTitle: 'M Power Engineering Solutions Master Template (PO.pdf 100%)',
    fileName: 'PO.pdf',
    fileType: 'pdf',
    version: '1.0',
    isActive: true,
    uploadedAt: '2026-09-25T10:45:00Z',
    uploadedBy: 'System Administrator',
    fileSize: 195400,
    pageSize: 'A4',
    orientation: 'portrait',
    maxItemsPerPage: 6,
    fieldMappings: [
      { tag: '{{PO_NO}}', key: 'document_no', label: 'PO. No. :', required: true, isPresentInTemplate: true, sampleValue: '2609001', category: 'header' },
      { tag: '{{PO_DATE}}', key: 'document_date', label: 'Date :', required: true, isPresentInTemplate: true, sampleValue: '01-Sep-26', category: 'header' },
      { tag: '{{DUE_DATE}}', key: 'due_date', label: 'Due Date :', required: true, isPresentInTemplate: true, sampleValue: 'Cash', category: 'header' },
      { tag: '{{SUPPLIER_NAME}}', key: 'supplier_name', label: 'Supplier :', required: true, isPresentInTemplate: true, sampleValue: 'Dacon Trading Co., Ltd. (Head Office)', category: 'customer' },
      { tag: '{{SUPPLIER_ADDRESS}}', key: 'supplier_address', label: 'Address :', required: true, isPresentInTemplate: true, sampleValue: '88/9 Moo 3, Phala, Banchang, Rayong 21130 Thailand', category: 'customer' },
      { tag: '{{SUPPLIER_TAX_ID}}', key: 'supplier_tax_id', label: 'Tax ID No. :', required: true, isPresentInTemplate: true, sampleValue: '0215542000248', category: 'customer' },
      { tag: '{{SALES_NAME}}', key: 'sales_name', label: 'Sales Name :', required: false, isPresentInTemplate: true, sampleValue: 'Praiya', category: 'header' },
      { tag: '{{SUPPLIER_PHONE}}', key: 'supplier_phone', label: 'Tel. :', required: false, isPresentInTemplate: true, sampleValue: '081-8935437', category: 'customer' },
      { tag: '{{REF_CUSTOMER}}', key: 'ref_customer', label: 'Ref. Customer :', required: false, isPresentInTemplate: true, sampleValue: 'Promt Solution', category: 'header' },
      { tag: '{{ATTN}}', key: 'attn', label: 'Attn. :', required: false, isPresentInTemplate: true, sampleValue: 'Khun Chatcha', category: 'customer' },
      { tag: '{{SUBTOTAL}}', key: 'subtotal', label: 'AMOUNT', required: true, isPresentInTemplate: true, sampleValue: '38,200.00', category: 'summary' },
      { tag: '{{VAT}}', key: 'vat', label: 'SALES VAT 7%', required: true, isPresentInTemplate: true, sampleValue: '2,674.00', category: 'summary' },
      { tag: '{{GRAND_TOTAL}}', key: 'grand_total', label: 'TOTAL AMOUNT', required: true, isPresentInTemplate: true, sampleValue: '40,874.00', category: 'summary' },
      { tag: '{{BAHT_TEXT_EN}}', key: 'baht_text_en', label: 'BAHT TEXT (EN)', required: true, isPresentInTemplate: true, sampleValue: 'FORTY THOUSAND EIGHT HUNDRED AND SEVENTY FOUR BAHT', category: 'summary' },
      { tag: '{{DELIVERY_REMARK}}', key: 'delivery_remark', label: 'Delivery Remark', required: false, isPresentInTemplate: true, sampleValue: 'กรุณาจัดส่งสินค้าตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์เอ็นจิเนียริ่งโซลูชั่นส์ จำกัด เปิดบิล-ส่งของวันที่ 01-Sep-26', category: 'other' },
      { tag: '{{PREPARED_BY}}', key: 'prepared_by', label: 'Prepared By', required: true, isPresentInTemplate: true, sampleValue: 'Praiya', category: 'sign' },
      { tag: '{{APPROVED_BY}}', key: 'approved_by', label: 'Approved By', required: true, isPresentInTemplate: true, sampleValue: 'Authorized Manager', category: 'sign' }
    ],
    tableColumns: [
      { colIndex: 1, key: 'quantity', headerText: 'Quantity', widthPct: 12, align: 'center' },
      { colIndex: 2, key: 'description', headerText: 'Descriptions', widthPct: 52, align: 'left' },
      { colIndex: 3, key: 'unit_price', headerText: 'Unit Price (THB)', widthPct: 18, align: 'right' },
      { colIndex: 4, key: 'amount', headerText: 'Amount (THB)', widthPct: 18, align: 'right' }
    ],
    versionHistory: [
      { id: 'v-po-1.0', version: '1.0', fileName: 'PO.pdf', fileType: 'pdf', uploadedAt: '2026-09-25T10:45:00Z', uploadedBy: 'System Administrator', changelog: 'แม่แบบ PO.pdf Master Template 100% Geometry Matched (Page 1/1, Prepared By / Approved By)', isActive: true, fileSize: 195400 }
    ]
  },

  // 5. Invoice / Tax Invoice
  {
    id: 'tpl-invoice-v1',
    docType: 'invoice',
    title: 'ใบแจ้งหนี้ / ใบกำกับภาษี (Invoice / Tax Invoice)',
    subTitle: 'M Power Engineering Solutions Master Template',
    fileName: 'Invoice_Tax_Invoice_Master_Template.pdf',
    fileType: 'pdf',
    version: '1.0',
    isActive: true,
    uploadedAt: '2026-09-25T11:00:00Z',
    uploadedBy: 'System Administrator',
    fileSize: 188200,
    pageSize: 'A4',
    orientation: 'portrait',
    maxItemsPerPage: 6,
    fieldMappings: [
      { tag: '{{DOCUMENT_NO}}', key: 'document_no', label: 'เลขที่ใบแจ้งหนี้ (Invoice No.)', required: true, isPresentInTemplate: true, sampleValue: 'INV-26001', category: 'header' },
      { tag: '{{DOCUMENT_DATE}}', key: 'document_date', label: 'วันที่ออกใบแจ้งหนี้', required: true, isPresentInTemplate: true, sampleValue: '26/09/2026', category: 'header' },
      { tag: '{{DUE_DATE}}', key: 'due_date', label: 'วันครบกำหนดชำระ', required: true, isPresentInTemplate: true, sampleValue: '26/10/2026', category: 'header' },
      { tag: '{{CUSTOMER_NAME}}', key: 'customer_name', label: 'ชื่อผู้ซื้อ / ลูกค้า', required: true, isPresentInTemplate: true, sampleValue: 'บริษัท ปตท. จำกัด (มหาชน)', category: 'customer' },
      { tag: '{{CUSTOMER_ADDRESS}}', key: 'customer_address', label: 'ที่อยู่ผู้ซื้อ', required: true, isPresentInTemplate: true, sampleValue: '555 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900', category: 'customer' },
      { tag: '{{CUSTOMER_TAX_ID}}', key: 'customer_tax_id', label: 'เลขประจำตัวผู้เสียภาษี', required: true, isPresentInTemplate: true, sampleValue: '0107544000108', category: 'customer' },
      { tag: '{{CUSTOMER_BRANCH}}', key: 'customer_branch', label: 'สาขา', required: false, isPresentInTemplate: true, sampleValue: 'สำนักงานใหญ่', category: 'customer' },
      { tag: '{{REF_PO_NO}}', key: 'ref_po_no', label: 'อ้างอิงใบสั่งซื้อลูกค้า (PO No.)', required: false, isPresentInTemplate: true, sampleValue: 'PTT-PO-2026-99', category: 'header' },
      { tag: '{{SUBTOTAL}}', key: 'subtotal', label: 'มูลค่าสินค้ารวมก่อนภาษี', required: true, isPresentInTemplate: true, sampleValue: '120,000.00', category: 'summary' },
      { tag: '{{VAT}}', key: 'vat', label: 'ภาษีมูลค่าเพิ่ม 7%', required: true, isPresentInTemplate: true, sampleValue: '8,400.00', category: 'summary' },
      { tag: '{{GRAND_TOTAL}}', key: 'grand_total', label: 'ยอดเงินรวมสุทธิ', required: true, isPresentInTemplate: true, sampleValue: '128,400.00', category: 'summary' },
      { tag: '{{BAHT_TEXT}}', key: 'baht_text', label: 'ตัวอักษร', required: true, isPresentInTemplate: true, sampleValue: 'หนึ่งแสนสองหมื่นแปดพันสี่ร้อยบาทถ้วน', category: 'summary' },
      { tag: '{{AUTHORIZED_NAME}}', key: 'authorized_name', label: 'ผู้มีอำนาจลงนาม', required: true, isPresentInTemplate: true, sampleValue: 'นายพงษ์ศักดิ์ บุญประเสริฐ', category: 'sign' },
    ],
    tableColumns: [
      { colIndex: 1, key: 'item_no', headerText: 'ลำดับ', widthPct: 8, align: 'center' },
      { colIndex: 2, key: 'description', headerText: 'รายการสินค้าหรือบริการ (Description)', widthPct: 46, align: 'left' },
      { colIndex: 3, key: 'qty', headerText: 'จำนวน', widthPct: 10, align: 'center' },
      { colIndex: 4, key: 'unit', headerText: 'หน่วย', widthPct: 10, align: 'center' },
      { colIndex: 5, key: 'unit_price', headerText: 'ราคาต่อหน่วย', widthPct: 13, align: 'right' },
      { colIndex: 6, key: 'amount', headerText: 'จำนวนเงิน (บาท)', widthPct: 13, align: 'right' }
    ],
    versionHistory: [
      { id: 'v-inv-1.0', version: '1.0', fileName: 'Invoice_Tax_Invoice_Master_Template.pdf', fileType: 'pdf', uploadedAt: '2026-09-25T11:00:00Z', uploadedBy: 'System Administrator', changelog: 'แม่แบบใบแจ้งหนี้/ใบกำกับภาษีตามประมวลรัษฎากร', isActive: true, fileSize: 188200 }
    ]
  },

  // 6. Billing Note
  {
    id: 'tpl-billing-note-v1',
    docType: 'billing_note',
    title: 'ใบวางบิล (Billing Note)',
    subTitle: 'M Power Engineering Solutions Master Template',
    fileName: 'Billing_Note_Master_Template.pdf',
    fileType: 'pdf',
    version: '1.0',
    isActive: true,
    uploadedAt: '2026-09-25T11:15:00Z',
    uploadedBy: 'System Administrator',
    fileSize: 181400,
    pageSize: 'A4',
    orientation: 'portrait',
    maxItemsPerPage: 6,
    fieldMappings: [
      { tag: '{{DOCUMENT_NO}}', key: 'document_no', label: 'เลขที่ใบวางบิล', required: true, isPresentInTemplate: true, sampleValue: 'BN-26001', category: 'header' },
      { tag: '{{DOCUMENT_DATE}}', key: 'document_date', label: 'วันที่วางบิล', required: true, isPresentInTemplate: true, sampleValue: '26/09/2026', category: 'header' },
      { tag: '{{DUE_DATE}}', key: 'due_date', label: 'กำหนดวันนัดชำระเงิน', required: true, isPresentInTemplate: true, sampleValue: '26/10/2026', category: 'header' },
      { tag: '{{CUSTOMER_NAME}}', key: 'customer_name', label: 'ชื่อลูกค้าที่วางบิล', required: true, isPresentInTemplate: true, sampleValue: 'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน) (SCG)', category: 'customer' },
      { tag: '{{CUSTOMER_ADDRESS}}', key: 'customer_address', label: 'ที่อยู่ลูกค้า', required: true, isPresentInTemplate: true, sampleValue: '1 ถนนปูนซิเมนต์ไทย บางซื่อ กรุงเทพฯ', category: 'customer' },
      { tag: '{{CUSTOMER_TAX_ID}}', key: 'customer_tax_id', label: 'เลขประจำตัวผู้เสียภาษี', required: true, isPresentInTemplate: true, sampleValue: '0107537000958', category: 'customer' },
      { tag: '{{SUBTOTAL}}', key: 'subtotal', label: 'ยอดรวมยอดบิล', required: true, isPresentInTemplate: true, sampleValue: '65,000.00', category: 'summary' },
      { tag: '{{WHT_AMOUNT}}', key: 'wht_amount', label: 'หัก ณ ที่จ่าย (ถ้ามี 3%)', required: false, isPresentInTemplate: true, sampleValue: '1,950.00', category: 'summary' },
      { tag: '{{GRAND_TOTAL}}', key: 'grand_total', label: 'ยอดคงเหลือชำระสุทธิ', required: true, isPresentInTemplate: true, sampleValue: '63,050.00', category: 'summary' },
      { tag: '{{BAHT_TEXT}}', key: 'baht_text', label: 'ตัวอักษร', required: true, isPresentInTemplate: true, sampleValue: 'หกหมื่นสามพันห้าสิบบาทถ้วน', category: 'summary' },
      { tag: '{{AUTHORIZED_NAME}}', key: 'authorized_name', label: 'ผู้วางบิล', required: true, isPresentInTemplate: true, sampleValue: 'ฝ่ายการเงินและบัญชี', category: 'sign' },
    ],
    tableColumns: [
      { colIndex: 1, key: 'item_no', headerText: 'ลำดับ', widthPct: 8, align: 'center' },
      { colIndex: 2, key: 'invoice_no', headerText: 'เลขที่ใบแจ้งหนี้ / ใบกำกับภาษี', widthPct: 24, align: 'left' },
      { colIndex: 3, key: 'invoice_date', headerText: 'ลงวันที่', widthPct: 14, align: 'center' },
      { colIndex: 4, key: 'due_date', headerText: 'ครบกำหนด', widthPct: 14, align: 'center' },
      { colIndex: 5, key: 'ref_no', headerText: 'เอกสารอ้างอิง (SO/PO)', widthPct: 20, align: 'left' },
      { colIndex: 6, key: 'amount', headerText: 'จำนวนเงินคงชำระ (บาท)', widthPct: 20, align: 'right' }
    ],
    versionHistory: [
      { id: 'v-bn-1.0', version: '1.0', fileName: 'Billing_Note_Master_Template.pdf', fileType: 'pdf', uploadedAt: '2026-09-25T11:15:00Z', uploadedBy: 'System Administrator', changelog: 'แม่แบบใบวางบิลพร้อมช่องเซ็นรับวางบิลและระบุกำหนดจ่าย', isActive: true, fileSize: 181400 }
    ]
  },

  // 7. Receipt
  {
    id: 'tpl-receipt-v1',
    docType: 'receipt',
    title: 'ใบเสร็จรับเงิน (Receipt)',
    subTitle: 'M Power Engineering Solutions Master Template',
    fileName: 'Receipt_Master_Template.pdf',
    fileType: 'pdf',
    version: '1.0',
    isActive: true,
    uploadedAt: '2026-09-25T11:30:00Z',
    uploadedBy: 'System Administrator',
    fileSize: 176500,
    pageSize: 'A4',
    orientation: 'portrait',
    maxItemsPerPage: 6,
    fieldMappings: [
      { tag: '{{DOCUMENT_NO}}', key: 'document_no', label: 'เลขที่ใบเสร็จรับเงิน (RC No.)', required: true, isPresentInTemplate: true, sampleValue: 'RC-26001', category: 'header' },
      { tag: '{{DOCUMENT_DATE}}', key: 'document_date', label: 'วันที่รับชำระเงิน', required: true, isPresentInTemplate: true, sampleValue: '26/09/2026', category: 'header' },
      { tag: '{{REF_INVOICE_NO}}', key: 'ref_invoice_no', label: 'อ้างอิงใบแจ้งหนี้', required: false, isPresentInTemplate: true, sampleValue: 'INV-26001', category: 'header' },
      { tag: '{{CUSTOMER_NAME}}', key: 'customer_name', label: 'ชื่อลูกค้า / ผู้ชำระเงิน', required: true, isPresentInTemplate: true, sampleValue: 'บริษัท ปตท. จำกัด (มหาชน)', category: 'customer' },
      { tag: '{{CUSTOMER_ADDRESS}}', key: 'customer_address', label: 'ที่อยู่ลูกค้า', required: true, isPresentInTemplate: true, sampleValue: '555 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ', category: 'customer' },
      { tag: '{{CUSTOMER_TAX_ID}}', key: 'customer_tax_id', label: 'เลขประจำตัวผู้เสียภาษี', required: true, isPresentInTemplate: true, sampleValue: '0107544000108', category: 'customer' },
      { tag: '{{PAYMENT_METHOD}}', key: 'payment_method', label: 'ช่องทางการชำระ (โอน/เช็ค/เงินสด)', required: true, isPresentInTemplate: true, sampleValue: 'โอนเงินเข้าบัญชี ธ.กสิกรไทย', category: 'header' },
      { tag: '{{SUBTOTAL}}', key: 'subtotal', label: 'ยอดรับชำระก่อนหัก', required: true, isPresentInTemplate: true, sampleValue: '128,400.00', category: 'summary' },
      { tag: '{{WHT_AMOUNT}}', key: 'wht_amount', label: 'ภาษีถูกหัก ณ ที่จ่าย', required: false, isPresentInTemplate: true, sampleValue: '3,600.00', category: 'summary' },
      { tag: '{{GRAND_TOTAL}}', key: 'grand_total', label: 'ยอดรับชำระสุทธิ', required: true, isPresentInTemplate: true, sampleValue: '124,800.00', category: 'summary' },
      { tag: '{{BAHT_TEXT}}', key: 'baht_text', label: 'ตัวอักษร', required: true, isPresentInTemplate: true, sampleValue: 'หนึ่งแสนสองหมื่นสี่พันแปดร้อยบาทถ้วน', category: 'summary' },
      { tag: '{{AUTHORIZED_NAME}}', key: 'authorized_name', label: 'ผู้รับเงิน / สมุห์บัญชี', required: true, isPresentInTemplate: true, sampleValue: 'เจ้าหน้าที่การเงิน (Cashier)', category: 'sign' },
    ],
    tableColumns: [
      { colIndex: 1, key: 'item_no', headerText: 'ลำดับ', widthPct: 8, align: 'center' },
      { colIndex: 2, key: 'description', headerText: 'รายการที่รับชำระเงิน', widthPct: 46, align: 'left' },
      { colIndex: 3, key: 'qty', headerText: 'จำนวน', widthPct: 10, align: 'center' },
      { colIndex: 4, key: 'unit', headerText: 'งวด/หน่วย', widthPct: 10, align: 'center' },
      { colIndex: 5, key: 'unit_price', headerText: 'ยอดเงินเต็ม', widthPct: 13, align: 'right' },
      { colIndex: 6, key: 'amount', headerText: 'ยอดที่ชำระ (บาท)', widthPct: 13, align: 'right' }
    ],
    versionHistory: [
      { id: 'v-rc-1.0', version: '1.0', fileName: 'Receipt_Master_Template.pdf', fileType: 'pdf', uploadedAt: '2026-09-25T11:30:00Z', uploadedBy: 'System Administrator', changelog: 'แม่แบบใบเสร็จรับเงินมาตรฐานทางการเงิน', isActive: true, fileSize: 176500 }
    ]
  },

  // 8. Delivery Note
  {
    id: 'tpl-delivery-note-v1',
    docType: 'delivery_note',
    title: 'ใบส่งของ (Delivery Note - DO)',
    subTitle: 'M Power Engineering Solutions Master Template',
    fileName: 'Delivery_Note_Master_Template.pdf',
    fileType: 'pdf',
    version: '1.0',
    isActive: true,
    uploadedAt: '2026-09-25T11:45:00Z',
    uploadedBy: 'System Administrator',
    fileSize: 182600,
    pageSize: 'A4',
    orientation: 'portrait',
    maxItemsPerPage: 6,
    fieldMappings: [
      { tag: '{{DOCUMENT_NO}}', key: 'document_no', label: 'เลขที่ใบส่งของ (DO No.)', required: true, isPresentInTemplate: true, sampleValue: 'DO-26001', category: 'header' },
      { tag: '{{DOCUMENT_DATE}}', key: 'document_date', label: 'วันที่จัดส่งสินค้า', required: true, isPresentInTemplate: true, sampleValue: '26/09/2026', category: 'header' },
      { tag: '{{REF_SO_NO}}', key: 'ref_so_no', label: 'อ้างอิงใบสั่งขาย (Ref SO)', required: false, isPresentInTemplate: true, sampleValue: 'SO-26001', category: 'header' },
      { tag: '{{CUSTOMER_NAME}}', key: 'customer_name', label: 'ชื่อผู้รับสินค้า / ลูกค้า', required: true, isPresentInTemplate: true, sampleValue: 'Unithai Shipyard & Engineering Ltd.', category: 'customer' },
      { tag: '{{CUSTOMER_ADDRESS}}', key: 'customer_address', label: 'สถานที่ส่งมอบสินค้า', required: true, isPresentInTemplate: true, sampleValue: '48 หมู่ 3 ต.ทุ่งศุขลา อ.ศรีราชา จ.ชลบุรี (คลังท่าเทียบเรือ)', category: 'customer' },
      { tag: '{{CUSTOMER_TAX_ID}}', key: 'customer_tax_id', label: 'เลขประจำตัวผู้เสียภาษี', required: false, isPresentInTemplate: true, sampleValue: '0105523008985', category: 'customer' },
      { tag: '{{CARRIER_NAME}}', key: 'carrier_name', label: 'พนักงานขนส่ง / ทะเบียนรถ', required: false, isPresentInTemplate: true, sampleValue: 'นายสุวิทย์ มั่นใจ (ทะเบียน 70-8912 ชบ)', category: 'header' },
      { tag: '{{PROJECT_NAME}}', key: 'project_name', label: 'ชื่องาน / โครงการ', required: false, isPresentInTemplate: true, sampleValue: 'Offshore Piping Replacement', category: 'header' },
      { tag: '{{TOTAL_ITEMS}}', key: 'total_items', label: 'จำนวนรายการทั้งหมด', required: true, isPresentInTemplate: true, sampleValue: '3 รายการ', category: 'summary' },
      { tag: '{{REMARK}}', key: 'remark', label: 'หมายเหตุการส่งมอบ / สภาพสินค้า', required: false, isPresentInTemplate: true, sampleValue: 'ส่งมอบครบถ้วนในสภาพสมบูรณ์ พร้อมอุปกรณ์ตรวจวัดครบเซ็ต', category: 'other' },
      { tag: '{{AUTHORIZED_NAME}}', key: 'authorized_name', label: 'ผู้ส่งมอบสินค้า', required: true, isPresentInTemplate: true, sampleValue: 'พนักงานคลังสินค้า M Power', category: 'sign' },
    ],
    tableColumns: [
      { colIndex: 1, key: 'item_no', headerText: 'ลำดับ', widthPct: 8, align: 'center' },
      { colIndex: 2, key: 'product_code', headerText: 'รหัสสินค้า', widthPct: 16, align: 'center' },
      { colIndex: 3, key: 'description', headerText: 'รายละเอียดสินค้า / อุปกรณ์ที่จัดส่ง', widthPct: 44, align: 'left' },
      { colIndex: 4, key: 'ordered_qty', headerText: 'จน.ที่สั่ง', widthPct: 10, align: 'center' },
      { colIndex: 5, key: 'delivered_qty', headerText: 'จน.ที่ส่งจริง', widthPct: 12, align: 'center' },
      { colIndex: 6, key: 'unit', headerText: 'หน่วย', widthPct: 10, align: 'center' }
    ],
    versionHistory: [
      { id: 'v-do-1.0', version: '1.0', fileName: 'Delivery_Note_Master_Template.pdf', fileType: 'pdf', uploadedAt: '2026-09-25T11:45:00Z', uploadedBy: 'System Administrator', changelog: 'แม่แบบใบส่งของพร้อมช่องเซ็น ผู้ส่ง / พนักงานขับรถ / ผู้รับของ', isActive: true, fileSize: 182600 }
    ]
  },

  // 9. Tax Invoice / Delivery Note (Orig & Copy)
  {
    id: 'tpl-tax-invoice-delivery-v1',
    docType: 'tax_invoice_delivery',
    title: 'ใบกำกับภาษี / ใบส่งของ (Tax Invoice / Delivery Note)',
    subTitle: 'M Power Engineering Solutions Master Template (ต้นฉบับ & สำเนา)',
    fileName: 'Tax_Invoice_Delivery_Note_Master_Template.pdf',
    fileType: 'pdf',
    version: '1.0',
    isActive: true,
    uploadedAt: '2026-09-25T12:00:00Z',
    uploadedBy: 'System Administrator',
    fileSize: 201200,
    pageSize: 'A4',
    orientation: 'portrait',
    maxItemsPerPage: 6,
    fieldMappings: [
      { tag: '{{DOCUMENT_NO}}', key: 'document_no', label: 'เลขที่เอกสาร (Tax/DO No.)', required: true, isPresentInTemplate: true, sampleValue: 'TX-26001', category: 'header' },
      { tag: '{{DOCUMENT_DATE}}', key: 'document_date', label: 'วันที่ออกเอกสาร', required: true, isPresentInTemplate: true, sampleValue: '26/09/2026', category: 'header' },
      { tag: '{{DOCUMENT_COPY_TYPE}}', key: 'document_copy_type', label: 'ประเภทฉบับ (ต้นฉบับ/สำเนา)', required: true, isPresentInTemplate: true, sampleValue: 'ต้นฉบับ (Original - สำหรับผู้ซื้อ)', category: 'header' },
      { tag: '{{CUSTOMER_CODE}}', key: 'customer_code', label: 'รหัสลูกค้า', required: false, isPresentInTemplate: true, sampleValue: 'CUS-260001', category: 'customer' },
      { tag: '{{CUSTOMER_NAME}}', key: 'customer_name', label: 'ชื่อผู้ซื้อ / นิติบุคคล', required: true, isPresentInTemplate: true, sampleValue: 'บริษัท ปตท. จำกัด (มหาชน)', category: 'customer' },
      { tag: '{{CUSTOMER_ADDRESS}}', key: 'customer_address', label: 'ที่อยู่ผู้ซื้อ (สำนักงานใหญ่)', required: true, isPresentInTemplate: true, sampleValue: '555 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900', category: 'customer' },
      { tag: '{{CUSTOMER_TAX_ID}}', key: 'customer_tax_id', label: 'เลขประจำตัวผู้เสียภาษี', required: true, isPresentInTemplate: true, sampleValue: '0107544000108', category: 'customer' },
      { tag: '{{PAYMENT_TERM}}', key: 'payment_term', label: 'เงื่อนไขการชำระเงิน', required: false, isPresentInTemplate: true, sampleValue: 'เครดิต 30 วัน', category: 'header' },
      { tag: '{{SUBTOTAL}}', key: 'subtotal', label: 'มูลค่าสินค้ารวมก่อนภาษี', required: true, isPresentInTemplate: true, sampleValue: '120,000.00', category: 'summary' },
      { tag: '{{DISCOUNT}}', key: 'discount', label: 'ส่วนลด', required: false, isPresentInTemplate: true, sampleValue: '0.00', category: 'summary' },
      { tag: '{{VAT}}', key: 'vat', label: 'ภาษีมูลค่าเพิ่ม 7%', required: true, isPresentInTemplate: true, sampleValue: '8,400.00', category: 'summary' },
      { tag: '{{GRAND_TOTAL}}', key: 'grand_total', label: 'จำนวนเงินรวมทั้งสิ้น', required: true, isPresentInTemplate: true, sampleValue: '128,400.00', category: 'summary' },
      { tag: '{{BAHT_TEXT}}', key: 'baht_text', label: 'จำนวนเงินตัวอักษร', required: true, isPresentInTemplate: true, sampleValue: 'หนึ่งแสนสองหมื่นแปดพันสี่ร้อยบาทถ้วน', category: 'summary' },
      { tag: '{{REMARK}}', key: 'remark', label: 'หมายเหตุ', required: false, isPresentInTemplate: true, sampleValue: 'ได้รับสินค้าตามรายการข้างต้นถูกต้องเรียบร้อยแล้ว', category: 'other' },
      { tag: '{{AUTHORIZED_NAME}}', key: 'authorized_name', label: 'ผู้มีอำนาจลงนาม', required: true, isPresentInTemplate: true, sampleValue: 'นายพงษ์ศักดิ์ บุญประเสริฐ', category: 'sign' },
    ],
    tableColumns: [
      { colIndex: 1, key: 'item_no', headerText: 'ลำดับ', widthPct: 8, align: 'center' },
      { colIndex: 2, key: 'description', headerText: 'รายการสินค้าหรือบริการ (Description)', widthPct: 46, align: 'left' },
      { colIndex: 3, key: 'qty', headerText: 'จำนวน', widthPct: 10, align: 'center' },
      { colIndex: 4, key: 'unit', headerText: 'หน่วย', widthPct: 10, align: 'center' },
      { colIndex: 5, key: 'unit_price', headerText: 'ราคาต่อหน่วย', widthPct: 13, align: 'right' },
      { colIndex: 6, key: 'amount', headerText: 'จำนวนเงิน (บาท)', widthPct: 13, align: 'right' }
    ],
    versionHistory: [
      { id: 'v-tx-1.0', version: '1.0', fileName: 'Tax_Invoice_Delivery_Note_Master_Template.pdf', fileType: 'pdf', uploadedAt: '2026-09-25T12:00:00Z', uploadedBy: 'System Administrator', changelog: 'แม่แบบใบกำกับภาษี/ใบส่งของคู่ ต้นฉบับและสำเนา', isActive: true, fileSize: 201200 }
    ]
  }
];

export const COMPANY_MASTER_INFO = {
  company_name_th: 'บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด (สำนักงานใหญ่)',
  company_name_en: 'M POWER ENGINEERING SOLUTIONS CO., LTD. (HEAD OFFICE)',
  tax_id: '0205561021481',
  address_th: '53/72 หมู่ที่ 8 ต.สัตหีบ อ.สัตหีบ จ.ชลบุรี 20180',
  address_en: '53/72 Moo 8, Sattahip, Sattahip, Chonburi 20180 Thailand',
  phone: '033-641789, 063-935-9565',
  email: 'sales@mpower-engineering.com, account@mpower-engineering.com',
  website: 'www.mpower-engineering.com',
  logo_url: '/mpower-logo.png'
};
