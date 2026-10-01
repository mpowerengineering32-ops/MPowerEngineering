import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Supplier, PurchaseOrder } from '../types';
import { numberToEnglishBaht } from './numberWords';
import { MPOWER_LOGO_BASE64 } from '../assets/logoBase64';

export interface PurchaseOrderTemplateData {
  po_no: string;
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
    unit_price: number;
    amount: number;
  }[];
  amount: number;
  vat_amount: number;
  total_amount: number;
  baht_text_en: string;
  remarks?: string;
  delivery_note?: string;
  prepared_by?: string;
  approved_by?: string;
}

export interface PurchaseOrderAuditResult {
  status: 'PASSED' | 'WARNING';
  po_no: string;
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
 * Format a Date string into DD-MMM-YY (e.g. 01-Sep-26) matching PO.pdf
 */
export function formatPODate(dateStr?: string): string {
  if (!dateStr) return '01-Sep-26';

  // If already in DD-MMM-YY format
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
 * Prepare PurchaseOrderTemplateData from a CRM PurchaseOrder and optional Supplier record
 */
export function preparePurchaseOrderTemplateData(
  po: PurchaseOrder,
  supplier?: Supplier
): PurchaseOrderTemplateData {
  // Supplier name & address
  const suppName = po.supplier_name || supplier?.supplier_name || 'Dacon Trading Co., Ltd. (Head Office)';
  const suppAddr = po.supplier_address || supplier?.address || '88/9 Moo 3, Phala, Banchang,\nRayong 21130 Thailand';
  const suppTax = po.supplier_tax_id || supplier?.tax_id || '0215542000248';
  const suppPhone = po.supplier_phone || supplier?.phone || '081-8935437';
  const suppAttn = po.supplier_attn || supplier?.contact_person || 'Khun Chatcha';

  // Items normalization
  const itemsList = (po.items && po.items.length > 0)
    ? po.items.map(it => {
        const qty = Number(it.quantity ?? it.qty ?? 1);
        const unitPrice = Number(it.unit_price ?? 0);
        const amt = Number(it.amount ?? (qty * unitPrice));
        return {
          quantity: qty,
          description: it.description || '1630,WL/WF,BLACK',
          unit_price: unitPrice,
          amount: amt
        };
      })
    : [
        {
          quantity: 2,
          description: '1630,WL/WF,BLACK',
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
    po_no: po.po_no || '2609001',
    date: formatPODate(po.date || po.po_date || po.order_date),
    due_date: po.due_date || 'Cash',
    supplier_name: suppName,
    supplier_address: suppAddr,
    supplier_tax_id: suppTax,
    supplier_phone: suppPhone,
    supplier_attn: suppAttn,
    sales_name: po.sales_name || 'Praiya',
    ref_customer: po.ref_customer || 'Promt Solution',
    attn: suppAttn,
    items: itemsList,
    amount: subtotal,
    vat_amount: vat,
    total_amount: grandTotal,
    baht_text_en: bahtTextEn,
    remarks: po.remarks,
    delivery_note: po.delivery_note || po.billing_delivery_date_note || 'กรุณาจัดส่งสินค้าตามชื่อ-ที่อยู่\nบริษัท เอ็ม พาวเวอร์เอ็นจิเนียริ่งโซลูชั่นส์ จำกัด\nเปิดบิล-ส่งของวันที่ 1 กันยายน 2569',
    prepared_by: po.prepared_by || po.sales_name || 'Praiya',
    approved_by: po.approved_by || 'Authorized Manager'
  };
}

/**
 * Pre-Export Audit for Master Purchase Order Template
 */
export function auditPurchaseOrderForMasterTemplate(
  data: PurchaseOrderTemplateData
): PurchaseOrderAuditResult {
  const matchedSlots: PurchaseOrderAuditResult['matchedSlots'] = [
    { label: 'PO. No.', value: data.po_no, isTemplateSlot: true },
    { label: 'Date', value: data.date, isTemplateSlot: true },
    { label: 'Due Date', value: data.due_date, isTemplateSlot: true },
    { label: 'Supplier Name', value: data.supplier_name, isTemplateSlot: true },
    { label: 'Supplier Address', value: data.supplier_address, isTemplateSlot: true },
    { label: 'Supplier Tax ID No.', value: data.supplier_tax_id, isTemplateSlot: true },
    { label: 'Supplier Phone', value: data.supplier_phone, isTemplateSlot: true },
    { label: 'Supplier Attn.', value: data.supplier_attn, isTemplateSlot: true },
    { label: 'Sales Name', value: data.sales_name, isTemplateSlot: true },
    { label: 'Ref. Customer', value: data.ref_customer, isTemplateSlot: true },
    { label: 'Attn.', value: data.attn, isTemplateSlot: true },
    { label: 'Quantity (Column)', value: `${data.items.length} รายการ`, isTemplateSlot: true },
    { label: 'Descriptions (Column)', value: data.items.map(it => it.description).join(', '), isTemplateSlot: true },
    { label: 'Unit Price (THB) (Column)', value: 'THB Unit Price', isTemplateSlot: true },
    { label: 'Amount (THB) (Column)', value: `฿${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'AMOUNT (Subtotal)', value: `฿${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'SALES VAT 7%', value: `฿${data.vat_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'TOTAL AMOUNT', value: `฿${data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, isTemplateSlot: true },
    { label: 'BAHT TEXT (EN)', value: data.baht_text_en, isTemplateSlot: true },
    { label: 'Prepared By', value: data.prepared_by || 'Prepared By', isTemplateSlot: true },
    { label: 'Approved By', value: data.approved_by || 'Approved By', isTemplateSlot: true }
  ];

  const missingSlotsInTemplate: PurchaseOrderAuditResult['missingSlotsInTemplate'] = [];
  const warnings: string[] = [];

  const calculatedSub = Math.round(data.items.reduce((s, it) => s + it.amount, 0) * 100) / 100;
  const calculatedVat = Math.round(calculatedSub * 0.07 * 100) / 100;
  const calculatedTotal = Math.round((calculatedSub + calculatedVat) * 100) / 100;

  const mathCheckPassed =
    Math.abs(calculatedSub - data.amount) < 0.05 &&
    Math.abs(calculatedVat - data.vat_amount) < 0.05 &&
    Math.abs(calculatedTotal - data.total_amount) < 0.05;

  if (!mathCheckPassed) {
    warnings.push(`ตรวจสอบผลรวมคลาดเคลื่อน: คำนวณ ${calculatedSub} + VAT 7% (${calculatedVat}) = ${calculatedTotal} vs ข้อมูล PO ${data.total_amount}`);
  }

  return {
    status: warnings.length > 0 ? 'WARNING' : 'PASSED',
    po_no: data.po_no,
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
 * Generate PDF of Purchase Order matching PO.pdf 100% using pdf-lib.
 * A4 Portrait, black-and-white business layout, exact column widths and positions.
 */
export async function generatePurchaseOrderMasterPDF(
  data: PurchaseOrderTemplateData
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
  const margin = 36; // Left and right margin

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

    // Filter characters outside WinAnsi range to prevent pdf-lib encoding error
    const safeText = (text || '').replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');

    page.drawText(safeText, {
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
  // 1. TOP HEADER: LOGO ON LEFT & COMPANY INFO (Matching PO.pdf)
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
  // 2. DOCUMENT TITLE: "Purchase Order" (Centered Bold)
  // -------------------------------------------------------------
  const titleY = topY - 82;
  const titleText = 'Purchase Order';
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 16);
  drawText(titleText, (width - titleWidth) / 2, titleY, 16, true);

  // -------------------------------------------------------------
  // 3. VENDOR / SUPPLIER & PO INFORMATION (Two Column Layout)
  // -------------------------------------------------------------
  const infoTopY = titleY - 22;
  const leftColX = margin;
  const rightColX = width / 2 + 10;

  // Left Column: Supplier / Vendor Info
  let suppY = infoTopY;
  // Clean English supplier text (strip un-renderable non-latin characters for Helvetica)
  const safeSuppName = data.supplier_name.replace(/[\u0E00-\u0E7F]/g, '').trim() || data.supplier_name;
  drawText(safeSuppName, leftColX, suppY, 10.5, true);
  suppY -= 13;

  const addrLines = formatWrappedAddress(data.supplier_address, 36);
  for (const line of addrLines) {
    const safeLine = line.replace(/[\u0E00-\u0E7F]/g, '').trim() || line;
    drawText(safeLine, leftColX, suppY, 9);
    suppY -= 11;
  }

  suppY -= 6;
  const suppTaxLabel = 'Tax ID No. :';
  drawText(suppTaxLabel, leftColX, suppY, 9, true);
  drawText(data.supplier_tax_id, leftColX + 70, suppY, 9);
  suppY -= 12;

  const suppPhoneLabel = 'Tel. :';
  drawText(suppPhoneLabel, leftColX, suppY, 9, true);
  drawText(data.supplier_phone, leftColX + 70, suppY, 9);
  suppY -= 12;

  const suppAttnLabel = 'Attn. :';
  drawText(suppAttnLabel, leftColX, suppY, 9, true);
  const safeAttn = data.supplier_attn.replace(/[\u0E00-\u0E7F]/g, '').trim() || data.supplier_attn;
  drawText(safeAttn, leftColX + 70, suppY, 9);

  // Right Column: PO Information
  let poY = infoTopY;
  const poFields = [
    { label: 'PO. No. :', val: data.po_no, isBold: true },
    { label: 'Date :', val: data.date, isBold: false },
    { label: 'Due Date :', val: data.due_date, isBold: false },
    { label: 'Tax ID No. :', val: data.supplier_tax_id, isBold: false },
    { label: 'Sales Name :', val: data.sales_name.replace(/[\u0E00-\u0E7F]/g, '').trim() || data.sales_name, isBold: false },
    { label: 'Tel. :', val: data.supplier_phone, isBold: false },
    { label: 'Ref. Customer :', val: data.ref_customer.replace(/[\u0E00-\u0E7F]/g, '').trim() || data.ref_customer, isBold: false },
    { label: 'Attn. :', val: safeAttn, isBold: false }
  ];

  const labelW = 85;
  for (const f of poFields) {
    drawText(f.label, rightColX, poY, 9, true);
    drawText(f.val, rightColX + labelW, poY, 9, f.isBold);
    poY -= 12;
  }

  // -------------------------------------------------------------
  // 4. ITEM TABLE (Quantity | Descriptions | Unit Price | Amount)
  // -------------------------------------------------------------
  const tableTopY = Math.min(suppY, poY) - 14;
  const contentW = width - margin * 2;

  // Proportions matching PO.pdf:
  // Quantity: 12%
  // Descriptions: 52%
  // Unit Price (THB): 18%
  // Amount (THB): 18%
  const colW1 = contentW * 0.12;
  const colW2 = contentW * 0.52;
  const colW3 = contentW * 0.18;
  const colW4 = contentW * 0.18;

  const colX1 = margin;
  const colX2 = colX1 + colW1;
  const colX3 = colX2 + colW2;
  const colX4 = colX3 + colW3;

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

  // Table header labels
  const thY = tableTopY - 15;
  const hQty = 'Quantity';
  drawText(hQty, colX1 + (colW1 - fontBold.widthOfTextAtSize(hQty, 9)) / 2, thY, 9, true);

  const hDesc = 'Descriptions';
  drawText(hDesc, colX2 + 10, thY, 9, true);

  const hPrice = 'Unit Price (THB)';
  drawText(hPrice, colX4 - 10 - fontBold.widthOfTextAtSize(hPrice, 9), thY, 9, true);

  const hAmt = 'Amount (THB)';
  drawText(hAmt, margin + contentW - 10 - fontBold.widthOfTextAtSize(hAmt, 9), thY, 9, true);

  // Table items rows
  let rowY = tableTopY - headerH - 18;
  data.items.forEach(it => {
    // Quantity (centered)
    const qtyStr = String(it.quantity);
    drawText(qtyStr, colX1 + (colW1 - fontRegular.widthOfTextAtSize(qtyStr, 9)) / 2, rowY, 9);

    // Description (left)
    const descStr = it.description.replace(/[\u0E00-\u0E7F]/g, '').trim() || it.description;
    drawText(descStr, colX2 + 10, rowY, 9);

    // Unit Price (right)
    const priceStr = it.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    drawText(priceStr, colX4 - 10 - fontRegular.widthOfTextAtSize(priceStr, 9), rowY, 9);

    // Amount (right)
    const amtStr = it.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    drawText(amtStr, margin + contentW - 10 - fontRegular.widthOfTextAtSize(amtStr, 9), rowY, 9);

    rowY -= 18;
  });

  // -------------------------------------------------------------
  // 5. LAST ENTRY (Matching PO.pdf)
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
      c.width = 650;
      c.height = 140;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = '#dc2626'; // Red color
        ctx.font = 'bold 22px "Sarabun", "TH Sarabun New", "Noto Sans Thai", Tahoma, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText('กรุณาจัดส่งสินค้าตามชื่อ-ที่อยู่', 4, 4);
        ctx.fillText('บริษัท เอ็ม พาวเวอร์เอ็นจิเนียริ่งโซลูชั่นส์ จำกัด', 4, 38);
        ctx.fillText(`เปิดบิล-ส่งของวันที่ ${data.date}`, 4, 72);
        const dataUrl = c.toDataURL('image/png');
        const remarkPngBytes = base64ToUint8Array(dataUrl);
        const remarkImg = await pdfDoc.embedPng(remarkPngBytes);
        const imgW = 200;
        const imgH = (imgW / 650) * 140;
        page.drawImage(remarkImg, {
          x: colX2 + 8,
          y: tableBottomY + 10,
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
    drawText('Please deliver goods to company name and address:', colX2 + 10, remarkY, 8.5, true, redColor);
    remarkY -= 12;
    drawText('M Power Engineering Solutions Co., Ltd.', colX2 + 10, remarkY, 8.5, true, redColor);
    remarkY -= 12;
    drawText(`Billing and delivery date: ${data.date}`, colX2 + 10, remarkY, 8.5, true, redColor);
  }

  // -------------------------------------------------------------
  // 7. TOTAL SECTION (AMOUNT | SALES VAT 7% | TOTAL AMOUNT)
  // -------------------------------------------------------------
  const totalBoxTop = tableBottomY - 6;
  const totLabelX = colX3 + 10;
  const totValRightX = margin + contentW - 10;
  const rowH = 16;

  // AMOUNT (Subtotal)
  drawText('AMOUNT', totLabelX, totalBoxTop - 12, 9, true);
  const subStr = data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  drawText(subStr, totValRightX - fontRegular.widthOfTextAtSize(subStr, 9.5), totalBoxTop - 12, 9.5);
  drawLine(colX3, totalBoxTop - 16, margin + contentW, totalBoxTop - 16, 0.5);

  // SALES VAT 7%
  drawText('SALES VAT 7%', totLabelX, totalBoxTop - 12 - rowH, 9, true);
  const vatStr = data.vat_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  drawText(vatStr, totValRightX - fontRegular.widthOfTextAtSize(vatStr, 9.5), totalBoxTop - 12 - rowH, 9.5);
  drawLine(colX3, totalBoxTop - 16 - rowH, margin + contentW, totalBoxTop - 16 - rowH, 0.5);

  // TOTAL AMOUNT
  drawText('TOTAL AMOUNT', totLabelX, totalBoxTop - 12 - rowH * 2, 9.5, true);
  const grandStr = data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  drawText(grandStr, totValRightX - fontBold.widthOfTextAtSize(grandStr, 10), totalBoxTop - 12 - rowH * 2, 10, true);
  // Double underline below TOTAL AMOUNT
  drawLine(colX3, totalBoxTop - 16 - rowH * 2, margin + contentW, totalBoxTop - 16 - rowH * 2, 0.8);
  drawLine(colX3, totalBoxTop - 18 - rowH * 2, margin + contentW, totalBoxTop - 18 - rowH * 2, 0.5);

  // Outer border box around summary on right
  drawRect(colX3, totalBoxTop - 19 - rowH * 2, colW3 + colW4, rowH * 3 + 4, rgb(0, 0, 0), 0.8);

  // -------------------------------------------------------------
  // 8. BAHT TEXT (English Uppercase Text) & REMARKS
  // -------------------------------------------------------------
  // Baht Text on left side opposite the total box
  const bahtY = totalBoxTop - 16;
  drawText(data.baht_text_en, margin, bahtY, 8.5, true);

  // Remarks; label
  const remY = totalBoxTop - 45;
  drawText('Remarks;', margin, remY, 9, true);

  // -------------------------------------------------------------
  // 9. SIGNATURES: Prepared By & Approved By (No box around it)
  // -------------------------------------------------------------
  const sigY = margin + 45;
  const sigLineW = 160;
  const sig1X = margin + 30;
  const sig2X = width - margin - sigLineW - 30;

  // Prepared By
  drawLine(sig1X, sigY, sig1X + sigLineW, sigY, 0.8);
  const prepLabel = 'Prepared By';
  drawText(prepLabel, sig1X + (sigLineW - fontRegular.widthOfTextAtSize(prepLabel, 9.5)) / 2, sigY - 14, 9.5);

  // Approved By
  drawLine(sig2X, sigY, sig2X + sigLineW, sigY, 0.8);
  const appLabel = 'Approved By';
  drawText(appLabel, sig2X + (sigLineW - fontRegular.widthOfTextAtSize(appLabel, 9.5)) / 2, sigY - 14, 9.5);

  // -------------------------------------------------------------
  // 10. PAGE NUMBER: Page 1/1 (Bottom Right)
  // -------------------------------------------------------------
  const pageStr = 'Page 1/1';
  drawText(pageStr, width - margin - fontRegular.widthOfTextAtSize(pageStr, 8.5), margin - 15, 8.5);

  return await pdfDoc.save();
}
