import React, { useState, useEffect } from 'react';
import { getConnectivityMode, setConnectivityMode, CRMService } from '../supabaseService';
import { 
  Database, 
  CheckCircle2, 
  Copy, 
  Check, 
  Terminal, 
  Info, 
  RefreshCcw, 
  CloudLightning,
  AlertTriangle,
  Download,
  Server,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  PROCUREMENT_AND_BILLING_SQL, 
  MYSQL_PROCUREMENT_AND_BILLING_SQL 
} from '../data/sqlSchemas';

interface SetupViewProps {
  onToast: (msg: string, type: 'success' | 'err') => void;
  onConnectivityChange?: () => void;
}

interface TableStatus {
  name: string;
  label: string;
  status: 'checking' | 'ready' | 'missing';
  count?: number;
}

export default function SetupView({ onToast, onConnectivityChange }: SetupViewProps) {
  const [useCloud, setUseCloud] = useState(getConnectivityMode());
  const [cloudStatus, setCloudStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [copied, setCopied] = useState(false);
  const [activeSqlTab, setActiveSqlTab] = useState<'procurement' | 'supabase_full' | 'mysql'>('procurement');
  const [customUrl, setCustomUrl] = useState(
    localStorage.getItem('crm_supabase_url') 
      ? (localStorage.getItem('crm_supabase_url') || '').replace('/rest/v1', '') 
      : ''
  );
  const [customKey, setCustomKey] = useState(localStorage.getItem('crm_supabase_anon_key') || '');

  // Table diagnostics list
  const [tables, setTables] = useState<TableStatus[]>([
    { name: 'suppliers', label: 'คู่ค้า / ซัพพลายเออร์ (Suppliers)', status: 'checking' },
    { name: 'purchase_requests', label: 'ใบขอซื้อ (Purchase Requests - PR)', status: 'checking' },
    { name: 'purchase_orders', label: 'ใบสั่งซื้อ (Purchase Orders - PO)', status: 'checking' },
    { name: 'billing_notes', label: 'ใบวางบิล (Billing Notes)', status: 'checking' },
    { name: 'customers', label: 'ลูกค้า (Customers)', status: 'checking' },
    { name: 'quotations', label: 'ใบเสนอราคา (Quotations)', status: 'checking' },
    { name: 'sales_orders', label: 'ใบสั่งขาย (Sales Orders)', status: 'checking' }
  ]);

  // Full Supabase CRM Schema (includes Core + Procurement)
  const fullSupabaseScript = `-- ============================================================================
-- CRM & Procurement Production Schema - Supabase (PostgreSQL 14+)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    industry_type VARCHAR(100),
    address TEXT,
    province VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    payment_term VARCHAR(50),
    credit_limit NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public on customers" ON public.customers FOR ALL USING (true);

-- 2. OPPORTUNITIES
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    lead_source VARCHAR(100) NOT NULL,
    project_location VARCHAR(50) DEFAULT 'Other',
    estimated_value NUMERIC(15, 2) DEFAULT 0.00,
    success_probability INT DEFAULT 0,
    weighted_value NUMERIC(15, 2) DEFAULT 0.00,
    expected_close_date DATE,
    sales_person_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Lead',
    remarks TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public on opportunities" ON public.opportunities FOR ALL USING (true);

-- 3. QUOTATIONS
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_no VARCHAR(50) UNIQUE NOT NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    vat_amount NUMERIC(15, 2) DEFAULT 0.00,
    grand_total NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Draft',
    issue_date DATE,
    valid_until DATE,
    remarks TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public on quotations" ON public.quotations FOR ALL USING (true);

-- 4. SALES ORDERS
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    so_no VARCHAR(50) UNIQUE NOT NULL,
    quotation_id UUID,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public on sales_orders" ON public.sales_orders FOR ALL USING (true);

-- EXTENSIONS: PROCUREMENT & BILLING
` + PROCUREMENT_AND_BILLING_SQL;

  // Active script selector
  const getActiveScript = () => {
    switch (activeSqlTab) {
      case 'procurement':
        return PROCUREMENT_AND_BILLING_SQL;
      case 'supabase_full':
        return fullSupabaseScript;
      case 'mysql':
        return MYSQL_PROCUREMENT_AND_BILLING_SQL;
      default:
        return PROCUREMENT_AND_BILLING_SQL;
    }
  };

  // Run connection & tables health check
  const runConnectionCheck = async () => {
    setCloudStatus('checking');
    const connected = await CRMService.checkCloudConnection();
    setCloudStatus(connected ? 'connected' : 'disconnected');

    // Check individual tables if connected
    const updatedTables: TableStatus[] = [];
    for (const t of tables) {
      if (!connected) {
        updatedTables.push({ ...t, status: 'missing', count: 0 });
        continue;
      }

      try {
        const raw = localStorage.getItem('crm_supabase_url') || 'https://vrmjdbwdilqitdttzrcq.supabase.co/rest/v1';
        const key = localStorage.getItem('crm_supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybWpkYndkaWxxaXRkdHR6cmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjU5NTQsImV4cCI6MjA1NTkwMTk1NH0.G7NffnFfS5Tz4j3mQnFv6zT2ZqYkL_0_c2oG7t7Yw4s';
        const res = await fetch(`${raw}/${t.name}?select=id&limit=5`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          updatedTables.push({ ...t, status: 'ready', count: Array.isArray(data) ? data.length : 0 });
        } else {
          updatedTables.push({ ...t, status: 'missing' });
        }
      } catch {
        updatedTables.push({ ...t, status: 'missing' });
      }
    }
    setTables(updatedTables);
  };

  useEffect(() => {
    runConnectionCheck();
  }, [useCloud]);

  const handleToggleMode = (mode: boolean) => {
    setConnectivityMode(mode);
    setUseCloud(mode);
    onToast(mode ? 'สลับเข้าสู่โหมดเชื่อมต่อคลาวด์ Supabase (Cloud Mode)' : 'สลับเข้าสู่โหมดออฟไลน์ (Offline Sandbox)', 'success');
    if (onConnectivityChange) {
      onConnectivityChange();
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(getActiveScript());
    setCopied(true);
    onToast('คัดลอกคำสั่ง SQL เรียบร้อยแล้ว สามารถนำไปวางใน SQL Editor ได้ทันที', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSQL = () => {
    const filename = activeSqlTab === 'mysql' 
      ? 'database_procurement_mysql.sql' 
      : activeSqlTab === 'procurement' 
      ? 'procurement_and_billing_schema.sql' 
      : 'supabase_schema.sql';
    
    const blob = new Blob([getActiveScript()], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast(`ดาวน์โหลดไฟล์ ${filename} เรียบร้อยแล้ว`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Title Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <Database className="w-5 h-5 text-blue-600" />
            การตั้งค่าฐานข้อมูล & สคริปต์สร้างตาราง (Database Schema & Cloud Sync)
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            รองรับทั้งระบบจัดซื้อ (PR/PO), ซัพพลายเออร์, ใบวางบิล และระบบ CRM ครบวงจร พร้อมสคริปต์ SQL พร้อมรันทั้ง Supabase และ MySQL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runConnectionCheck}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            ตรวจสอบสถานะตาราง
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Diagnostics & Settings */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Connection Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Server className="w-4 h-4 text-indigo-500" />
                สถานะการเชื่อมต่อ (Cloud Gateway)
              </h3>
              
              {cloudStatus === 'checking' && (
                <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <RefreshCcw className="w-3 h-3 animate-spin" />
                  กำลังตรวจสอบ...
                </span>
              )}

              {cloudStatus === 'connected' && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  เชื่อมต่อสำเร็จ
                </span>
              )}

              {cloudStatus === 'disconnected' && (
                <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  ตรวจไม่พบตารางบนคลาวด์
                </span>
              )}
            </div>

            {/* Storage Toggle Mode */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-600 block">โหมดการจัดเก็บข้อมูล (Storage Adapter)</span>
              
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  id="btn-switch-offline"
                  onClick={() => handleToggleMode(false)}
                  className={`py-2 text-xs font-semibold rounded-lg focus:outline-none transition-all cursor-pointer ${!useCloud ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Offline Sandbox
                </button>
                <button
                  id="btn-switch-cloud"
                  onClick={() => handleToggleMode(true)}
                  className={`py-2 text-xs font-semibold rounded-lg focus:outline-none transition-all flex items-center justify-center gap-1 cursor-pointer ${useCloud ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <CloudLightning className="w-3.5 h-3.5 shrink-0" />
                  Cloud Sync Mode
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {!useCloud 
                  ? 'ระบบบันทึกลง LocalDB (ความเร็วสูง รองรับการทำงานออฟไลน์ 100%) ข้อมูล Add / Edit / Delete บันทึกทันที' 
                  : 'ระบบพยายามซิงก์ตรงกับ Supabase REST API และมี LocalDB สำรองกรณีออฟไลน์'}
              </p>
            </div>

            {/* Table Checklist */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  สถานะตารางในระบบ (Table Health)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {tables.filter(t => t.status === 'ready').length}/{tables.length} พร้อมใช้งาน
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {tables.map((tbl) => (
                  <div key={tbl.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="truncate mr-2">
                      <div className="font-semibold text-slate-700 truncate">{tbl.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tbl.name}</div>
                    </div>
                    <div>
                      {tbl.status === 'ready' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> ออนไลน์
                        </span>
                      ) : tbl.status === 'checking' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <RefreshCcw className="w-2.5 h-2.5 animate-spin" /> เช็ค...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-slate-400" /> รอสร้าง SQL
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Supabase Credentials Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-500" />
              กำหนดค่า Supabase ส่วนตัว (Custom Cluster)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Project Web URL</label>
                <input
                  type="text"
                  placeholder="เช่น https://xxxx.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-800 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Anon Public-Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-800 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    let urlClean = customUrl.trim();
                    if (urlClean) {
                      if (urlClean.endsWith('/')) urlClean = urlClean.slice(0, -1);
                      if (!urlClean.endsWith('/rest/v1')) urlClean = `${urlClean}/rest/v1`;
                      localStorage.setItem('crm_supabase_url', urlClean);
                    } else {
                      localStorage.removeItem('crm_supabase_url');
                    }

                    if (customKey.trim()) {
                      localStorage.setItem('crm_supabase_anon_key', customKey.trim());
                    } else {
                      localStorage.removeItem('crm_supabase_anon_key');
                    }

                    onToast('บันทึกค่าการเชื่อมต่อเรียบร้อยแล้ว', 'success');
                    if (onConnectivityChange) {
                      onConnectivityChange();
                    }
                    setTimeout(() => {
                      runConnectionCheck();
                    }, 400);
                  }}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors text-xs text-center"
                >
                  บันทึกการเชื่อมต่อ
                </button>

                {(localStorage.getItem('crm_supabase_url') || localStorage.getItem('crm_supabase_anon_key')) && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('crm_supabase_url');
                      localStorage.removeItem('crm_supabase_anon_key');
                      setCustomUrl('');
                      setCustomKey('');
                      onToast('คืนค่าเชื่อมต่อเริ่มต้นเรียบร้อย (Reset to default)', 'success');
                      if (onConnectivityChange) {
                        onConnectivityChange();
                      }
                      setTimeout(() => {
                        runConnectionCheck();
                      }, 400);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg cursor-pointer transition-colors text-xs"
                  >
                    คืนค่าเดิม
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: SQL Tabs, Script Viewer & Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4 flex flex-col justify-between">
          
          {/* Header & Tabs */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  คำสั่งสร้างตาราง (SQL Script Generator)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  เลือกสคริปต์ที่ต้องการนำไปรันใน Supabase หรือ MySQL XAMPP
                </p>
              </div>

              {/* Action Buttons: Copy & Download */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-download-sql"
                  onClick={handleDownloadSQL}
                  className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="ดาวน์โหลดไฟล์ .sql"
                >
                  <Download className="w-3.5 h-3.5" />
                  ดาวน์โหลด .sql
                </button>

                <button
                  id="btn-copy-sql"
                  onClick={handleCopySQL}
                  className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'คัดลอกแล้ว!' : 'คัดลอกคำสั่ง SQL'}
                </button>
              </div>
            </div>

            {/* SQL Tab Selector */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveSqlTab('procurement')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSqlTab === 'procurement'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                ตารางจัดซื้อ & วางบิล (PR / PO / ซัพพลายเออร์ / วางบิล)
              </button>

              <button
                type="button"
                onClick={() => setActiveSqlTab('supabase_full')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSqlTab === 'supabase_full'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Supabase ครบทุกระบบ (Full Database)
              </button>

              <button
                type="button"
                onClick={() => setActiveSqlTab('mysql')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSqlTab === 'mysql'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                MySQL / MariaDB (XAMPP)
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="relative flex-1 mt-2">
            <textarea
              readOnly
              value={getActiveScript()}
              className="w-full h-88 p-4 border border-slate-200 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none leading-relaxed select-all shadow-inner"
            />
          </div>

          {/* Easy Setup Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <span className="font-bold text-blue-900 text-xs block">
                วิธีติดตั้งตารางเข้าฐานข้อมูลเพื่อรองรับระบบจัดซื้อ & วางบิล
              </span>
              <ol className="list-decimal pl-4 text-[11px] text-blue-800 space-y-1 leading-relaxed">
                <li>กดปุ่ม <strong>"คัดลอกคำสั่ง SQL"</strong> ด้านบน</li>
                <li>เปิด <strong>Supabase Dashboard</strong> ของคุณ นำทางไปยังแถบเมนู <strong>SQL Editor</strong></li>
                <li>คลิกปุ่ม <strong>New Query</strong> แล้วกด Paste (Ctrl + V หรือ Cmd + V) วางคำสั่งลงในช่องรันโค้ด</li>
                <li>กดปุ่มเขียว <strong>Run</strong> (หรือกด Ctrl + Enter) เพื่อสร้างตารางทั้งหมด</li>
                <li>กลับมาที่หน้านี้แล้วกดปุ่ม <strong>"ตรวจสอบสถานะตาราง"</strong> เพื่อยืนยันการเชื่อมต่อ</li>
              </ol>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
