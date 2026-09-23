export interface User {
  id: string;
  username: string;
  fullname: string; // aligned with frontend fullname/full_name
  email: string;
  role: string;
  status?: string;
  created_at?: string;
}

export interface ContactPerson {
  contact_name: string;
  position: string;
  department?: string;
  phone: string; // Mobile
  office_phone?: string;
  email: string;
  line_id?: string;
  preferred_contact?: 'Phone' | 'Line' | 'Email' | 'Meeting';
  status?: 'Active' | 'Inactive';
}

export interface Customer {
  id: string; // UUID or string id
  customer_code: string; // e.g., CUS-260001
  customer_name: string;
  tax_id: string;
  industry_type: string;
  address: string;
  province?: string;
  country?: string;
  phone: string;
  email: string;
  website?: string;
  payment_term: string;
  credit_limit?: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  contacts: ContactPerson[]; // Let's store contacts as jsonb array inside customers table or fallback
  created_at?: string;
}

export type OpportunityStatus = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost' | 'Cancelled';

export interface Opportunity {
  id: string;
  opportunity_no: string; // e.g., OPP-260001
  customer_id: string;
  project_name: string;
  service_type: string;
  lead_source: string;
  project_location?: 'RY' | 'LKU' | 'SKL' | 'Other'; // dropdown values
  estimated_value: number;
  success_probability: number; // 0-100
  weighted_value?: number; // Estimated value * Success probability %
  expected_close_date: string;
  sales_person_id: string; // ID of sales person
  status: OpportunityStatus;
  remarks: string;
  internal_notes?: string;
  created_at?: string;
  customer?: Customer; // Joined customer info
}

export interface SalesPerson {
  id: string;
  name: string;
  role: string;
  email: string;
}

export type UserRole = 'Sales' | 'Sales Manager' | 'Management' | 'Admin' | 'System Administrator';

export interface AuditLog {
  id: string;
  action_by: string; // e.g., "admin@company.com (Admin)"
  role: UserRole;
  action: string; // e.g., "สร้างลูกค้าใหม่", "แก้ไขข้อตกลง", "ลบประวัติ"
  target_type: 'customer' | 'opportunity' | 'contact' | 'task' | 'attachment' | 'system' | 'role';
  target_id?: string; // e.g. customer_id or opportunity_id
  details: string; // text showing values changed or actions done
  created_at: string;
}

export type ActivityType = 'Phone Call' | 'Meeting' | 'Email' | 'Site Visit' | 'Tender' | 'Presentation' | 'Follow Up' | 'Other';

export interface OpportunityActivity {
  id: string;
  opportunity_id: string;
  activity_type: string; // 'Call', 'Email', 'Meeting', etc.
  activity_date: string;
  notes: string;
  created_at?: string;
}

export interface Activity {
  id: string;
  opportunity_id: string;
  activity_type: ActivityType;
  activity_date: string;
  subject: string;
  description: string;
  next_action_date?: string;
  owner: string;
  created_at: string;
}

export interface OpportunityTask {
  id: string;
  opportunity_id: string;
  task_name: string;
  description: string;
  due_date: string;
  assigned_to: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at: string;
}

export interface OpportunityAttachment {
  id: string;
  opportunity_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  file_url?: string;
}

export interface QuotationItem {
  id: string;
  item_no: number;
  qty: number;
  unit: string;
  description: string;
  duration_days: number;
  unit_rate: number;
  total_price: number;
}

export interface Quotation {
  id: string;
  quotation_no: string;
  opportunity_id: string;
  customer_id: string;
  subject: string;
  total_amount: number;
  vat_amount: number;
  grand_total: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Expired' | 'Invoiced';
  issue_date: string;
  valid_until: string;
  created_at: string;
  remarks?: string;
  customer_name?: string;
  items?: QuotationItem[];
  title?: string;
  quotation_date?: string;
  validity_days?: number;
  payment_term?: string;
  sales_person?: string;
  revision_number?: number;
  terms_conditions?: string;
  total_value?: number;
  attention?: string;
  cc?: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface SalesOrder {
  id: string;
  so_no: string;
  customer_id: string;
  project_name: string;
  total_amount: number;
  status: 'Pending' | 'Planning' | 'In Progress' | 'Completed' | 'Cancelled' | 'Partially Invoiced' | 'Fully Invoiced';
  order_date: string;
  target_delivery_date: string;
  created_at: string;
  customer_name?: string;
  job_no?: string;
  po_no?: string;
  sales_person?: string;
  items?: {
    item_no: number;
    description: string;
    qty: number;
    remaining_qty: number;
    unit: string;
    unit_price: number;
  }[];
}

export type ProjectStatus = 'Pending' | 'Mobilizing' | 'On Going' | 'Completed' | 'Ready For Invoice' | 'On Hold' | 'Delayed' | 'Cancelled' | 'Closed';

export interface ProjectTask {
  id: string;
  project_id: string;
  task_name: string;
  description?: string;
  responsible_person: string;
  start_date: string;
  due_date: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  progress: number;
  remark?: string;
  created_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  milestone_name: string;
  target_date: string;
  actual_date?: string;
  status: 'Pending' | 'Completed' | 'Delayed';
  responsible_person: string;
  remark?: string;
}

export interface ProjectTimeline {
  id: string;
  project_id: string;
  event_name: string;
  date: string;
  time: string;
  responsible_person: string;
  remark?: string;
}

export interface ProjectProgressLog {
  id: string;
  project_id: string;
  progress_percent: number;
  logged_date: string;
  note?: string;
  logged_by: string;
}

export interface Project {
  id: string;
  job_number: string;
  sales_order_id: string;
  customer_id: string;
  project_name: string;
  project_manager?: string;
  sales_representative?: string;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  progress_percent: number;
  status: ProjectStatus;
  contract_value: number;
  created_at: string;
  updated_at: string;
  
  // Virtual / joined fields
  customer_name?: string;
  sales_order_no?: string;
  invoice_status?: string;
  collection_status?: string;
  
  tasks?: ProjectTask[];
  milestones?: ProjectMilestone[];
  timeline?: ProjectTimeline[];
  progress_logs?: ProjectProgressLog[];
}

export interface DeliveryJob {
  id: string;
  delivery_no: string;
  sales_order_id: string;
  customer_id: string;
  carrier_name?: string;
  tracking_no?: string;
  status: 'Scheduled' | 'In Transit' | 'Delivered' | 'Failed';
  actual_delivery_date?: string;
  delivered_by?: string;
  created_at: string;
  customer_name?: string;
  project_name?: string;
}

export interface InvoiceItem {
  id: string;
  item_no: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number; // e.g. 7 for 7%
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  sales_order_id: string;
  customer_id: string;
  total_amount: number;
  vat_amount: number;
  grand_total: number;
  status: 'Unpaid' | 'Overdue' | 'Paid' | 'Partially Paid';
  issue_date: string;
  due_date: string;
  created_at: string;
  customer_name?: string;
  items?: InvoiceItem[];
}

export interface Receipt {
  id: string;
  receipt_no: string;
  invoice_id: string;
  customer_id: string;
  received_amount: number;
  payment_method: 'Transfer' | 'Cash' | 'Cheque' | 'Credit Card';
  payment_date: string;
  created_at: string;
  customer_name?: string;
}

export interface SupplierContact {
  id: string;
  name: string;
  role: string;
  position?: string;
  department?: string;
  phone: string;
  mobile?: string;
  email: string;
  notes?: string;
  is_primary?: boolean;
}

export interface SupplierAddress {
  type: 'Headquarters' | 'Shipping' | 'Tax Invoice';
  address: string;
}

export interface SupplierDocument {
  id: string;
  name: string;
  type: string;
  uploaded_at: string;
  file_size?: string;
}

export interface SupplierActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

export interface Supplier {
  id: string;
  supplier_code: string;
  supplier_name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  contact_person: string;
  supplier_type?: 'Distributor' | 'Manufacturer' | 'Wholesaler' | 'Service Provider' | 'Subcontractor';
  payment_term?: string;
  credit_limit?: number;
  outstanding_balance?: number;
  last_purchase_date?: string;
  bank_account?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
  contacts?: SupplierContact[];
  addresses?: SupplierAddress[];
  documents?: SupplierDocument[];
  activity_logs?: SupplierActivityLog[];
  status: 'Active' | 'Inactive' | 'Pending';
  notes?: string;
  created_at?: string;
}

export interface PurchaseRequestItem {
  id?: string;
  item_no: number;
  description: string;
  quantity?: number;
  qty?: number;
  unit?: string;
  unit_price: number;
  amount: number;
}

export interface PurchaseRequest {
  id: string;
  pr_no: string;
  date?: string;
  pr_date?: string;
  required_date?: string;
  due_date?: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_address?: string;
  supplier_tax_id?: string;
  supplier_phone?: string;
  supplier_attn?: string;
  department?: string;
  project?: string;
  sales_name?: string;
  requestor?: string;
  requested_by?: string;
  ref_customer?: string;
  remarks?: string;
  delivery_note?: string;
  items: PurchaseRequestItem[];
  amount: number;
  vat_amount: number;
  total_amount: number;
  status: 'Draft' | 'Pending' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted to PO';
  approval_status?: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  po_no?: string;
  converted_po_id?: string;
  converted_po_no?: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id?: string;
  item_no: number;
  description: string;
  quantity?: number;
  qty?: number;
  unit?: string;
  unit_price: number;
  amount: number;
  received_qty?: number;
}

export interface PurchaseOrder {
  id: string;
  po_no: string;
  pr_id?: string;
  pr_no?: string;
  date: string;
  po_date?: string;
  order_date?: string;
  due_date: string;
  delivery_date?: string;
  supplier_id: string;
  supplier_name: string;
  supplier_address?: string;
  supplier_tax_id?: string;
  supplier_phone?: string;
  supplier_attn?: string;
  sales_name: string;
  department?: string;
  project?: string;
  ref_customer: string;
  payment_term?: string;
  remarks?: string;
  delivery_note?: string;
  billing_delivery_date_note?: string;
  items: PurchaseOrderItem[];
  amount: number;
  vat_amount: number;
  total_amount: number;
  received_amount?: number;
  outstanding_amount?: number;
  status: 'Pending' | 'Approved' | 'PO Issued' | 'Partially Received' | 'Received' | 'Completed' | 'Cancelled';
  approval_status?: 'Pending' | 'Approved' | 'Rejected';
  po_status?: 'PO Issued' | 'Partially Received' | 'Received' | 'Completed' | 'Cancelled';
  prepared_by: string;
  approved_by: string;
  approved_at?: string;
  created_at: string;
}

export interface BillingNoteItem {
  id?: string;
  no: number;
  ref_no?: string;
  invoice_no: string;
  sales_order_no?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  date: string;
  amount: number;
  paid_amount?: number;
  outstanding_amount?: number;
}

export interface BillingNotePaymentRecord {
  id: string;
  date: string;
  amount: number;
  payment_method: 'Transfer' | 'Cash' | 'Cheque' | 'Credit Card';
  reference_no?: string;
  recorded_by: string;
  notes?: string;
}

export interface BillingNote {
  id: string;
  billing_no: string;
  date: string;
  billing_date?: string;
  customer_id?: string;
  customer_name: string;
  customer_address?: string;
  customer_tax_id?: string;
  sales_order_no?: string;
  salesperson?: string;
  due_of_payment: string;
  due_date?: string;
  total_amount: number;
  paid_amount?: number;
  outstanding_amount?: number;
  payment_method?: 'Transfer' | 'Cash' | 'Cheque' | 'Credit Card';
  delivered_by: string;
  delivered_date: string;
  received_by?: string;
  received_date?: string;
  notes?: string;
  items: BillingNoteItem[];
  payments?: BillingNotePaymentRecord[];
  status: 'Draft' | 'Issued' | 'Pending' | 'Delivered' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  created_at: string;
}

declare global {
  interface Window {
    SupabaseDB: any;
  }
}

