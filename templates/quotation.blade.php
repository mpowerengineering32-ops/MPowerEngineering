<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Quotation {{ $quotation_no ?? '' }}</title>
    <style>
        @font-face {
            font-family: 'Sarabun';
            font-style: normal;
            font-weight: normal;
            src: url("https://cdn.jsdelivr.net/npm/font-sarabun@1.0.0/fonts/Sarabun-Regular.ttf") format('truetype');
        }
        @font-face {
            font-family: 'Sarabun';
            font-style: normal;
            font-weight: bold;
            src: url("https://cdn.jsdelivr.net/npm/font-sarabun@1.0.0/fonts/Sarabun-Bold.ttf") format('truetype');
        }

        @page {
            size: a4 portrait;
            margin: 12mm 12mm 15mm 12mm;
        }

        body {
            font-family: 'Sarabun', 'Helvetica', 'Arial', sans-serif;
            font-size: 10.5px;
            color: #000000;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }

        /* Header Style */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .company-info-cell {
            vertical-align: top;
            width: 100%;
            font-size: 10px;
            line-height: 1.25;
        }
        .company-name {
            font-size: 12px;
            font-weight: bold;
            color: #000000;
        }

        /* Document Title */
        .doc-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 3px;
            margin-top: 10px;
            margin-bottom: 12px;
            text-transform: uppercase;
        }

        /* Metadata Box */
        .meta-box {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000000;
            margin-bottom: 12px;
        }
        .meta-box td {
            vertical-align: top;
            padding: 6px 8px;
            font-size: 10.5px;
        }
        .meta-left {
            width: 50%;
            border-right: 1px solid #000000;
        }
        .meta-right {
            width: 50%;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000000;
            margin-bottom: 8px;
        }
        .items-table th {
            font-size: 10.5px;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
            border-bottom: 1px solid #000000;
            border-right: 1px solid #000000;
            padding: 6px 4px;
        }
        .items-table th:last-child {
            border-right: none;
        }
        .items-table td {
            font-size: 10px;
            padding: 6px;
            vertical-align: top;
            border-right: 1px solid #000000;
        }
        .items-table td:last-child {
            border-right: none;
        }

        /* Totals Box */
        .totals-section {
            width: 100%;
            margin-bottom: 12px;
        }
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }
        .baht-words-cell {
            width: 68%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 10px 0 0;
        }
        .baht-words-box {
            border: 1px solid #000000;
            padding: 6px 8px;
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            color: #000000;
        }
        .totals-values-cell {
            width: 32%;
            vertical-align: bottom;
        }
        .sub-total-row {
            width: 100%;
            border-collapse: collapse;
        }
        .sub-total-row td {
            padding: 3px 6px;
            font-size: 10px;
        }
        .sub-total-row td.amount-box {
            border: 1px solid #000000;
            width: 100px;
            text-align: right;
            font-family: monospace;
        }
        .sub-total-row tr:last-child td {
            border-bottom: none;
            font-weight: bold;
            background-color: #f8fafc;
        }

        /* Terms & Conditions */
        .terms-section {
            font-size: 10px;
            margin-bottom: 20px;
        }
        .terms-title {
            font-weight: bold;
            margin-bottom: 4px;
        }

        /* Signatures */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
        }
        .sig-cell {
            width: 50%;
            text-align: center;
            vertical-align: bottom;
            font-weight: bold;
            font-size: 10.5px;
        }
        .sig-line {
            border-bottom: 1px solid #000000;
            width: 80%;
            margin: 0 auto 6px auto;
        }
    </style>
</head>
<body>

    <!-- Company Header -->
    <table class="header-table">
        <tr>
            <td style="width: 170px; vertical-align: top;">
                <img src="/mpower-logo.png" alt="M Power Logo" style="width: 160px; height: auto;" />
            </td>
            <td class="company-info-cell" style="vertical-align: top;">
                <div class="company-name">M Power Engineering Solutions Co., Ltd.</div>
                <div>53/72 Moo 8, Sattahip Subdistrict, Sattahip District, Chonburi 20180 , Thailand.</div>
                <div>Tel. 033-641789 / 063-9359565 Email: sales.mpower-engineering.com , info@mpower-engineering.com</div>
                <div>Tax ID Number. 0205569006956 (Head office)</div>
            </td>
        </tr>
    </table>

    <!-- Document Title -->
    <div class="doc-title">QUOTATION</div>

    <!-- Metadata Box -->
    <table class="meta-box">
        <tr>
            <td class="meta-left">
                <div style="font-weight: bold; font-size: 11px;">{{ $customer_name ?? '-' }}</div>
                @if(isset($customer_address) && $customer_address)
                <div>{{ $customer_address }}</div>
                @endif
                @if(isset($customer_city) && $customer_city)
                <div>{{ $customer_city }}{{ isset($customer_province) && $customer_province ? ', ' . $customer_province : '' }}</div>
                @endif
                @if(isset($customer_phone) && $customer_phone)
                <div>Tel. {{ $customer_phone }}</div>
                @endif
                @if(isset($tax_id) && $tax_id)
                <div>Tax ID: {{ $tax_id }} {{ isset($branch) && $branch ? '(' . $branch . ')' : '(Head Office)' }}</div>
                @endif
                <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #ccc;">
                    <div><strong>Attn :</strong> {{ $attention ?? '-' }}</div>
                    <div><strong>Tel :</strong> {{ $attention_phone ?? $customer_phone ?? '-' }}</div>
                    <div><strong>Email :</strong> {{ $attention_email ?? $customer_email ?? '-' }}</div>
                </div>
            </td>
            <td class="meta-right">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="font-weight: bold; width: 100px; padding: 1px 0;">Quotation No. :</td>
                        <td style="font-weight: bold; padding: 1px 0;">{{ $quotation_no ?? 'QT2607001' }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 1px 0;">Date :</td>
                        <td style="padding: 1px 0;">{{ $quotation_date ?? '26-10-2025' }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 1px 0;">Due Date :</td>
                        <td style="padding: 1px 0;">30 Days</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 1px 0;">Sales Name :</td>
                        <td style="padding: 1px 0;">{{ $sales_person ?? 'Pronpicha' }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 10%;">Quantity</th>
                <th style="width: 60%;">Description</th>
                <th style="width: 15%; text-align: right;">Unit Price (THB)</th>
                <th style="width: 15%; text-align: right;">Amount (THB)</th>
            </tr>
        </thead>
        <tbody>
            @if(isset($items) && count($items) > 0)
                @foreach($items as $item)
                    <tr>
                        <td style="text-align: center; font-weight: bold;">{{ $item['qty'] ?? 1 }}</td>
                        <td>
                            <div style="font-weight: bold; font-size: 11px;">{{ $item['description'] ?? 'Sky Lotech High Lift' }}</div>
                            @if(isset($item['brand']))<div>Brand : {{ $item['brand'] }}</div>@endif
                            @if(isset($item['model']))<div>Model : {{ $item['model'] }}</div>@endif
                        </td>
                        <td style="text-align: right;">{{ number_format($item['unit_rate'] ?? 0, 2) }}</td>
                        <td style="text-align: right;">{{ number_format($item['total_price'] ?? 0, 2) }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td style="text-align: center; font-weight: bold;">1</td>
                    <td>
                        <div style="font-weight: bold; font-size: 11px;">Sky Lotech High Lift</div>
                        <div>Brand : Skyy Lotech</div>
                        <div>Model : M-380X-200</div>
                        <div style="font-style: italic;">- Length : 200 Meter</div>
                        <div style="font-style: italic;">- Length : 200 Meter</div>
                        <div style="font-style: italic;">- Diameter : 1/2"</div>
                    </td>
                    <td style="text-align: right;">2,800.00</td>
                    <td style="text-align: right;">2,800.00</td>
                </tr>
            @endif

            @if(isset($remarks) && $remarks)
            <tr>
                <td></td>
                <td style="text-align: left; padding: 8px;">
                    <div style="font-weight: bold; font-size: 10.5px;">Remarks / Notes</div>
                    <div style="font-size: 10px; color: #000;">{{ $remarks }}</div>
                </td>
                <td></td>
                <td></td>
            </tr>
            @endif

            <!-- Mid table last entry marker -->
            <tr>
                <td></td>
                <td style="text-align: center; font-weight: bold; font-style: italic; padding: 12px; letter-spacing: 2px;">
                    ** LAST ENTRY **
                </td>
                <td></td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <!-- Totals Row -->
    <div class="totals-section">
        <table class="totals-table">
            <tr>
                <td class="baht-words-cell">
                    <div class="baht-words-box">
                        {{ $baht_text ?? 'TWO THOUSAND NINE HUNDRED NINETY SIX BAHT' }}
                    </div>
                </td>
                <td class="totals-values-cell">
                    <table class="sub-total-row">
                        <tr>
                            <td style="font-weight: bold; text-align: right; text-transform: uppercase;">AMOUNT</td>
                            <td class="amount-box">{{ number_format($subtotal ?? 2800.00, 2) }}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; text-align: right; text-transform: uppercase;">SALES VAT 7%</td>
                            <td class="amount-box">{{ number_format($vat_amount ?? 196.00, 2) }}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; text-align: right; text-transform: uppercase;">TOTAL AMOUNT</td>
                            <td class="amount-box" style="font-weight: bold;">{{ number_format($grand_total ?? 2996.00, 2) }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <!-- Terms & Conditions -->
    <div class="terms-section">
        <div class="terms-title">Terms & Condition;</div>
        <div>- 30 days validily from date of quotation.</div>
        <div>- All prices above are quoted in THB.</div>
    </div>

    <div style="text-align: right; font-weight: bold; font-size: 10px;">Page 1/1</div>

    <!-- Signatures -->
    <table class="signatures-table">
        <tr>
            <td class="sig-cell">
                <div class="sig-line" style="margin-top: 30px;"></div>
                PREPARE BY
            </td>
            <td class="sig-cell">
                <div class="sig-line" style="margin-top: 30px;"></div>
                CUSTOMER APPRROVE BY
            </td>
        </tr>
    </table>

</body>
</html>
