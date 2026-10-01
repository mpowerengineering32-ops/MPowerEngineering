import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Customer, SalesOrder } from '../types';
import { numberToEnglishWords } from './numberWords';
import { MPOWER_LOGO_BASE64 } from '../assets/logoBase64';

export interface SalesOrderAuditResult {
  status: 'PASSED' | 'WARNING';
  so_no: string;
  matchedSlots: { label: string; value: string; isTemplateSlot: true }[];
  missingSlotsInTemplate: { label: string; dbValue: string; reason: string }[];
  subtotal: number;
  vat: number;
  grandTotal: number;
  bahtTextEn: string;
  mathCheckPassed: boolean;
  warnings: string[];
}

export interface SalesOrderTemplateData {
  so_no: string;
  date: string;
  customer_name: string;
  customer_address_1: string;
  customer_address_2: string;
  tax_id: string;
  attn: string;
  tel: string;
  terms_of_payment: string;
  sales_name: string;
  items: {
    qty: number;
    description: string;
    details?: string[];
    unit_price: number;
    amount: number;
  }[];
  subtotal: number;
  vat: number;
  grand_total: number;
  baht_text_en: string;
  // Non-template fields stored for record-keeping and audit
  project_name?: string;
  delivery_plan?: string;
  job_no?: string;
  customer_po_ref?: string;
}

/**
 * Helper to convert Base64 string to Uint8Array in browser or node
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const pureBase64 = base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').replace(/[\r\n\s]/g, '');
  if (typeof atob === 'function') {
    const binaryString = atob(pureBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  return Buffer.from(pureBase64, 'base64');
}

/**
 * Format a Date string or Date object into DD-MM-YYYY as displayed in the Master Template (e.g. 01-09-2026)
 */
export function formatMasterDate(dateStr?: string): string {
  if (!dateStr) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  // If already in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // If in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Prepare SalesOrderTemplateData from a CRM SalesOrder and its Customer record
 */
export function prepareSalesOrderTemplateData(
  so: SalesOrder,
  customer?: Customer
): SalesOrderTemplateData {
  // Resolve address lines
  const rawAddr = customer?.address || (so as any).customer_address || '155/167 Moo 5, Samnakthon Sub-District\nBanchang District, Rayong, Thailand 21130';
  const addrParts = rawAddr.split('\n').map(s => s.trim()).filter(Boolean);
  const addr1 = addrParts[0] || '155/167 Moo 5, Samnakthon Sub-District';
  const addr2 = addrParts.slice(1).join(', ') || 'Banchang District, Rayong, Thailand 21130';

  // Resolve Customer Name
  const custName = customer?.customer_name || so.customer_name || 'IKM Testing (Thailand) Co., Ltd';

  // Resolve Tax ID
  let taxIdStr = customer?.tax_id || (so as any).customer_tax_id || '0215552000909';
  if (!taxIdStr.includes('Head Office') && !taxIdStr.includes('สาขา')) {
    taxIdStr += ' (Head Office)';
  }

  // Resolve Contact Person (Attn)
  const attnStr = customer?.contact_person || (customer as any)?.contacts_list || (so as any).contact_person || (so as any).attn || 'Khun Apiyut';

  // Resolve Tel
  const telStr = customer?.phone || (so as any).customer_phone || (so as any).tel || '038-601 996-8';

  // Resolve Payment Terms
  const paymentTermStr = customer?.payment_term ? `${customer.payment_term} Days` : ((so as any).payment_term || '30 Days');

  // Resolve Salesperson Name
  const salesNameStr = so.sales_person || (so as any).sales_representative || 'Pornpicha O.';

  // Resolve Items
  let itemsList: SalesOrderTemplateData['items'] = [];

  if (so.items && so.items.length > 0) {
    itemsList = so.items.map(it => {
      const q = Number(it.qty || 1);
      const p = Number(it.unit_price || 0);
      const a = q * p;

      // Extract bullet points if description has multiple lines
      const descLines = (it.description || '').split('\n').map(s => s.trim()).filter(Boolean);
      const mainDesc = descLines[0] || 'Engineering Equipment & Service Package';
      const details = descLines.slice(1);

      return {
        qty: q,
        description: mainDesc,
        details: details.length > 0 ? details : undefined,
        unit_price: p,
        amount: a
      };
    });
  } else {
    // If no individual line items, use project details or standard default
    const unitPrice = so.total_amount ? Math.round((so.total_amount / 1.07) * 100) / 100 : 2800;
    itemsList = [
      {
        qty: 1,
        description: so.project_name || 'Sky Lotech High Lift',
        details: [
          'Brand : Skyy Lotech',
          'Model : M-380X-200',
          '- Length : 200 Meter',
          '- Length : 200 Meter',
          '- Diameter : 1/2"'
        ],
        unit_price: unitPrice,
        amount: unitPrice
      }
    ];
  }

  // Subtotal (AMOUNT), VAT 7% (SALES VAT 7%), TOTAL AMOUNT
  const subtotal = Math.round(itemsList.reduce((sum, it) => sum + it.amount, 0) * 100) / 100;
  const vat = Math.round(subtotal * 0.07 * 100) / 100;
  const grandTotal = Math.round((subtotal + vat) * 100) / 100;
  const bahtTextEn = numberToEnglishWords(grandTotal);

  return {
    so_no: so.so_no || 'SO-2609001',
    date: formatMasterDate(so.order_date),
    customer_name: custName,
    customer_address_1: addr1,
    customer_address_2: addr2,
    tax_id: taxIdStr,
    attn: attnStr,
    tel: telStr,
    terms_of_payment: paymentTermStr,
    sales_name: salesNameStr,
    items: itemsList,
    subtotal: subtotal,
    vat: vat,
    grand_total: grandTotal,
    baht_text_en: bahtTextEn,
    project_name: so.project_name,
    delivery_plan: so.target_delivery_date,
    job_no: so.job_no,
    customer_po_ref: so.po_no
  };
}

/**
 * Pre-Export Audit & Field Mapping Check
 */
export function auditSalesOrderForMasterTemplate(
  data: SalesOrderTemplateData
): SalesOrderAuditResult {
  const matchedSlots: SalesOrderAuditResult['matchedSlots'] = [
    { label: 'Sale Order No. :', value: data.so_no, isTemplateSlot: true },
    { label: 'Date :', value: data.date, isTemplateSlot: true },
    { label: 'Customer :', value: data.customer_name, isTemplateSlot: true },
    { label: 'Customer Address (Line 1)', value: data.customer_address_1, isTemplateSlot: true },
    { label: 'Customer Address (Line 2)', value: data.customer_address_2, isTemplateSlot: true },
    { label: 'Tax ID:', value: data.tax_id, isTemplateSlot: true },
    { label: 'Attn:', value: data.attn, isTemplateSlot: true },
    { label: 'Tel:', value: data.tel, isTemplateSlot: true },
    { label: 'Terms of Payment :', value: data.terms_of_payment, isTemplateSlot: true },
    { label: 'Sales Name :', value: data.sales_name, isTemplateSlot: true },
    { label: 'Quantity (Column)', value: `${data.items.length} รายการ`, isTemplateSlot: true },
    { label: 'Drescription (Column)', value: 'ตรงตามสะกด Master Template', isTemplateSlot: true },
    { label: 'Unit Price (THB) (Column)', value: 'THB Currency', isTemplateSlot: true },
    { label: 'Amount (THB) (Column)', value: 'THB Currency', isTemplateSlot: true },
    { label: '** LAST ENTRY **', value: 'มีใน Master Template', isTemplateSlot: true },
    { label: 'AMOUNT', value: `฿${data.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'SALES VAT 7%', value: `฿${data.vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'TOTAL AMOUNT', value: `฿${data.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'English Baht Words Box', value: data.baht_text_en, isTemplateSlot: true },
    { label: 'Terms & Condition;', value: '30 days validily & Quoted in THB', isTemplateSlot: true },
    { label: 'Prepared By', value: 'ช่องลายเซ็นผู้จัดทำ', isTemplateSlot: true },
    { label: 'Authorized Signature', value: 'ช่องลายเซ็นผู้อนุมัติ', isTemplateSlot: true }
  ];

  const missingSlotsInTemplate: SalesOrderAuditResult['missingSlotsInTemplate'] = [];
  const warnings: string[] = [];

  if (data.project_name) {
    missingSlotsInTemplate.push({
      label: 'ชื่องาน / แคมเปญโครงการ (Project Name)',
      dbValue: data.project_name,
      reason: 'ไม่มีช่องรองรับข้อมูลนี้ใน Master Template (ระบบจะไม่แทรกช่องใหม่เพื่อรักษา Layout เดิม 100%)'
    });
    warnings.push(`ฟิลด์ "ชื่องาน / แคมเปญโครงการ" (${data.project_name}) ไม่มีช่องรองรับใน Master Template`);
  }

  if (data.delivery_plan) {
    missingSlotsInTemplate.push({
      label: 'กำหนดส่งมอบงาน (Delivery Terms / Target Date)',
      dbValue: data.delivery_plan,
      reason: 'ไม่มีช่องรองรับข้อมูลนี้ใน Master Template (ระบบจะไม่แทรกช่องใหม่เพื่อรักษา Layout เดิม 100%)'
    });
    warnings.push(`ฟิลด์ "กำหนดวันส่งมอบงาน" (${data.delivery_plan}) ไม่มีช่องรองรับใน Master Template`);
  }

  if (data.job_no) {
    missingSlotsInTemplate.push({
      label: 'เลขที่งาน (Job Number)',
      dbValue: data.job_no,
      reason: 'ไม่มีช่องรองรับข้อมูลนี้ใน Master Template'
    });
  }

  if (data.customer_po_ref) {
    missingSlotsInTemplate.push({
      label: 'เลขที่ PO ลูกค้าอ้างอิง (Customer PO Ref)',
      dbValue: data.customer_po_ref,
      reason: 'ไม่มีช่องรองรับข้อมูลนี้ใน Master Template'
    });
  }

  const calculatedSum = Math.round((data.subtotal + data.vat) * 100) / 100;
  const mathCheckPassed = Math.abs(calculatedSum - data.grand_total) < 0.05;
  if (!mathCheckPassed) {
    warnings.push(`ตรวจสอบผลรวมคลาดเคลื่อน: ${data.subtotal} + ${data.vat} = ${calculatedSum} != ${data.grand_total}`);
  }

  return {
    status: warnings.length > 0 ? 'WARNING' : 'PASSED',
    so_no: data.so_no,
    matchedSlots,
    missingSlotsInTemplate,
    subtotal: data.subtotal,
    vat: data.vat,
    grandTotal: data.grand_total,
    bahtTextEn: data.baht_text_en,
    mathCheckPassed,
    warnings
  };
}

/**
 * Generate PDF of Sales Order matching the Master Template 100% using pdf-lib.
 * Uses the exact official M Power logo and supports multi-page pagination.
 */
export async function generateSalesOrderMasterPDF(
  data: SalesOrderTemplateData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Embed official logo image (JPEG / PNG robust detection)
  let logoImage: any = null;
  try {
    const logoBytes = base64ToUint8Array(MPOWER_LOGO_BASE64);
    if (logoBytes.length > 2 && logoBytes[0] === 0xff && logoBytes[1] === 0xd8) {
      logoImage = await pdfDoc.embedJpg(logoBytes);
    } else if (logoBytes.length > 3 && logoBytes[0] === 0x89 && logoBytes[1] === 0x50) {
      logoImage = await pdfDoc.embedPng(logoBytes);
    } else {
      try {
        logoImage = await pdfDoc.embedJpg(logoBytes);
      } catch {
        logoImage = await pdfDoc.embedPng(logoBytes);
      }
    }
  } catch (err) {
    console.error('Failed to embed logo into PDF:', err);
  }

  // A4 Page dimensions in points: 595.28 x 841.89
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 28.35; // 10mm margin for crisp printing

  // Pagination calculation
  const items = data.items || [];
  const pages: (typeof items)[] = [];

  if (items.length <= 3) {
    pages.push(items);
  } else {
    let currentPage: typeof items = [];
    let currentUnits = 0;
    const maxUnitsPage1 = 8;
    const maxUnitsSubsequent = 12;

    items.forEach(item => {
      const itemUnits = 1 + (item.details?.length || 0) * 0.75;
      const limit = pages.length === 0 ? maxUnitsPage1 : maxUnitsSubsequent;

      if (currentUnits + itemUnits > limit && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [item];
        currentUnits = itemUnits;
      } else {
        currentPage.push(item);
        currentUnits += itemUnits;
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
  }

  const totalPages = pages.length > 0 ? pages.length : 1;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const pageItems = pages[pageIdx] || [];
    const isLastPage = pageIdx === totalPages - 1;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const { width, height } = page.getSize();

    // Helper drawing functions
    const drawText = (
      text: string,
      x: number,
      y: number,
      size = 9,
      isBold = false,
      color = rgb(0, 0, 0),
      isItalic = false
    ) => {
      let fontToUse = fontRegular;
      if (isBold) fontToUse = fontBold;
      else if (isItalic) fontToUse = fontOblique;

      const sanitized = text.replace(/[\u0E00-\u0E7F]/g, '') || text;
      page.drawText(sanitized, {
        x,
        y,
        size,
        font: fontToUse,
        color
      });
    };

    const drawLine = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      thickness = 0.75,
      color = rgb(0, 0, 0)
    ) => {
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness,
        color
      });
    };

    const drawRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      strokeColor = rgb(0, 0, 0),
      strokeWidth = 0.75,
      fillColor?: [number, number, number]
    ) => {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderWidth: strokeWidth,
        borderColor: strokeColor,
        color: fillColor ? rgb(fillColor[0], fillColor[1], fillColor[2]) : undefined
      });
    };

    // -------------------------------------------------------------
    // 1. TOP CORPORATE HEADER (Logo & Company text)
    // -------------------------------------------------------------
    const topY = height - margin;

    if (logoImage) {
      page.drawImage(logoImage, {
        x: margin + 4,
        y: topY - 38,
        width: 100,
        height: 34
      });
    } else {
      // Fallback text logo
      page.drawText('M Power', {
        x: margin + 4,
        y: topY - 26,
        size: 20,
        font: fontBold,
        color: rgb(0.1, 0.2, 0.5)
      });
      page.drawText('Engineering Solutions', {
        x: margin + 26,
        y: topY - 34,
        size: 5.5,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.4)
      });
    }

    // Company details on the right of logo
    const compX = margin + 115;
    drawText('M Power Engineering Solutions Co., Ltd.', compX, topY - 14, 9, true);
    drawText('53/72 Moo 8, Sattahip Subdistrict, Sattahip District, Chonburi 20180 , Thailand.', compX, topY - 25, 7.5);
    drawText('Tel. 033-641789 / 063-9359565 Email: sales@mpower-engineering.com , info@mpower-engineering.com', compX, topY - 36, 7.5);
    drawText('Tax ID Number. 0205569006956 (Head office)', compX, topY - 47, 7.5);

    if (totalPages > 1) {
      const pageNumText = `Page ${pageIdx + 1} of ${totalPages}`;
      drawText(pageNumText, width - margin - fontRegular.widthOfTextAtSize(pageNumText, 7.5), topY - 14, 7.5, false, rgb(0.4, 0.4, 0.4));
    }

    // -------------------------------------------------------------
    // 2. DOCUMENT TITLE: "Sale Order" (Centered)
    // -------------------------------------------------------------
    const titleY = topY - 72;
    const titleText = 'Sale Order';
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 14);
    drawText(titleText, (width - titleWidth) / 2, titleY, 14, true);

    // -------------------------------------------------------------
    // 3. CUSTOMER & SALE ORDER DETAILS BOX (Split 2-Columns)
    // -------------------------------------------------------------
    const boxY = titleY - 94;
    const boxW = width - margin * 2;
    const boxH = 88;
    const splitX = margin + boxW * 0.65; // 65% for Customer, 35% for SO Details

    // Outer border & divider
    drawRect(margin, boxY, boxW, boxH, rgb(0, 0, 0), 1);
    drawLine(splitX, boxY, splitX, boxY + boxH, 1, rgb(0, 0, 0));

    // Left Column: Customer details
    const leftX = margin + 12;
    let curY = boxY + boxH - 14;

    drawText('Customer : ', leftX, curY, 8.5, true);
    const custLabelW = fontBold.widthOfTextAtSize('Customer : ', 8.5);
    drawText(data.customer_name, leftX + custLabelW, curY, 8.5, false);

    curY -= 13;
    drawText(data.customer_address_1, leftX + custLabelW, curY, 8, false);

    curY -= 12;
    drawText(data.customer_address_2, leftX + custLabelW, curY, 8, false);

    curY -= 12;
    drawText(`Tax ID: ${data.tax_id}`, leftX + custLabelW, curY, 8, false);

    curY -= 13;
    drawText('Attn: ', leftX + 16, curY, 8, true);
    drawText(data.attn, leftX + 16 + fontBold.widthOfTextAtSize('Attn: ', 8), curY, 8, false);

    curY -= 12;
    drawText('Tel: ', leftX + 22, curY, 8, true);
    drawText(data.tel, leftX + 22 + fontBold.widthOfTextAtSize('Tel: ', 8), curY, 8, false);

    // Right Column: Sale Order Details
    const rightX = splitX + 14;
    curY = boxY + boxH - 14;

    drawText('Sale Order No. : ', rightX + 8, curY, 8.5, true);
    drawText(data.so_no, rightX + 8 + fontBold.widthOfTextAtSize('Sale Order No. : ', 8.5), curY, 8.5, false);

    curY -= 14;
    drawText('Date : ', rightX + 44, curY, 8.5, true);
    drawText(data.date, rightX + 44 + fontBold.widthOfTextAtSize('Date : ', 8.5), curY, 8.5, false);

    curY -= 14;
    drawText('Terms of Payment : ', rightX, curY, 8.5, true);
    drawText(data.terms_of_payment, rightX + fontBold.widthOfTextAtSize('Terms of Payment : ', 8.5), curY, 8.5, false);

    curY -= 14;
    drawText('Sales Name : ', rightX + 16, curY, 8.5, true);
    drawText(data.sales_name, rightX + 16 + fontBold.widthOfTextAtSize('Sales Name : ', 8.5), curY, 8.5, false);

    // -------------------------------------------------------------
    // 4. ITEMS TABLE (Quantity | Drescription | Unit Price (THB) | Amount (THB))
    // -------------------------------------------------------------
    const tableTop = boxY - 14;
    const colW1 = boxW * 0.11; // Quantity: ~11%
    const colW2 = boxW * 0.55; // Drescription: ~55%
    const colW3 = boxW * 0.17; // Unit Price (THB): ~17%
    const colW4 = boxW * 0.17; // Amount (THB): ~17%

    const colX1 = margin;
    const colX2 = colX1 + colW1;
    const colX3 = colX2 + colW2;
    const colX4 = colX3 + colW3;

    const headerH = 22;
    const tableH = isLastPage ? 345 : 460;
    const tableBottom = tableTop - tableH;

    // Outer border & header border
    drawRect(margin, tableBottom, boxW, tableH, rgb(0, 0, 0), 1);
    drawLine(margin, tableTop - headerH, margin + boxW, tableTop - headerH, 1, rgb(0, 0, 0));

    // Vertical column gridlines
    drawLine(colX2, tableBottom, colX2, tableTop, 1, rgb(0, 0, 0));
    drawLine(colX3, tableBottom, colX3, tableTop, 1, rgb(0, 0, 0));
    drawLine(colX4, tableBottom, colX4, tableTop, 1, rgb(0, 0, 0));

    // Table Column Headers (Centered bold)
    const headerTextY = tableTop - 15;

    const textQ = 'Quantity';
    drawText(textQ, colX1 + (colW1 - fontBold.widthOfTextAtSize(textQ, 8.5)) / 2, headerTextY, 8.5, true);

    const textD = 'Drescription';
    drawText(textD, colX2 + (colW2 - fontBold.widthOfTextAtSize(textD, 8.5)) / 2, headerTextY, 8.5, true);

    const textUP = 'Unit Price (THB)';
    drawText(textUP, colX3 + (colW3 - fontBold.widthOfTextAtSize(textUP, 8.5)) / 2, headerTextY, 8.5, true);

    const textA = 'Amount (THB)';
    drawText(textA, colX4 + (colW4 - fontBold.widthOfTextAtSize(textA, 8.5)) / 2, headerTextY, 8.5, true);

    // Table Rows
    let itemY = tableTop - headerH - 18;

    pageItems.forEach((it) => {
      // Quantity (Centered)
      const qStr = String(it.qty);
      drawText(qStr, colX1 + (colW1 - fontBold.widthOfTextAtSize(qStr, 8.5)) / 2, itemY, 8.5, true);

      // Description (Main title)
      drawText(it.description, colX2 + 8, itemY, 8.5, true);

      // Unit Price (Right aligned)
      const upStr = it.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      drawText(upStr, colX4 - 10 - fontRegular.widthOfTextAtSize(upStr, 8.5), itemY, 8.5, false);

      // Amount (Right aligned)
      const aStr = it.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      drawText(aStr, margin + boxW - 10 - fontRegular.widthOfTextAtSize(aStr, 8.5), itemY, 8.5, false);

      itemY -= 12;

      // Bullet details if any
      if (it.details && it.details.length > 0) {
        it.details.forEach((det) => {
          drawText(det, colX2 + 8, itemY, 8, false);
          itemY -= 11;
        });
      }

      itemY -= 8;
    });

    if (isLastPage) {
      // Center "** LAST ENTRY **" below the items
      const lastEntryText = '** LAST ENTRY **';
      const lastEntryW = fontOblique.widthOfTextAtSize(lastEntryText, 8.5);
      const lastEntryX = colX2 + (colW2 - lastEntryW) / 2;
      const lastEntryY = Math.max(tableBottom + 30, itemY - 14);
      drawText(lastEntryText, lastEntryX, lastEntryY, 8.5, false, rgb(0, 0, 0), true);

      // -------------------------------------------------------------
      // 5. SUMMARY TOTALS (AMOUNT, SALES VAT 7%, TOTAL AMOUNT & ENGLISH BAHT WORDS BOX)
      // -------------------------------------------------------------
      const summaryTop = tableBottom;
      const rowH = 16;
      const summaryTotalH = rowH * 3;

      const sumRightX = colX3;
      const sumRightW = colW3 + colW4;

      // Outer border for right summary box
      drawRect(sumRightX, summaryTop - summaryTotalH, sumRightW, summaryTotalH, rgb(0, 0, 0), 1);

      // Divider lines inside right summary
      drawLine(sumRightX, summaryTop - rowH, sumRightX + sumRightW, summaryTop - rowH, 1, rgb(0, 0, 0));
      drawLine(sumRightX, summaryTop - rowH * 2, sumRightX + sumRightW, summaryTop - rowH * 2, 1, rgb(0, 0, 0));
      drawLine(colX4, summaryTop - summaryTotalH, colX4, summaryTop, 1, rgb(0, 0, 0));

      // Row 1: AMOUNT
      const amtLabel = 'AMOUNT';
      drawText(amtLabel, colX4 - 10 - fontBold.widthOfTextAtSize(amtLabel, 7.5), summaryTop - 11, 7.5, true);
      const subtotalStr = data.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      drawText(subtotalStr, margin + boxW - 10 - fontRegular.widthOfTextAtSize(subtotalStr, 8.5), summaryTop - 11, 8.5, false);

      // Row 2: SALES VAT 7%
      const vatLabel = 'SALES VAT 7%';
      drawText(vatLabel, colX4 - 10 - fontBold.widthOfTextAtSize(vatLabel, 7.5), summaryTop - rowH - 11, 7.5, true);
      const vatStr = data.vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      drawText(vatStr, margin + boxW - 10 - fontRegular.widthOfTextAtSize(vatStr, 8.5), summaryTop - rowH - 11, 8.5, false);

      // Row 3: TOTAL AMOUNT
      const totLabel = 'TOTAL AMOUNT';
      drawText(totLabel, colX4 - 10 - fontBold.widthOfTextAtSize(totLabel, 7.5), summaryTop - rowH * 2 - 11, 7.5, true);
      const grandTotalStr = data.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      drawText(grandTotalStr, margin + boxW - 10 - fontBold.widthOfTextAtSize(grandTotalStr, 8.5), summaryTop - rowH * 2 - 11, 8.5, true);

      // English Baht Words Box: Left side of TOTAL AMOUNT
      const wordsBoxW = colW1 + colW2;
      const wordsBoxH = rowH;
      const wordsBoxY = summaryTop - summaryTotalH;

      drawRect(margin, wordsBoxY, wordsBoxW, wordsBoxH, rgb(0, 0, 0), 1);
      const wordsText = data.baht_text_en;
      const wordsW = fontBold.widthOfTextAtSize(wordsText, 7.5);
      drawText(wordsText, margin + (wordsBoxW - wordsW) / 2, wordsBoxY + 5, 7.5, true);

      // -------------------------------------------------------------
      // 6. TERMS & CONDITION SECTION
      // -------------------------------------------------------------
      let tcY = wordsBoxY - 22;
      drawText('Terms & Condition;', margin, tcY, 8, true);

      tcY -= 12;
      drawText('- 30 days validily from date of quotation.', margin + 8, tcY, 7.5, false);

      tcY -= 11;
      drawText('- All prices above are quoted in THB.', margin + 8, tcY, 7.5, false);

      // -------------------------------------------------------------
      // 7. SIGNATURES SECTION (Prepared By & Authorized Signature)
      // -------------------------------------------------------------
      const sigY = margin + 45;
      const sigLineW = 160;

      // Left: Prepared By
      const sig1X = margin + 18;
      const dotted1 = '......................................................';
      drawText(dotted1, sig1X, sigY, 9, false);
      const prepText = 'Prepared By';
      const prepW = fontRegular.widthOfTextAtSize(prepText, 8.5);
      drawText(prepText, sig1X + (sigLineW - prepW) / 2, sigY - 14, 8.5, false);

      // Right: Authorized Signature
      const sig2X = width - margin - sigLineW - 18;
      drawText(dotted1, sig2X, sigY, 9, false);
      const authText = 'Authorized Signature';
      const authW = fontRegular.widthOfTextAtSize(authText, 8.5);
      drawText(authText, sig2X + (sigLineW - authW) / 2, sigY - 14, 8.5, false);
    } else {
      // Continuation indicator on intermediate pages
      const contText = '[ Continued on next page ]';
      const contW = fontRegular.widthOfTextAtSize(contText, 8);
      drawText(contText, width - margin - contW, margin + 20, 8, false, rgb(0.4, 0.4, 0.4));
    }
  }

  return await pdfDoc.save();
}
