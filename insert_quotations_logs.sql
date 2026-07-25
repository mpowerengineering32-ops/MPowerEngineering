-- ==========================================
-- CRM Sales Master - Seed Historical Quotation Audit Logs to Supabase
-- Copy and run this script in your Supabase SQL Editor to insert the log records automatically.
-- ==========================================

-- 1. Ensure the referenced users exist in the public.users table
INSERT INTO public.users (id, username, fullname, email, role, status)
VALUES 
  ('c4ef4942-83b3-4f9e-bbb4-7a0df47ab005', 'tepdecha', 'Tepdecha', 'tepdecha@example.com', 'Sales Rep', 'Active'),
  ('c4ef4942-83b3-4f9e-bbb4-7a0df47ab006', 'thiha', 'Thiha', 'thiha@example.com', 'Sales Rep', 'Active'),
  ('c4ef4942-83b3-4f9e-bbb4-7a0df47ab007', 'nichapa', 'Nichapa', 'nichapa@example.com', 'Sales Rep', 'Active'),
  ('c4ef4942-83b3-4f9e-bbb4-7a0df47ab008', 'chaweewan', 'Chaweewan', 'chaweewan@example.com', 'Sales Rep', 'Active')
ON CONFLICT (username) DO NOTHING;


-- 2. Insert the Quotation Creation Audit Logs
INSERT INTO public.audit_logs (user_id, action, target_type, target_id, details, created_at)
VALUES
  -- 1. QT-4277-26 by @tepdecha
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'tepdecha'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4277-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4277-26 สำหรับโครงการ "Mechanical pipe plug 1"" Sch XS supply" มูลค่า ฿8,900.00',
    '2026-07-21 08:00:00+00'
  ),

  -- 2. QT-4276-26 by @thiha
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'thiha'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4276-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4276-26 สำหรับโครงการ "Centering Device and Spool Fabrication Work" มูลค่า $11,982.88',
    '2026-07-21 07:55:00+00'
  ),

  -- 3. QT-4275-26 by @nichapa
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'nichapa'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4275-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4275-26 สำหรับโครงการ "Flange Facing Service - PTT GSP#7_Project SMP-02 FFW System" มูลค่า ฿55,000.00',
    '2026-07-21 07:50:00+00'
  ),

  -- 4. QT-4274-26 by @chaweewan
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'chaweewan'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4274-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4274-26 สำหรับโครงการ "Remove and Re-install beam pump of NMM-Q08,13,16T on 16 July 2026" มูลค่า ฿10,000.00',
    '2026-07-21 07:45:00+00'
  ),

  -- 5. QT-4273-26 by @chaweewan
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'chaweewan'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4273-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4273-26 สำหรับโครงการ "Remove and Re-install beam pump LKU-G06T on 10 July 2026" มูลค่า ฿0.00',
    '2026-07-21 07:40:00+00'
  ),

  -- 6. QT-4272-26 by @chaweewan
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'chaweewan'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4272-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4272-26 สำหรับโครงการ "Remove and Re-install beam pump LKU-A25T on 9July 2026" มูลค่า ฿10,000.00',
    '2026-07-21 07:35:00+00'
  ),

  -- 7. QT-4271-26 by @chaweewan
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'chaweewan'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4271-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4271-26 สำหรับโครงการ "Remove and Re-install beam pump NOH-C17T on 8 July 2026" มูลค่า ฿10,000.00',
    '2026-07-21 07:30:00+00'
  ),

  -- 8. QT-4270-26 by @tepdecha
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'tepdecha'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4270-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4270-26 สำหรับโครงการ "Advanced Scaffolder Manpower Supply" มูลค่า ฿151,200.00',
    '2026-07-21 07:25:00+00'
  ),

  -- 9. QT-4269-26 by @nichapa
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'nichapa'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4269-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4269-26 สำหรับโครงการ "Equipment Rental" มูลค่า ฿25,000.00',
    '2026-07-21 07:20:00+00'
  ),

  -- 10. QT-4268-26 by @nichapa
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'nichapa'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4268-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4268-26 สำหรับโครงการ "Equipment Rental" มูลค่า ฿9,070.00',
    '2026-07-21 07:15:00+00'
  ),

  -- 11. QT-4267-26 by @nichapa
  (
    COALESCE((SELECT id FROM public.users WHERE username = 'nichapa'), 'd1ef4942-83b3-4f9e-bbb4-7a0df47ab001'),
    'สร้างใบเสนอราคา',
    'quotation',
    COALESCE((SELECT id::text FROM public.quotations WHERE quotation_no = 'QT-4267-26'), 'system'),
    'สร้างใบเสนอราคาใหม่ QT-4267-26 สำหรับโครงการ "Rental Hydraulic torque tools support PLCPP2 in August 2026" มูลค่า ฿159,000.00',
    '2026-07-21 07:10:00+00'
  );
