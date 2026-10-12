import React from 'react';
import { PurchaseOrderTemplateData } from '../../utils/purchaseOrderPdfEngine';
import { MPOWER_LOGO_BASE64 } from '../../assets/logoBase64';

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

interface MasterPurchaseOrderDocumentProps {
  data: PurchaseOrderTemplateData;
  scale?: number;
}

export const MasterPurchaseOrderDocument: React.FC<MasterPurchaseOrderDocumentProps> = ({
  data,
  scale = 1
}) => {
  return (
    <div
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center'
      }}
      className="flex flex-col gap-6 print:gap-0 mx-auto"
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, aside, footer, #navbar-shell, #sidebar-shell, button {
            display: none !important;
          }
          .master-po-container {
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 12mm !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

      {/* Exact A4 Sheet: 210mm x 297mm */}
      <div
        className="master-po-container bg-white text-black font-sans selection:bg-slate-200 shadow-2xl mx-auto print:shadow-none print:m-0 w-[210mm] min-h-[297mm] p-[12mm] box-border relative flex flex-col justify-between print:break-after-page text-[11px] leading-normal"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        <div>
          {/* ======================================================== */}
          {/* 1. TOP CORPORATE HEADER: M POWER LOGO & COMPANY INFO    */}
          {/* ======================================================== */}
          <div className="flex items-start justify-between pb-1">
            <div className="flex items-start gap-4">
              {/* Exact Official M Power Logo */}
              <div className="shrink-0 pt-0.5">
                <img
                  src={MPOWER_LOGO_BASE64}
                  alt="M Power Engineering Solutions Logo"
                  className="h-[46px] w-auto object-contain block"
                />
              </div>

              {/* Company text details (Strictly matching PO.pdf) */}
              <div className="text-[10px] text-black leading-[1.35] pl-1">
                <div className="font-extrabold text-[12px] text-black">
                  M Power Engineering Solutions Co., Ltd.
                </div>
                <div>53/72 Moo 8, Sattahip Subdistrict, Sattahip District,</div>
                <div>Chonburi 20180 , Thailand.</div>
                <div className="pt-0.5">Tel. 033-641789 / 063-9359565</div>
                <div>Email: sales@mpower-engineering.com , info@mpower-engineering.com</div>
                <div className="pt-0.5">Tax ID Number. 0205569006956 (Head office)</div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. DOCUMENT TITLE: "Purchase Order" (Centered Bold)      */}
          {/* ======================================================== */}
          <div className="text-center my-3">
            <h1 className="text-[18px] font-black tracking-normal text-black m-0 uppercase font-sans">
              Purchase Order
            </h1>
          </div>

          {/* ======================================================== */}
          {/* 3. VENDOR / SUPPLIER & PO INFORMATION (Framed Box with Divider) */}
          {/* ======================================================== */}
          <div className="border border-black flex mb-3 text-[11px] leading-[1.45] box-border">
            {/* Left Column: Vendor / Supplier Info (64%) */}
            <div className="w-[64%] p-2.5 border-r border-black space-y-0.5 box-border">
              <div className="font-bold text-[11.5px] text-black break-words">
                {data.supplier_name}
              </div>
              <div className="text-black text-[10.5px] leading-snug break-words space-y-0.5">
                {formatWrappedAddress(data.supplier_address, 34).map((line, idx) => (
                  <div key={idx} className="break-words break-all whitespace-normal">
                    {line}
                  </div>
                ))}
              </div>
              <div className="pt-1.5 space-y-0.5 text-[10.5px]">
                <div className="flex">
                  <span className="w-24 shrink-0 font-bold text-black">Tax ID No. :</span>
                  <span className="text-black font-mono break-all">{data.supplier_tax_id}</span>
                </div>
                <div className="flex">
                  <span className="w-24 shrink-0 font-bold text-black">Tel. :</span>
                  <span className="text-black font-mono break-all">{data.supplier_phone}</span>
                </div>
                <div className="flex">
                  <span className="w-24 shrink-0 font-bold text-black">Attn. :</span>
                  <span className="text-black break-words">{data.supplier_attn}</span>
                </div>
              </div>
            </div>

            {/* Right Column: PO Metadata (36%) */}
            <div className="w-[36%] p-2.5 space-y-1 text-[10.5px] flex flex-col justify-start box-border">
              <div className="flex">
                <span className="w-28 shrink-0 font-bold text-black">PO. No. :</span>
                <span className="font-mono font-bold text-black">{data.po_no}</span>
              </div>
              <div className="flex">
                <span className="w-28 shrink-0 font-bold text-black">Date :</span>
                <span className="font-mono text-black">{data.date}</span>
              </div>
              <div className="flex">
                <span className="w-28 shrink-0 font-bold text-black">Due Date :</span>
                <span className="text-black">{data.due_date}</span>
              </div>
              <div className="flex">
                <span className="w-28 shrink-0 font-bold text-black">Sales Name :</span>
                <span className="text-black break-words">{data.sales_name}</span>
              </div>
              <div className="flex items-start">
                <span className="w-28 shrink-0 font-bold text-black">Ref. Customer :</span>
                <span className="text-black break-words break-all leading-tight">{data.ref_customer}</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. ITEM TABLE (Quantity | Description | Unit | Price (THB) | Amount (THB)) */}
          {/* Continuous vertical gridlines + horizontal divider for header & items */}
          {/* ======================================================== */}
          <div className="w-full">
            <table className="w-full table-fixed border-collapse border border-black text-[10.5px]" style={{ border: '1px solid #000', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b-2 border-black text-black font-bold text-center bg-transparent" style={{ borderBottom: '1.5px solid #000' }}>
                  <th className="w-[11%] py-2 px-2 border-r border-b-2 border-black text-center font-bold" style={{ borderRight: '1px solid #000', borderBottom: '1.5px solid #000' }}>
                    Quantity
                  </th>
                  <th className="w-[45%] py-2 px-3 border-r border-b-2 border-black text-center font-bold" style={{ borderRight: '1px solid #000', borderBottom: '1.5px solid #000' }}>
                    Description
                  </th>
                  <th className="w-[10%] py-2 px-2 border-r border-b-2 border-black text-center font-bold" style={{ borderRight: '1px solid #000', borderBottom: '1.5px solid #000' }}>
                    Unit
                  </th>
                  <th className="w-[17%] py-2 px-3 border-r border-b-2 border-black text-center font-bold" style={{ borderRight: '1px solid #000', borderBottom: '1.5px solid #000' }}>
                    Price (THB)
                  </th>
                  <th className="w-[17%] py-2 px-3 border-b-2 border-black text-center font-bold" style={{ borderBottom: '1.5px solid #000' }}>
                    Amount (THB)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} className="align-top">
                    {/* Quantity */}
                    <td className="py-2 px-2 text-center border-r border-black font-mono" style={{ borderRight: '1px solid #000' }}>
                      {item.quantity}
                    </td>
                    {/* Description */}
                    <td className="py-2 px-3 border-r border-black font-medium break-words" style={{ borderRight: '1px solid #000' }}>
                      {item.description}
                    </td>
                    {/* Unit */}
                    <td className="py-2 px-2 text-center border-r border-black font-mono" style={{ borderRight: '1px solid #000' }}>
                      {item.unit || 'EA'}
                    </td>
                    {/* Price (THB) */}
                    <td className="py-2 px-3 text-right font-mono border-r border-black" style={{ borderRight: '1px solid #000' }}>
                      {item.unit_price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    {/* Amount */}
                    <td className="py-2 px-3 text-right font-mono">
                      {item.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                  </tr>
                ))}

                {/* ** LAST ENTRY ** marker (only vertical column lines, no horizontal divider) */}
                <tr className="align-top">
                  <td className="py-1 px-2 text-center border-r border-black font-mono" style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                  <td className="py-1 px-3 border-r border-black font-bold text-center italic" style={{ borderRight: '1px solid #000' }}>
                    ** LAST ENTRY **
                  </td>
                  <td className="py-1 px-2 border-r border-black font-mono" style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                  <td className="py-1 px-3 border-r border-black" style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                  <td className="py-1 px-3">&nbsp;</td>
                </tr>

                {/* Filler space ensuring vertical lines extend all the way down to table bottom */}
                <tr>
                  <td className="border-r border-black h-[180px]" style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                  <td className="border-r border-black relative p-3 h-[180px]" style={{ borderRight: '1px solid #000' }}>
                    {/* Red Delivery Remark inside bottom area matching sample */}
                    <div className="absolute bottom-3 left-3 text-[10px] text-[#dc2626] font-bold space-y-0.5 leading-snug">
                      {data.delivery_note ? (
                        data.delivery_note.split('\n').map((line, i) => (
                          <div key={i}>{line}</div>
                        ))
                      ) : (
                        <>
                          <div>* กรุณาจัดส่งสินค้า ตามชื่อ-ที่อยู่ บริษัท เอ็ม พาวเวอร์ เอ็นจิเนียริ่ง โซลูชั่นส์ จำกัด</div>
                          <div className="pt-0.5">** เปิดบิล-ส่งของวันที่ {data.date}</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="border-r border-black h-[180px]" style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                  <td className="border-r border-black h-[180px]" style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                  <td className="h-[180px]">&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ======================================================== */}
          {/* 5. TOTAL SECTION & BAHT TEXT (Directly Attached Layout) */}
          {/* ======================================================== */}
          <div className="flex justify-between items-start">
            {/* Left: Framed Baht Text Box (Aligned with Total Amount row) */}
            <div className="w-[66%] pt-12 pr-4">
              <div className="border border-black px-3 py-1.5 text-center font-bold text-[9.5px] uppercase tracking-wide">
                {data.baht_text_en}
              </div>
            </div>

            {/* Right: Summary Box (AMOUNT, SALES VAT 7%, TOTAL AMOUNT) */}
            <div className="w-[34%] border border-black border-t-0 text-[10.5px]">
              {/* AMOUNT */}
              <div className="flex items-center border-b border-black">
                <span className="w-[50%] py-1.5 px-2 font-bold text-black text-center border-r border-black">
                  AMOUNT
                </span>
                <span className="w-[50%] py-1.5 px-3 font-mono text-black text-right">
                  {data.amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>

              {/* SALES VAT 7% */}
              <div className="flex items-center border-b border-black">
                <span className="w-[50%] py-1.5 px-2 font-bold text-black text-center border-r border-black">
                  SALES VAT 7%
                </span>
                <span className="w-[50%] py-1.5 px-3 font-mono text-black text-right">
                  {data.vat_amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>

              {/* TOTAL AMOUNT */}
              <div className="flex items-center">
                <span className="w-[50%] py-1.5 px-2 font-bold text-black text-center border-r border-black">
                  TOTAL AMOUNT
                </span>
                <span className="w-[50%] py-1.5 px-3 font-bold font-mono text-black text-right">
                  {data.total_amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks & Page indicator matching sample screenshot */}
          <div className="flex justify-between items-start mt-2 text-[10.5px] text-black">
            <div>
              <div className="font-bold">Remarks;</div>
              {data.remarks && (
                <div className="text-[10px] text-black font-normal mt-0.5 whitespace-pre-line">
                  {data.remarks}
                </div>
              )}
            </div>
            <div className="font-bold text-[10px] text-right">Page 1/1</div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. SIGNATURES: 2 Blocks (Prepared By & Approved By)       */}
        {/* ======================================================== */}
        <div className="mt-12 mb-4">
          <div className="flex justify-between items-end px-10 text-center">
            {/* Prepared By */}
            <div className="w-56 text-center">
              <div className="h-10"></div>
              <div className="text-[11px] text-black font-mono tracking-wider mb-1 select-none">............................</div>
              <div className="text-[11px] font-bold text-black">Prepared By</div>
            </div>

            {/* Approved By */}
            <div className="w-56 text-center">
              <div className="h-10"></div>
              <div className="text-[11px] text-black font-mono tracking-wider mb-1 select-none">............................</div>
              <div className="text-[11px] font-bold text-black">Approved By</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
