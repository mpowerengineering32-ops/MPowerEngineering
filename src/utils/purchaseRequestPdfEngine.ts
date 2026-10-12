import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Supplier, PurchaseRequest } from '../types';
import { numberToEnglishBaht } from './numberWords';
import { MPOWER_LOGO_BASE64 } from '../assets/logoBase64';

export interface PurchaseRequestTemplateData {
  pr_no: string;
  date: string;
  due_date: string;
  supplier_name: string;
  supplier_address: string;
  supplier_tax_id: string;
  supplier_phone: string;
  supplier_attn: string;
  sales_name: string;
  ref_customer: string;
  attn: string;
  items: {
    quantity: number;
    description: string;
    unit?: string;
    unit_price: number;
    amount: number;
  }[];
  amount: number;
  vat_amount: number;
  total_amount: number;
  baht_text_en: string;
  remarks?: string;
  delivery_note?: string;
  requested_by?: string;
  approved_by?: string;
}

export interface PurchaseRequestAuditResult {
  status: 'PASSED' | 'WARNING';
  pr_no: string;
  matchedSlots: { label: string; value: string; isTemplateSlot: true }[];
  missingSlotsInTemplate: { label: string; reason: string }[];
  amount: number;
  vatAmount: number;
  totalAmount: number;
  bahtTextEn: string;
  mathCheckPassed: boolean;
  warnings: string[];
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
 * Helper to wrap long address lines cleanly to multiple lines without breaking words awkwardly
 */
export function formatWrappedAddress(addrStr?: string, maxLineLength = 34): string[] {
  if (!addrStr) return [];
  const rawLines = addrStr.split(/\r?\n/);
  const result: string[] = [];

  const thaiMarkers = [
    'ตำบล', 'ต.', 'อำเภอ', 'อ.', 'จังหวัด', 'จ.',
    'ถนน', 'ถ.', 'ซอย', 'ซ.', 'แขวง', 'เขต',
    'หมู่ที่', 'หมู่ ', 'ม.', 'อาคาร', 'ชั้น'
  ];

  const breakChunk = (text: string): string[] => {
    const trimmed = text.trim();
    if (!trimmed) return [];
    if (trimmed.length <= maxLineLength) return [trimmed];

    // 1. Try splitting by comma or semicolon
    if (trimmed.includes(',') || trimmed.includes(';')) {
      const parts = trimmed.split(/[,;]\s*/);
      const subLines: string[] = [];
      let cur = '';
      for (let i = 0; i < parts.length; i++) {
        const seg = parts[i] + (i < parts.length - 1 ? ',' : '');
        if (!cur) {
          cur = seg;
        } else if ((cur + ' ' + seg).length <= maxLineLength) {
          cur += ' ' + seg;
        } else {
          subLines.push(...breakChunk(cur));
          cur = seg;
        }
      }
      if (cur.trim()) subLines.push(...breakChunk(cur));
      return subLines;
    }

    // 2. Try splitting before Thai address markers
    for (const marker of thaiMarkers) {
      const idx = trimmed.indexOf(marker);
      if (idx >= 8 && idx <= maxLineLength + 4) {
        const left = trimmed.slice(0, idx).trim();
        const right = trimmed.slice(idx).trim();
        return [...breakChunk(left), ...breakChunk(right)];
      }
    }

    // 3. Try splitting by spaces
    if (trimmed.includes(' ')) {
      const words = trimmed.split(/\s+/);
      const subLines: string[] = [];
      let cur = '';
      for (const w of words) {
        if (!cur) {
          cur = w;
        } else if ((cur + ' ' + w).length <= maxLineLength) {
          cur += ' ' + w;
        } else {
          subLines.push(...breakChunk(cur));
          cur = w;
        }
      }
      if (cur.trim()) subLines.push(...breakChunk(cur));
      return subLines;
    }

    // 4. Fallback: hard break at maxLineLength
    const hardChunks: string[] = [];
    let rem = trimmed;
    while (rem.length > maxLineLength) {
      hardChunks.push(rem.slice(0, maxLineLength));
      rem = rem.slice(maxLineLength);
    }
    if (rem.trim()) hardChunks.push(rem.trim());
    return hardChunks;
  };

  for (const rawLine of rawLines) {
    result.push(...breakChunk(rawLine));
  }

  return result.filter(Boolean);
}

/**
 * Format a Date string into DD-MMM-YY (e.g. 01-Sep-26) matching PR.pdf
 */
export function formatPRDate(dateStr?: string): string {
  if (!dateStr) return '01-Sep-26';

  if (/^\d{1,2}-[A-Za-z]{3}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    return `${parts[0].padStart(2, '0')}-${parts[1]}-${parts[2]}`;
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mmm = months[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mmm}-${yy}`;
}

/**
 * Prepare PurchaseRequestTemplateData from a CRM PurchaseRequest and optional Supplier record
 */
export function preparePurchaseRequestTemplateData(
  pr: PurchaseRequest,
  supplier?: Supplier
): PurchaseRequestTemplateData {
  const suppName = pr.supplier_name || supplier?.supplier_name || 'Dacon Trading Co., Ltd. (Head Office)';
  const suppAddr = pr.supplier_address || supplier?.address || '88/9 Moo 3, Phala, Banchang,\nRayong 21130 Thailand';
  const suppTax = pr.supplier_tax_id || supplier?.tax_id || '0215542000248';
  const suppPhone = pr.supplier_phone || supplier?.phone || '081-8935437';
  const suppAttn = pr.supplier_attn || supplier?.contact_person || 'Khun Chatcha';

  const itemsList = (pr.items && pr.items.length > 0)
    ? pr.items.map(it => {
        const qty = Number(it.quantity ?? it.qty ?? 1);
        const unitPrice = Number(it.unit_price ?? 0);
        const amt = Number(it.amount ?? (qty * unitPrice));
        return {
          quantity: qty,
          description: it.description || '1630,WL/WF,BLACK',
          unit: it.unit || 'EA',
          unit_price: unitPrice,
          amount: amt
        };
      })
    : [
        {
          quantity: 2,
          description: '1630,WL/WF,BLACK',
          unit: 'EA',
          unit_price: 19100,
          amount: 38200
        }
      ];

  const subtotal = Math.round(itemsList.reduce((sum, it) => sum + it.amount, 0) * 100) / 100;
  // Strict formula: VAT = Subtotal * 0.07 (NO back calculation)
  const vat = Math.round(subtotal * 0.07 * 100) / 100;
  const grandTotal = Math.round((subtotal + vat) * 100) / 100;

  const bahtTextEn = numberToEnglishBaht(grandTotal);

  return {
    pr_no: pr.pr_no || '2609001',
    date: formatPRDate(pr.date || (pr as any).pr_date || (pr as any).required_date),
    due_date: pr.due_date || 'Cash',
    supplier_name: suppName,
    supplier_address: suppAddr,
    supplier_tax_id: suppTax,
    supplier_phone: suppPhone,
    supplier_attn: suppAttn,
    sales_name: pr.sales_name || pr.requested_by || pr.requestor || 'Praiya',
    ref_customer: pr.ref_customer || 'Promt Solution',
    attn: suppAttn,
    items: itemsList,
    amount: subtotal,
    vat_amount: vat,
    total_amount: grandTotal,
    baht_text_en: bahtTextEn,
    remarks: pr.remarks,
    delivery_note: pr.delivery_note || '* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด\nเปิดบิล-ส่งของวันที่ 1 กันยายน 2569',
    requested_by: pr.requested_by || pr.requestor || pr.sales_name || 'Requested By',
    approved_by: pr.approved_by || 'Approved By'
  };
}

/**
 * Pre-Export Audit for Master Purchase Request Template
 */
export function auditPurchaseRequestForMasterTemplate(
  data: PurchaseRequestTemplateData
): PurchaseRequestAuditResult {
  const matchedSlots: PurchaseRequestAuditResult['matchedSlots'] = [
    { label: 'PR. No.', value: data.pr_no, isTemplateSlot: true },
    { label: 'Date', value: data.date, isTemplateSlot: true },
    { label: 'Due Date', value: data.due_date, isTemplateSlot: true },
    { label: 'Tax ID No.', value: data.supplier_tax_id, isTemplateSlot: true },
    { label: 'Sales Name', value: data.sales_name, isTemplateSlot: true },
    { label: 'Tel.', value: data.supplier_phone, isTemplateSlot: true },
    { label: 'Ref. Customer', value: data.ref_customer, isTemplateSlot: true },
    { label: 'Attn.', value: data.attn, isTemplateSlot: true },
    { label: 'Supplier Name', value: data.supplier_name, isTemplateSlot: true },
    { label: 'Supplier Address', value: data.supplier_address, isTemplateSlot: true },
    { label: 'Quantity (Column)', value: `${data.items.length} รายการ`, isTemplateSlot: true },
    { label: 'Descriptions (Column)', value: data.items.map(it => it.description).join(', '), isTemplateSlot: true },
    { label: 'Unit Price (THB) (Column)', value: 'THB Unit Price', isTemplateSlot: true },
    { label: 'Amount (THB) (Column)', value: `฿${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'AMOUNT (Subtotal)', value: `฿${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'SALES VAT 7%', value: `฿${data.vat_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'TOTAL AMOUNT', value: `฿${data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'BAHT TEXT (EN)', value: data.baht_text_en, isTemplateSlot: true },
    { label: 'Requested By', value: data.requested_by || 'Requested By', isTemplateSlot: true },
    { label: 'Approved By', value: data.approved_by || 'Approved By', isTemplateSlot: true }
  ];

  const missingSlotsInTemplate: PurchaseRequestAuditResult['missingSlotsInTemplate'] = [];
  const warnings: string[] = [];

  const calculatedSub = Math.round(data.items.reduce((s, it) => s + it.amount, 0) * 100) / 100;
  const calculatedVat = Math.round(calculatedSub * 0.07 * 100) / 100;
  const calculatedTotal = Math.round((calculatedSub + calculatedVat) * 100) / 100;

  const mathCheckPassed =
    Math.abs(calculatedSub - data.amount) < 0.05 &&
    Math.abs(calculatedVat - data.vat_amount) < 0.05 &&
    Math.abs(calculatedTotal - data.total_amount) < 0.05;

  if (!mathCheckPassed) {
    warnings.push(`ตรวจสอบผลรวมคลาดเคลื่อน: คำนวณ ${calculatedSub} + VAT 7% (${calculatedVat}) = ${calculatedTotal} vs ข้อมูล PR ${data.total_amount}`);
  }

  return {
    status: warnings.length > 0 ? 'WARNING' : 'PASSED',
    pr_no: data.pr_no,
    matchedSlots,
    missingSlotsInTemplate,
    amount: data.amount,
    vatAmount: data.vat_amount,
    totalAmount: data.total_amount,
    bahtTextEn: data.baht_text_en,
    mathCheckPassed,
    warnings
  };
}

/**
 * Generate PDF of Purchase Request matching PR.pdf 100% using pdf-lib.
 * A4 Portrait, black-and-white business layout, exact two-column vendor/PR info,
 * continuous table vertical lines, header divider line,
 * boxed Baht text, and Requested By / Approved By signatures.
 */
export async function generatePurchaseRequestMasterPDF(
  data: PurchaseRequestTemplateData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Embed official logo image
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

  // A4 dimensions in points: 595.28 x 841.89
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 34; // Left and right margin

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

    // Sanitize text for WinAnsi encoding
    let sanitized = (text || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...');

    try {
      page.drawText(sanitized, {
        x,
        y,
        size,
        font: fontToUse,
        color
      });
    } catch {
      const asciiOnly = sanitized.replace(/[^\x20-\xFF]/g, '');
      if (asciiOnly.trim()) {
        try {
          page.drawText(asciiOnly, {
            x,
            y,
            size,
            font: fontToUse,
            color
          });
        } catch {}
      }
    }
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    thickness = 0.8,
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
    strokeWidth = 0.8,
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
  // 1. TOP HEADER: LOGO ON LEFT & COMPANY INFO (Matching PR.pdf)
  // -------------------------------------------------------------
  const topY = height - margin;

  let logoWidth = 120;
  let logoHeight = 40;
  if (logoImage) {
    const aspect = logoImage.width / logoImage.height;
    logoHeight = 42;
    logoWidth = Math.round(logoHeight * aspect);
    page.drawImage(logoImage, {
      x: margin,
      y: topY - logoHeight - 2,
      width: logoWidth,
      height: logoHeight
    });
  } else {
    drawText('M Power', margin, topY - 24, 18, true, rgb(0.1, 0.2, 0.5));
  }

  // Company details beside logo
  const compInfoX = margin + logoWidth + 14;
  let compY = topY - 8;
  drawText('M Power Engineering Solutions Co., Ltd.', compInfoX, compY, 10.5, true);
  compY -= 12;
  drawText('53/72 Moo 8, Sattahip Subdistrict, Sattahip District,', compInfoX, compY, 8.5);
  compY -= 10;
  drawText('Chonburi 20180 , Thailand.', compInfoX, compY, 8.5);
  compY -= 11;
  drawText('Tel. 033-641789 / 063-9359565', compInfoX, compY, 8.5);
  compY -= 10;
  drawText('Email: sales@mpower-engineering.com , info@mpower-engineering.com', compInfoX, compY, 8.5);
  compY -= 11;
  drawText('Tax ID Number. 0205569006956 (Head office)', compInfoX, compY, 8.5);

  // -------------------------------------------------------------
  // 2. DOCUMENT TITLE: "Purchase Request" (Centered Bold)
  // -------------------------------------------------------------
  const titleY = topY - 82;
  const titleText = 'Purchase Request';
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 16);
  drawText(titleText, (width - titleWidth) / 2, titleY, 16, true);

  // -------------------------------------------------------------
  // 3. VENDOR / SUPPLIER & PR INFORMATION (Framed Box with Divider)
  // -------------------------------------------------------------
  const infoTopY = titleY - 18;
  const contentW = width - margin * 2;
  const infoBoxH = 92;
  const infoBoxBottomY = infoTopY - infoBoxH;
  const infoSplitX = margin + contentW * 0.64;

  // Outer border of Vendor / PR info box and vertical dividing line
  drawRect(margin, infoBoxBottomY, contentW, infoBoxH, rgb(0, 0, 0), 0.8);
  drawLine(infoSplitX, infoBoxBottomY, infoSplitX, infoTopY, 0.8);

  const leftColX = margin + 8;
  const rightColX = infoSplitX + 8;

  // Left Column: Supplier / Vendor Info
  let suppY = infoTopY - 14;
  const safeSuppName = data.supplier_name.replace(/[\u0E00-\u0E7F]/g, '').trim() || data.supplier_name;
  drawText(safeSuppName, leftColX, suppY, 10, true);
  suppY -= 12;

  const addrLines = formatWrappedAddress(data.supplier_address, 34);
  for (const line of addrLines.slice(0, 2)) {
    const safeLine = line.replace(/[\u0E00-\u0E7F]/g, '').trim() || line;
    drawText(safeLine, leftColX, suppY, 8.5);
    suppY -= 11;
  }

  suppY -= 2;
  const suppTaxLabel = 'Tax ID No. :';
  drawText(suppTaxLabel, leftColX, suppY, 8.5, true);
  drawText(data.supplier_tax_id, leftColX + 65, suppY, 8.5);
  suppY -= 11;

  const suppPhoneLabel = 'Tel. :';
  drawText(suppPhoneLabel, leftColX, suppY, 8.5, true);
  drawText(data.supplier_phone, leftColX + 65, suppY, 8.5);
  suppY -= 11;

  const suppAttnLabel = 'Attn. :';
  drawText(suppAttnLabel, leftColX, suppY, 8.5, true);
  const safeAttn = data.supplier_attn.replace(/[\u0E00-\u0E7F]/g, '').trim() || data.supplier_attn;
  drawText(safeAttn, leftColX + 65, suppY, 8.5);

  // Right Column: PR Information (Exact 5 fields matching screenshot)
  let prY = infoTopY - 14;
  const prFields = [
    { label: 'PR. No. :', val: data.pr_no, isBold: true },
    { label: 'Date :', val: data.date, isBold: false },
    { label: 'Due Date :', val: data.due_date || 'Cash', isBold: false },
    { label: 'Sales Name :', val: data.sales_name.replace(/[\u0E00-\u0E7F]/g, '').trim() || data.sales_name, isBold: false },
    { label: 'Ref. Customer :', val: data.ref_customer.replace(/[\u0E00-\u0E7F]/g, '').trim() || data.ref_customer, isBold: false }
  ];

  const labelW = 75;
  for (const f of prFields) {
    drawText(f.label, rightColX, prY, 8.5, true);
    drawText(f.val, rightColX + labelW, prY, 8.5, f.isBold);
    prY -= 12;
  }

  // -------------------------------------------------------------
  // 4. ITEM TABLE (Quantity | Description | Unit | Price (THB) | Amount (THB))
  // Horizontal header divider line & continuous vertical gridlines
  // -------------------------------------------------------------
  const tableTopY = infoBoxBottomY - 10;

  // 5 Columns matching user requirements:
  // Quantity: 11%
  // Description: 45%
  // Unit: 10%
  // Price (THB): 17%
  // Amount (THB): 17%
  const colW1 = contentW * 0.11;
  const colW2 = contentW * 0.45;
  const colW3 = contentW * 0.10;
  const colW4 = contentW * 0.17;
  const colW5 = contentW * 0.17;

  const colX1 = margin;
  const colX2 = colX1 + colW1;
  const colX3 = colX2 + colW2;
  const colX4 = colX3 + colW3;
  const colX5 = colX4 + colW4;

  const headerH = 22;
  const tableH = 260; // Clean table height
  const tableBottomY = tableTopY - tableH;

  // Outer border & header horizontal line
  drawRect(margin, tableBottomY, contentW, tableH, rgb(0, 0, 0), 1.2);
  drawLine(margin, tableTopY - headerH, margin + contentW, tableTopY - headerH, 1.2);

  // Column vertical lines extending full table height
  drawLine(colX2, tableBottomY, colX2, tableTopY, 1.2);
  drawLine(colX3, tableBottomY, colX3, tableTopY, 1.2);
  drawLine(colX4, tableBottomY, colX4, tableTopY, 1.2);
  drawLine(colX5, tableBottomY, colX5, tableTopY, 1.2);

  // Table header labels
  const thY = tableTopY - 15;
  const hQty = 'Quantity';
  drawText(hQty, colX1 + (colW1 - fontBold.widthOfTextAtSize(hQty, 9)) / 2, thY, 9, true);

  const hDesc = 'Description';
  drawText(hDesc, colX2 + 8, thY, 9, true);

  const hUnit = 'Unit';
  drawText(hUnit, colX3 + (colW3 - fontBold.widthOfTextAtSize(hUnit, 9)) / 2, thY, 9, true);

  const hPrice = 'Price (THB)';
  drawText(hPrice, colX5 - 8 - fontBold.widthOfTextAtSize(hPrice, 9), thY, 9, true);

  const hAmt = 'Amount (THB)';
  drawText(hAmt, margin + contentW - 8 - fontBold.widthOfTextAtSize(hAmt, 9), thY, 9, true);

  // Table items rows
  let rowY = tableTopY - headerH - 18;
  data.items.forEach(it => {
    // Quantity (centered)
    const qtyStr = String(it.quantity);
    drawText(qtyStr, colX1 + (colW1 - fontRegular.widthOfTextAtSize(qtyStr, 9)) / 2, rowY, 9);

    // Description (left)
    const descStr = it.description.replace(/[\u0E00-\u0E7F]/g, '').trim() || it.description;
    drawText(descStr, colX2 + 8, rowY, 9);

    // Unit (centered)
    const unitStr = it.unit || 'EA';
    drawText(unitStr, colX3 + (colW3 - fontRegular.widthOfTextAtSize(unitStr, 9)) / 2, rowY, 9);

    // Price (THB) (right)
    const priceStr = it.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    drawText(priceStr, colX5 - 8 - fontRegular.widthOfTextAtSize(priceStr, 9), rowY, 9);

    // Amount (THB) (right)
    const amtStr = it.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    drawText(amtStr, margin + contentW - 8 - fontRegular.widthOfTextAtSize(amtStr, 9), rowY, 9);

    rowY -= 18;
  });

  // -------------------------------------------------------------
  // 5. LAST ENTRY (Matching PR.pdf)
  // -------------------------------------------------------------
  rowY -= 6;
  const lastEntryText = '** LAST ENTRY **';
  const lastEntryW = fontBold.widthOfTextAtSize(lastEntryText, 9);
  drawText(lastEntryText, colX2 + (colW2 - lastEntryW) / 2, rowY, 9, true);

  // -------------------------------------------------------------
  // 6. DELIVERY REMARK (Red text inside bottom area of table)
  // -------------------------------------------------------------
  let renderedThaiRemark = false;
  if (typeof document !== 'undefined') {
    try {
      const c = document.createElement('canvas');
      c.width = 800;
      c.height = 160;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = '#dc2626'; // Red text matching PR.pdf
        ctx.font = 'bold 24px "Sarabun", "TH Sarabun New", "Noto Sans Thai", Tahoma, sans-serif';
        ctx.textBaseline = 'top';
        const deliveryLines = (
          data.delivery_note ||
          `* กรุณาจัดส่งสินค้าตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์เอ็นจิเนียริ่งโซลูชั่นส์ จำกัด\n** เปิดบิล-ส่งของวันที่ ${data.date}`
        ).split(/\r?\n/);
        deliveryLines.forEach((line, lIdx) => {
          ctx.fillText(line, 4, 4 + lIdx * 34);
        });
        const dataUrl = c.toDataURL('image/png');
        const remarkPngBytes = base64ToUint8Array(dataUrl);
        const remarkImg = await pdfDoc.embedPng(remarkPngBytes);
        const imgW = 230;
        const imgH = (imgW / 800) * 160;
        page.drawImage(remarkImg, {
          x: colX2 + 8,
          y: tableBottomY + 8,
          width: imgW,
          height: imgH
        });
        renderedThaiRemark = true;
      }
    } catch (e) {
      console.warn('Canvas remark render failed:', e);
    }
  }

  if (!renderedThaiRemark) {
    const redColor = rgb(0.85, 0.1, 0.1);
    let remarkY = tableBottomY + 45;
    drawText('Please deliver goods to company name and address:', colX2 + 8, remarkY, 8, true, redColor);
    remarkY -= 12;
    drawText('M Power Engineering Solutions Co., Ltd.', colX2 + 8, remarkY, 8, true, redColor);
    remarkY -= 12;
    drawText(`Delivery Date: ${data.date}`, colX2 + 8, remarkY, 8, true, redColor);
  }

  // -------------------------------------------------------------
  // 7. TOTAL SECTION (AMOUNT | SALES VAT 7% | TOTAL AMOUNT)
  // & FRAMED BAHT TEXT ON LEFT (Matching sample)
  // -------------------------------------------------------------
  const totalAreaTopY = tableBottomY;
  const summaryW = colW4 + colW5;
  const summaryX = colX4;
  const rowH = 19;

  // Box for totals on right directly attached to table bottom
  drawRect(summaryX, totalAreaTopY - rowH * 3, summaryW, rowH * 3, rgb(0, 0, 0), 1.0);
  drawLine(summaryX, totalAreaTopY - rowH, summaryX + summaryW, totalAreaTopY - rowH, 0.8);
  drawLine(summaryX, totalAreaTopY - rowH * 2, summaryX + summaryW, totalAreaTopY - rowH * 2, 0.8);
  // Vertical line separating labels and amounts (continuous with colX5)
  drawLine(colX5, totalAreaTopY - rowH * 3, colX5, totalAreaTopY, 0.8);

  // AMOUNT
  const lblAmt = 'AMOUNT';
  drawText(lblAmt, summaryX + (colW4 - fontBold.widthOfTextAtSize(lblAmt, 8.5)) / 2, totalAreaTopY - 13, 8.5, true);
  const subStr = data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  drawText(subStr, summaryX + summaryW - 10 - fontRegular.widthOfTextAtSize(subStr, 9), totalAreaTopY - 13, 9);

  // SALES VAT 7%
  const lblVat = 'SALES VAT 7%';
  drawText(lblVat, summaryX + (colW4 - fontBold.widthOfTextAtSize(lblVat, 8.5)) / 2, totalAreaTopY - rowH - 13, 8.5, true);
  const vatStr = data.vat_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  drawText(vatStr, summaryX + summaryW - 10 - fontRegular.widthOfTextAtSize(vatStr, 9), totalAreaTopY - rowH - 13, 9);

  // TOTAL AMOUNT
  const lblTot = 'TOTAL AMOUNT';
  drawText(lblTot, summaryX + (colW4 - fontBold.widthOfTextAtSize(lblTot, 8.5)) / 2, totalAreaTopY - rowH * 2 - 13, 8.5, true);
  const grandStr = data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  drawText(grandStr, summaryX + summaryW - 10 - fontBold.widthOfTextAtSize(grandStr, 9), totalAreaTopY - rowH * 2 - 13, 9, true);

  // Left side: Framed Rectangular Baht Text Box (Aligned with TOTAL AMOUNT row)
  const bahtBoxW = colW1 + colW2 + colW3 - 14;
  const bahtBoxH = 19;
  const bahtBoxY = totalAreaTopY - rowH * 3 + 1;
  drawRect(margin, bahtBoxY, bahtBoxW, bahtBoxH, rgb(0, 0, 0), 0.8);
  const bahtText = data.baht_text_en;
  const bahtTextW = fontBold.widthOfTextAtSize(bahtText, 8.5);
  drawText(bahtText, margin + (bahtBoxW - bahtTextW) / 2, bahtBoxY + 5.5, 8.5, true);

  // Remarks & Page 1/1 (matching sample)
  const remarksY = bahtBoxY - 14;
  drawText('Remarks;', margin, remarksY, 9, true);
  const pageStr = 'Page 1/1';
  drawText(pageStr, width - margin - fontBold.widthOfTextAtSize(pageStr, 9), remarksY, 9, true);

  if (data.remarks) {
    if (typeof document !== 'undefined' && /[\u0E00-\u0E7F]/.test(data.remarks)) {
      try {
        const rc = document.createElement('canvas');
        rc.width = 1200;
        rc.height = 140;
        const rctx = rc.getContext('2d');
        if (rctx) {
          rctx.clearRect(0, 0, rc.width, rc.height);
          rctx.fillStyle = '#000000';
          rctx.font = '20px "Sarabun", "TH Sarabun New", "Noto Sans Thai", Tahoma, sans-serif';
          rctx.textBaseline = 'top';
          const rLines = data.remarks.split(/\r?\n/);
          rLines.slice(0, 4).forEach((line, rIdx) => {
            rctx.fillText(line, 2, 2 + rIdx * 28);
          });
          const rPngBytes = base64ToUint8Array(rc.toDataURL('image/png'));
          const rImg = await pdfDoc.embedPng(rPngBytes);
          page.drawImage(rImg, {
            x: margin,
            y: remarksY - 26,
            width: 380,
            height: 22
          });
        }
      } catch (err) {
        drawText(data.remarks.replace(/[\u0E00-\u0E7F]/g, '').trim(), margin, remarksY - 11, 8.5);
      }
    } else {
      drawText(data.remarks, margin, remarksY - 11, 8.5);
    }
  }

  // -------------------------------------------------------------
  // 8. SIGNATURES: 2 Blocks (Requestd By & Approved By)
  // -------------------------------------------------------------
  const sigY = margin + 50;
  const sigLineW = 180;
  const sig1X = margin + 25;
  const sig2X = width - margin - sigLineW - 25;

  // Dotted line above Requestd By and Approved By
  const dotsText = '............................';
  const dotsW = fontRegular.widthOfTextAtSize(dotsText, 8.5);
  drawText(dotsText, sig1X + (sigLineW - dotsW) / 2, sigY, 8.5);
  drawText(dotsText, sig2X + (sigLineW - dotsW) / 2, sigY, 8.5);

  // Requestd By
  const reqText = 'Requestd By';
  const reqTextW = fontBold.widthOfTextAtSize(reqText, 9.5);
  drawText(reqText, sig1X + (sigLineW - reqTextW) / 2, sigY - 14, 9.5, true);

  // Approved By
  const appText = 'Approved By';
  const appTextW = fontBold.widthOfTextAtSize(appText, 9.5);
  drawText(appText, sig2X + (sigLineW - appTextW) / 2, sigY - 14, 9.5, true);

  return await pdfDoc.save();
}
