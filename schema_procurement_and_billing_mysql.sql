-- ============================================================================
-- M Power Engineering Solutions Co., Ltd. - Database Migration Schema
-- Module: 3 Core Subsystems (1. Supplier Accounts, 2. PR/PO Management, 3. Billing Notes)
-- Database Engine: MySQL 8.0+ / MariaDB 10.4+ / phpMyAdmin (InnoDB utf8mb4)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. SUPPLIERS & SUPPLIER CONTACTS (ระบบทะเบียนซัพพลายเออร์และผู้ติดต่อ)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `supplier_contacts`;
DROP TABLE IF EXISTS `suppliers`;

CREATE TABLE `suppliers` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `supplier_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'รหัสคู่ค้า เช่น SUP-26001',
    `supplier_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อบริษัท/ห้างหุ้นส่วน ซัพพลายเออร์',
    `tax_id` VARCHAR(50) NULL COMMENT 'เลขประจำตัวผู้เสียภาษี 13 หลัก',
    `branch` VARCHAR(100) NULL DEFAULT 'สำนักงานใหญ่' COMMENT 'สาขา',
    `address` TEXT NULL COMMENT 'ที่อยู่ตาม ภ.พ.20 หรือที่อยู่จดทะเบียน',
    `phone` VARCHAR(50) NULL COMMENT 'เบอร์โทรศัพท์สำนักงาน',
    `mobile` VARCHAR(50) NULL COMMENT 'เบอร์โทรศัพท์มือถือ',
    `email` VARCHAR(255) NULL COMMENT 'อีเมลสำหรับติดต่อ/ส่ง PO',
    `website` VARCHAR(255) NULL COMMENT 'เว็บไซต์องค์กร',
    `contact_person` VARCHAR(150) NULL COMMENT 'ชื่อผู้ประสานงานหลัก',
    `payment_term` VARCHAR(50) NOT NULL DEFAULT 'Credit 30 Days' COMMENT 'เงื่อนไขการชำระเงิน',
    `credit_limit` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'วงเงินเครดิตที่ได้รับ',
    `bank_name` VARCHAR(100) NULL COMMENT 'ธนาคารสำหรับโอนเงิน',
    `bank_account_no` VARCHAR(50) NULL COMMENT 'เลขที่บัญชีธนาคาร',
    `bank_account_name` VARCHAR(150) NULL COMMENT 'ชื่อบัญชีธนาคาร',
    `status` ENUM('Active', 'Inactive', 'Blacklisted') NOT NULL DEFAULT 'Active' COMMENT 'สถานะคู่ค้า',
    `notes` TEXT NULL COMMENT 'หมายเหตุ / เงื่อนไขเฉพาะ',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_sup_code` (`supplier_code`),
    INDEX `idx_sup_status` (`status`),
    INDEX `idx_sup_name` (`supplier_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางข้อมูลทะเบียนคู่ค้า ซัพพลายเออร์';

CREATE TABLE `supplier_contacts` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `supplier_id` VARCHAR(50) NOT NULL COMMENT 'อ้างอิง suppliers.id',
    `name` VARCHAR(150) NOT NULL COMMENT 'ชื่อ-นามสกุล ผู้ติดต่อ',
    `position` VARCHAR(100) NULL COMMENT 'ตำแหน่งงาน',
    `department` VARCHAR(100) NULL COMMENT 'แผนก เช่น ฝ่ายขาย, ฝ่ายประสานงาน',
    `phone` VARCHAR(50) NULL COMMENT 'เบอร์โทรสำนักงาน/ต่อสายภายใน',
    `mobile` VARCHAR(50) NULL COMMENT 'เบอร์โทรศัพท์มือถือ',
    `email` VARCHAR(255) NULL COMMENT 'อีเมลติดต่อ',
    `notes` VARCHAR(255) NULL COMMENT 'บันทึกเพิ่มเติม',
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'เป็นผู้ติดต่อหลัก (1=ใช่, 0=ไม่ใช่)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_sc_supplier` (`supplier_id`),
    CONSTRAINT `fk_sc_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางผู้ติดต่อตัวแทนซัพพลายเออร์';

-- ----------------------------------------------------------------------------
-- 2. PURCHASE REQUESTS & ITEMS (ระบบใบขอซื้อ PR & การอนุมัติ)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `purchase_request_items`;
DROP TABLE IF EXISTS `purchase_requests`;

CREATE TABLE `purchase_requests` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `pr_no` VARCHAR(50) NOT NULL UNIQUE COMMENT 'เลขที่ใบขอซื้อ เช่น PR 26-001',
    `pr_date` DATE NOT NULL COMMENT 'วันที่ออกใบขอซื้อ',
    `required_date` VARCHAR(50) NULL COMMENT 'วันที่ต้องการสินค้า',
    `due_date` VARCHAR(50) NULL COMMENT 'กำหนดเวลาส่งมอบ/เครดิตเทอม',
    `supplier_id` VARCHAR(50) NULL COMMENT 'อ้างอิง suppliers.id',
    `supplier_name` VARCHAR(255) NULL COMMENT 'ชื่อซัพพลายเออร์ที่เสนอ',
    `supplier_address` TEXT NULL COMMENT 'ที่อยู่ซัพพลายเออร์',
    `supplier_tax_id` VARCHAR(50) NULL COMMENT 'เลขประจำตัวผู้เสียภาษี',
    `supplier_phone` VARCHAR(50) NULL COMMENT 'เบอร์ติดต่อซัพพลายเออร์',
    `supplier_attn` VARCHAR(150) NULL COMMENT 'ผู้ติดต่อฝั่งซัพพลายเออร์',
    `sales_name` VARCHAR(150) NULL COMMENT 'เจ้าหน้าที่ฝ่ายขาย/จัดซื้อที่เกี่ยวข้อง',
    `requested_by` VARCHAR(150) NOT NULL COMMENT 'ผู้ขอเปิดใบ PR',
    `department` VARCHAR(100) NULL COMMENT 'แผนกที่ขอ เช่น งานโครงการ, วิศวกรรม',
    `ref_customer` VARCHAR(255) NULL COMMENT 'โครงการ หรือ ลูกค้าอ้างอิง',
    `remarks` TEXT NULL COMMENT 'วัตถุประสงค์การจัดซื้อ / หมายเหตุ',
    `delivery_note` TEXT NULL COMMENT 'สถานที่และข้อกำหนดส่งมอบ',
    `items` JSON NULL COMMENT 'Snapshot รายการสินค้าแบบ JSON',
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดรวมก่อนภาษี',
    `vat_percent` DECIMAL(5, 2) NOT NULL DEFAULT 7.00 COMMENT 'อัตราภาษีมูลค่าเพิ่ม (%)',
    `vat_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ภาษีมูลค่าเพิ่ม 7%',
    `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดรวมทั้งสิ้นสุทธิ',
    `status` ENUM('Draft', 'Pending Approval', 'Approved', 'Rejected', 'Converted to PO', 'Cancelled') NOT NULL DEFAULT 'Pending Approval' COMMENT 'สถานะขั้นตอน PR',
    `approval_status` ENUM('Draft', 'Pending Approval', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending Approval' COMMENT 'สถานะการพิจารณาอนุมัติ',
    `approved_by` VARCHAR(150) NULL COMMENT 'ผู้อนุมัติ (ผู้ดูแลระบบ/Admin)',
    `approved_at` DATETIME NULL COMMENT 'วันเวลาที่อนุมัติ',
    `rejected_by` VARCHAR(150) NULL COMMENT 'ผู้ปฏิเสธ PR',
    `rejected_at` DATETIME NULL COMMENT 'วันเวลาที่ปฏิเสธ',
    `rejection_reason` TEXT NULL COMMENT 'เหตุผลในการปฏิเสธ/ส่งกลับแก้ไข',
    `converted_po_id` VARCHAR(50) NULL COMMENT 'อ้างอิง purchase_orders.id เมื่อแปลงแล้ว',
    `converted_po_no` VARCHAR(50) NULL COMMENT 'เลขที่ PO ที่ได้จากการแปลง',
    `converted_at` DATETIME NULL COMMENT 'วันเวลาที่แปลงเป็น PO',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_pr_no` (`pr_no`),
    INDEX `idx_pr_status` (`status`),
    INDEX `idx_pr_approval` (`approval_status`),
    INDEX `idx_pr_supplier` (`supplier_id`),
    INDEX `idx_pr_converted_po` (`converted_po_no`),
    CONSTRAINT `fk_pr_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางใบขอซื้อ Purchase Request';

CREATE TABLE `purchase_request_items` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `pr_id` VARCHAR(50) NOT NULL COMMENT 'อ้างอิง purchase_requests.id',
    `item_no` INT NOT NULL DEFAULT 1 COMMENT 'ลำดับรายการ (1, 2, 3...)',
    `item_code` VARCHAR(100) NULL COMMENT 'รหัสสินค้า/อะไหล่',
    `description` TEXT NOT NULL COMMENT 'รายละเอียดสินค้าหรือบริการ',
    `qty` DECIMAL(12, 2) NOT NULL DEFAULT 1.00 COMMENT 'จำนวนที่ต้องการ',
    `unit` VARCHAR(50) NOT NULL DEFAULT 'EA' COMMENT 'หน่วยนับ เช่น ชิ้น, เส้น, งาน, ชุด',
    `unit_price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาต่อหน่วยโดยประมาณ',
    `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'รวมเงิน = qty * unit_price',
    `remarks` VARCHAR(255) NULL COMMENT 'หมายเหตุเฉพาะรายการ',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_pri_pr_id` (`pr_id`),
    CONSTRAINT `fk_pri_pr` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางรายละเอียดสินค้าในใบขอซื้อ PR';

-- ----------------------------------------------------------------------------
-- 3. PURCHASE ORDERS & ITEMS (ระบบใบสั่งซื้อ PO)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `purchase_order_items`;
DROP TABLE IF EXISTS `purchase_orders`;

CREATE TABLE `purchase_orders` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `po_no` VARCHAR(50) NOT NULL UNIQUE COMMENT 'เลขที่ใบสั่งซื้อ เช่น PO 26-001',
    `po_date` DATE NOT NULL COMMENT 'วันที่สั่งซื้อ',
    `pr_id` VARCHAR(50) NULL COMMENT 'อ้างอิง purchase_requests.id ต้นทาง',
    `pr_no` VARCHAR(50) NULL COMMENT 'เลขที่ PR อ้างอิง',
    `due_date` VARCHAR(50) NULL COMMENT 'กำหนดเวลาส่งของ/เงื่อนไขเครดิต',
    `supplier_id` VARCHAR(50) NULL COMMENT 'อ้างอิง suppliers.id',
    `supplier_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อซัพพลายเออร์',
    `supplier_address` TEXT NULL COMMENT 'ที่อยู่จัดส่งเอกสารซัพพลายเออร์',
    `supplier_tax_id` VARCHAR(50) NULL COMMENT 'เลขประจำตัวผู้เสียภาษี',
    `supplier_phone` VARCHAR(50) NULL COMMENT 'เบอร์โทรติดต่อ',
    `supplier_attn` VARCHAR(150) NULL COMMENT 'ผู้ติดต่อฝั่งซัพพลายเออร์',
    `payment_term` VARCHAR(50) NOT NULL DEFAULT 'Credit 30 Days' COMMENT 'เงื่อนไขการชำระเงิน',
    `sales_name` VARCHAR(150) NULL COMMENT 'ผู้ติดต่อหรือผู้ประสานงานฝ่ายจัดซื้อ',
    `ref_customer` VARCHAR(255) NULL COMMENT 'โครงการ / ลูกค้าปลายทางอ้างอิง',
    `remarks` TEXT NULL COMMENT 'หมายเหตุและข้อกำหนดสั่งซื้อ',
    `delivery_note` TEXT NULL COMMENT 'สถานที่และเงื่อนไขส่งมอบสินค้า',
    `billing_delivery_date_note` VARCHAR(255) NULL COMMENT 'รอบวันวางบิลและเงื่อนไขรับเช็ค/โอน',
    `items` JSON NULL COMMENT 'Snapshot รายการสินค้าแบบ JSON',
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดรวมก่อนภาษี',
    `vat_percent` DECIMAL(5, 2) NOT NULL DEFAULT 7.00 COMMENT 'อัตราภาษีมูลค่าเพิ่ม (%)',
    `vat_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ภาษีมูลค่าเพิ่ม 7%',
    `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดสุทธิรวมทั้งสิ้น',
    `status` ENUM('Draft', 'Approved', 'Issued', 'Partial Delivered', 'Delivered', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Approved' COMMENT 'สถานะใบสั่งซื้อ',
    `prepared_by` VARCHAR(150) NULL COMMENT 'ผู้จัดทำเอกสาร PO',
    `approved_by` VARCHAR(150) NULL COMMENT 'ผู้อนุมัติสั่งซื้อ (Admin/Manager)',
    `approved_at` DATETIME NULL COMMENT 'วันเวลาที่อนุมัติ PO',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_po_no` (`po_no`),
    INDEX `idx_po_status` (`status`),
    INDEX `idx_po_pr_id` (`pr_id`),
    INDEX `idx_po_supplier` (`supplier_id`),
    CONSTRAINT `fk_po_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_po_pr` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางใบสั่งซื้อ Purchase Order';

CREATE TABLE `purchase_order_items` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `po_id` VARCHAR(50) NOT NULL COMMENT 'อ้างอิง purchase_orders.id',
    `item_no` INT NOT NULL DEFAULT 1 COMMENT 'ลำดับรายการ (1, 2, 3...)',
    `item_code` VARCHAR(100) NULL COMMENT 'รหัสสินค้า/อะไหล่',
    `description` TEXT NOT NULL COMMENT 'รายละเอียดสินค้าหรือบริการ',
    `qty` DECIMAL(12, 2) NOT NULL DEFAULT 1.00 COMMENT 'จำนวนที่สั่งซื้อ',
    `received_qty` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนที่ตรวจรับเข้าแล้ว',
    `unit` VARCHAR(50) NOT NULL DEFAULT 'EA' COMMENT 'หน่วยนับ',
    `unit_price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาต่อหน่วย',
    `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'รวมเงิน = qty * unit_price',
    `remarks` VARCHAR(255) NULL COMMENT 'หมายเหตุ',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_poi_po_id` (`po_id`),
    CONSTRAINT `fk_poi_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางรายการสินค้าในใบสั่งซื้อ PO';

-- ----------------------------------------------------------------------------
-- 4. BILLING NOTES & ITEMS (ระบบใบวางบิล - สูงสุด 10 รายการต่อฉบับ)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `billing_note_items`;
DROP TABLE IF EXISTS `billing_notes`;

CREATE TABLE `billing_notes` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `billing_no` VARCHAR(50) NOT NULL UNIQUE COMMENT 'เลขที่ใบวางบิล เช่น BL2609001',
    `billing_date` DATE NOT NULL COMMENT 'วันที่ออกใบวางบิล',
    `customer_id` VARCHAR(50) NULL COMMENT 'อ้างอิง customers.id ลูกค้า',
    `customer_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อลูกค้า/บริษัท',
    `customer_address` TEXT NULL COMMENT 'ที่อยู่ลูกค้าสำหรับวางบิล',
    `customer_tax_id` VARCHAR(50) NULL COMMENT 'เลขประจำตัวผู้เสียภาษีลูกค้า',
    `project_name` VARCHAR(255) NULL COMMENT 'ชื่อโครงการ / งานบริการ',
    `term_days` INT NOT NULL DEFAULT 30 COMMENT 'เครดิตเทอม (วัน)',
    `due_of_payment` VARCHAR(50) NULL COMMENT 'วันครบกำหนดชำระเงิน',
    `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดรวมเงินสุทธิทั้งสิ้น (ต้อง > 0)',
    `delivered_by` VARCHAR(150) NULL COMMENT 'ผู้นำส่งเอกสารวางบิล',
    `delivered_date` VARCHAR(50) NULL COMMENT 'วันที่นำส่งเอกสาร',
    `received_by` VARCHAR(150) NULL COMMENT 'ผู้รับวางบิล (เจ้าหน้าที่บัญชีลูกค้า)',
    `received_date` VARCHAR(50) NULL COMMENT 'วันที่ประทับตรารับวางบิล',
    `receiver_position` VARCHAR(100) NULL COMMENT 'ตำแหน่งผู้รับวางบิล',
    `notes` TEXT NULL COMMENT 'หมายเหตุและเงื่อนไขการรับเช็ค/โอน',
    `items` JSON NULL COMMENT 'Snapshot รายการใบวางบิลแบบ JSON',
    `status` ENUM('Draft', 'Issued', 'Delivered', 'Collected', 'Cancelled', 'Overdue') NOT NULL DEFAULT 'Draft' COMMENT 'สถานะการวางบิล',
    `created_by` VARCHAR(150) NULL COMMENT 'ผู้บันทึกสร้างใบวางบิล',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_bn_no` (`billing_no`),
    INDEX `idx_bn_status` (`status`),
    INDEX `idx_bn_customer` (`customer_id`),
    INDEX `idx_bn_date` (`billing_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางใบวางบิล Billing Notes';

CREATE TABLE `billing_note_items` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `billing_id` VARCHAR(50) NOT NULL COMMENT 'อ้างอิง billing_notes.id',
    `no` TINYINT NOT NULL DEFAULT 1 COMMENT 'ลำดับที่ 1-10 (จำกัดสูงสุด 10 รายการต่อใบ)',
    `invoice_no` VARCHAR(100) NOT NULL COMMENT 'เลขที่ใบแจ้งหนี้/ใบเสร็จ (Invoice No)',
    `sales_order_no` VARCHAR(100) NULL COMMENT 'เลขที่คำสั่งขาย / Ref SO / PO',
    `ref_no` VARCHAR(100) NULL COMMENT 'เลขที่เอกสารอ้างอิงอื่นๆ',
    `date` VARCHAR(50) NULL COMMENT 'วันที่ใบแจ้งหนี้',
    `description` TEXT NULL COMMENT 'รายการสินค้าหรือบริการ (Item / Description)',
    `quantity` DECIMAL(12, 2) NOT NULL DEFAULT 1.00 COMMENT 'จำนวน (Quantity)',
    `unit` VARCHAR(50) NOT NULL DEFAULT 'งาน' COMMENT 'หน่วยนับ เช่น งาน, ชุด, ชิ้น',
    `unit_price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาต่อหน่วย (Unit Price)',
    `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนเงินรวม = quantity * unit_price',
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดที่ได้รับชำระแล้ว',
    `outstanding_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดคงค้างชำระ',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_bni_billing` (`billing_id`),
    INDEX `idx_bni_invoice` (`invoice_no`),
    CONSTRAINT `fk_bni_billing` FOREIGN KEY (`billing_id`) REFERENCES `billing_notes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางรายการสินค้า/Invoice ในใบวางบิล';

-- ----------------------------------------------------------------------------
-- 5. USEFUL BUSINESS VIEWS (วิวรายงานสรุปการทำงานทั้ง 3 ระบบ)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_pr_po_pipeline` AS
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
FROM `purchase_requests` pr
LEFT JOIN `purchase_orders` po ON pr.converted_po_id = po.id OR pr.converted_po_no = po.po_no;

CREATE OR REPLACE VIEW `v_billing_notes_summary` AS
SELECT 
    bn.id,
    bn.billing_no,
    bn.billing_date,
    bn.customer_name,
    bn.due_of_payment,
    bn.status,
    bn.total_amount,
    COUNT(bni.id) AS total_items,
    SUM(bni.amount) AS verified_items_sum
FROM `billing_notes` bn
LEFT JOIN `billing_note_items` bni ON bn.id = bni.billing_id
GROUP BY bn.id, bn.billing_no, bn.billing_date, bn.customer_name, bn.due_of_payment, bn.status, bn.total_amount;

-- ----------------------------------------------------------------------------
-- 6. SAMPLE SEED DATA (ข้อมูลตัวอย่างเริ่มต้นสำหรับทดสอบ)
-- ----------------------------------------------------------------------------
INSERT INTO `suppliers` (`id`, `supplier_code`, `supplier_name`, `tax_id`, `branch`, `address`, `phone`, `email`, `contact_person`, `payment_term`, `credit_limit`, `status`, `notes`)
VALUES 
('sup-26001', 'SUP-26001', 'Thai Pipe & Fittings Co., Ltd.', '0105531001234', 'สำนักงานใหญ่', '88/12 Moo 3, Bangna-Trad Km.18, Bang Chalong, Bang Phli, Samut Prakan 10540', '02-316-4455', 'sales@thaipipefittings.com', 'คุณสมชาย วิทยาพงษ์', 'Credit 30 Days', 500000.00, 'Active', 'ซัพพลายเออร์ท่อสตีลและข้อต่อคุณภาพสูง'),
('sup-26002', 'SUP-26002', 'Eastern Technical Safety Equipment Ltd.', '0215549005678', 'สาขาระยอง', '140 Sukhumvit Rd., Map Ta Phut, Mueang Rayong, Rayong 21150', '038-683-112', 'contact@easternequip.co.th', 'คุณกนกวรรณ จิตต์ดี', 'Credit 45 Days', 300000.00, 'Active', 'อุปกรณ์เซฟตี้ วาล์วอุตสาหกรรม และเกจวัดความดัน')
ON DUPLICATE KEY UPDATE `supplier_name`=VALUES(`supplier_name`);

INSERT INTO `supplier_contacts` (`id`, `supplier_id`, `name`, `position`, `department`, `phone`, `mobile`, `email`, `is_primary`)
VALUES
('sc-001', 'sup-26001', 'คุณสมชาย วิทยาพงษ์', 'Sales Manager', 'ฝ่ายขายและโครงการ', '02-316-4455 ต่อ 101', '081-445-6789', 'somchai@thaipipefittings.com', 1),
('sc-002', 'sup-26002', 'คุณกนกวรรณ จิตต์ดี', 'Senior Technical Sales', 'ฝ่ายบริการเทคนิค', '038-683-112 ต่อ 205', '089-887-2345', 'kanokwan@easternequip.co.th', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `purchase_requests` (`id`, `pr_no`, `pr_date`, `required_date`, `due_date`, `supplier_id`, `supplier_name`, `supplier_attn`, `requested_by`, `ref_customer`, `remarks`, `subtotal`, `vat_percent`, `vat_amount`, `total_amount`, `status`, `approval_status`, `approved_by`, `approved_at`, `converted_po_id`, `converted_po_no`, `converted_at`)
VALUES
('pr-26001', 'PR 26-001', '2026-09-20', '2026-10-15', '30 Days', 'sup-26001', 'Thai Pipe & Fittings Co., Ltd.', 'คุณสมชาย วิทยาพงษ์', 'Apiyut Noeikhiaw', 'IKM Testing (Thailand) Co., Ltd', 'จัดซื้ออุปกรณ์ท่อเหล็กและหน้าแปลนโครงการ Rayong', 18500.00, 7.00, 1295.00, 19795.00, 'Approved', 'Approved', 'Administrator', '2026-09-20 14:30:00', 'po-26001', 'PO 26-001', '2026-09-20 14:35:00')
ON DUPLICATE KEY UPDATE `pr_no`=VALUES(`pr_no`);

INSERT INTO `purchase_request_items` (`id`, `pr_id`, `item_no`, `item_code`, `description`, `qty`, `unit`, `unit_price`, `amount`)
VALUES
('pri-001', 'pr-26001', 1, 'PIP-CS-40', 'Carbon Steel Pipe Seamless Sch.40 Size 4 inch', 10.00, 'เส้น', 1200.00, 12000.00),
('pri-002', 'pr-26001', 2, 'FLG-ANSI-150', 'Flange ANSI 150# 4 inch Raised Face', 10.00, 'ตัว', 650.00, 6500.00)
ON DUPLICATE KEY UPDATE `description`=VALUES(`description`);

INSERT INTO `purchase_orders` (`id`, `po_no`, `po_date`, `pr_id`, `pr_no`, `due_date`, `supplier_id`, `supplier_name`, `supplier_attn`, `payment_term`, `ref_customer`, `remarks`, `subtotal`, `vat_percent`, `vat_amount`, `total_amount`, `status`, `prepared_by`, `approved_by`, `approved_at`)
VALUES
('po-26001', 'PO 26-001', '2026-09-20', 'pr-26001', 'PR 26-001', '30 Days', 'sup-26001', 'Thai Pipe & Fittings Co., Ltd.', 'คุณสมชาย วิทยาพงษ์', 'Credit 30 Days', 'IKM Testing (Thailand) Co., Ltd', 'อนุมัติสั่งซื้อตามเอกสาร PR 26-001 จัดส่งไซด์งานมาบตาพุด', 18500.00, 7.00, 1295.00, 19795.00, 'Approved', 'Apiyut Noeikhiaw', 'Administrator', '2026-09-20 14:35:00')
ON DUPLICATE KEY UPDATE `po_no`=VALUES(`po_no`);

INSERT INTO `purchase_order_items` (`id`, `po_id`, `item_no`, `item_code`, `description`, `qty`, `received_qty`, `unit`, `unit_price`, `amount`)
VALUES
('poi-001', 'po-26001', 1, 'PIP-CS-40', 'Carbon Steel Pipe Seamless Sch.40 Size 4 inch', 10.00, 0.00, 'เส้น', 1200.00, 12000.00),
('poi-002', 'po-26001', 2, 'FLG-ANSI-150', 'Flange ANSI 150# 4 inch Raised Face', 10.00, 0.00, 'ตัว', 650.00, 6500.00)
ON DUPLICATE KEY UPDATE `description`=VALUES(`description`);

INSERT INTO `billing_notes` (`id`, `billing_no`, `billing_date`, `customer_name`, `customer_address`, `customer_tax_id`, `project_name`, `term_days`, `due_of_payment`, `total_amount`, `delivered_by`, `delivered_date`, `received_by`, `received_date`, `receiver_position`, `notes`, `status`, `created_by`)
VALUES
('bl-2609001', 'BL2609001', '2026-09-20', 'IKM Testing (Thailand) Co., Ltd', '155/167 Moo 5, Samnakthon Sub-District Banchang District, Rayong 21130', '0215552000909', 'Sky Lotech High Lift Equipment Supply & NDT Testing', 30, '2026-10-20', 185000.00, 'Apiyut Noeikhiaw', '2026-09-20', 'คุณสมศรี สุขเกษม', '2026-09-21', 'เจ้าหน้าที่การเงินและบัญชี', 'วางบิลค่างวดงานรอบเดือนกันยายน ชำระเงินโดยโอนเข้าบัญชีบริษัท', 'Delivered', 'Admin')
ON DUPLICATE KEY UPDATE `billing_no`=VALUES(`billing_no`);

INSERT INTO `billing_note_items` (`id`, `billing_id`, `no`, `invoice_no`, `sales_order_no`, `date`, `description`, `quantity`, `unit`, `unit_price`, `amount`)
VALUES
('bni-001', 'bl-2609001', 1, 'INV-2609001', 'SO-260901', '2026-09-18', 'ค่าบริการทดสอบระบบท่อและแรงดันสูงโครงการ Rayong Site งานสอบเทียบ', 1.00, 'งาน', 125000.00, 125000.00),
('bni-002', 'bl-2609001', 2, 'INV-2609002', 'SO-260902', '2026-09-19', 'ค่าเช่าอุปกรณ์ทดสอบ Sky Lotech High Lift และช่างผู้เชี่ยวชาญ', 1.00, 'งาน', 60000.00, 60000.00)
ON DUPLICATE KEY UPDATE `description`=VALUES(`description`);

SET FOREIGN_KEY_CHECKS = 1;
