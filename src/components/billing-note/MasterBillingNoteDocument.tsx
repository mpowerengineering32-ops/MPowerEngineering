import React, { useMemo } from 'react';
import { BillingNoteTemplateData } from '../../utils/billingNotePdfEngine';
import { MPOWER_LOGO_BASE64 } from '../../assets/logoBase64';

interface MasterBillingNoteDocumentProps {
  data: BillingNoteTemplateData;
  scale?: number;
}

export const MasterBillingNoteDocument: React.FC<MasterBillingNoteDocumentProps> = ({
  data,
  scale = 1
}) => {
  // Pagination calculation: max 8 items per page
  const itemsPerPage = 8;
  const items = data.items || [];
  const paginatedPages = useMemo(() => {
    if (items.length <= itemsPerPage) {
      return [items];
    }
    const pages: (typeof items)[] = [];
    for (let i = 0; i < items.length; i += itemsPerPage) {
      pages.push(items.slice(i, i + itemsPerPage));
    }
    return pages;
  }, [items]);

  const totalPages = paginatedPages.length;

  return (
    <div
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center'
      }}
      className="flex flex-col gap-6 print:gap-0 mx-auto"
    >
      {paginatedPages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;

        return (
          <div
            key={pageIdx}
            className="bg-white text-black font-sans selection:bg-indigo-100 shadow-2xl mx-auto print:shadow-none print:m-0 w-[210mm] min-h-[297mm] p-[10mm] box-border relative flex flex-col justify-between print:break-after-page"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <div>
              {/* ======================================================== */}
              {/* 1. TOP HEADER: LOGO, CENTERED COMPANY INFO, RIGHT NO/DATE */}
              {/* ======================================================== */}
              <div className="relative flex items-start justify-between pb-1">
                {/* Top Left: Logo */}
                <div className="w-[22%] shrink-0 pt-0.5">
                  <img
                    src={MPOWER_LOGO_BASE64}
                    alt="M Power Engineering Solutions Logo"
                    className="h-[58px] w-auto object-contain block"
                  />
                </div>

                {/* Center: Title & Company text details (Company info left-aligned as requested) */}
                <div className="w-[56%] text-black leading-[1.38] px-2 flex flex-col items-center">
                  <h1 className="text-[21px] font-black text-black tracking-normal uppercase m-0 font-sans text-center">
                    ใบวางบิล / Billing
                  </h1>
                  <div className="text-left w-fit mt-1">
                    <div className="font-extrabold text-[12.5px] text-black">
                      M Power Engineering Solutions Co., Ltd.
                    </div>
                    <div className="text-[10px] text-black mt-0.5 font-normal">
                      53/72 Moo.8 , T. Sattahip, A. Sattahip, Chonburi 20180
                    </div>
                    <div className="text-[10px] text-black font-normal">
                      Tel.: 033 - 641789 / 063-9968789
                    </div>
                    <div className="text-[10px] text-black font-normal">
                      E-mail : account@mpower-engineering.com
                    </div>
                  </div>
                </div>

                {/* Top Right: Document No., Receipt & Date */}
                <div className="w-[24%] text-right shrink-0 pt-0.5 space-y-1">
                  <div className="font-black text-black text-[16px] tracking-tight">
                    NO. {data.billing_no}
                  </div>
                  <div className="text-[11px] text-black font-medium tracking-wide">
                    Document Receipt
                  </div>

                  <div className="pt-3 flex items-center justify-end text-[11px] text-black">
                    <span className="font-extrabold mr-2">Date:</span>
                    <span className="font-bold border-b-2 border-black inline-block min-w-[110px] text-center pb-0.5 font-mono">
                      {data.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 2. CUSTOMER LINE WITH CONTINUOUS UNDERLINE              */}
              {/* ======================================================== */}
              <div className="mt-4 mb-4 text-[12px] flex items-baseline">
                <span className="font-extrabold text-black shrink-0 mr-3">
                  Customer :
                </span>
                <span className="font-bold text-black border-b-2 border-black pb-0.5 inline-block w-[72%] truncate pl-1">
                  {data.customer_name}
                </span>
              </div>

              {/* ======================================================== */}
              {/* 3. BILLING TABLE (NO. | Ref. No. | Invoice No. | Date | Amout) */}
              {/* Continuous vertical gridlines all the way to bottom of box */}
              {/* ======================================================== */}
              <div className="border-2 border-black h-[480px] flex flex-col justify-between">
                <table className="w-full h-full table-fixed border-collapse text-[11.5px]">
                  <thead>
                    <tr className="border-b-2 border-black text-black font-extrabold text-center bg-transparent">
                      <th className="py-2 px-2 w-[11%] border-r-2 border-b-2 border-black font-extrabold text-center">
                        NO.
                      </th>
                      <th className="py-2 px-3 w-[18%] border-r-2 border-b-2 border-black font-extrabold text-center">
                        Ref. No.
                      </th>
                      <th className="py-2 px-3 w-[15%] border-r-2 border-b-2 border-black font-extrabold text-center">
                        Invoice No.
                      </th>
                      <th className="py-2 px-3 w-[18%] border-r-2 border-b-2 border-black font-extrabold text-center">
                        Date
                      </th>
                      <th className="py-2 px-3 w-[38%] border-b-2 border-black font-extrabold text-center">
                        Amout
                      </th>
                    </tr>
                  </thead>
                  <tbody className="h-full">
                    {pageItems.map((item, idx) => (
                      <tr key={idx} className="align-top h-8">
                        {/* NO. */}
                        <td className="py-2 px-2 text-center border-r-2 border-black font-medium">
                          {item.no}
                        </td>
                        {/* Ref. No. */}
                        <td className="py-2 px-3 border-r-2 border-black font-mono text-center">
                          {item.ref_no || ''}
                        </td>
                        {/* Invoice No. */}
                        <td className="py-2 px-3 border-r-2 border-black font-mono text-center font-bold">
                          {item.invoice_no}
                        </td>
                        {/* Date */}
                        <td className="py-2 px-3 border-r-2 border-black font-mono text-center">
                          {item.date}
                        </td>
                        {/* Amount */}
                        <td className="py-2 px-6 text-right font-mono font-medium">
                          {item.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                      </tr>
                    ))}
                    {/* Filler row ensuring column dividers extend down to the bottom border of the table */}
                    <tr className="h-full">
                      <td className="border-r-2 border-black">&nbsp;</td>
                      <td className="border-r-2 border-black">&nbsp;</td>
                      <td className="border-r-2 border-black">&nbsp;</td>
                      <td className="border-r-2 border-black">&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ======================================================== */}
              {/* 4. TOTAL ROW (Under Date & Amout columns)                */}
              {/* ======================================================== */}
              {isLastPage && (
                <div className="flex justify-end items-center mt-1 text-[11.5px]">
                  <div className="w-[18%] text-center font-extrabold text-black text-[12px]">
                    Total
                  </div>
                  <div className="w-[38%] border-2 border-black border-b-4 border-b-double py-1 px-6 text-right font-bold font-mono text-[12.5px] text-black">
                    {data.total.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 5. DUE OF PAYMENT (Gray box with center horizontal line) */}
              {/* ======================================================== */}
              {isLastPage && (
                <div className="mt-5 flex items-center text-[12px] text-black">
                  <span className="font-extrabold uppercase mr-3">
                    DUE OF PAYMENT
                  </span>
                  <div className="bg-[#bfbfbf] relative w-[150px] h-[28px] flex items-center justify-center">
                    {/* Horizontal line across gray box matching template */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b-2 border-black"></div>
                    <span className="relative z-10 font-bold font-mono text-[12px] text-black">
                      {data.due_of_payment || ''}
                    </span>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 6. DELIVERED BY & RECEIVED BY SIGNATURE UNDERLINES       */}
              {/* ======================================================== */}
              {isLastPage && (
                <div className="mt-6 flex justify-between items-start text-[11.5px] text-black">
                  {/* Left Signature: Delivered by */}
                  <div className="w-[42%] flex flex-col items-center">
                    {/* Hand-drawn style Saranya signature matching screenshot */}
                    <div className="h-14 flex items-end justify-center">
                      <svg className="w-40 h-12 text-[#2b3d5b]" viewBox="0 0 170 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Large left sweeping flourish loop */}
                        <path d="M 12 38 C 2 34, 4 14, 22 10 C 38 6, 42 16, 28 24 C 12 32, 2 38, 45 36" stroke="#2b3d5b" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        {/* Cursive aranya. letters */}
                        <path d="M 45 36 C 48 31, 52 28, 56 34 C 59 30, 63 28, 67 34 C 70 30, 74 28, 78 34 C 82 28, 86 28, 90 34 C 94 30, 98 30, 102 36" stroke="#2b3d5b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <text x="36" y="34" fontFamily="'Brush Script MT', 'Dancing Script', 'Caveat', cursive, serif" fontSize="21" fill="#2b3d5b" fontStyle="italic">
                          aranya.
                        </text>
                      </svg>
                    </div>
                    <div className="w-full border-b-2 border-black mt-0.5"></div>
                    <div className="font-extrabold text-center mt-1.5 text-[11.5px]">
                      Delivered by
                    </div>
                    <div className="text-center font-mono mt-0.5 font-bold text-[11px]">
                      {data.delivered_date || data.date}
                    </div>
                  </div>

                  {/* Right Signature: Received by */}
                  <div className="w-[42%] flex flex-col items-center">
                    <div className="h-14 flex items-end justify-center"></div>
                    <div className="w-full border-b-2 border-black mt-0.5"></div>
                    <div className="font-extrabold text-center mt-1.5 text-[11.5px]">
                      Received by
                    </div>
                    <div className="text-center font-mono mt-0.5 font-bold text-[11px] text-black">
                      (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 7. FOOTER REMARK (RED TEXT CENTERED)                    */}
              {/* ======================================================== */}
              {isLastPage && (
                <div className="mt-7 text-center text-red-600 font-bold text-[11.5px] leading-relaxed">
                  <div>
                    **รบกวนเซ็นต์รับและส่งกลับที่เมลล์ : account@mpower-engineering.com
                  </div>
                  <div>ขอบคุณค่ะ</div>
                </div>
              )}
            </div>

            {!isLastPage && (
              <div className="py-2 text-right text-[10px] text-slate-400 font-mono">
                [ Continued on next page ]
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
