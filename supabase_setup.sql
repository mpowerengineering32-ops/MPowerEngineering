-- ====================================================================
-- M POWER ENGINEERING SOLUTIONS CO., LTD.
-- Master Supabase Schema & Initial Data Setup
-- Copy and paste this script directly into Supabase SQL Editor
-- ====================================================================

-- 1. Create USERS Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    fullname VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Sales Rep',
    status VARCHAR(50) DEFAULT 'Active',
    password VARCHAR(255) DEFAULT 'crm123456',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.users;

CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.users FOR DELETE USING (true);


-- 2. Create CUSTOMERS Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    industry_type VARCHAR(100),
    address TEXT,
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Thailand',
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    payment_term VARCHAR(50) DEFAULT '30 Days',
    credit_limit NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active',
    notes TEXT,
    contacts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.customers;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.customers;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.customers;

CREATE POLICY "Enable read access for all users" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.customers FOR DELETE USING (true);


-- 3. Create CUSTOMER CONTACTS Table
CREATE TABLE IF NOT EXISTS public.customer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    position VARCHAR(150),
    department VARCHAR(150),
    phone VARCHAR(50),
    office_phone VARCHAR(50),
    email VARCHAR(255),
    line_id VARCHAR(100),
    preferred_contact VARCHAR(50) DEFAULT 'Phone',
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customer_contacts;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.customer_contacts;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.customer_contacts;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.customer_contacts;

CREATE POLICY "Enable read access for all users" ON public.customer_contacts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.customer_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.customer_contacts FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.customer_contacts FOR DELETE USING (true);


-- 4. Create OPPORTUNITIES Table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    lead_source VARCHAR(100) NOT NULL,
    project_location VARCHAR(100),
    estimated_value NUMERIC(15, 2) DEFAULT 0.00,
    success_probability INT DEFAULT 0,
    expected_close_date DATE,
    sales_person_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Lead',
    remarks TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.opportunities;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.opportunities;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.opportunities;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.opportunities;

CREATE POLICY "Enable read access for all users" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.opportunities FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.opportunities FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.opportunities FOR DELETE USING (true);


-- 5. Create OPPORTUNITY ACTIVITIES Table
CREATE TABLE IF NOT EXISTS public.opportunity_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.opportunity_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.opportunity_activities;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.opportunity_activities;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.opportunity_activities;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.opportunity_activities;

CREATE POLICY "Enable read access for all users" ON public.opportunity_activities FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.opportunity_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.opportunity_activities FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.opportunity_activities FOR DELETE USING (true);


-- 6. Create QUOTATIONS Table
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    title VARCHAR(255),
    quotation_date DATE,
    validity_days INT DEFAULT 30,
    payment_term VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Draft',
    sales_person VARCHAR(100),
    items JSONB DEFAULT '[]'::jsonb,
    total_value NUMERIC(15, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 7.00,
    grand_total NUMERIC(15, 2) DEFAULT 0.00,
    terms_conditions TEXT,
    remarks TEXT,
    revision_number INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.quotations;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.quotations;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.quotations;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.quotations;

CREATE POLICY "Enable read access for all users" ON public.quotations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.quotations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.quotations FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.quotations FOR DELETE USING (true);


-- 7. Create SALES ORDERS Table
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    so_no VARCHAR(50) NOT NULL UNIQUE,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending',
    order_date DATE,
    target_delivery_date DATE,
    job_no VARCHAR(100),
    po_no VARCHAR(100),
    sales_person VARCHAR(100),
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sales_orders;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.sales_orders;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.sales_orders;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.sales_orders;

CREATE POLICY "Enable read access for all users" ON public.sales_orders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.sales_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.sales_orders FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.sales_orders FOR DELETE USING (true);


-- 8. Create INVOICES Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    quotation_no VARCHAR(50),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    po_reference VARCHAR(100),
    project_name VARCHAR(255),
    invoice_date DATE,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Unpaid',
    sales_person VARCHAR(100),
    items JSONB DEFAULT '[]'::jsonb,
    total_value NUMERIC(15, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 7.00,
    grand_total NUMERIC(15, 2) DEFAULT 0.00,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.invoices;

CREATE POLICY "Enable read access for all users" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.invoices FOR DELETE USING (true);


-- 9. Create AUDIT LOGS Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.audit_logs;

CREATE POLICY "Enable read access for all users" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.audit_logs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.audit_logs FOR DELETE USING (true);


-- ====================================================================
-- SEED DATA SETUP
-- ====================================================================

-- Users
INSERT INTO public.users (id, username, fullname, email, role, status)
VALUES 
('d1ef4942-83b3-4f9e-bbb4-7a0df47ab001', 'apiyut', 'Apiyut Noeikhiaw', 'mpowerengineering32@gmail.com', 'Admin', 'Active'),
('d2ef4942-83b3-4f9e-bbb4-7a0df47ab002', 'mpower_mgr', 'ผู้จัดการฝ่ายขาย M Power', 'sales@mpower.co.th', 'Sales Manager', 'Active')
ON CONFLICT (username) DO NOTHING;

-- Customers
INSERT INTO public.customers (id, customer_code, customer_name, tax_id, industry_type, address, province, country, phone, email, payment_term, status)
VALUES 
('c1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'CUS-260001', 'บริษัท ปตท. สำรวจและผลิตปิโตรเลียม จำกัด (มหาชน)', '0107535000206', 'Energy & Utilities', '555/1 ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ กรุงเทพฯ', 'กรุงเทพมหานคร', 'Thailand', '02-537-4000', 'procurement@pttep.com', '30 Days', 'Active'),
('c2ef4942-83b3-4f9e-bbb4-7a0df47a0002', 'CUS-260002', 'บริษัท ไทยออยล์ จำกัด (มหาชน)', '0107537000220', 'Energy & Utilities', '555/1 ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ กรุงเทพฯ', 'กรุงเทพมหานคร', 'Thailand', '02-797-2000', 'vendor@thaioilgroup.com', '45 Days', 'Active')
ON CONFLICT (customer_code) DO NOTHING;

-- Customer Contacts
INSERT INTO public.customer_contacts (id, customer_id, contact_name, position, department, phone, email)
VALUES 
('con1ef49-83b3-4f9e-bbb4-7a0df47a0001', 'c1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'สมชาย รักดี', 'Procurement Manager', 'ฝ่ายจัดซื้อ', '081-234-5678', 'somchai.r@pttep.com'),
('con2ef49-83b3-4f9e-bbb4-7a0df47a0002', 'c2ef4942-83b3-4f9e-bbb4-7a0df47a0002', 'สมศรี มณีรัตน์', 'Senior Maintenance Engineer', 'ฝ่ายวิศวกรรม', '089-876-5432', 'somsri@thaioilgroup.com')
ON CONFLICT DO NOTHING;

-- Opportunities
INSERT INTO public.opportunities (id, opportunity_no, customer_id, project_name, service_type, lead_source, estimated_value, success_probability, expected_close_date, sales_person_id, status, remarks)
VALUES 
('o1ef4942-83b3-4f9e-bbb4-7a0df4700001', 'OPP-260001', 'c1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'โครงการจัดหาปั๊มไฮโดรเทสความดันสูง คลังน้ำมันระยอง', 'Equipment Rental', 'Tender', 1500000.00, 80, '2026-08-30', 'S01', 'Negotiation', 'งานบริการวิศวกรรมปั๊มและแรงดันสูง M Power'),
('o2ef4942-83b3-4f9e-bbb4-7a0df4700002', 'OPP-260002', 'c2ef4942-83b3-4f9e-bbb4-7a0df47a0002', 'บริการงานทดสอบแรงดันระบบท่อส่งน้ำมันหล่อลื่นส่วนต่อขยาย', 'Testing Service', 'Existing Customer', 850000.00, 95, '2026-09-15', 'S02', 'Won', 'ผ่านการพิจารณาทางเทคนิคเรียบร้อย')
ON CONFLICT (opportunity_no) DO NOTHING;

-- Quotations
INSERT INTO public.quotations (id, quotation_no, customer_id, opportunity_id, title, quotation_date, total_value, tax_rate, grand_total, status)
VALUES 
('q1ef4942-83b3-4f9e-bbb4-7a0df47ab001', 'QT-0001-26', 'c1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'o1ef4942-83b3-4f9e-bbb4-7a0df4700001', 'ใบเสนอราคาปั๊มไฮโดรเทสความดันสูง', '2026-07-01', 1500000.00, 7.00, 1605000.00, 'Approved')
ON CONFLICT (quotation_no) DO NOTHING;

-- Invoices
INSERT INTO public.invoices (id, invoice_no, quotation_no, customer_id, project_name, invoice_date, due_date, status, total_value, tax_rate, grand_total)
VALUES 
('i1ef4942-83b3-4f9e-bbb4-7a0df47ac001', 'INV-0001-26', 'QT-0001-26', 'c1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'โครงการจัดหาปั๊มไฮโดรเทสความดันสูง งวดที่ 1', '2026-07-10', '2026-08-10', 'Unpaid', 750000.00, 7.00, 802500.00)
ON CONFLICT (invoice_no) DO NOTHING;


-- Enable Realtime for all core tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'customers') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'opportunities') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'quotations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quotations;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'invoices') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sales_orders') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_orders;
    END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
