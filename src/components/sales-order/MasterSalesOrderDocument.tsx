import React, { useMemo } from 'react';
import { SalesOrderTemplateData } from '../../utils/salesOrderPdfEngine';
import { MPOWER_LOGO_BASE64 } from '../../assets/logoBase64';

interface MasterSalesOrderDocumentProps {
  data: SalesOrderTemplateData;
  scale?: number;
}

export const MasterSalesOrderDocument: React.FC<MasterSalesOrderDocumentProps> = ({
  data,
  scale = 1
}) => {
  // Requirement 6 & 7: Pagination calculation if items exceed 1 page
  const paginatedPages = useMemo(() => {
    const items = data.items || [];
    if (items.length <= 3) {
      return [items];
    }

    // Compute line units to paginate cleanly
    const pages: (typeof items)[] = [];
    let currentPage: typeof items = [];
    let currentUnits = 0;
    const maxUnitsPage1 = 8; // with footer & customer box
    const maxUnitsSubsequent = 12;

    items.forEach((item) => {
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

    return pages.length > 0 ? pages : [[]];
  }, [data.items]);

  const totalPages = paginatedPages.length;

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
          .master-so-container {
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border-color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      {paginatedPages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;

        return (
          <div
            key={pageIdx}
            className="master-so-container bg-white text-black font-sans selection:bg-indigo-100 shadow-2xl mx-auto print:shadow-none print:m-0 w-[210mm] min-h-[297mm] p-[10mm] box-border relative flex flex-col justify-between print:break-after-page"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <div>
              {/* ======================================================== */}
              {/* 1. TOP CORPORATE HEADER: M POWER LOGO & COMPANY INFO    */}
              {/* ======================================================== */}
              <div className="flex items-start justify-between pb-2">
                <div className="flex items-start gap-4">
                  {/* Exact Official M Power Logo */}
                  <div className="shrink-0 pt-0.5">
                    <img
                      src={MPOWER_LOGO_BASE64}
                      alt="M Power Engineering Solutions Logo"
                      className="h-[46px] w-auto object-contain block"
                    />
                  </div>

                  {/* Company text details */}
                  <div className="text-[10.5px] text-black leading-[1.35] pl-2">
                    <div className="font-extrabold text-[12px] text-black">
                      M Power Engineering Solutions Co., Ltd.
                    </div>
                    <div>53/72 Moo 8, Sattahip Subdistrict, Sattahip District, Chonburi 20180 , Thailand.</div>
                    <div>Tel. 033-641789 / 063-9359565 Email: sales@mpower-engineering.com , info@mpower-engineering.com</div>
                    <div>Tax ID Number. 0205569006956 (Head office)</div>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Page {pageIdx + 1} of {totalPages}
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* 2. DOCUMENT TITLE: "Sale Order" (Centered Bold)          */}
              {/* ======================================================== */}
              <div className="text-center my-2.5">
                <h1 className="text-[17px] font-black tracking-normal text-black m-0 uppercase font-sans">
                  Sale Order
                </h1>
              </div>

              {/* ======================================================== */}
              {/* 3. CUSTOMER & SALE ORDER DETAILS BOX (2 Columns)        */}
              {/* ======================================================== */}
              <div className="border border-black flex mb-3 text-[11px] leading-[1.4]">
                {/* Left Column: Customer details (65% width) */}
                <div className="w-[65%] p-2.5 border-r border-black space-y-0.5">
                  <div>
                    <span className="font-extrabold text-black">Customer : </span>
                    <span className="font-normal text-black">{data.customer_name}</span>
                  </div>
                  <div className="pl-16 text-black">{data.customer_address_1}</div>
                  <div className="pl-16 text-black">{data.customer_address_2}</div>
                  <div className="pl-16 text-black">Tax ID: {data.tax_id}</div>
                  <div className="pt-0.5">
                    <span className="font-extrabold text-black pl-5">Attn: </span>
                    <span className="text-black">{data.attn}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-black pl-7">Tel: </span>
                    <span className="text-black">{data.tel}</span>
                  </div>
                </div>

                {/* Right Column: Sale Order Details (35% width) */}
                <div className="w-[35%] p-2.5 space-y-1.5 pl-3">
                  <div>
                    <span className="font-extrabold text-black">Sale Order No. : </span>
                    <span className="text-black font-semibold">{data.so_no}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-black pl-8">Date : </span>
                    <span className="text-black">{data.date}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-black">Terms of Payment : </span>
                    <span className="text-black">{data.terms_of_payment}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-black pl-3">Sales Name : </span>
                    <span className="text-black">{data.sales_name}</span>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 4. ITEMS TABLE (Quantity | Drescription | Unit Price | Amount) */}
              {/* Continuous vertical gridlines extending all the way down to bottom border */}
              {/* ======================================================== */}
              <div className="w-full">
                <div 
                  className={`w-full border border-black text-[11px] grid bg-white ${isLastPage ? 'border-b-0' : ''}`}
                  style={{ 
                    gridTemplateColumns: '11% 55% 17% 17%',
                    minHeight: '400px',
                    alignItems: 'stretch'
                  }}
                >
                  {/* Column 1: Quantity */}
                  <div className="border-r border-black flex flex-col h-full">
                    <div className="h-[32px] box-border flex items-center justify-center font-extrabold text-center border-b border-black px-2 bg-white">
                      Quantity
                    </div>
                    <div className="flex-1 py-2 px-2 text-center font-bold">
                      {pageItems.map((item, idx) => (
                        <div key={idx} className="mb-2">{item.qty}</div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Description */}
                  <div className="border-r border-black flex flex-col h-full">
                    <div className="h-[32px] box-border flex items-center justify-center font-extrabold text-center border-b border-black px-3 bg-white">
                      Description
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-2 px-3 leading-tight min-h-0">
                      <div>
                        {pageItems.map((item, idx) => (
                          <div key={idx} className="mb-2">
                            <div className="font-bold text-black">{item.description}</div>
                            {item.details && item.details.length > 0 && (
                              <div className="text-[10px] text-black space-y-0.5 mt-0.5 pl-0.5">
                                {item.details.map((d, dIdx) => {
                                  const isItalic = d.trim().startsWith('-') || d.toLowerCase().includes('length') || d.toLowerCase().includes('diameter');
                                  return <div key={dIdx} className={isItalic ? 'italic' : ''}>{d}</div>;
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {isLastPage && (
                        <div className="text-center italic text-[11px] font-bold tracking-wide pt-4 pb-2">
                          ** LAST ENTRY **
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Unit Price (THB) */}
                  <div className="border-r border-black flex flex-col h-full">
                    <div className="h-[32px] box-border flex items-center justify-center font-extrabold text-center border-b border-black px-3 bg-white">
                      Unit Price (THB)
                    </div>
                    <div className="flex-1 py-2 px-3 text-right">
                      {pageItems.map((item, idx) => (
                        <div key={idx} className="mb-2">
                          {item.unit_price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 4: Amount (THB) */}
                  <div className="flex flex-col h-full">
                    <div className="h-[32px] box-border flex items-center justify-center font-extrabold text-center border-b border-black px-3 bg-white">
                      Amount (THB)
                    </div>
                    <div className="flex-1 py-2 px-3 text-right">
                      {pageItems.map((item, idx) => (
                        <div key={idx} className="mb-2">
                          {item.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* 5. SUMMARY FOOTER & ENGLISH BAHT TEXT BOX (Final Page Only) */}
                {/* Merged seamlessly into the continuous table frame */}
                {/* ======================================================== */}
                {isLastPage && (
                  <div 
                    className="w-full border border-black border-t text-[11px] grid bg-white m-0"
                    style={{ gridTemplateColumns: '11% 55% 17% 17%' }}
                  >
                    {/* Column 1: Quantity divider extension (11%) */}
                    <div className="border-r border-black flex flex-col justify-end bg-white">
                      <div className="border-t border-black h-[26px] bg-slate-50">&nbsp;</div>
                    </div>

                    {/* Column 2: Baht Text (55%) */}
                    <div className="border-r border-black flex flex-col justify-end bg-white">
                      <div className="border-t border-black h-[26px] px-2 text-center font-bold uppercase tracking-wide text-[10px] bg-slate-50 flex items-center justify-center">
                        {data.baht_text_en}
                      </div>
                    </div>

                    {/* Column 3: Labels right-aligned under Unit Price (17%) */}
                    <div className="border-r border-black flex flex-col">
                      <div className="h-[24px] flex items-center justify-end px-2.5 font-bold text-[10px] border-b border-black">
                        AMOUNT
                      </div>
                      <div className="h-[24px] flex items-center justify-end px-2.5 font-bold text-[10px] border-b border-black">
                        SALES VAT 7%
                      </div>
                      <div className="h-[26px] flex items-center justify-end px-2.5 font-bold text-[10px]">
                        TOTAL AMOUNT
                      </div>
                    </div>

                    {/* Column 4: Values under Amount (17%) */}
                    <div className="flex flex-col">
                      <div className="h-[24px] flex items-center justify-end px-3 border-b border-black">
                        {data.subtotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                      <div className="h-[24px] flex items-center justify-end px-3 border-b border-black">
                        {data.vat.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                      <div className="h-[26px] flex items-center justify-end px-3 font-bold">
                        {data.grand_total.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isLastPage && (
                <>
                  {/* ======================================================== */}
                  {/* 6. TERMS & CONDITIONS SECTION                            */}
                  {/* ======================================================== */}
                  <div className="mt-3.5 text-[10px] space-y-0.5 text-black">
                    <div className="font-extrabold text-[10.5px]">Terms & Condition;</div>
                    <div className="pl-4">- 30 days validily from date of quotation.</div>
                    <div className="pl-4">- All prices above are quoted in THB.</div>
                  </div>
                </>
              )}
            </div>

            {/* ======================================================== */}
            {/* 7. SIGNATURES SECTION (Final Page Only)                  */}
            {/* ======================================================== */}
            {isLastPage ? (
              <div className="pt-10 pb-3">
                <div className="flex justify-between items-end px-6 text-[10.5px]">
                  {/* Left: Prepared By */}
                  <div className="w-56 text-center">
                    <div className="text-slate-400 select-none tracking-widest text-xs">
                      ......................................................
                    </div>
                    <div className="font-normal text-black mt-1">Prepared By</div>
                  </div>

                  {/* Right: Authorized Signature */}
                  <div className="w-56 text-center">
                    <div className="text-slate-400 select-none tracking-widest text-xs">
                      ......................................................
                    </div>
                    <div className="font-normal text-black mt-1">Authorized Signature</div>
                  </div>
                </div>
              </div>
            ) : (
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
