-- ============================================================================
-- M Power Engineering Solutions Co., Ltd. - Database Migration Schema
-- Module: 3 Core Subsystems (1. Supplier Accounts, 2. PR/PO Management, 3. Billing Notes)
-- Database Engine: PostgreSQL 14+ / Supabase / Google Cloud SQL PostgreSQL
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. SUPPLIERS & SUPPLIER CONTACTS TABLE (ทะเบียนซัพพลายเออร์และผู้ติดต่อ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    branch VARCHAR(100) DEFAULT 'สำนักงานใหญ่',
    address TEXT,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    contact_person VARCHAR(150),
    payment_term VARCHAR(50) DEFAULT 'Credit 30 Days',
    credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    bank_name VARCHAR(100),
    bank_account_no VARCHAR(50),
    bank_account_name VARCHAR(150),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Blacklisted')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    email VARCHAR(255),
    notes VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. PURCHASE REQUESTS & ITEMS TABLE (ใบขอซื้อ PR & การอนุมัติ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_no VARCHAR(50) UNIQUE NOT NULL,
    pr_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_date VARCHAR(50),
    due_date VARCHAR(50),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    supplier_address TEXT,
    supplier_tax_id VARCHAR(50),
    supplier_phone VARCHAR(50),
    supplier_attn VARCHAR(150),
    sales_name VARCHAR(150),
    requested_by VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    ref_customer VARCHAR(255),
    remarks TEXT,
    delivery_note TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    vat_percent NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Approval' CHECK (status IN ('Draft', 'Pending Approval', 'Approved', 'Rejected', 'Converted to PO', 'Cancelled')),
    approval_status VARCHAR(50) NOT NULL DEFAULT 'Pending Approval' CHECK (approval_status IN ('Draft', 'Pending Approval', 'Approved', 'Rejected')),
    approved_by VARCHAR(150),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by VARCHAR(150),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    converted_po_id UUID,
    converted_po_no VARCHAR(50),
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
    item_no INT NOT NULL DEFAULT 1,
    item_code VARCHAR(100),
    description TEXT NOT NULL,
    qty NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'EA',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. PURCHASE ORDERS & ITEMS TABLE (ใบสั่งซื้อ PO)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_no VARCHAR(50) UNIQUE NOT NULL,
    po_date DATE NOT NULL DEFAULT CURRENT_DATE,
    date VARCHAR(50),
    pr_id UUID REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
    pr_no VARCHAR(50),
    due_date VARCHAR(50),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_address TEXT,
    supplier_tax_id VARCHAR(50),
    supplier_phone VARCHAR(50),
    supplier_attn VARCHAR(150),
    payment_term VARCHAR(50) NOT NULL DEFAULT 'Credit 30 Days',
    sales_name VARCHAR(150),
    ref_customer VARCHAR(255),
    remarks TEXT,
    delivery_note TEXT,
    billing_delivery_date_note VARCHAR(255),
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    vat_percent NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Approved' CHECK (status IN ('Draft', 'Approved', 'Issued', 'Partial Delivered', 'Delivered', 'Completed', 'Cancelled')),
    prepared_by VARCHAR(150),
    approved_by VARCHAR(150),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_no INT NOT NULL DEFAULT 1,
    item_code VARCHAR(100),
    description TEXT NOT NULL,
    qty NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    received_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'EA',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. BILLING NOTES & ITEMS TABLE (ใบวางบิล - จำกัดสูงสุด 10 รายการต่อฉบับ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_no VARCHAR(50) UNIQUE NOT NULL,
    billing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    date VARCHAR(50),
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT,
    customer_tax_id VARCHAR(50),
    project_name VARCHAR(255),
    term_days INT NOT NULL DEFAULT 30,
    due_of_payment VARCHAR(50),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    delivered_by VARCHAR(150),
    delivered_date VARCHAR(50),
    received_by VARCHAR(150),
    received_date VARCHAR(50),
    receiver_position VARCHAR(100),
    notes TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Issued', 'Delivered', 'Collected', 'Cancelled', 'Overdue')),
    created_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_note_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_id UUID NOT NULL REFERENCES public.billing_notes(id) ON DELETE CASCADE,
    no INT NOT NULL DEFAULT 1 CHECK (no BETWEEN 1 AND 10),
    invoice_no VARCHAR(100) NOT NULL,
    sales_order_no VARCHAR(100),
    ref_no VARCHAR(100),
    date VARCHAR(50),
    description TEXT,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'งาน',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    outstanding_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE & RELATIONAL INTEGRITY
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_sc_supplier ON public.supplier_contacts(supplier_id);

CREATE INDEX IF NOT EXISTS idx_pr_no ON public.purchase_requests(pr_no);
CREATE INDEX IF NOT EXISTS idx_pr_status ON public.purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_pr_approval ON public.purchase_requests(approval_status);
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
CREATE INDEX IF NOT EXISTS idx_billing_date ON public.billing_notes(billing_date);
CREATE INDEX IF NOT EXISTS idx_billing_items_billing_id ON public.billing_note_items(billing_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_invoice ON public.billing_note_items(invoice_no);

-- ----------------------------------------------------------------------------
-- 6. REPORTING VIEWS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_pr_po_pipeline AS
SELECT 
    pr.id AS pr_id,
    pr.pr_no,
    pr.pr_date,
    pr.status AS pr_status,
    pr.approval_status,
    pr.requested_by,
    pr.approved_by,
    pr.approved_at,
    pr.supplier_name,
    pr.total_amount AS pr_amount,
    pr.converted_po_no,
    po.id AS po_id,
    po.po_date,
    po.status AS po_status,
    po.total_amount AS po_amount
FROM public.purchase_requests pr
LEFT JOIN public.purchase_orders po ON pr.converted_po_id = po.id OR pr.converted_po_no = po.po_no;

CREATE OR REPLACE VIEW public.v_billing_notes_summary AS
SELECT 
    bn.id,
    bn.billing_no,
    bn.billing_date,
    bn.customer_name,
    bn.due_of_payment,
    bn.status,
    bn.total_amount,
    COUNT(bni.id) AS total_items,
    COALESCE(SUM(bni.amount), 0.00) AS verified_items_sum
FROM public.billing_notes bn
LEFT JOIN public.billing_note_items bni ON bn.id = bni.billing_id
GROUP BY bn.id, bn.billing_no, bn.billing_date, bn.customer_name, bn.due_of_payment, bn.status, bn.total_amount;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) FOR SUPABASE REST APIS
-- ----------------------------------------------------------------------------
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_note_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public access on suppliers" ON public.suppliers;
    DROP POLICY IF EXISTS "Allow public access on supplier_contacts" ON public.supplier_contacts;
    DROP POLICY IF EXISTS "Allow public access on purchase_requests" ON public.purchase_requests;
    DROP POLICY IF EXISTS "Allow public access on purchase_request_items" ON public.purchase_request_items;
    DROP POLICY IF EXISTS "Allow public access on purchase_orders" ON public.purchase_orders;
    DROP POLICY IF EXISTS "Allow public access on purchase_order_items" ON public.purchase_order_items;
    DROP POLICY IF EXISTS "Allow public access on billing_notes" ON public.billing_notes;
    DROP POLICY IF EXISTS "Allow public access on billing_note_items" ON public.billing_note_items;
END $$;

CREATE POLICY "Allow public access on suppliers" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Allow public access on supplier_contacts" ON public.supplier_contacts FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_requests" ON public.purchase_requests FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_request_items" ON public.purchase_request_items FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_orders" ON public.purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_order_items" ON public.purchase_order_items FOR ALL USING (true);
CREATE POLICY "Allow public access on billing_notes" ON public.billing_notes FOR ALL USING (true);
CREATE POLICY "Allow public access on billing_note_items" ON public.billing_note_items FOR ALL USING (true);
