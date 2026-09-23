import React, { useState, useEffect } from 'react';
import BillingManagement from '../components/BillingManagement';
import { BillingNote, Customer, Invoice, UserRole } from '../types';
import { CRMService, LocalDB } from '../supabaseService';

export default function BillingPage() {
  const [billingNotes, setBillingNotes] = useState<BillingNote[]>(() => LocalDB.getBillingNotes());
  const [customers, setCustomers] = useState<Customer[]>(() => LocalDB.getCustomers());
  const [invoices, setInvoices] = useState<Invoice[]>(() => LocalDB.getInvoices());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'err' } | null>(null);

  const currentRole: UserRole = (localStorage.getItem('crm_active_role') ||
    localStorage.getItem('crm_user_role') ||
    'System Administrator') as UserRole;
  const currentUserId = localStorage.getItem('crm_active_user_id') || 'admin-1';

  const showToast = (message: string, type: 'success' | 'err' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [notes, custs, invs] = await Promise.all([
        CRMService.getBillingNotes(),
        CRMService.fetchCustomers(),
        CRMService.fetchInvoices()
      ]);
      setBillingNotes(notes);
      setCustomers(custs);
      setInvoices(invs);
    } catch (err) {
      console.warn('Could not sync billing notes from remote, using local state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (payload: Omit<BillingNote, 'id' | 'created_at'>) => {
    try {
      const created = await CRMService.insertBillingNote(payload);
      setBillingNotes(prev => [created, ...prev]);
      showToast(`สร้างใบวางบิลเลขที่ ${created.billing_no} สำเร็จเรียบร้อย`, 'success');
      return created;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถบันทึกใบวางบิลได้', 'err');
      throw err;
    }
  };

  const handleUpdate = async (id: string, updates: Partial<BillingNote>) => {
    try {
      const updated = await CRMService.updateBillingNote(id, updates);
      setBillingNotes(prev => prev.map(b => (b.id === id ? updated : b)));
      showToast(`อัปเดตข้อมูลใบวางบิล ${updated.billing_no} เรียบร้อย`, 'success');
      return updated;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถอัปเดตใบวางบิลได้', 'err');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await CRMService.deleteBillingNote(id);
      setBillingNotes(prev => prev.filter(b => b.id !== id));
      showToast('ลบรายการใบวางบิลเรียบร้อยแล้ว', 'success');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถลบใบวางบิลได้', 'err');
      throw err;
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold border ${
              toast.type === 'err'
                ? 'bg-rose-950/90 text-rose-200 border-rose-700'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <BillingManagement
        billingNotes={billingNotes}
        customers={customers}
        invoices={invoices}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onToast={showToast}
        currentRole={currentRole}
        currentUserId={currentUserId}
        onRefresh={loadData}
        isLoading={isLoading}
      />
    </div>
  );
}
