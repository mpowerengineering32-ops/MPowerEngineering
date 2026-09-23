-- ============================================================================
-- M Power Engineering Solutions Co., Ltd. - Supabase PostgreSQL Database Schema
-- Project URL: https://ctgjfgpovfvismgfutcl.supabase.co
-- ============================================================================

-- Enable required extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    fullname VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Sales Rep', -- 'Admin', 'Sales Manager', 'Sales Rep', 'Auditor'
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Suspended'
    password VARCHAR(255) NOT NULL DEFAULT 'crm123456',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    industry_type VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    payment_term INT NOT NULL DEFAULT 30,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CUSTOMER CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.customer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    position VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) DEFAULT 'Testing Service',
    lead_source VARCHAR(100) DEFAULT 'Existing Customer',
    estimated_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    success_probability INT NOT NULL DEFAULT 20,
    expected_close_date DATE,
    sales_person_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    salesperson_name VARCHAR(150),
    status VARCHAR(50) NOT NULL DEFAULT 'Lead', -- 'Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Cancelled'
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    validity_days INT NOT NULL DEFAULT 30,
    payment_term VARCHAR(50) DEFAULT '30 Days',
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Sent', 'Approved', 'Rejected', 'Invoiced'
    sales_person_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    salesperson_name VARCHAR(150),
    total_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    terms_conditions TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. QUOTATION ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'Unit',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Unpaid', -- 'Unpaid', 'Paid', 'Overdue', 'Cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    fullname VARCHAR(150),
    role VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. OPPORTUNITY ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.opportunity_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'Call', 'Meeting', 'Email', 'Site Visit'
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    note TEXT,
    responsible_person VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON public.opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON public.quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);

-- 11. ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_activities ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write access for web REST API usage
CREATE POLICY "Allow public read access on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public write access on users" ON public.users FOR ALL USING (true);

CREATE POLICY "Allow public access on customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow public access on customer_contacts" ON public.customer_contacts FOR ALL USING (true);
CREATE POLICY "Allow public access on opportunities" ON public.opportunities FOR ALL USING (true);
CREATE POLICY "Allow public access on quotations" ON public.quotations FOR ALL USING (true);
CREATE POLICY "Allow public access on quotation_items" ON public.quotation_items FOR ALL USING (true);
CREATE POLICY "Allow public access on invoices" ON public.invoices FOR ALL USING (true);
CREATE POLICY "Allow public access on audit_logs" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Allow public access on opportunity_activities" ON public.opportunity_activities FOR ALL USING (true);

-- 12. INITIAL SEED DATA FOR M POWER ENGINEERING SOLUTIONS
INSERT INTO public.users (id, username, fullname, email, role, status, password)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'apiyut.noeikhiaw', 'Apiyut Noeikhiaw', 'Apiyut.noeikhiaw@th.ikm.com', 'Admin', 'Active', 'crm123456'),
    ('00000000-0000-0000-0000-000000000002', 'pronpicha', 'Pronpicha', 'pronpicha@mpower-engineering.com', 'Sales Rep', 'Active', 'crm123456')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.customers (id, customer_code, customer_name, tax_id, industry_type, address, phone, email, payment_term, status)
VALUES 
    ('c1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'CUS-260001', 'IKM Testing (Thailand) Co., Ltd', '0215552000909', 'Testing & Engineering', '155/167 Moo 5, Samnakthon Sub-District Banchang District, Rayong, Thailand 21130', '038-601 996-8', 'info@ikm-testing.co.th', 30, 'Active'),
    ('c2ef4942-83b3-4f9e-bbb4-7a0df47a0002', 'CUS-260002', 'PTT Public Company Limited', '0107544000108', 'Energy & Utilities', '555 Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900', '02-537-2000', 'info@pttplc.com', 30, 'Active')
ON CONFLICT (customer_code) DO NOTHING;

INSERT INTO public.quotations (id, quotation_no, customer_id, title, quotation_date, validity_days, payment_term, status, salesperson_name, total_value, tax_rate, grand_total, terms_conditions)
VALUES 
    ('q1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'QT2607001', 'c1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'Sky Lotech High Lift Equipment Supply', '2025-10-26', 30, '30 Days', 'Approved', 'Pronpicha', 2800.00, 7.00, 2996.00, '30 days validity from date of quotation. All prices above are quoted in THB.')
ON CONFLICT (quotation_no) DO NOTHING;

INSERT INTO public.quotation_items (quotation_id, item_name, quantity, unit, unit_price, total)
VALUES 
    ('q1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'Sky Lotech High Lift (Brand: Skyy Lotech, Model: M-380X-200, Length: 200m, Diameter: 1/2")', 1.00, 'Unit', 2800.00, 2800.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 13. SUPPLIERS TABLE (คู่ค้า / ซัพพลายเออร์)
-- ============================================================================
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
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 14. PURCHASE REQUESTS & ITEMS TABLE (ใบขอซื้อ PR)
-- ============================================================================
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
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    approved_by VARCHAR(150),
    approved_at TIMESTAMP WITH TIME ZONE,
    converted_po_id UUID,
    converted_po_no VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- ============================================================================
-- 15. PURCHASE ORDERS & ITEMS TABLE (ใบสั่งซื้อ PO)
-- ============================================================================
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
    status VARCHAR(50) NOT NULL DEFAULT 'Approved',
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
    description TEXT NOT NULL,
    qty NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'EA',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 16. BILLING NOTES & ITEMS TABLE (ใบวางบิล)
-- ============================================================================
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
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_pr_no ON public.purchase_requests(pr_no);
CREATE INDEX IF NOT EXISTS idx_po_no ON public.purchase_orders(po_no);
CREATE INDEX IF NOT EXISTS idx_billing_no ON public.billing_notes(billing_no);

-- Enable RLS & Policies
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_note_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access on suppliers" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_requests" ON public.purchase_requests FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_request_items" ON public.purchase_request_items FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_orders" ON public.purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow public access on purchase_order_items" ON public.purchase_order_items FOR ALL USING (true);
CREATE POLICY "Allow public access on billing_notes" ON public.billing_notes FOR ALL USING (true);
CREATE POLICY "Allow public access on billing_note_items" ON public.billing_note_items FOR ALL USING (true);

