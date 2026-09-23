import React, { useState, useEffect } from 'react';
import PurchaseManagement from '../components/PurchaseManagement';
import { PurchaseRequest, PurchaseOrder, Supplier, Customer, UserRole } from '../types';
import { CRMService, LocalDB } from '../supabaseService';

export default function PurchasePage() {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => LocalDB.getPurchaseRequests());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => LocalDB.getPurchaseOrders());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => LocalDB.getSuppliers());
  const [customers, setCustomers] = useState<Customer[]>(() => LocalDB.getCustomers());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'err' } | null>(null);

  const currentRole: UserRole = (localStorage.getItem('crm_active_role') ||
    localStorage.getItem('crm_user_role') ||
    'System Administrator') as UserRole;
  const currentUserId = localStorage.getItem('crm_active_user_id') || 'admin-1';
  const currentUserFullname = localStorage.getItem('crm_user_fullname') || 'Saranya (Admin)';

  const showToast = (message: string, type: 'success' | 'err' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prs, pos, sups, custs] = await Promise.all([
        CRMService.getPurchaseRequests(),
        CRMService.getPurchaseOrders(),
        CRMService.getSuppliers(),
        CRMService.fetchCustomers()
      ]);
      setPurchaseRequests(prs);
      setPurchaseOrders(pos);
      setSuppliers(sups);
      setCustomers(custs);
    } catch (err) {
      console.warn('Could not sync purchase data from remote, using local state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPR = async (pr: Omit<PurchaseRequest, 'id' | 'created_at'>) => {
    try {
      const created = await CRMService.insertPurchaseRequest(pr);
      setPurchaseRequests(prev => [created, ...prev]);
      showToast(`สร้างใบขอซื้อ ${created.pr_no} เรียบร้อยแล้ว`, 'success');
      return created;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถสร้างใบขอซื้อได้', 'err');
      throw err;
    }
  };

  const handleUpdatePR = async (id: string, updates: Partial<PurchaseRequest>) => {
    try {
      const updated = await CRMService.updatePurchaseRequest(id, updates);
      setPurchaseRequests(prev => prev.map(p => (p.id === id ? updated : p)));
      showToast(`อัปเดตใบขอซื้อ ${updated.pr_no} เรียบร้อย`, 'success');
      return updated;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถอัปเดตใบขอซื้อได้', 'err');
      throw err;
    }
  };

  const handleDeletePR = async (id: string) => {
    try {
      await CRMService.deletePurchaseRequest(id);
      setPurchaseRequests(prev => prev.filter(p => p.id !== id));
      showToast('ลบใบขอซื้อเรียบร้อยแล้ว', 'success');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถลบใบขอซื้อได้', 'err');
      throw err;
    }
  };

  const handleApprovePRtoPO = async (prId: string) => {
    const roleStr = currentRole as string;
    const isAdm = roleStr === 'Admin' || roleStr === 'Administrator' || roleStr === 'System Administrator';
    if (!isAdm) {
      showToast('⚠️ สิทธิ์ไม่เพียงพอ: การอนุมัติ PR เพื่อแปลงเป็น PO สามารถทำได้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น', 'err');
      throw new Error('Unauthorized');
    }

    try {
      const newPO = await CRMService.approvePRtoPO(prId, currentUserFullname);
      setPurchaseOrders(prev => [newPO, ...prev]);
      setPurchaseRequests(prev =>
        prev.map(p => {
          if (p.id === prId) {
            return {
              ...p,
              status: 'Approved',
              approval_status: 'Approved',
              approved_by: currentUserFullname,
              approved_at: new Date().toISOString(),
              converted_po_id: newPO.id,
              converted_po_no: newPO.po_no
            };
          }
          return p;
        })
      );
      showToast(`อนุมัติ PR สำเร็จ ออกใบสั่งซื้อ PO เลขที่ ${newPO.po_no} โดย ${currentUserFullname}`, 'success');
      return newPO;
    } catch (err: any) {
      showToast(err?.message || 'เกิดข้อผิดพลาดในการอนุมัติ PR เป็น PO', 'err');
      throw err;
    }
  };

  const handleAddPO = async (po: Omit<PurchaseOrder, 'id' | 'created_at'>) => {
    try {
      const created = await CRMService.insertPurchaseOrder(po);
      setPurchaseOrders(prev => [created, ...prev]);
      showToast(`สร้างใบสั่งซื้อ ${created.po_no} สำเร็จ`, 'success');
      return created;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถสร้างใบสั่งซื้อได้', 'err');
      throw err;
    }
  };

  const handleUpdatePO = async (id: string, updates: Partial<PurchaseOrder>) => {
    try {
      const updated = await CRMService.updatePurchaseOrder(id, updates);
      setPurchaseOrders(prev => prev.map(p => (p.id === id ? updated : p)));
      showToast(`อัปเดตใบสั่งซื้อ ${updated.po_no} เรียบร้อย`, 'success');
      return updated;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถอัปเดตใบสั่งซื้อได้', 'err');
      throw err;
    }
  };

  const handleDeletePO = async (id: string) => {
    try {
      await CRMService.deletePurchaseOrder(id);
      setPurchaseOrders(prev => prev.filter(p => p.id !== id));
      showToast('ลบใบสั่งซื้อเรียบร้อยแล้ว', 'success');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถลบใบสั่งซื้อได้', 'err');
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

      <PurchaseManagement
        purchaseRequests={purchaseRequests}
        purchaseOrders={purchaseOrders}
        suppliers={suppliers}
        customers={customers}
        onAddPR={handleAddPR}
        onUpdatePR={handleUpdatePR}
        onDeletePR={handleDeletePR}
        onApprovePRtoPO={handleApprovePRtoPO}
        onAddPO={handleAddPO}
        onUpdatePO={handleUpdatePO}
        onDeletePO={handleDeletePO}
        onToast={showToast}
        currentRole={currentRole}
        currentUserId={currentUserId}
        currentUserFullname={currentUserFullname}
        onRefresh={loadData}
        isLoading={isLoading}
      />
    </div>
  );
}
