import React, { useState, useEffect } from 'react';
import SupplierManagement from '../components/SupplierManagement';
import { Supplier, PurchaseRequest, PurchaseOrder, UserRole } from '../types';
import { CRMService, LocalDB } from '../supabaseService';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => LocalDB.getSuppliers());
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => LocalDB.getPurchaseRequests());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => LocalDB.getPurchaseOrders());
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
      const [sups, prs, pos] = await Promise.all([
        CRMService.getSuppliers(),
        CRMService.getPurchaseRequests(),
        CRMService.getPurchaseOrders()
      ]);
      setSuppliers(sups);
      setPurchaseRequests(prs);
      setPurchaseOrders(pos);
    } catch (err) {
      console.warn('Could not sync supplier data from remote, using local state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (sup: Omit<Supplier, 'id' | 'created_at'>) => {
    try {
      const created = await CRMService.insertSupplier(sup);
      setSuppliers(prev => [created, ...prev]);
      showToast(`เพิ่มทะเบียนซัพพลายเออร์ "${created.supplier_name}" สำเร็จ`, 'success');
      return created;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถเพิ่มซัพพลายเออร์ได้', 'err');
      throw err;
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Supplier>) => {
    try {
      const updated = await CRMService.updateSupplier(id, updates);
      setSuppliers(prev => prev.map(s => (s.id === id ? updated : s)));
      showToast(`อัปเดตข้อมูล ${updated.supplier_name} เรียบร้อยแล้ว`, 'success');
      return updated;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถอัปเดตข้อมูลซัพพลายเออร์ได้', 'err');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await CRMService.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      showToast('ลบข้อมูลซัพพลายเออร์เรียบร้อยแล้ว', 'success');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถลบซัพพลายเออร์ได้', 'err');
      throw err;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f4f6f9] text-slate-800 p-4 md:p-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold border ${
              toast.type === 'err'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <SupplierManagement
        suppliers={suppliers}
        purchaseRequests={purchaseRequests}
        purchaseOrders={purchaseOrders}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onToast={showToast}
        currentRole={currentRole}
        currentUserId={currentUserId}
        onRefresh={loadData}
        isLoading={isLoading}
        onNavigateToPR={(supplierId) => {
          window.location.href = `pr_po.html?supplier=${encodeURIComponent(supplierId || '')}`;
        }}
      />
    </div>
  );
}
