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
              {/* ======================================================== */}
              <div
                className={`border border-black flex flex-col justify-between ${
                  isLastPage ? 'border-b-0 min-h-[360px]' : 'min-h-[480px]'
                }`}
              >
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-black text-black font-extrabold text-center">
                      <th className="py-1.5 px-2 w-[11%] border-r border-black font-extrabold text-center">
                        Quantity
                      </th>
                      <th className="py-1.5 px-3 w-[55%] border-r border-black font-extrabold text-center">
                        Drescription
                      </th>
                      <th className="py-1.5 px-3 w-[17%] border-r border-black font-extrabold text-center">
                        Unit Price (THB)
                      </th>
                      <th className="py-1.5 px-3 w-[17%] font-extrabold text-center">
                        Amount (THB)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, idx) => (
                      <tr key={idx} className="align-top">
                        {/* Quantity */}
                        <td className="py-2 px-2 text-center border-r border-black font-bold">
                          {item.qty}
                        </td>
                        {/* Drescription */}
                        <td className="py-2 px-3 border-r border-black leading-tight">
                          <div className="font-bold text-black">{item.description}</div>
                          {item.details && item.details.length > 0 && (
                            <div className="text-[10px] text-black space-y-0.5 mt-0.5 pl-0.5">
                              {item.details.map((d, dIdx) => (
                                <div key={dIdx}>{d}</div>
                              ))}
                            </div>
                          )}
                        </td>
                        {/* Unit Price (THB) */}
                        <td className="py-2 px-3 border-r border-black text-right font-mono">
                          {item.unit_price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        {/* Amount (THB) */}
                        <td className="py-2 px-3 text-right font-mono">
                          {item.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                      </tr>
                    ))}

                    {/* Centered LAST ENTRY Indicator only on final page */}
                    {isLastPage && (
                      <tr>
                        <td className="border-r border-black"></td>
                        <td className="py-4 text-center border-r border-black italic text-[11px] font-medium tracking-wide">
                          ** LAST ENTRY **
                        </td>
                        <td className="border-r border-black"></td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ======================================================== */}
              {/* 5. SUMMARY ROW & ENGLISH BAHT TEXT BOX (Final Page Only) */}
              {/* ======================================================== */}
              {isLastPage && (
                <>
                  <div className="border border-black border-t-0 flex text-[10.5px]">
                    {/* Left area: English Words for Grand Total */}
                    <div className="w-[66%] flex flex-col justify-end border-r border-black">
                      <div className="border-t border-black p-1 text-center font-bold uppercase tracking-wide text-[9.5px] bg-slate-50/50">
                        {data.baht_text_en}
                      </div>
                    </div>

                    {/* Right area: AMOUNT, SALES VAT 7%, TOTAL AMOUNT */}
                    <div className="w-[34%]">
                      {/* Row 1: AMOUNT */}
                      <div className="flex border-t border-black">
                        <div className="w-[50%] p-1 text-right font-extrabold border-r border-black pr-2">
                          AMOUNT
                        </div>
                        <div className="w-[50%] p-1 text-right font-mono pr-3">
                          {data.subtotal.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </div>

                      {/* Row 2: SALES VAT 7% */}
                      <div className="flex border-t border-black">
                        <div className="w-[50%] p-1 text-right font-extrabold border-r border-black pr-2">
                          SALES VAT 7%
                        </div>
                        <div className="w-[50%] p-1 text-right font-mono pr-3">
                          {data.vat.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </div>

                      {/* Row 3: TOTAL AMOUNT */}
                      <div className="flex border-t border-black">
                        <div className="w-[50%] p-1 text-right font-extrabold border-r border-black pr-2">
                          TOTAL AMOUNT
                        </div>
                        <div className="w-[50%] p-1 text-right font-mono font-bold pr-3">
                          {data.grand_total.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

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
