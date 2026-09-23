// ============================================================================
// SQL Schemas for Supabase (PostgreSQL) and MySQL (Local XAMPP)
// Procurement, Purchasing (PR/PO), Billing Notes, and Full CRM Integration
// ============================================================================

export const PROCUREMENT_AND_BILLING_SQL = `-- ============================================================================
-- M Power Engineering Solutions Co., Ltd. - Database Migration
-- Module: Procurement & Billing Extension (Suppliers, PR, PO, Billing Notes)
-- Database Engine: PostgreSQL 14+ / Supabase
-- Target Tables:
--   1. suppliers               (คู่ค้า / ทะเบียนซัพพลายเออร์)
--   2. purchase_requests       (ใบขอซื้อ PR)
--   3. purchase_request_items  (รายการสินค้าในใบขอซื้อ PR Items)
--   4. purchase_orders         (ใบสั่งซื้อ PO)
--   5. purchase_order_items    (รายการสินค้าในใบสั่งซื้อ PO Items)
--   6. billing_notes           (ใบวางบิล / Billing Notes)
--   7. billing_note_items      (รายการอ้างอิงในใบวางบิล)
-- ============================================================================

-- Extensions for UUID & Cryptography
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. SUPPLIERS TABLE (ทะเบียนคู่ค้า / ซัพพลายเออร์)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    contact_person VARCHAR(150),
    payment_term VARCHAR(50) DEFAULT 'Credit 30 Days',
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Inactive'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. PURCHASE REQUESTS TABLE (ใบขอซื้อ PR)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_no VARCHAR(50) UNIQUE NOT NULL,
    required_date VARCHAR(50),
    due_date VARCHAR(50),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    supplier_address TEXT,
    supplier_tax_id VARCHAR(50),
    supplier_phone VARCHAR(50),
    supplier_attn VARCHAR(150),
    sales_name VARCHAR(150),
    requestor VARCHAR(150) NOT NULL,
    requested_by VARCHAR(150),
    ref_customer VARCHAR(255),
    remarks TEXT,
    delivery_note TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Converted to PO'
    approved_by VARCHAR(150),
    approved_at TIMESTAMP WITH TIME ZONE,
    converted_po_id UUID,
    converted_po_no VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. PURCHASE REQUEST ITEMS TABLE (รายการในใบขอซื้อ - Normalized Items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
    item_no INT NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    qty NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'EA',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PURCHASE ORDERS TABLE (ใบสั่งซื้อ PO)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_no VARCHAR(50) UNIQUE NOT NULL,
    pr_id UUID REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
    pr_no VARCHAR(50),
    date VARCHAR(50) NOT NULL,
    due_date VARCHAR(50),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_address TEXT,
    supplier_tax_id VARCHAR(50),
    supplier_phone VARCHAR(50),
    supplier_attn VARCHAR(150),
    sales_name VARCHAR(150),
    ref_customer VARCHAR(255),
    remarks TEXT,
    delivery_note TEXT,
    billing_delivery_date_note VARCHAR(100),
    items JSONB DEFAULT '[]'::jsonb,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Approved', -- 'Draft', 'Approved', 'Delivered', 'Cancelled'
    prepared_by VARCHAR(150),
    approved_by VARCHAR(150),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. PURCHASE ORDER ITEMS TABLE (รายการในใบสั่งซื้อ - Normalized Items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_no INT NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    qty NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'EA',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. BILLING NOTES TABLE (ใบวางบิล)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_no VARCHAR(50) UNIQUE NOT NULL,
    date VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT,
    customer_tax_id VARCHAR(50),
    due_of_payment VARCHAR(50),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    delivered_by VARCHAR(150),
    delivered_date VARCHAR(50),
    received_by VARCHAR(150),
    received_date VARCHAR(50),
    notes TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Delivered', 'Collected', 'Cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. BILLING NOTE ITEMS TABLE (รายการใบแจ้งหนี้อ้างอิงในใบวางบิล)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_note_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_id UUID NOT NULL REFERENCES public.billing_notes(id) ON DELETE CASCADE,
    no INT NOT NULL DEFAULT 1,
    ref_no VARCHAR(100),
    invoice_no VARCHAR(100) NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    date VARCHAR(50),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. INDEXES FOR PERFORMANCE & RELATIONAL INTEGRITY
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);

CREATE INDEX IF NOT EXISTS idx_pr_no ON public.purchase_requests(pr_no);
CREATE INDEX IF NOT EXISTS idx_pr_status ON public.purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_pr_supplier ON public.purchase_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pr_items_pr_id ON public.purchase_request_items(pr_id);

CREATE INDEX IF NOT EXISTS idx_po_no ON public.purchase_orders(po_no);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_pr_id ON public.purchase_orders(pr_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON public.purchase_order_items(po_id);

CREATE INDEX IF NOT EXISTS idx_billing_no ON public.billing_notes(billing_no);
CREATE INDEX IF NOT EXISTS idx_billing_status ON public.billing_notes(status);
CREATE INDEX IF NOT EXISTS idx_billing_customer ON public.billing_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_billing_id ON public.billing_note_items(billing_id);

-- ----------------------------------------------------------------------------
-- 9. ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC REST POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_note_items ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated roles full read/write access via Supabase REST API
CREATE POLICY "Allow public access on suppliers" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_requests" ON public.purchase_requests FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_request_items" ON public.purchase_request_items FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_orders" ON public.purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_order_items" ON public.purchase_order_items FOR ALL USING (true);
CREATE POLICY "Allow public access on billing_notes" ON public.billing_notes FOR ALL USING (true);
CREATE POLICY "Allow public access on billing_note_items" ON public.billing_note_items FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- 10. INITIAL SEED DATA FOR M POWER ENGINEERING SOLUTIONS
-- ----------------------------------------------------------------------------
INSERT INTO public.suppliers (id, supplier_code, supplier_name, tax_id, address, phone, email, contact_person, payment_term, status, notes)
VALUES 
    ('s1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'SUP-26001', 'Thai Pipe & Fittings Co., Ltd.', '0105531001234', '88/12 Moo 3, Bangna-Trad Km.18, Bang Chalong, Bang Phli, Samut Prakan 10540', '02-316-4455', 'sales@thaipipefittings.com', 'คุณสมชาย วิทยาพงษ์', 'Credit 30 Days', 'Active', 'ซัพพลายเออร์ท่อสตีลและข้อต่อคุณภาพสูง'),
    ('s2ef4942-83b3-4f9e-bbb4-7a0df47a0002', 'SUP-26002', 'Eastern Technical Safety Equipment Ltd.', '0215549005678', '140 Sukhumvit Rd., Map Ta Phut, Mueang Rayong, Rayong 21150', '038-683-112', 'contact@easternequip.co.th', 'คุณกนกวรรณ จิตต์ดี', 'Credit 45 Days', 'Active', 'อุปกรณ์เซฟตี้ วาล์วอุตสาหกรรม และเกจวัดความดัน')
ON CONFLICT (supplier_code) DO NOTHING;

INSERT INTO public.purchase_requests (id, pr_no, required_date, due_date, supplier_id, supplier_name, supplier_address, supplier_tax_id, supplier_phone, supplier_attn, sales_name, requestor, requested_by, ref_customer, remarks, delivery_note, amount, vat_amount, total_amount, status, approved_by, approved_at, converted_po_id, converted_po_no, items)
VALUES 
    (
        'p1ef4942-83b3-4f9e-bbb4-7a0df47a0001',
        'PR 26-001',
        '25-Oct-26',
        '30 Days',
        's1ef4942-83b3-4f9e-bbb4-7a0df47a0001',
        'Thai Pipe & Fittings Co., Ltd.',
        '88/12 Moo 3, Bangna-Trad Km.18, Bang Chalong, Bang Phli, Samut Prakan 10540',
        '0105531001234',
        '02-316-4455',
        'คุณสมชาย วิทยาพงษ์',
        'Apiyut Noeikhiaw',
        'Apiyut Noeikhiaw',
        'Apiyut Noeikhiaw',
        'IKM Testing (Thailand) Co., Ltd',
        'ใช้สำหรับงานทดสอบระบบท่อโครงการ IKM Rayong',
        'ส่งมอบที่ไซต์งาน IKM Testing นิคมอุตสาหกรรมมาบตาพุด',
        18500.00,
        1295.00,
        19795.00,
        'Approved',
        'Administrator',
        NOW(),
        'o1ef4942-83b3-4f9e-bbb4-7a0df47a0001',
        'PO 26-001',
        '[{"item_no":1,"description":"Carbon Steel Pipe Seamless Sch.40 Size 4 inch","qty":10,"unit":"เส้น","unit_price":1200,"amount":12000},{"item_no":2,"description":"Flange ANSI 150# 4 inch Raised Face","qty":10,"unit":"ตัว","unit_price":650,"amount":6500}]'::jsonb
    )
ON CONFLICT (pr_no) DO NOTHING;

INSERT INTO public.purchase_orders (id, po_no, pr_id, pr_no, date, due_date, supplier_id, supplier_name, supplier_address, supplier_tax_id, supplier_phone, supplier_attn, sales_name, ref_customer, remarks, delivery_note, billing_delivery_date_note, amount, vat_amount, total_amount, status, prepared_by, approved_by, approved_at, items)
VALUES 
    (
        'o1ef4942-83b3-4f9e-bbb4-7a0df47a0001',
        'PO 26-001',
        'p1ef4942-83b3-4f9e-bbb4-7a0df47a0001',
        'PR 26-001',
        '25-Oct-26',
        '30 Days',
        's1ef4942-83b3-4f9e-bbb4-7a0df47a0001',
        'Thai Pipe & Fittings Co., Ltd.',
        '88/12 Moo 3, Bangna-Trad Km.18, Bang Chalong, Bang Phli, Samut Prakan 10540',
        '0105531001234',
        '02-316-4455',
        'คุณสมชาย วิทยาพงษ์',
        'Apiyut Noeikhiaw',
        'IKM Testing (Thailand) Co., Ltd',
        'ใช้สำหรับงานทดสอบระบบท่อโครงการ IKM Rayong',
        'ส่งมอบที่ไซต์งาน IKM Testing นิคมอุตสาหกรรมมาบตาพุด',
        'วางบิลภายในวันที่ 25 ของเดือน ชำระทุกวันศุกร์สุดท้ายของเดือน',
        18500.00,
        1295.00,
        19795.00,
        'Approved',
        'Apiyut Noeikhiaw',
        'Administrator',
        NOW(),
        '[{"item_no":1,"description":"Carbon Steel Pipe Seamless Sch.40 Size 4 inch","qty":10,"unit":"เส้น","unit_price":1200,"amount":12000},{"item_no":2,"description":"Flange ANSI 150# 4 inch Raised Face","qty":10,"unit":"ตัว","unit_price":650,"amount":6500}]'::jsonb
    )
ON CONFLICT (po_no) DO NOTHING;

INSERT INTO public.billing_notes (id, billing_no, date, customer_name, customer_address, customer_tax_id, due_of_payment, total_amount, delivered_by, delivered_date, received_by, received_date, notes, status, items)
VALUES 
    (
        'b1ef4942-83b3-4f9e-bbb4-7a0df47a0001',
        'BL2607001',
        '2026-07-02',
        'IKM Testing (Thailand) Co., Ltd',
        '155/167 Moo 5, Samnakthon Sub-District Banchang District, Rayong, Thailand 21130',
        '0215552000909',
        '2026-08-01',
        185000.00,
        'Apiyut Noeikhiaw',
        '2026-07-02',
        'สมศรี สุขเกษม (ฝ่ายบัญชี)',
        '2026-07-03',
        'วางบิลค่างวดงานที่ 1 โครงการ Sky Lotech High Lift Equipment Supply',
        'Delivered',
        '[{"no":1,"ref_no":"QT2607001","invoice_no":"INV-2026-001","date":"2026-07-01","amount":185000}]'::jsonb
    )
ON CONFLICT (billing_no) DO NOTHING;
`;

export const MYSQL_PROCUREMENT_AND_BILLING_SQL = `-- ==========================================
-- M Power Engineering Solutions - MySQL / MariaDB (XAMPP)
-- Module: Procurement & Billing Extension
-- ==========================================

USE \`sales_master_crm\`;

-- 1. Create SUPPLIERS Table (MySQL)
CREATE TABLE IF NOT EXISTS \`suppliers\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`supplier_code\` VARCHAR(50) UNIQUE NOT NULL,
    \`supplier_name\` VARCHAR(255) NOT NULL,
    \`tax_id\` VARCHAR(50) NULL,
    \`address\` TEXT NULL,
    \`phone\` VARCHAR(50) NULL,
    \`email\` VARCHAR(255) NULL,
    \`contact_person\` VARCHAR(150) NULL,
    \`payment_term\` VARCHAR(50) DEFAULT 'Credit 30 Days',
    \`status\` VARCHAR(50) NOT NULL DEFAULT 'Active',
    \`notes\` TEXT NULL,
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create PURCHASE REQUESTS Table (MySQL)
CREATE TABLE IF NOT EXISTS \`purchase_requests\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`pr_no\` VARCHAR(50) UNIQUE NOT NULL,
    \`required_date\` VARCHAR(50) NULL,
    \`due_date\` VARCHAR(50) NULL,
    \`supplier_id\` VARCHAR(50) NULL,
    \`supplier_name\` VARCHAR(255) NULL,
    \`supplier_address\` TEXT NULL,
    \`supplier_tax_id\` VARCHAR(50) NULL,
    \`supplier_phone\` VARCHAR(50) NULL,
    \`supplier_attn\` VARCHAR(150) NULL,
    \`sales_name\` VARCHAR(150) NULL,
    \`requestor\` VARCHAR(150) NOT NULL,
    \`requested_by\` VARCHAR(150) NULL,
    \`ref_customer\` VARCHAR(255) NULL,
    \`remarks\` TEXT NULL,
    \`delivery_note\` TEXT NULL,
    \`items\` JSON NULL,
    \`amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`vat_amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`total_amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`status\` VARCHAR(50) NOT NULL DEFAULT 'Pending',
    \`approved_by\` VARCHAR(150) NULL,
    \`approved_at\` DATETIME NULL,
    \`converted_po_id\` VARCHAR(50) NULL,
    \`converted_po_no\` VARCHAR(50) NULL,
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`purchase_request_items\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`pr_id\` VARCHAR(50) NOT NULL,
    \`item_no\` INT NOT NULL DEFAULT 1,
    \`description\` TEXT NOT NULL,
    \`qty\` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    \`unit\` VARCHAR(50) NOT NULL DEFAULT 'EA',
    \`unit_price\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`pr_id\`) REFERENCES \`purchase_requests\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create PURCHASE ORDERS Table (MySQL)
CREATE TABLE IF NOT EXISTS \`purchase_orders\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`po_no\` VARCHAR(50) UNIQUE NOT NULL,
    \`pr_id\` VARCHAR(50) NULL,
    \`pr_no\` VARCHAR(50) NULL,
    \`date\` VARCHAR(50) NOT NULL,
    \`due_date\` VARCHAR(50) NULL,
    \`supplier_id\` VARCHAR(50) NULL,
    \`supplier_name\` VARCHAR(255) NOT NULL,
    \`supplier_address\` TEXT NULL,
    \`supplier_tax_id\` VARCHAR(50) NULL,
    \`supplier_phone\` VARCHAR(50) NULL,
    \`supplier_attn\` VARCHAR(150) NULL,
    \`sales_name\` VARCHAR(150) NULL,
    \`ref_customer\` VARCHAR(255) NULL,
    \`remarks\` TEXT NULL,
    \`delivery_note\` TEXT NULL,
    \`billing_delivery_date_note\` VARCHAR(100) NULL,
    \`items\` JSON NULL,
    \`amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`vat_amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`total_amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`status\` VARCHAR(50) NOT NULL DEFAULT 'Approved',
    \`prepared_by\` VARCHAR(150) NULL,
    \`approved_by\` VARCHAR(150) NULL,
    \`approved_at\` DATETIME NULL,
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`) ON DELETE SET NULL,
    FOREIGN KEY (\`pr_id\`) REFERENCES \`purchase_requests\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`purchase_order_items\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`po_id\` VARCHAR(50) NOT NULL,
    \`item_no\` INT NOT NULL DEFAULT 1,
    \`description\` TEXT NOT NULL,
    \`qty\` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    \`unit\` VARCHAR(50) NOT NULL DEFAULT 'EA',
    \`unit_price\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`po_id\`) REFERENCES \`purchase_orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create BILLING NOTES Table (MySQL)
CREATE TABLE IF NOT EXISTS \`billing_notes\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`billing_no\` VARCHAR(50) UNIQUE NOT NULL,
    \`date\` VARCHAR(50) NOT NULL,
    \`customer_name\` VARCHAR(255) NOT NULL,
    \`customer_address\` TEXT NULL,
    \`customer_tax_id\` VARCHAR(50) NULL,
    \`due_of_payment\` VARCHAR(50) NULL,
    \`total_amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`delivered_by\` VARCHAR(150) NULL,
    \`delivered_date\` VARCHAR(50) NULL,
    \`received_by\` VARCHAR(150) NULL,
    \`received_date\` VARCHAR(50) NULL,
    \`notes\` TEXT NULL,
    \`items\` JSON NULL,
    \`status\` VARCHAR(50) NOT NULL DEFAULT 'Draft',
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`billing_note_items\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`billing_id\` VARCHAR(50) NOT NULL,
    \`no\` INT NOT NULL DEFAULT 1,
    \`ref_no\` VARCHAR(100) NULL,
    \`invoice_no\` VARCHAR(100) NOT NULL,
    \`date\` VARCHAR(50) NULL,
    \`amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`billing_id\`) REFERENCES \`billing_notes\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
