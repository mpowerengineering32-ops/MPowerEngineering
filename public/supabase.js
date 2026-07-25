// Supabase REST Client and Database Service
const savedSupabaseUrl = localStorage.getItem('crm_supabase_url');
const savedSupabaseKey = localStorage.getItem('crm_supabase_anon_key');

const SUPABASE_URL = (savedSupabaseUrl ? savedSupabaseUrl.replace('/rest/v1', '').trim() : 'https://ctgjfgpovfvismgfutcl.supabase.co').trim();
const SUPABASE_REST_URL = SUPABASE_URL + '/rest/v1';
const SUPABASE_KEY = (savedSupabaseKey ? savedSupabaseKey.trim() : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Z2pmZ3BvdmZ2aXNtZ2Z1dGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NTQyODEsImV4cCI6MjEwMDUzMDI4MX0.LaQ7BXDg8Fo50MwxsKbpCgozWm2lyGz-JfsmRfgWJ4E').trim();

// Dynamically load Supabase SDK for Realtime support
(function loadSupabaseSDK() {
  if (!document.getElementById('supabase-sdk')) {
    const script = document.createElement('script');
    script.id = 'supabase-sdk';
    script.src = 'https://unpkg.com/@supabase/supabase-js@2';
    script.onload = () => {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      connectRealtimeDashboard();
    };
    document.head.appendChild(script);
  }
})();

function connectRealtimeDashboard() {
  if (!window.supabaseClient) return;
  // Listen to customer updates
  window.supabaseClient
    .channel('public:customers')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, payload => {
      console.log('Realtime change received: customers!', payload);
      if (typeof loadCustomerTable === 'function') loadCustomerTable();
      if (typeof loadDashboardData === 'function') loadDashboardData();
    })
    .subscribe();

  // Listen to opportunities updates
  window.supabaseClient
    .channel('public:opportunities')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' }, payload => {
      console.log('Realtime change received: opportunities!', payload);
      if (typeof loadDashboardData === 'function') loadDashboardData();
    })
    .subscribe();
}

// Default initial data for simulation and seeding
const DEFAULT_CUSTOMERS = [
  {
    id: "c1ef4942-83b3-4f9e-bbb4-7a0df47a0001",
    customer_code: "CUS-260001",
    customer_name: "PTT Public Company Limited",
    tax_id: "0107544000108",
    industry_type: "Energy & Utilities",
    address: "555 Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900",
    phone: "02-537-2000",
    email: "info@pttplc.com",
    payment_term: 30,
    status: "Active",
    created_at: "2026-06-15T08:00:00.000Z"
  },
  {
    id: "c2ef4942-83b3-4f9e-bbb4-7a0df47a0002",
    customer_code: "CUS-260002",
    customer_name: "The Siam Cement Public Company Limited (SCG)",
    tax_id: "0107537000958",
    industry_type: "Manufacturing",
    address: "1 Siam Cement Rd, Bang Sue, Bangkok 10800",
    phone: "02-586-3333",
    email: "contact@scg.com",
    payment_term: 45,
    status: "Active",
    created_at: "2026-06-15T08:10:00.000Z"
  },
  {
    id: "c3ef4942-83b3-4f9e-bbb4-7a0df47a0003",
    customer_code: "CUS-260003",
    customer_name: "CP All Public Company Limited",
    tax_id: "0107542000011",
    industry_type: "Retail",
    address: "313 C.P. Tower, 24th Fl, Silom Rd, Bang Rak, Bangkok 10500",
    phone: "02-071-9000",
    email: "hr@cpall.co.th",
    payment_term: 60,
    status: "Active",
    created_at: "2026-06-15T08:20:00.000Z"
  },
  {
    id: "c4ef4942-83b3-4f9e-bbb4-7a0df47a0004",
    customer_code: "CUS-260004",
    customer_name: "Advanced Info Service Public Company Limited (AIS)",
    tax_id: "0107535000265",
    industry_type: "Telecommunication",
    address: "414 Shinawatra Tower 1, Phaholyothin Rd, Phaya Thai, Bangkok 10400",
    phone: "02-029-5000",
    email: "contact@ais.co.th",
    payment_term: 30,
    status: "Inactive",
    created_at: "2026-06-15T08:30:00.000Z"
  },
  {
    id: "c5ef4942-83b3-4f9e-bbb4-7a0df47a0005",
    customer_code: "CUS-260005",
    customer_name: "Thai Beverage Public Company Limited",
    tax_id: "0107546000342",
    industry_type: "Food & Beverage",
    address: "14 Vibhavadi Rangsit Rd, Chom Phon, Chatuchak, Bangkok 10900",
    phone: "02-785-5555",
    email: "info@thaibev.com",
    payment_term: 30,
    status: "Active",
    created_at: "2026-06-15T08:40:00.000Z"
  }
];

const DEFAULT_CONTACTS = [
  {
    id: "con1ef49-83b3-4f9e-bbb4-7a0df47a0001",
    customer_id: "c1ef4942-83b3-4f9e-bbb4-7a0df47a0001",
    contact_name: "Somchai Rakdee",
    position: "Procurement Specialist",
    phone: "081-234-5678",
    email: "somchai.r@pttplc.com"
  },
  {
    id: "con2ef49-83b3-4f9e-bbb4-7a0df47a0002",
    customer_id: "c1ef4942-83b3-4f9e-bbb4-7a0df47a0001",
    contact_name: "Wipa Promsiri",
    position: "Maintenance Manager",
    phone: "089-876-5432",
    email: "wipa.p@pttplc.com"
  },
  {
    id: "con3ef49-83b3-4f9e-bbb4-7a0df47a0003",
    customer_id: "c2ef4942-83b3-4f9e-bbb4-7a0df47a0002",
    contact_name: "Apichat Worawit",
    position: "Engineering Team Lead",
    phone: "083-456-7890",
    email: "apichat@scg.com"
  },
  {
    id: "con4ef49-83b3-4f9e-bbb4-7a0df47a0004",
    customer_id: "c3ef4942-83b3-4f9e-bbb4-7a0df47a0003",
    contact_name: "Danai Nontree",
    position: "Facility Manager",
    phone: "086-111-2222",
    email: "danai@cpall.co.th"
  },
  {
    id: "con5ef49-83b3-4f9e-bbb4-7a0df47a0005",
    customer_id: "c5ef4942-83b3-4f9e-bbb4-7a0df47a0005",
    contact_name: "Nares Anantasing",
    position: "Warehouse Director",
    phone: "084-555-1234",
    email: "nares@thaibev.com"
  }
];

const DEFAULT_OPPORTUNITIES = [
  {
    id: "o1ef4942-83b3-4f9e-bbb4-7a0df4700001",
    opportunity_no: "OPP-260001",
    customer_id: "c1ef4942-83b3-4f9e-bbb4-7a0df47a0001",
    project_name: "Tank Storage Inspection Project",
    service_type: "Testing Service",
    lead_source: "Tender",
    estimated_value: 1250000.00,
    success_probability: 70,
    expected_close_date: "2026-08-30",
    sales_person_id: "Thanaphol Khamdee (S03)",
    status: "Lead",
    remarks: "Scoping phase and initial requirement gathering for PTT.",
    created_at: "2026-06-16T10:00:00.000Z"
  },
  {
    id: "o2ef4942-83b3-4f9e-bbb4-7a0df4700002",
    opportunity_no: "OPP-260002",
    customer_id: "c1ef4942-83b3-4f9e-bbb4-7a0df47a0001",
    project_name: "Boiler Maintenance Equipment Rental",
    service_type: "Equipment Rental",
    lead_source: "Referral",
    estimated_value: 380000.00,
    success_probability: 90,
    expected_close_date: "2026-07-15",
    sales_person_id: "Ekachai Wongdee (S01)",
    status: "Proposal",
    remarks: "Maintenance equipment rental quotation submitted successfully. Create quotation button is enabled.",
    created_at: "2026-06-16T10:15:00.000Z"
  },
  {
    id: "o3ef4942-83b3-4f9e-bbb4-7a0df4700003",
    opportunity_no: "OPP-260003",
    customer_id: "c2ef4942-83b3-4f9e-bbb4-7a0df47a0002",
    project_name: "SCG Plant Welding Support Service",
    service_type: "Manpower Supply",
    lead_source: "Existing Customer",
    estimated_value: 850000.00,
    success_probability: 80,
    expected_close_date: "2026-09-10",
    sales_person_id: "Suchada Lertwiriya (S02)",
    status: "Negotiation",
    remarks: "Negotiating welder skill scope and job performance warranty.",
    created_at: "2026-06-16T10:30:00.000Z"
  },
  {
    id: "o4ef4942-83b3-4f9e-bbb4-7a0df4700004",
    opportunity_no: "OPP-260004",
    customer_id: "c2ef4942-83b3-4f9e-bbb4-7a0df47a0002",
    project_name: "SCG Structural Piping Design",
    service_type: "Engineering Service",
    lead_source: "Call In",
    estimated_value: 1500000.00,
    success_probability: 100,
    expected_close_date: "2026-06-25",
    sales_person_id: "Suchada Lertwiriya (S02)",
    status: "Won",
    remarks: "Won tender bid. Received Purchase Order successfully.",
    created_at: "2026-06-16T10:45:00.000Z"
  },
  {
    id: "o5ef4942-83b3-4f9e-bbb4-7a0df4700005",
    opportunity_no: "OPP-260005",
    customer_id: "c3ef4942-83b3-4f9e-bbb4-7a0df47a0003",
    project_name: "CP All Logistics Center Inspection",
    service_type: "Testing Service",
    lead_source: "Connection",
    estimated_value: 450000.00,
    success_probability: 50,
    expected_close_date: "2026-10-15",
    sales_person_id: "Thanaphol Khamdee (S03)",
    status: "Qualified",
    remarks: "Confirmed onsite readiness. Preparing final test contract proposal.",
    created_at: "2026-06-16T11:00:00.000Z"
  },
  {
    id: "o6ef4942-83b3-4f9e-bbb4-7a0df4700006",
    opportunity_no: "OPP-260006",
    customer_id: "c4ef4942-83b3-4f9e-bbb4-7a0df47a0004",
    project_name: "AIS Server Room Cold Cutting Service",
    service_type: "Engineering Service",
    lead_source: "Walk In",
    estimated_value: 300000.00,
    success_probability: 0,
    expected_close_date: "2026-06-20",
    sales_person_id: "Ekachai Wongdee (S01)",
    status: "Lost",
    remarks: "Cancelled due to quote higher than AIS IT standard budget.",
    created_at: "2026-06-16T11:15:00.000Z"
  },
  {
    id: "o7ef4942-83b3-4f9e-bbb4-7a0df4700007",
    opportunity_no: "OPP-260007",
    customer_id: "c5ef4942-83b3-4f9e-bbb4-7a0df47a0005",
    project_name: "ThaiBev Machinery Hydrostatic Testing",
    service_type: "Testing Service",
    lead_source: "Website",
    estimated_value: 620000.00,
    success_probability: 0,
    expected_close_date: "2026-07-31",
    sales_person_id: "Thanaphol Khamdee (S03)",
    status: "Cancelled",
    remarks: "Customer postponed modernization project bundle to next fiscal year.",
    created_at: "2026-06-16T11:30:00.000Z"
  },
  {
    id: "o8ef4942-83b3-4f9e-bbb4-7a0df4700008",
    opportunity_no: "OPP-260008",
    customer_id: "c3ef4942-83b3-4f9e-bbb4-7a0df47a0003",
    project_name: "CP All Cooling Tower Manpower supply",
    service_type: "Manpower Supply",
    lead_source: "Connection",
    estimated_value: 500000.00,
    success_probability: 40,
    expected_close_date: "2026-11-30",
    sales_person_id: "Suchada Lertwiriya (S02)",
    status: "Lead",
    remarks: "Submitted initial technician draft profiles to facilities procurement department.",
    created_at: "2026-06-16T11:45:00.000Z"
  },
  {
    id: "o9ef4942-83b3-4f9e-bbb4-7a0df4700009",
    opportunity_no: "OPP-260009",
    customer_id: "c1ef4942-83b3-4f9e-bbb4-7a0df47a0001",
    project_name: "PTT Gas Pipe Maintenance Support",
    service_type: "Engineering Service",
    lead_source: "Tender",
    estimated_value: 2350000.00,
    success_probability: 60,
    expected_close_date: "2026-09-30",
    sales_person_id: "Ekachai Wongdee (S01)",
    status: "Qualified",
    remarks: "Inspector credentials qualified. Preparing final pricing summary by end of month.",
    created_at: "2026-06-16T12:00:00.000Z"
  },
  {
    id: "o10f4942-83b3-4f9e-bbb4-7a0df4700010",
    opportunity_no: "OPP-260010",
    customer_id: "c5ef4942-83b3-4f9e-bbb4-7a0df47a0005",
    project_name: "ThaiBev Brewery Flange Facing Service",
    service_type: "Engineering Service",
    lead_source: "Existing Customer",
    estimated_value: 190000.00,
    success_probability: 95,
    expected_close_date: "2026-07-10",
    sales_person_id: "Thanaphol Khamdee (S03)",
    status: "Negotiation",
    remarks: "Completed emergency repair rates and downtime agreement. Awaiting contract signing next week.",
    created_at: "2026-06-16T12:15:00.000Z"
  }
];

const DEFAULT_QUOTATIONS = [
  {
    id: "q1ef4942-83b3-4f9e-bbb4-7a0df47ab001",
    quotation_no: "QT-0001-26",
    customer_id: "c1ef4942-83b3-4f9e-bbb4-7a0df47a0001",
    opportunity_id: "o2ef4942-83b3-4f9e-bbb4-7a0df4700002",
    title: "Boiler Maintenance Equipment Rental",
    quotation_date: "2026-06-16",
    validity_days: 30,
    payment_term: "30 Days",
    status: "Approved",
    sales_person: "Ekachai Wongdee (S01)",
    items: [
      {
        item_no: 1,
        qty: 1,
        unit: "Set",
        description: "Provision of HP Hot Boiler Wash Tooling Set",
        duration: 10,
        unit_rate: 30000.00,
        total_price: 300000.00
      },
      {
        item_no: 2,
        qty: 2,
        unit: "Team",
        description: "Onsite Support Technicians for Maintenance Tasks",
        duration: 10,
        unit_rate: 4000.00,
        total_price: 80000.00
      }
    ],
    total_value: 380000.00,
    tax_rate: 7,
    grand_total: 406600.00,
    terms_conditions: "1. Deliver within 7 days after PO receipt.\n2. Invoices generated upon dynamic phase completion.\n3. Standard rental service warranty applies.",
    created_at: "2026-06-16T10:15:00.000Z"
  },
  {
    id: "q2ef4942-83b3-4f9e-bbb4-7a0df47ab002",
    quotation_no: "QT-0002-26",
    customer_id: "c1ef4942-83b3-4f9e-bbb4-7a0df47a0001",
    opportunity_id: "o1ef4942-83b3-4f9e-bbb4-7a0df4700001",
    title: "Tank Storage Inspection Project",
    quotation_date: "2026-06-16",
    validity_days: 30,
    payment_term: "30 Days",
    status: "Sent",
    sales_person: "Thanaphol Khamdee (S03)",
    items: [
      {
        item_no: 1,
        qty: 1,
        unit: "Set",
        description: "Provision of HP Water Jet Pump 15,000 PSI",
        duration: 12,
        unit_rate: 12000.00,
        total_price: 144000.00
      },
      {
        item_no: 2,
        qty: 1,
        unit: "Set",
        description: "Ultrasonics Thickness Gauge Rental UT5000",
        duration: 12,
        unit_rate: 2500.00,
        total_price: 30000.00
      },
      {
        item_no: 3,
        qty: 2,
        unit: "Person",
        description: "Senior ASNT Level II Thickness Survey Inspectors",
        duration: 12,
        unit_rate: 5000.00,
        total_price: 120000.00
      }
    ],
    total_value: 294000.00,
    tax_rate: 7,
    grand_total: 314580.00,
    terms_conditions: "1. Price includes routine mobilization but excludes high altitude lift rigs.\n2. Report issued within 5 working days post-inspection.\n3. Standard credit terms apply.",
    created_at: "2026-06-16T11:20:00.000Z"
  },
  {
    id: "q3ef4942-83b3-4f9e-bbb4-7a0df47ab003",
    quotation_no: "QT-0003-26",
    customer_id: "c2ef4942-83b3-4f9e-bbb4-7a0df47a0002",
    opportunity_id: "o3ef4942-83b3-4f9e-bbb4-7a0df4700003",
    title: "Equipment Rental & Calibration Service",
    quotation_date: "2026-05-18",
    validity_days: 30,
    payment_term: "30 Days",
    status: "Sent",
    sales_person: "Suchada Lertwiriya (S02)",
    items: [
      {
        item_no: 1,
        qty: 1,
        unit: "Set",
        description: "Calibration of Hydrotest Pump with Chart Recorder - Model HP-30K",
        duration: 1,
        unit_rate: 45000.00,
        total_price: 45000.00
      }
    ],
    total_value: 45000.00,
    tax_rate: 7,
    grand_total: 48150.00,
    terms_conditions: "1. Calibration certificate valid for 1 year.\n2. Payment terms 30 days.",
    created_at: "2026-05-18T10:00:00.000Z"
  },
  {
    id: "q4ef4942-83b3-4f9e-bbb4-7a0df47ab004",
    quotation_no: "QT-0004-26",
    customer_id: "c3ef4942-83b3-4f9e-bbb4-7a0df47a0003",
    opportunity_id: "o1ef4942-83b3-4f9e-bbb4-7a0df4700001",
    title: "High Pressure Testing Supplies",
    quotation_date: "2026-05-10",
    validity_days: 30,
    payment_term: "30 Days",
    status: "Sent",
    sales_person: "Thanaphol Khamdee (S03)",
    items: [
      {
        item_no: 1,
        qty: 10,
        unit: "Pcs",
        description: "Stainless Steel High Pressure Fittings 1/2 inch",
        duration: 1,
        unit_rate: 2500.00,
        total_price: 25000.00
      }
    ],
    total_value: 25000.00,
    tax_rate: 7,
    grand_total: 26750.00,
    terms_conditions: "1. Deliveries ex-stock Bangkok.\n2. Offer subject to prior sales.",
    created_at: "2026-05-10T14:20:00.000Z"
  }
];

const DEFAULT_SALES_ORDERS = [
  {
    id: "so1ef4942-83b3-4f9e-bbb4-7a0df47ad001",
    so_no: "SO-0001-26",
    customer_id: "c1ef4942-83b3-4f9e-bbb4-7a0df47a0001",
    project_name: "Boiler Maintenance Equipment Rental",
    total_amount: 406600.00,
    status: "Pending",
    order_date: "2026-06-16",
    target_delivery_date: "2026-07-16",
    job_no: "JOB-26001",
    po_no: "PO-PTT-8890",
    items: [
      {
        item_no: 1,
        qty: 1,
        unit: "Set",
        description: "Provision of HP Hot Boiler Wash Tooling Set",
        duration: 10,
        unit_rate: 30000.00,
        total_price: 300000.00
      },
      {
        item_no: 2,
        qty: 2,
        unit: "Team",
        description: "Onsite Support Technicians for Maintenance Tasks",
        duration: 10,
        unit_rate: 4000.00,
        total_price: 80000.00
      }
    ],
    created_at: "2026-06-16T10:15:00.000Z"
  },
  {
    id: "so2ef4942-83b3-4f9e-bbb4-7a0df47ad002",
    so_no: "SO-0002-26",
    customer_id: "c2ef4942-83b3-4f9e-bbb4-7a0df47a0002",
    project_name: "Siam Cement Kiln Refractory Installation",
    total_amount: 150000.00,
    status: "In Progress",
    order_date: "2026-06-20",
    target_delivery_date: "2026-08-20",
    job_no: "JOB-26002",
    po_no: "PO-SCG-4521",
    items: [
      {
        item_no: 1,
        qty: 1,
        unit: "Lot",
        description: "Kiln #3 Refractory installation and curing services",
        duration: 1,
        unit_rate: 140186.91,
        total_price: 140186.91
      }
    ],
    created_at: "2026-06-20T11:00:00.000Z"
  }
];

const DEFAULT_INVOICES = [
  {
    id: "i1ef4942-83b3-4f9e-bbb4-7a0df47ac001",
    invoice_no: "INV-0001-26",
    quotation_no: "QT-0001-26",
    customer_id: "c1ef4942-83b3-4f9e-bbb4-7a0df47a0001",
    po_reference: "PTT-PO-26008892",
    project_name: "Provision of Rental Equipment and Manpower Services for PTT ESP Plant",
    invoice_date: "2026-06-17",
    due_date: "2026-07-17",
    status: "Paid",
    sales_person: "Ekachai Wongdee (S01)",
    items: [
      {
        item_no: 1,
        description: "Provision of HP Hot Boiler Wash Tooling Set Set",
        qty: 1,
        unit: "Set",
        unit_rate: 30000.00,
        duration: 5,
        total_price: 150000.00
      },
      {
        item_no: 2,
        description: "Onsite Support Technicians for Maintenance - Level I",
        qty: 1,
        unit: "Team",
        unit_rate: 4000.00,
        duration: 10,
        total_price: 40000.00
      }
    ],
    total_value: 190000.00,
    tax_rate: 7,
    grand_total: 203300.00,
    remarks: "Paid via bank transfer Ref #KBank-9908123. Thank you for your business.",
    created_at: "2026-06-17T09:00:00.000Z"
  },
  {
    id: "i2ef4942-83b3-4f9e-bbb4-7a0df47ac002",
    invoice_no: "INV-0002-26",
    quotation_no: "QT-0003-26",
    customer_id: "c2ef4942-83b3-4f9e-bbb4-7a0df47a0002",
    po_reference: "SCG-PO-260211",
    project_name: "Calibration and Test Loop Audit - SCG Rayong Plant",
    invoice_date: "2026-05-10",
    due_date: "2026-06-10",
    status: "Unpaid",
    sales_person: "Suchada Lertwiriya (S02)",
    items: [
      {
        item_no: 1,
        description: "Calibration of Hydrotest Pump with Chart Recorder - Model HP-30K",
        qty: 1,
        unit: "Set",
        unit_rate: 45000.00,
        duration: 1,
        total_price: 45000.00
      }
    ],
    total_value: 45000.00,
    tax_rate: 7,
    grand_total: 48150.00,
    remarks: "Overdue payment warning issued on 2026-06-12.",
    created_at: "2026-05-10T10:00:00.000Z"
  },
  {
    id: "i3ef4942-83b3-4f9e-bbb4-7a0df47ac003",
    invoice_no: "INV-0003-26",
    quotation_no: "QT-0004-26",
    customer_id: "c3ef4942-83b3-4f9e-bbb4-7a0df47a0003",
    po_reference: "CPALL-PO-9912",
    project_name: "Emergency Boiler Inspection and Tooling Support",
    invoice_date: "2026-04-25",
    due_date: "2026-05-25",
    status: "Overdue",
    sales_person: "Thanaphol Khamdee (S03)",
    items: [
      {
        item_no: 1,
        description: "Boiler Safety Valve Repair and Fast Response Inspection",
        qty: 1,
        unit: "Set",
        unit_rate: 120000.00,
        duration: 1,
        total_price: 120000.00
      }
    ],
    total_value: 120000.00,
    tax_rate: 7,
    grand_total: 128400.00,
    remarks: "Finance department awaiting final payment approval loop.",
    created_at: "2026-04-25T11:00:00.000Z"
  }
];

// Helper to check and retrieve connection settings
function getConnectivityMode() {
  const mode = localStorage.getItem('crm_use_cloud');
  return mode === null ? true : JSON.parse(mode);
}

// REST helper
async function restRequest(endpoint, options = {}) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${SUPABASE_REST_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase Error (${response.status}): ${text}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Initialization of Local Backup
function initLocalData() {
  if (!localStorage.getItem('crm_customers')) {
    localStorage.setItem('crm_customers', JSON.stringify(DEFAULT_CUSTOMERS));
  }
  if (!localStorage.getItem('crm_contacts')) {
    localStorage.setItem('crm_contacts', JSON.stringify(DEFAULT_CONTACTS));
  }
  if (!localStorage.getItem('crm_opportunities')) {
    localStorage.setItem('crm_opportunities', JSON.stringify(DEFAULT_OPPORTUNITIES));
  }
  if (!localStorage.getItem('crm_quotations')) {
    localStorage.setItem('crm_quotations', JSON.stringify(DEFAULT_QUOTATIONS));
  } else {
    try {
      const qList = JSON.parse(localStorage.getItem('crm_quotations')) || [];
      if (!qList.some(q => q.quotation_no === 'QT-0003-26')) {
        qList.push(...DEFAULT_QUOTATIONS.filter(q => q.quotation_no === 'QT-0003-26' || q.quotation_no === 'QT-0004-26'));
        localStorage.setItem('crm_quotations', JSON.stringify(qList));
      }
    } catch (e) {
      console.warn("Failed to check and heal quotations", e);
    }
  }
  if (!localStorage.getItem('crm_sales_orders')) {
    localStorage.setItem('crm_sales_orders', JSON.stringify(DEFAULT_SALES_ORDERS));
  }
  if (!localStorage.getItem('crm_invoices')) {
    localStorage.setItem('crm_invoices', JSON.stringify(DEFAULT_INVOICES));
  } else {
    try {
      const iList = JSON.parse(localStorage.getItem('crm_invoices')) || [];
      if (!iList.some(i => i.invoice_no === 'INV-0002-26')) {
        iList.push(...DEFAULT_INVOICES.filter(i => i.invoice_no === 'INV-0002-26' || i.invoice_no === 'INV-0003-26'));
        localStorage.setItem('crm_invoices', JSON.stringify(iList));
      }
    } catch (e) {
      console.warn("Failed to check and heal invoices", e);
    }
  }
  if (!localStorage.getItem('crm_activities')) {
    localStorage.setItem('crm_activities', JSON.stringify([]));
  }
}

initLocalData();

let _cachedConnectionResult = null;
let _lastConnectionCheckTime = 0;

let _customersCache = null;
let _customersCacheTime = 0;

let _opportunitiesCache = null;
let _opportunitiesCacheTime = 0;

let _quotationsCache = null;
let _quotationsCacheTime = 0;

function clearSupabaseCaches() {
  _customersCache = null;
  _customersCacheTime = 0;
  _opportunitiesCache = null;
  _opportunitiesCacheTime = 0;
  _quotationsCache = null;
  _quotationsCacheTime = 0;
}

const TABLE_COLUMNS = {
  customers: [
    'id', 'customer_code', 'customer_name', 'tax_id', 'industry_type',
    'address', 'phone', 'email', 'payment_term', 'status', 'contacts', 'created_at'
  ],
  customer_contacts: [
    'id', 'customer_id', 'contact_name', 'position', 'phone', 'email', 'created_at'
  ],
  opportunities: [
    'id', 'opportunity_no', 'customer_id', 'project_name', 'service_type',
    'lead_source', 'estimated_value', 'success_probability', 'expected_close_date',
    'sales_person_id', 'salesperson_name', 'status', 'remarks', 'project_location', 'created_at'
  ],
  quotations: [
    'id', 'quotation_no', 'customer_id', 'opportunity_id', 'title',
    'quotation_date', 'validity_days', 'payment_term', 'status', 'sales_person_id',
    'total_value', 'tax_rate', 'grand_total', 'terms_conditions', 'remarks',
    'created_at', 'updated_at'
  ],
  sales_orders: [
    'id', 'so_no', 'quotation_id', 'customer_id', 'project_name', 'total_amount',
    'status', 'order_date', 'target_delivery_date', 'job_no', 'po_no', 'sales_person', 'items',
    'created_at', 'created_by', 'updated_by'
  ],
  invoices: [
    'id', 'invoice_no', 'customer_id', 'quotation_no', 'po_reference',
    'project_name', 'invoice_date', 'due_date', 'status', 'sales_person',
    'items', 'total_value', 'tax_rate', 'grand_total', 'remarks', 'created_at'
  ],
  users: [
    'id', 'username', 'fullname', 'email', 'role', 'status', 'password', 'created_at'
  ],
  audit_logs: [
    'id', 'user_id', 'action', 'target_type', 'target_id', 'details', 'created_at'
  ]
};

const UUID_FIELDS = ['id', 'customer_id', 'opportunity_id', 'user_id'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(val) {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

function sanitizePayload(tableName, rawPayload) {
  const allowed = TABLE_COLUMNS[tableName];
  if (!allowed) return { ...rawPayload };

  const sanitized = {};
  for (const key of allowed) {
    if (rawPayload[key] !== undefined) {
      let val = rawPayload[key];
      
      // If it's a UUID field, check if it's a valid UUID. If not, map to null
      if (UUID_FIELDS.includes(key)) {
        if (val === null || val === undefined || val === '') {
          val = null;
        } else if (!isValidUUID(val)) {
          console.warn(`Field ${key} has invalid UUID format: "${val}". Setting to null.`);
          val = null;
        }
      }
      
      sanitized[key] = val;
    }
  }
  return sanitized;
}

const SupabaseDB = {
  // Test connection to cloud database
  async testConnection() {
    if (!getConnectivityMode()) return false;
    const now = Date.now();
    // Cache connection status for 30 seconds to avoid massive redundant network calls
    if (_cachedConnectionResult !== null && (now - _lastConnectionCheckTime) < 30000) {
      return _cachedConnectionResult;
    }
    try {
      await restRequest('/customers?select=id&limit=1', { method: 'GET' });
      _cachedConnectionResult = true;
    } catch (e) {
      console.warn("REST endpoint offline or schema not present. Falling back to LocalStorage.", e);
      _cachedConnectionResult = false;
    }
    _lastConnectionCheckTime = Date.now();
    return _cachedConnectionResult;
  },

  // -----------------------
  // CUSTOMER & CONTACTS CRUD
  // -----------------------
  async getCustomers() {
    const now = Date.now();
    if (_customersCache !== null && (now - _customersCacheTime) < 5000) {
      return _customersCache;
    }
    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        const rawCusts = await restRequest('/customers?order=customer_code.asc');
        let rawContacts = [];
        try {
          rawContacts = await restRequest('/customer_contacts') || [];
        } catch (err) {
          console.warn("customer_contacts endpoint missing, using empty default", err);
        }

        // Group contacts and attach
        const map = rawCusts.map(cust => {
          return {
            ...cust,
            contacts: rawContacts.filter(c => c.customer_id === cust.id)
          };
        });

        localStorage.setItem('crm_customers', JSON.stringify(map));
        _customersCache = map;
        _customersCacheTime = Date.now();
        return map;
      } catch (e) {
        console.warn("Fetch Cloud Customers failed. fallback to local", e);
        const fallback = JSON.parse(localStorage.getItem('crm_customers')) || [];
        _customersCache = fallback;
        _customersCacheTime = Date.now();
        return fallback;
      }
    } else {
      const custs = JSON.parse(localStorage.getItem('crm_customers')) || [];
      const conts = JSON.parse(localStorage.getItem('crm_contacts')) || [];
      const map = custs.map(cust => ({
        ...cust,
        contacts: conts.filter(c => c.customer_id === cust.id)
      }));
      _customersCache = map;
      _customersCacheTime = Date.now();
      return map;
    }
  },

  async createCustomer(customerData) {
    return this.addCustomer(customerData);
  },

  async addCustomer(customerData) {
    clearSupabaseCaches();
    const customers = JSON.parse(localStorage.getItem('crm_customers')) || [];
    
    // Auto customer code
    const yr = '26';
    const thisYr = customers.filter(c => c.customer_code.startsWith(`CUS-${yr}`));
    let seq = 1;
    if (thisYr.length > 0) {
      const seqs = thisYr.map(c => parseInt(c.customer_code.replace(`CUS-${yr}`, ''), 10));
      seq = Math.max(...seqs) + 1;
    }
    const nextCode = `CUS-${yr}${String(seq).padStart(4, '0')}`;
    const newId = crypto.randomUUID();

    const newCustomer = {
      ...customerData,
      id: newId,
      customer_code: nextCode,
      created_at: new Date().toISOString()
    };

    // Split contacts from payload
    const contacts = customerData.contacts || [];
    delete newCustomer.contacts;

    // Save locally
    const savedCusts = [...customers, { ...newCustomer, contacts }];
    localStorage.setItem('crm_customers', JSON.stringify(savedCusts));

    const completeLocalContacts = JSON.parse(localStorage.getItem('crm_contacts')) || [];
    const formattedContacts = contacts.map(c => ({
      id: crypto.randomUUID(),
      customer_id: newId,
      ...c
    }));
    localStorage.setItem('crm_contacts', JSON.stringify([...completeLocalContacts, ...formattedContacts]));

    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        const dbPayload = sanitizePayload('customers', newCustomer);
        const response = await restRequest('/customers', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(dbPayload)
        });
        
        // Save contacts to cloud if table exists
        if (formattedContacts.length > 0) {
          for (const con of formattedContacts) {
            try {
              const conPayload = sanitizePayload('customer_contacts', con);
              await restRequest('/customer_contacts', {
                method: 'POST',
                body: JSON.stringify(conPayload)
              });
            } catch (err) {
              console.warn("Could not insert contact on cloud", err);
            }
          }
        }
        return response ? response[0] : newCustomer;
      } catch (err) {
        console.warn("Cloud insert failed, saved locally", err);
      }
    }
    return { ...newCustomer, contacts: formattedContacts };
  },

  async updateCustomer(id, updates) {
    clearSupabaseCaches();
    // Save locally
    const customers = JSON.parse(localStorage.getItem('crm_customers')) || [];
    const idx = customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      const contacts = updates.contacts || customers[idx].contacts || [];
      const updatedCust = { ...customers[idx], ...updates };
      delete updatedCust.contacts;

      customers[idx] = { ...updatedCust, contacts };
      localStorage.setItem('crm_customers', JSON.stringify(customers));

      // Update contacts locally
      if (updates.contacts) {
        let allContacts = JSON.parse(localStorage.getItem('crm_contacts')) || [];
        allContacts = allContacts.filter(c => c.customer_id !== id);
        const formatted = contacts.map(c => ({
          id: c.id || crypto.randomUUID(),
          customer_id: id,
          ...c
        }));
        localStorage.setItem('crm_contacts', JSON.stringify([...allContacts, ...formatted]));
      }

      const isCloud = await this.testConnection();
      if (isCloud) {
        try {
          const body = { ...updates };
          delete body.contacts;
          const dbPayload = sanitizePayload('customers', body);
          delete dbPayload.id; // Don't PATCH primary key
          await restRequest(`/customers?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(dbPayload)
          });

          if (updates.contacts) {
            try {
              await restRequest(`/customer_contacts?customer_id=eq.${id}`, { method: 'DELETE' });
              for (const con of contacts) {
                const conBody = {
                  customer_id: id,
                  contact_name: con.contact_name,
                  position: con.position,
                  phone: con.phone,
                  email: con.email
                };
                const conPayload = sanitizePayload('customer_contacts', conBody);
                await restRequest('/customer_contacts', {
                  method: 'POST',
                  body: JSON.stringify(conPayload)
                });
              }
            } catch (conErr) {
              console.warn("Failed to update contacts table on cloud", conErr);
            }
          }
        } catch (e) {
          console.warn("Cloud update failed, saved locally", e);
        }
      }
      return customers[idx];
    }
    throw new Error("Customer not found");
  },

  async deleteCustomer(id) {
    clearSupabaseCaches();
    if (!this.isAdmin()) {
      throw new Error("Only Administrators are authorized to delete customer records.");
    }
    // Delete locally
    const customers = JSON.parse(localStorage.getItem('crm_customers')) || [];
    const filtered = customers.filter(c => c.id !== id);
    localStorage.setItem('crm_customers', JSON.stringify(filtered));

    let allContacts = JSON.parse(localStorage.getItem('crm_contacts')) || [];
    allContacts = allContacts.filter(c => c.customer_id !== id);
    localStorage.setItem('crm_contacts', JSON.stringify(allContacts));

    // Also delete tied opportunities
    const opportunities = JSON.parse(localStorage.getItem('crm_opportunities')) || [];
    localStorage.setItem('crm_opportunities', JSON.stringify(opportunities.filter(o => o.customer_id !== id)));

    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        try {
          await restRequest(`/customer_contacts?customer_id=eq.${id}`, { method: 'DELETE' });
        } catch (err) {}
        try {
          await restRequest(`/opportunities?customer_id=eq.${id}`, { method: 'DELETE' });
        } catch (err) {}
        await restRequest(`/customers?id=eq.${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn("Cloud delete failed, completed locally", e);
      }
    }
    return true;
  },

  // -----------------------
  // OPPORTUNITIES CRUD
  // -----------------------
  async getOpportunities() {
    const now = Date.now();
    if (_opportunitiesCache !== null && (now - _opportunitiesCacheTime) < 5000) {
      return _opportunitiesCache;
    }
    const isCloud = await this.testConnection();
    const localCusts = await this.getCustomers();
    const custMap = new Map(localCusts.map(c => [c.id, c]));

    if (isCloud) {
      try {
        const rawOpps = await restRequest('/opportunities?order=opportunity_no.desc');
        const hydrated = rawOpps.map(opp => ({
          ...opp,
          customer: custMap.get(opp.customer_id)
        }));
        localStorage.setItem('crm_opportunities', JSON.stringify(hydrated));
        _opportunitiesCache = hydrated;
        _opportunitiesCacheTime = Date.now();
        return hydrated;
      } catch (err) {
        console.warn("Fetch Cloud Opportunities failed. fallback to local", err);
        const fallback = JSON.parse(localStorage.getItem('crm_opportunities')) || [];
        _opportunitiesCache = fallback;
        _opportunitiesCacheTime = Date.now();
        return fallback;
      }
    } else {
      const opps = JSON.parse(localStorage.getItem('crm_opportunities')) || [];
      const map = opps.map(opp => ({
        ...opp,
        customer: custMap.get(opp.customer_id)
      })).sort((a,b) => b.opportunity_no.localeCompare(a.opportunity_no));
      _opportunitiesCache = map;
      _opportunitiesCacheTime = Date.now();
      return map;
    }
  },

  async addOpportunity(oppData) {
    clearSupabaseCaches();
    const opportunities = JSON.parse(localStorage.getItem('crm_opportunities')) || [];
    
    // Auto Generate Code
    const yr = '26';
    const thisYr = opportunities.filter(o => o.opportunity_no.startsWith(`OPP-${yr}`));
    let seq = 1;
    if (thisYr.length > 0) {
      const seqs = thisYr.map(o => parseInt(o.opportunity_no.replace(`OPP-${yr}`, ''), 10));
      seq = Math.max(...seqs) + 1;
    }
    const nextCode = `OPP-${yr}${String(seq).padStart(4, '0')}`;
    const newId = crypto.randomUUID();

    const currentUser = this.getCurrentUser();
    const newOpp = {
      ...oppData,
      id: newId,
      opportunity_no: nextCode,
      estimated_value: parseFloat(oppData.estimated_value) || 0,
      success_probability: parseInt(oppData.success_probability) || 0,
      created_by: currentUser.id,
      updated_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    // Save locally
    const localCustomers = JSON.parse(localStorage.getItem('crm_customers')) || [];
    newOpp.customer = localCustomers.find(c => c.id === oppData.customer_id);

    const savedOpps = [...opportunities, newOpp];
    localStorage.setItem('crm_opportunities', JSON.stringify(savedOpps));

    // Cloud insert
    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        const dbPayload = sanitizePayload('opportunities', newOpp);
        const response = await restRequest('/opportunities', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(dbPayload)
        });
        return response ? response[0] : newOpp;
      } catch (err) {
        console.warn("Cloud insert failed, completed locally", err);
      }
    }
    return newOpp;
  },

  async updateOpportunity(id, updates) {
    clearSupabaseCaches();
    const opportunities = JSON.parse(localStorage.getItem('crm_opportunities')) || [];
    const idx = opportunities.findIndex(o => o.id === id);
    if (idx !== -1) {
      const currentUser = this.getCurrentUser();
      const updatedOpp = { ...opportunities[idx], ...updates, updated_by: currentUser.id };
      
      // sync customer
      const localCustomers = JSON.parse(localStorage.getItem('crm_customers')) || [];
      updatedOpp.customer = localCustomers.find(c => c.id === updatedOpp.customer_id);

      opportunities[idx] = updatedOpp;
      localStorage.setItem('crm_opportunities', JSON.stringify(opportunities));

      const isCloud = await this.testConnection();
      if (isCloud) {
        try {
          const dbPayload = sanitizePayload('opportunities', updatedOpp);
          delete dbPayload.id; // Don't PATCH primary key
          await restRequest(`/opportunities?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(dbPayload)
          });
        } catch (e) {
          console.warn("Cloud PATCH failed, synced locally", e);
        }
      }
      return updatedOpp;
    }
    throw new Error("Opportunity not found");
  },

  async deleteOpportunity(id) {
    clearSupabaseCaches();
    if (!this.isAdmin()) {
      throw new Error("Only Administrators are authorized to delete sales opportunities.");
    }
    const opportunities = JSON.parse(localStorage.getItem('crm_opportunities')) || [];
    const filtered = opportunities.filter(o => o.id !== id);
    localStorage.setItem('crm_opportunities', JSON.stringify(filtered));

    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        await restRequest(`/opportunities?id=eq.${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn("Cloud delete failed, completed locally", e);
      }
    }
    return true;
  },

  // -----------------------
  // QUOTATIONS CRUD
  // -----------------------
  async getQuotations() {
    const now = Date.now();
    if (_quotationsCache !== null && (now - _quotationsCacheTime) < 5000) {
      return _quotationsCache;
    }
    const isCloud = await this.testConnection();
    const localCusts = await this.getCustomers();
    const custMap = new Map(localCusts.map(c => [c.id, c]));
    const localOpps = await this.getOpportunities();
    const oppMap = new Map(localOpps.map(o => [o.id, o]));

    if (isCloud) {
      try {
        const rawQuotes = await restRequest('/quotations?order=quotation_no.desc') || [];
        const hydrated = rawQuotes.map(q => {
          let project_name = q.project_name || q.title || '';
          let job_no = q.job_no || '';
          let po_no = q.po_no || '';
          let delivery_plan = q.delivery_plan || '';
          let version = q.version || 'v1.0';
          let remarks = q.remarks || '';
          let customer_phone = q.customer_phone || '';
          let customer_email = q.customer_email || '';
          let attention = q.attention || '';
          let cc = q.cc || '';
          let currency = q.currency || 'THB';
          let exchange_rate = q.exchange_rate || 1;
          let items = q.items || [];
          let sales_person = q.sales_person || q.salesperson_name || '';
          let created_by = q.created_by || '';
          let updated_by = q.updated_by || '';

          if (q.remarks && q.remarks.trim().startsWith('{')) {
            try {
              const meta = JSON.parse(q.remarks);
              if (meta._so_meta) {
                project_name = meta.project_name || project_name;
                job_no = meta.job_no || job_no;
                po_no = meta.po_no || po_no;
                delivery_plan = meta.delivery_plan || delivery_plan;
                version = meta.version || version;
                remarks = meta.remarks || '';
                customer_phone = meta.customer_phone || customer_phone;
                customer_email = meta.customer_email || customer_email;
                attention = meta.attention || attention;
                cc = meta.cc || cc;
                currency = meta.currency || currency;
                exchange_rate = meta.exchange_rate || exchange_rate;
                items = meta.items || items;
                sales_person = meta.sales_person || sales_person;
                created_by = meta.created_by || created_by;
                updated_by = meta.updated_by || updated_by;
              }
            } catch (e) {}
          }

          return {
            ...q,
            project_name,
            job_no,
            po_no,
            delivery_plan,
            version,
            remarks,
            customer_phone,
            customer_email,
            attention,
            cc,
            currency,
            exchange_rate,
            items,
            sales_person,
            created_by,
            updated_by,
            customer: custMap.get(q.customer_id),
            opportunity: oppMap.get(q.opportunity_id)
          };
        });
        localStorage.setItem('crm_quotations', JSON.stringify(hydrated));
        _quotationsCache = hydrated;
        _quotationsCacheTime = Date.now();
        return hydrated;
      } catch (err) {
        console.warn("Fetch Cloud Quotations failed, using local fallback", err);
      }
    }
    const quotes = JSON.parse(localStorage.getItem('crm_quotations')) || [];
    const map = quotes.map(q => {
      let project_name = q.project_name || q.title || '';
      let job_no = q.job_no || '';
      let po_no = q.po_no || '';
      let delivery_plan = q.delivery_plan || '';
      let version = q.version || 'v1.0';
      let remarks = q.remarks || '';
      let customer_phone = q.customer_phone || '';
      let customer_email = q.customer_email || '';
      let attention = q.attention || '';
      let cc = q.cc || '';
      let created_by = q.created_by || '';
      let updated_by = q.updated_by || '';

      if (q.remarks && q.remarks.trim().startsWith('{')) {
        try {
          const meta = JSON.parse(q.remarks);
          if (meta._so_meta) {
            project_name = meta.project_name || project_name;
            job_no = meta.job_no || job_no;
            po_no = meta.po_no || po_no;
            delivery_plan = meta.delivery_plan || delivery_plan;
            version = meta.version || version;
            remarks = meta.remarks || '';
            customer_phone = meta.customer_phone || customer_phone;
            customer_email = meta.customer_email || customer_email;
            attention = meta.attention || attention;
            cc = meta.cc || cc;
            created_by = meta.created_by || created_by;
            updated_by = meta.updated_by || updated_by;
          }
        } catch (e) {}
      }

      return {
        ...q,
        project_name,
        job_no,
        po_no,
        delivery_plan,
        version,
        remarks,
        customer_phone,
        customer_email,
        attention,
        cc,
        created_by,
        updated_by,
        customer: custMap.get(q.customer_id),
        opportunity: oppMap.get(q.opportunity_id)
      };
    }).sort((a, b) => b.quotation_no.localeCompare(a.quotation_no));
    _quotationsCache = map;
    _quotationsCacheTime = Date.now();
    return map;
  },

  async getQuotationById(id) {
    const quotes = await this.getQuotations();
    return quotes.find(q => q.id === id);
  },

  async addQuotation(quoteData) {
    clearSupabaseCaches();
    const quotes = JSON.parse(localStorage.getItem('crm_quotations')) || [];
    
    // Auto Generate Code based on year and month
    const qDate = quoteData.quotation_date || quoteData.issue_date || new Date().toISOString().slice(0, 10);
    let yr = "";
    let mm = "";
    if (qDate && typeof qDate === 'string' && qDate.includes("-")) {
      const parts = qDate.split("-");
      yr = parts[0].slice(-2);
      mm = parts[1].padStart(2, "0");
    }
    if (!yr || !mm) {
      const d = new Date();
      yr = d.getFullYear().toString().slice(-2);
      mm = String(d.getMonth() + 1).padStart(2, "0");
    }
    const prefix = `QT${yr}${mm}`;
    const regex = new RegExp(`^QT-?${yr}${mm}(\\d+)`, "i");

    const seqs = quotes.map(q => {
      if (!q.quotation_no) return 0;
      const match = q.quotation_no.match(regex);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxSeq = Math.max(0, ...seqs);
    const seq = maxSeq + 1;
    const nextCode = `${prefix}${String(seq).padStart(3, '0')}`;
    const newId = crypto.randomUUID();

    const currentUser = this.getCurrentUser();
    const newQuote = {
      ...quoteData,
      id: newId,
      quotation_no: nextCode,
      title: quoteData.title || quoteData.subject || quoteData.project_name || 'Quotation',
      salesperson_name: quoteData.salesperson_name || quoteData.sales_person || '',
      total_value: parseFloat(quoteData.total_value) || 0,
      tax_rate: parseFloat(quoteData.tax_rate) || 7,
      grand_total: parseFloat(quoteData.grand_total) || 0,
      created_by: currentUser.id,
      updated_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    const savedQuotes = [...quotes, newQuote];
    localStorage.setItem('crm_quotations', JSON.stringify(savedQuotes));

    const isCloud = await this.testConnection();
    if (isCloud) {
       try {
         const dbPayload = { ...newQuote };
         dbPayload.title = newQuote.title || newQuote.subject || newQuote.project_name || 'Quotation';
         dbPayload.salesperson_name = newQuote.salesperson_name || newQuote.sales_person || '';
         // Pack metadata into remarks
         dbPayload.remarks = JSON.stringify({
           _so_meta: true,
           remarks: newQuote.remarks || '',
           project_name: newQuote.project_name || newQuote.title || '',
           job_no: newQuote.job_no || '',
           po_no: newQuote.po_no || '',
           delivery_plan: newQuote.delivery_plan || '',
           version: newQuote.version || '',
           customer_phone: newQuote.customer_phone || '',
           customer_email: newQuote.customer_email || '',
           attention: newQuote.attention || '',
           cc: newQuote.cc || '',
           currency: newQuote.currency || 'THB',
           exchange_rate: newQuote.exchange_rate || 1,
           items: newQuote.items || [],
           sales_person: newQuote.sales_person || newQuote.salesperson_name || '',
           created_by: newQuote.created_by || '',
           updated_by: newQuote.updated_by || ''
         });
         const sanitized = sanitizePayload('quotations', dbPayload);
         await restRequest('/quotations', {
           method: 'POST',
           body: JSON.stringify(sanitized)
         });
       } catch (err) {
         console.warn("Cloud addQuotation failed, completed locally", err);
       }
    }
    await this.addActivity(
      "สร้างใบเสนอราคา",
      "Quotation",
      newQuote.id,
      `สร้างใบเสนอราคาใหม่ ${newQuote.quotation_no} สำหรับโครงการ "${newQuote.project_name || newQuote.title || 'N/A'}" มูลค่า ฿${parseFloat(newQuote.grand_total || 0).toLocaleString()}`
    );
    return newQuote;
  },

  async updateQuotation(id, updates, isEditMode = false) {
    clearSupabaseCaches();
    const quotes = JSON.parse(localStorage.getItem('crm_quotations')) || [];
    const idx = quotes.findIndex(q => q.id === id);
    if (idx !== -1) {
      let currentNo = quotes[idx].quotation_no;
      
      // Revision handling: "หากมีการแก้ไขก็จะ QT-0001-26-R1"
      if (isEditMode) {
        // Find base quote number e.g. "QT-0001-26"
        const rx = /^(QT-\d{4}-\d{2})(-R(\d+))?$/;
        const match = currentNo.match(rx);
        if (match) {
          const base = match[1];
          const rev = match[3] ? parseInt(match[3], 10) + 1 : 1;
          currentNo = `${base}-R${rev}`;
        } else {
          currentNo = `${currentNo}-R1`;
        }
      }

      const currentUser = this.getCurrentUser();
      const updatedQuote = { 
        ...quotes[idx], 
        ...updates, 
        quotation_no: currentNo,
        title: updates.title || updates.subject || updates.project_name || quotes[idx].title || 'Quotation',
        salesperson_name: updates.salesperson_name || updates.sales_person || quotes[idx].salesperson_name || quotes[idx].sales_person || '',
        total_value: parseFloat(updates.total_value !== undefined ? updates.total_value : quotes[idx].total_value) || 0,
        grand_total: parseFloat(updates.grand_total !== undefined ? updates.grand_total : quotes[idx].grand_total) || 0,
        updated_by: currentUser.id
      };

      quotes[idx] = updatedQuote;
      localStorage.setItem('crm_quotations', JSON.stringify(quotes));

      const isCloud = await this.testConnection();
      if (isCloud) {
        try {
          const dbPayload = { ...updatedQuote };
          dbPayload.title = updatedQuote.title || updatedQuote.subject || updatedQuote.project_name || 'Quotation';
          dbPayload.salesperson_name = updatedQuote.salesperson_name || updatedQuote.sales_person || '';
          // Pack metadata into remarks
          dbPayload.remarks = JSON.stringify({
            _so_meta: true,
            remarks: updatedQuote.remarks || '',
            project_name: updatedQuote.project_name || updatedQuote.title || '',
            job_no: updatedQuote.job_no || '',
            po_no: updatedQuote.po_no || '',
            delivery_plan: updatedQuote.delivery_plan || '',
            version: updatedQuote.version || '',
            customer_phone: updatedQuote.customer_phone || '',
            customer_email: updatedQuote.customer_email || '',
            attention: updatedQuote.attention || '',
            cc: updatedQuote.cc || '',
            currency: updatedQuote.currency || 'THB',
            exchange_rate: updatedQuote.exchange_rate || 1,
            items: updatedQuote.items || [],
            sales_person: updatedQuote.sales_person || updatedQuote.salesperson_name || '',
            created_by: updatedQuote.created_by || '',
            updated_by: updatedQuote.updated_by || ''
          });
          const sanitized = sanitizePayload('quotations', dbPayload);
          delete sanitized.id; // Don't PATCH primary key
          await restRequest(`/quotations?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(sanitized)
          });
        } catch (e) {
          console.warn("Cloud updateQuotation failed, completed locally", e);
        }
      }
      await this.addActivity(
        "แก้ไขใบเสนอราคา",
        "Quotation",
        updatedQuote.id,
        `แก้ไขข้อมูลใบเสนอราคา ${updatedQuote.quotation_no} สำหรับโครงการ "${updatedQuote.project_name || 'N/A'}" (สถานะ: ${updatedQuote.status || 'N/A'})`
      );
      return updatedQuote;
    }
    throw new Error("Quotation not found");
  },

  async deleteQuotation(id) {
    clearSupabaseCaches();
    if (!this.isAdmin()) {
      throw new Error("Only Administrators are authorized to delete quotations.");
    }
    const quotes = JSON.parse(localStorage.getItem('crm_quotations')) || [];
    const q = quotes.find(item => item.id === id);
    const filtered = quotes.filter(item => item.id !== id);
    localStorage.setItem('crm_quotations', JSON.stringify(filtered));

    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        await restRequest(`/quotations?id=eq.${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn("Cloud deleteQuotation failed, completed locally", e);
      }
    }
    if (q) {
      await this.addActivity(
        "ลบใบเสนอราคา",
        "Quotation",
        id,
        `ลบใบเสนอราคาหมายเลข ${q.quotation_no} ของโครงการ "${q.project_name || 'N/A'}"`
      );
    }
    return true;
  },

  // -----------------------
  // SALES ORDERS CRUD (100% DECOUPLED)
  // -----------------------
  async getSalesOrders() {
    const isCloud = await this.testConnection();
    const localCusts = await this.getCustomers();
    const custMap = new Map(localCusts.map(c => [c.id, c]));

    if (isCloud) {
      try {
        const rawSOs = await restRequest('/sales_orders?order=so_no.desc') || [];
        const hydrated = rawSOs.map(so => {
          return {
            ...so,
            customer: custMap.get(so.customer_id)
          };
        });
        localStorage.setItem('crm_sales_orders', JSON.stringify(hydrated));
        return hydrated;
      } catch (err) {
        console.warn("Fetch Cloud Sales Orders failed, using local fallback", err);
      }
    }
    const sos = JSON.parse(localStorage.getItem('crm_sales_orders')) || [];
    return sos.map(so => {
      return {
        ...so,
        customer: custMap.get(so.customer_id)
      };
    }).sort((a, b) => b.so_no.localeCompare(a.so_no));
  },

  async generateSalesOrderNumber() {
    const sos = await this.getSalesOrders();
    const year = new Date().getFullYear();
    const yearShort = year.toString().slice(-2);
    let maxNum = 0;
    sos.forEach(s => {
      if (s.so_no && s.so_no.startsWith('SO-')) {
        const parts = s.so_no.split('-');
        if (parts.length === 3) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(4, '0');
    return `SO-${padded}-${yearShort}`;
  },

  async addSalesOrder(soData) {
    clearSupabaseCaches();
    const sos = JSON.parse(localStorage.getItem('crm_sales_orders')) || [];
    const nextCode = await this.generateSalesOrderNumber();
    const prepared = {
      id: soData.id || crypto.randomUUID(),
      so_no: nextCode,
      quotation_id: soData.quotation_id || null,
      customer_id: soData.customer_id || null,
      project_name: soData.project_name || "",
      total_amount: parseFloat(soData.total_amount || soData.grand_total || 0),
      status: soData.status || "Pending",
      order_date: soData.order_date || new Date().toISOString().slice(0, 10),
      target_delivery_date: soData.target_delivery_date || soData.delivery_plan || null,
      job_no: soData.job_no || null,
      po_no: soData.po_no || null,
      sales_person: soData.sales_person || soData.sales_representative || null,
      items: soData.items || [],
      created_at: new Date().toISOString()
    };
    
    sos.push(prepared);
    localStorage.setItem('crm_sales_orders', JSON.stringify(sos));

    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        const dbPayload = { ...prepared };
        delete dbPayload.customer;
        const sanitized = sanitizePayload('sales_orders', dbPayload);
        await restRequest('/sales_orders', {
          method: 'POST',
          body: JSON.stringify(sanitized)
        });
      } catch (err) {
        console.warn("Cloud addSalesOrder failed, completed locally", err);
      }
    }
    await this.addActivity(
      "สร้างใบสั่งขาย",
      "Sales Order",
      prepared.id,
      `สร้างใบสั่งขายใหม่หมายเลข ${prepared.so_no} สำหรับโครงการ "${prepared.project_name || 'N/A'}" ยอดสั่งซื้อ ฿${parseFloat(prepared.total_amount || 0).toLocaleString()}`
    );
    return prepared;
  },

  async updateSalesOrder(id, updates) {
    clearSupabaseCaches();
    const sos = JSON.parse(localStorage.getItem('crm_sales_orders')) || [];
    const idx = sos.findIndex(s => s.id === id);
    if (idx > -1) {
      const updated = {
        ...sos[idx],
        ...updates,
        total_amount: updates.total_amount !== undefined ? parseFloat(updates.total_amount) : (updates.grand_total !== undefined ? parseFloat(updates.grand_total) : sos[idx].total_amount)
      };
      sos[idx] = updated;
      localStorage.setItem('crm_sales_orders', JSON.stringify(sos));

      const isCloud = await this.testConnection();
      if (isCloud) {
        try {
          const dbPayload = { ...updated };
          delete dbPayload.customer;
          const sanitized = sanitizePayload('sales_orders', dbPayload);
          await restRequest(`/sales_orders?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(sanitized)
          });
        } catch (e) {
          console.warn("Cloud updateSalesOrder failed, completed locally", e);
        }
      }
      await this.addActivity(
        "แก้ไขใบสั่งขาย",
        "Sales Order",
        updated.id,
        `แก้ไขข้อมูลใบสั่งขายหมายเลข ${updated.so_no} สำหรับโครงการ "${updated.project_name || 'N/A'}" (สถานะ: ${updated.status || 'N/A'})`
      );
      return updated;
    }
    throw new Error("Sales order not found");
  },

  async deleteSalesOrder(id) {
    clearSupabaseCaches();
    if (!this.isAdmin()) {
      throw new Error("Only Administrators are authorized to delete sales orders.");
    }
    const sos = JSON.parse(localStorage.getItem('crm_sales_orders')) || [];
    const s = sos.find(item => item.id === id);
    const filtered = sos.filter(item => item.id !== id);
    localStorage.setItem('crm_sales_orders', JSON.stringify(filtered));

    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        await restRequest(`/sales_orders?id=eq.${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn("Cloud deleteSalesOrder failed, completed locally", e);
      }
    }
    if (s) {
      await this.addActivity(
        "ลบใบสั่งขาย",
        "Sales Order",
        id,
        `ลบใบสั่งขายหมายเลข ${s.so_no} ของโครงการ "${s.project_name || 'N/A'}"`
      );
    }
    return true;
  },

  // -----------------------
  // INVOICES CRUD
  // -----------------------
  async getInvoices() {
    const isCloud = await this.testConnection();
    const localCusts = await this.getCustomers();
    const custMap = new Map(localCusts.map(c => [c.id, c]));

    if (isCloud) {
      try {
        const rawInvoices = await restRequest('/invoices?order=invoice_no.desc') || [];
        const hydrated = rawInvoices.map(inv => {
          let ikm_inv = inv.ikm_inv || '';
          let job_no = inv.job_no || '';
          let remarks = inv.remarks || '';

          if (inv.remarks && inv.remarks.trim().startsWith('{')) {
            try {
              const meta = JSON.parse(inv.remarks);
              if (meta._inv_meta) {
                ikm_inv = meta.ikm_inv || ikm_inv;
                job_no = meta.job_no || job_no;
                remarks = meta.remarks || '';
              }
            } catch (e) {}
          }

          return {
            ...inv,
            ikm_inv,
            job_no,
            remarks,
            customer: custMap.get(inv.customer_id)
          };
        });
        localStorage.setItem('crm_invoices', JSON.stringify(hydrated));
        return hydrated;
      } catch (err) {
        console.warn("Fetch Cloud Invoices failed, using local fallback", err);
      }
    }
    const invoices = JSON.parse(localStorage.getItem('crm_invoices')) || [];
    return invoices.map(inv => {
      let ikm_inv = inv.ikm_inv || '';
      let job_no = inv.job_no || '';
      let remarks = inv.remarks || '';

      if (inv.remarks && inv.remarks.trim().startsWith('{')) {
        try {
          const meta = JSON.parse(inv.remarks);
          if (meta._inv_meta) {
            ikm_inv = meta.ikm_inv || ikm_inv;
            job_no = meta.job_no || job_no;
            remarks = meta.remarks || '';
          }
        } catch (e) {}
      }

      return {
        ...inv,
        ikm_inv,
        job_no,
        remarks,
        customer: custMap.get(inv.customer_id)
      };
    }).sort((a, b) => b.invoice_no.localeCompare(a.invoice_no));
  },

  async getInvoiceById(id) {
    const invoices = await this.getInvoices();
    return invoices.find(inv => inv.id === id);
  },

  async addInvoice(invData) {
    clearSupabaseCaches();
    const invoices = JSON.parse(localStorage.getItem('crm_invoices')) || [];
    
    // Auto Generate Code based on invoice_date
    const iDate = invData.invoice_date || new Date().toISOString().slice(0, 10);
    const yr = iDate.split('-')[0].slice(-2); // e.g. "26"

    const thisYearInvs = invoices.filter(inv => {
      if (!inv.invoice_no) return false;
      const parts = inv.invoice_no.split('-');
      return (parts.length === 3 && parts[0] === 'INV' && parts[2] === yr) || inv.invoice_no.startsWith(`INV-${yr}`);
    });

    let seq = 1;
    if (thisYearInvs.length > 0) {
      const seqs = thisYearInvs.map(inv => {
        const parts = inv.invoice_no.split('-');
        if (parts.length === 3) {
          const num = parseInt(parts[1], 10);
          return isNaN(num) ? 0 : num;
        } else {
          const seqPart = inv.invoice_no.replace(`INV-${yr}`, '');
          const num = parseInt(seqPart, 10);
          return isNaN(num) ? 0 : num;
        }
      });
      seq = Math.max(...seqs, 0) + 1;
    }
    const nextCode = `INV-${String(seq).padStart(4, '0')}-${yr}`;
    const newId = crypto.randomUUID();

    const currentUser = this.getCurrentUser();
    const finalInvoiceNo = invData.invoice_no || nextCode;
    const newInv = {
      ...invData,
      id: newId,
      invoice_no: finalInvoiceNo,
      total_value: parseFloat(invData.total_value) || 0,
      tax_rate: parseFloat(invData.tax_rate) || 7,
      grand_total: parseFloat(invData.grand_total) || 0,
      created_by: currentUser.id,
      updated_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    const savedInvoices = [...invoices, newInv];
    localStorage.setItem('crm_invoices', JSON.stringify(savedInvoices));

    const isCloud = await this.testConnection();
    if (isCloud) {
       try {
         const dbPayload = { ...newInv };
         // Pack metadata into remarks
         dbPayload.remarks = JSON.stringify({
           _inv_meta: true,
           remarks: newInv.remarks || '',
           ikm_inv: newInv.ikm_inv || '',
           job_no: newInv.job_no || ''
         });
         const sanitized = sanitizePayload('invoices', dbPayload);
         await restRequest('/invoices', {
           method: 'POST',
           body: JSON.stringify(sanitized)
         });
       } catch (err) {
         console.warn("Cloud addInvoice failed, completed locally", err);
       }
    }
    return newInv;
  },

  async updateInvoice(id, updates) {
    const invoices = JSON.parse(localStorage.getItem('crm_invoices')) || [];
    const idx = invoices.findIndex(inv => inv.id === id);
    if (idx !== -1) {
      const currentUser = this.getCurrentUser();
      const updatedInv = { 
        ...invoices[idx], 
        ...updates,
        total_value: parseFloat(updates.total_value !== undefined ? updates.total_value : invoices[idx].total_value) || 0,
        grand_total: parseFloat(updates.grand_total !== undefined ? updates.grand_total : invoices[idx].grand_total) || 0,
        updated_by: currentUser.id
      };
      
      invoices[idx] = updatedInv;
      localStorage.setItem('crm_invoices', JSON.stringify(invoices));

      const isCloud = await this.testConnection();
      if (isCloud) {
        try {
          const dbPayload = { ...updatedInv };
          // Pack metadata into remarks
          dbPayload.remarks = JSON.stringify({
            _inv_meta: true,
            remarks: updatedInv.remarks || '',
            ikm_inv: updatedInv.ikm_inv || '',
            job_no: updatedInv.job_no || ''
          });
          const sanitized = sanitizePayload('invoices', dbPayload);
          delete sanitized.id; // Don't PATCH primary key
          await restRequest(`/invoices?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(sanitized)
          });
        } catch (e) {
          console.warn("Cloud updateInvoice failed, completed locally", e);
        }
      }
      return updatedInv;
    }
    throw new Error("Invoice not found");
  },

  async deleteInvoice(id) {
    if (!this.isAdmin()) {
      throw new Error("Only Administrators are authorized to delete invoices.");
    }
    const invoices = JSON.parse(localStorage.getItem('crm_invoices')) || [];
    const filtered = invoices.filter(inv => inv.id !== id);
    localStorage.setItem('crm_invoices', JSON.stringify(filtered));

    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        await restRequest(`/invoices?id=eq.${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn("Cloud deleteInvoice failed, completed locally", e);
      }
    }
    return true;
  },

  // -----------------------
  // USERS DB SYSTEM (SUPABASE SYNC)
  // -----------------------
  async getUsers() {
    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        const rawUsers = await restRequest('/users?order=created_at.desc');
        if (Array.isArray(rawUsers)) {
          localStorage.setItem('crm_users_list', JSON.stringify(rawUsers));
          return rawUsers;
        }
      } catch (err) {
        console.warn("Fetch Cloud Users failed, falling back to local storage", err);
      }
    }
    const local = localStorage.getItem('crm_users_list');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.warn("Parsing local crm_users_list failed", e);
      }
    }
    const defaultUsersList = [
      { id: "d1ef4942-83b3-4f9e-bbb4-7a0df47ab001", username: "apiyut", fullname: "Apiyut Noeikhiaw", email: "Apiyut.noeikhiaw@th.ikm.com", role: "Admin", status: "Active", password: "crm123456" },
      { id: "d2ef4942-83b3-4f9e-bbb4-7a0df47ab002", username: "pimjai", fullname: "Pimjai Kittikhun", email: "pimjai.k@ikm-testing.co.th", role: "Sales Manager", status: "Active", password: "crm123456" },
      { id: "d3ef4942-83b3-4f9e-bbb4-7a0df47ab003", username: "wiriya", fullname: "Wiriya Sawangngam", email: "wiriya.s@ikm-testing.co.th", role: "Sales Rep", status: "Active", password: "crm123456" },
      { id: "d4ef4942-83b3-4f9e-bbb4-7a0df47ab004", username: "somsri", fullname: "Somsri Jitprasong", email: "somsri.j@ikm-testing.co.th", role: "Auditor", status: "Active", password: "crm123456" }
    ];
    localStorage.setItem('crm_users_list', JSON.stringify(defaultUsersList));
    return defaultUsersList;
  },

  async addUser(userData) {
    const users = await this.getUsers();
    let newId = userData.id;
    if (!newId || typeof newId !== 'string' || newId.length < 30) {
      newId = crypto.randomUUID();
    }
    const now = new Date().toISOString();
    const newUser = {
      id: newId,
      username: (userData.username || `user_${Date.now()}`).trim().toLowerCase(),
      fullname: (userData.fullname || '').trim(),
      email: (userData.email || '').trim(),
      role: userData.role || 'Sales Rep',
      status: userData.status || 'Active',
      password: userData.password || 'crm123456',
      created_at: now,
      updated_at: now
    };

    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        const response = await restRequest('/users', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(newUser)
        });
        const created = (response && response[0]) ? response[0] : newUser;
        const filtered = users.filter(u => u.id !== created.id);
        filtered.unshift(created);
        localStorage.setItem('crm_users_list', JSON.stringify(filtered));
        return created;
      } catch (err) {
        console.error("Cloud addUser failed:", err);
        throw err;
      }
    } else {
      users.unshift(newUser);
      localStorage.setItem('crm_users_list', JSON.stringify(users));
      return newUser;
    }
  },

  async updateUser(id, updates) {
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    const now = new Date().toISOString();
    const payload = {
      ...updates,
      updated_at: now
    };
    if (payload.username) payload.username = payload.username.trim().toLowerCase();
    if (payload.fullname) payload.fullname = payload.fullname.trim();
    if (payload.email) payload.email = payload.email.trim();

    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        const response = await restRequest(`/users?id=eq.${id}`, {
          method: 'PATCH',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(payload)
        });
        const updated = (response && response[0]) ? response[0] : { ...(users[idx] || {}), ...payload, id };
        if (idx !== -1) {
          users[idx] = updated;
        } else {
          users.unshift(updated);
        }
        localStorage.setItem('crm_users_list', JSON.stringify(users));
        return updated;
      } catch (err) {
        console.error("Cloud updateUser failed:", err);
        throw err;
      }
    }

    if (idx !== -1) {
      users[idx] = { ...users[idx], ...payload };
      localStorage.setItem('crm_users_list', JSON.stringify(users));
      return users[idx];
    }
    return null;
  },

  async deleteUser(id) {
    if (!this.isAdmin()) {
      throw new Error("Only Administrators are authorized to delete users.");
    }
    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        await restRequest(`/users?id=eq.${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Cloud deleteUser failed:", err);
        throw err;
      }
    }

    const users = await this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem('crm_users_list', JSON.stringify(filtered));
    return true;
  },

  // -----------------------
  // ACTIVITIES AUDIT TRAIL LOGGING
  // -----------------------
  async getActivities() {
    const isCloud = await this.testConnection();
    let logs = [];
    if (isCloud) {
      try {
        logs = await restRequest('/audit_logs?order=created_at.desc') || [];
        localStorage.setItem('crm_activities_audit_logs', JSON.stringify(logs));
      } catch (err) {
        console.warn("Fetch Cloud Audit Logs failed. fallback to local", err);
        logs = JSON.parse(localStorage.getItem('crm_activities_audit_logs')) || [];
      }
    } else {
      logs = JSON.parse(localStorage.getItem('crm_activities_audit_logs')) || [];
    }

    const systemUsers = await this.getUsers() || [];
    const userMap = new Map(systemUsers.map(u => [u.id, u]));

    const mappedActivities = logs.map(l => {
      const u = userMap.get(l.user_id);
      
      let mappedTargetType = 'System';
      const targetTypeLower = String(l.target_type || '').toLowerCase();
      if (targetTypeLower === 'customer') {
        mappedTargetType = 'Customer';
      } else if (targetTypeLower === 'opportunity') {
        mappedTargetType = 'Opportunity';
      } else if (targetTypeLower === 'quotation') {
        mappedTargetType = 'Quotation';
      } else if (targetTypeLower === 'sales_order' || targetTypeLower === 'salesorder') {
        mappedTargetType = 'Sales Order';
      }

      return {
        id: l.id,
        action: l.action,
        target_type: mappedTargetType,
        target_id: l.target_id || 'system',
        details: l.details || '',
        created_by: l.user_id,
        created_by_name: u ? u.fullname : 'System',
        created_at: l.created_at
      };
    });

    return mappedActivities;
  },

  async addActivity(action, targetType, targetId, details) {
    const activities = JSON.parse(localStorage.getItem('crm_activities')) || [];
    const currentUser = this.getCurrentUser();
    
    // Fallback ID to ART KIT Admin if user has no ID or is invalid
    const isValidUUID = (str) => {
      if (typeof str !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    };
    const currentUserId = currentUser && isValidUUID(currentUser.id) ? currentUser.id : '657229df-fb36-4978-bf94-4a52e04f7ae0';

    const newAct = {
      id: crypto.randomUUID(),
      action: action,
      target_type: targetType,
      target_id: targetId || 'system',
      details: details,
      created_by: currentUserId,
      created_by_name: currentUser ? currentUser.fullname : 'System',
      created_at: new Date().toISOString()
    };
    activities.unshift(newAct); // standard unshift for immediate timeline display
    if (activities.length > 150) activities.pop(); // cap at 150 logs of history
    localStorage.setItem('crm_activities', JSON.stringify(activities));

    // Also update offline cache of audit logs
    const localAuditLogs = JSON.parse(localStorage.getItem('crm_activities_audit_logs')) || [];
    const newAuditLogObj = {
      id: newAct.id,
      user_id: currentUserId,
      action: action,
      target_type: String(targetType || 'system').toLowerCase(),
      target_id: String(targetId || 'system'),
      details: details,
      created_at: newAct.created_at
    };
    localAuditLogs.unshift(newAuditLogObj);
    if (localAuditLogs.length > 150) localAuditLogs.pop();
    localStorage.setItem('crm_activities_audit_logs', JSON.stringify(localAuditLogs));

    const isCloud = await this.testConnection();
    if (isCloud) {
      try {
        await restRequest('/audit_logs', {
          method: 'POST',
          body: JSON.stringify({
            user_id: currentUserId,
            action: action,
            target_type: String(targetType || 'system').toLowerCase(),
            target_id: String(targetId || 'system'),
            details: details
          })
        });
      } catch (err) {
        console.warn("Cloud audit logging failed", err);
      }
    }

    return newAct;
  },

  isAdmin() {
    const user = this.getCurrentUser();
    const role = (user && user.role) ? user.role.toLowerCase() : '';
    return role === 'admin' || role === 'system administrator';
  },

  getCurrentUser() {
    const storedUsers = localStorage.getItem('crm_users_list');
    const systemUsers = storedUsers ? JSON.parse(storedUsers) : [
      { id: "d1ef4942-83b3-4f9e-bbb4-7a0df47ab001", username: "apiyut", fullname: "Apiyut Noeikhiaw", role: "Admin", email: "Apiyut.noeikhiaw@th.ikm.com" },
      { id: "d2ef4942-83b3-4f9e-bbb4-7a0df47ab002", username: "pimjai", fullname: "Pimjai Kittikhun", role: "Sales Manager", email: "pimjai.k@ikm-testing.co.th" },
      { id: "d3ef4942-83b3-4f9e-bbb4-7a0df47ab003", username: "wiriya", fullname: "Wiriya Sawangngam", role: "Sales Rep", email: "wiriya.s@ikm-testing.co.th" },
      { id: "d4ef4942-83b3-4f9e-bbb4-7a0df47ab004", username: "somsri", fullname: "Somsri Jitprasong", role: "Auditor", email: "somsri.j@ikm-testing.co.th" },
      { id: "657229df-fb36-4978-bf94-4a52e04f7ae0", username: "art", fullname: "ART KIT", role: "Admin", email: "artkummool@gmail.com" }
    ];

    let currentUserId = localStorage.getItem('crm_user_id') || localStorage.getItem('crm_active_user_id');
    const currentFullname = localStorage.getItem('crm_user_fullname');
    const currentRole = localStorage.getItem('crm_user_role') || 'Admin';
    const currentEmail = localStorage.getItem('crm_user_email');

    // Safe Guard: Map dummy or invalid ID to a valid seeded ID
    if (!currentUserId || currentUserId === '00000000-0000-0000-0000-000000000000' || currentUserId === 'u-fallback' || currentUserId === '3') {
      if (currentEmail) {
        const foundByEmail = systemUsers.find(u => u.email && u.email.trim().toLowerCase() === currentEmail.trim().toLowerCase());
        if (foundByEmail) {
          currentUserId = foundByEmail.id;
          localStorage.setItem('crm_user_id', currentUserId);
          localStorage.setItem('crm_active_user_id', currentUserId);
        }
      }
      
      if (!currentUserId || currentUserId === '00000000-0000-0000-0000-000000000000' || currentUserId === 'u-fallback' || currentUserId === '3') {
        const foundByRole = systemUsers.find(u => u.role === currentRole) || systemUsers[0];
        currentUserId = foundByRole.id;
        localStorage.setItem('crm_user_id', currentUserId);
        localStorage.setItem('crm_active_user_id', currentUserId);
      }
    }

    // 1. Try to find in systemUsers by id first
    if (currentUserId) {
      const foundById = systemUsers.find(u => u.id === currentUserId);
      if (foundById) return foundById;
    }

    // 2. Try to find in crm_sim_users by id
    const cachedSimUsers = localStorage.getItem('crm_sim_users');
    if (cachedSimUsers && currentUserId) {
      try {
        const simUsersList = JSON.parse(cachedSimUsers);
        const foundInSim = simUsersList.find(u => u.id === currentUserId);
        if (foundInSim) {
          return {
            id: foundInSim.id,
            username: foundInSim.username || foundInSim.name?.toLowerCase().replace(/\s+/g, '') || 'user',
            fullname: foundInSim.name || foundInSim.fullname,
            role: foundInSim.role || currentRole
          };
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Try to construct if currentFullname is present
    if (currentUserId && currentFullname) {
      return {
        id: currentUserId,
        username: currentFullname.toLowerCase().replace(/\s+/g, ''),
        fullname: currentFullname,
        role: currentRole
      };
    }

    // 4. Fallback: if we have user info in localStorage, use it. Otherwise, fallback to role match.
    if (currentUserId) {
        return {
            id: currentUserId,
            username: currentFullname?.toLowerCase().replace(/\s+/g, '') || 'user',
            fullname: currentFullname || 'Unknown User',
            role: currentRole
        };
    }
    const found = systemUsers.find(u => u.role === currentRole) || systemUsers[0];
    return found;
  },

  getUsernameOrDisplayName(userIdOrRawString, useFullname = false) {
    if (!userIdOrRawString) return 'system';
    const storedUsers = localStorage.getItem('crm_users_list');
    const systemUsers = storedUsers ? JSON.parse(storedUsers) : [
      { id: "d1ef4942-83b3-4f9e-bbb4-7a0df47ab001", username: "apiyut", fullname: "Apiyut Noeikhiaw", role: "Admin", email: "Apiyut.noeikhiaw@th.ikm.com" },
      { id: "d2ef4942-83b3-4f9e-bbb4-7a0df47ab002", username: "pimjai", fullname: "Pimjai Kittikhun", role: "Sales Manager", email: "pimjai.k@ikm-testing.co.th" },
      { id: "d3ef4942-83b3-4f9e-bbb4-7a0df47ab003", username: "wiriya", fullname: "Wiriya Sawangngam", role: "Sales Rep", email: "wiriya.s@ikm-testing.co.th" },
      { id: "d4ef4942-83b3-4f9e-bbb4-7a0df47ab004", username: "somsri", fullname: "Somsri Jitprasong", role: "Auditor", email: "somsri.j@ikm-testing.co.th" },
      { id: "657229df-fb36-4978-bf94-4a52e04f7ae0", username: "art", fullname: "ART KIT", role: "Admin", email: "artkummool@gmail.com" }
    ];

    // Combine with simulated users list if available
    const cachedSimUsers = localStorage.getItem('crm_sim_users');
    if (cachedSimUsers) {
      try {
        const parsedSim = JSON.parse(cachedSimUsers);
        if (Array.isArray(parsedSim)) {
          parsedSim.forEach(u => {
            const normalizedUser = {
              id: u.id,
              username: u.username || u.name?.toLowerCase().replace(/\s+/g, '') || 'user',
              fullname: u.name || u.fullname,
              role: u.role
            };
            if (!systemUsers.some(su => su.id === normalizedUser.id)) {
              systemUsers.push(normalizedUser);
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    const cleanVal = String(userIdOrRawString).trim().toLowerCase();

    // 1. Try to match by id
    let found = systemUsers.find(u => u.id && u.id.toLowerCase() === cleanVal);
    // 2. Try to match by username
    if (!found) {
      found = systemUsers.find(u => u.username && u.username.toLowerCase() === cleanVal);
    }
    // 3. Try to match by substring of fullname
    if (!found) {
      found = systemUsers.find(u => {
        if (!u.fullname) return false;
        const fn = u.fullname.toLowerCase();
        return fn.includes(cleanVal) || cleanVal.includes(fn);
      });
    }
    // 4. Try mapping S01, S02, S03 codes
    if (!found) {
      if (cleanVal.includes("เอกชัย") || cleanVal.includes("s01") || cleanVal.includes("s1")) {
        found = systemUsers.find(u => u.username === "wiriya");
      } else if (cleanVal.includes("สุชาดา") || cleanVal.includes("s02") || cleanVal.includes("s2")) {
        found = systemUsers.find(u => u.username === "pimjai");
      } else if (cleanVal.includes("ธนพล") || cleanVal.includes("s03") || cleanVal.includes("s3")) {
        found = systemUsers.find(u => u.username === "apiyut");
      }
    }

    if (found) {
      return useFullname ? found.fullname : `@${found.username}`;
    }

    return userIdOrRawString.startsWith('u') ? `@${userIdOrRawString}` : userIdOrRawString;
  }
};

// Export to window/global space for easier consumption by scripts
window.SupabaseDB = SupabaseDB;
window.getConnectivityMode = getConnectivityMode;
