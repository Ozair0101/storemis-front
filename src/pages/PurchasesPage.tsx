import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiEye, FiDollarSign } from 'react-icons/fi';

/* ───────── Types ───────── */
interface Purchase {
  purchase_id: number;
  supplier_name: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  payment_type: string;
  status: string;
  created_at: string;
}

/* ───────── Helpers ───────── */
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    completed: 'bg-green-100 text-green-700', paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700', pending: 'bg-red-100 text-red-700',
  };
  const label: Record<string, string> = {
    completed: 'تکمیل شده', paid: 'پرداخت شده', partial: 'ناقص', pending: 'در انتظار',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {label[status] ?? status}
    </span>
  );
};

const fmt = (n: number) => Number(n ?? 0).toLocaleString('fa-AF');

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function PurchasesPage() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentTarget, setPaymentTarget] = useState<Purchase | null>(null);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/purchases');
      setPurchases(Array.isArray(data) ? data : data.data ?? []);
    } catch { toast.error('خطا در دریافت لیست خریدها'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPurchases(); }, []);

  return (
    <div dir="rtl" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">خریدها</h1>
          <p className="text-sm text-slate-500 mt-1">مدیریت سفارشات خرید</p>
        </div>
        <button onClick={() => navigate('/purchases/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition shadow">
          <FiPlus size={16} /> ثبت خرید جدید
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-16 text-center text-slate-400">هیچ خریدی ثبت نشده است</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">شماره</th>
                  <th className="px-4 py-3 text-right font-medium">تامین‌کننده</th>
                  <th className="px-4 py-3 text-center font-medium">فاکتور</th>
                  <th className="px-4 py-3 text-center font-medium">مبلغ کل</th>
                  <th className="px-4 py-3 text-center font-medium">پرداخت شده</th>
                  <th className="px-4 py-3 text-center font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-center font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-center font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.purchase_id}
                    onClick={() => navigate(`/purchases/${p.purchase_id}`)}
                    className="border-b last:border-0 hover:bg-blue-50 cursor-pointer transition">
                    <td className="px-4 py-3 font-medium text-slate-700">{p.purchase_id}</td>
                    <td className="px-4 py-3 text-slate-600">{p.supplier_name}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{p.invoice_number || '—'}</td>
                    <td className="px-4 py-3 text-center font-semibold">{fmt(p.total_amount)}</td>
                    <td className="px-4 py-3 text-center">{fmt(p.paid_amount)}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">
                      {new Date(p.created_at).toLocaleDateString('fa-AF')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={e => { e.stopPropagation(); navigate(`/purchases/${p.purchase_id}`); }}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50" title="مشاهده">
                          <FiEye size={15} />
                        </button>
                        {p.status !== 'completed' && p.status !== 'paid' && (
                          <button onClick={e => { e.stopPropagation(); setPaymentTarget(p); }}
                            className="p-1.5 rounded-md text-green-600 hover:bg-green-50" title="ثبت پرداخت">
                            <FiDollarSign size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment modal — quick action, stays as modal */}
      {paymentTarget && (
        <PaymentModal
          purchase={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onUpdated={() => { setPaymentTarget(null); fetchPurchases(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Payment Modal
   ═══════════════════════════════════════════════════════ */
function PaymentModal({ purchase, onClose, onUpdated }: {
  purchase: Purchase; onClose: () => void; onUpdated: () => void;
}) {
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'sarafi'>('account');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [sarafiId, setSarafiId] = useState<number | ''>('');
  const [accounts, setAccounts] = useState<{ account_id: number; name: string; type: string; currency: string }[]>([]);
  const [sarafis, setSarafis] = useState<{ sarafi_id: number; name: string; currency: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const remaining = Number(purchase.total_amount) - Number(purchase.paid_amount);

  useEffect(() => {
    api.get('/accounts').then(r => { setAccounts(r.data); if (r.data.length > 0) setAccountId(r.data[0].account_id); }).catch(() => {});
    api.get('/sarafis').then(r => setSarafis(r.data)).catch(() => {});
  }, []);

  const submit = async () => {
    if (paidAmount <= 0) { toast.error('لطفاً مبلغ پرداخت را وارد کنید'); return; }
    setSubmitting(true);
    try {
      const selectedAccount = accounts.find(a => a.account_id === accountId);
      await api.put(`/purchases/${purchase.purchase_id}/payment`, {
        paid_amount: Number(purchase.paid_amount) + paidAmount,
        payment_type: paymentMethod === 'sarafi' ? 'sarafi' : (selectedAccount?.type || 'cash'),
        account_id: paymentMethod === 'account' ? (accountId || null) : null,
        sarafi_id: paymentMethod === 'sarafi' ? (sarafiId || null) : null,
      });
      toast.success('پرداخت با موفقیت ثبت شد');
      onUpdated();
    } catch { toast.error('خطا در ثبت پرداخت'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">ثبت پرداخت</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><FiX size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">مبلغ کل</span>
              <span className="font-semibold">{fmt(purchase.total_amount)} افغانی</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">پرداخت شده</span>
              <span className="font-semibold text-green-600">{fmt(purchase.paid_amount)} افغانی</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-red-600 font-bold">
              <span>باقی‌مانده</span>
              <span>{fmt(remaining)} افغانی</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">روش پرداخت</label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-2">
              <button type="button" onClick={() => setPaymentMethod('account')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${paymentMethod === 'account' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>
                حساب مستقیم
              </button>
              <button type="button" onClick={() => setPaymentMethod('sarafi')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${paymentMethod === 'sarafi' ? 'bg-white shadow text-amber-700' : 'text-slate-500'}`}>
                از طریق صرافی
              </button>
            </div>
            {paymentMethod === 'account' ? (
              <select value={accountId} onChange={e => setAccountId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm">
                <option value="">انتخاب حساب...</option>
                {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name} ({a.currency})</option>)}
              </select>
            ) : (
              <select value={sarafiId} onChange={e => setSarafiId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-amber-50 text-sm">
                <option value="">انتخاب صرافی...</option>
                {sarafis.map(s => <option key={s.sarafi_id} value={s.sarafi_id}>{s.name} ({s.currency})</option>)}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">مبلغ پرداخت</label>
            <input type="number" min={0} max={remaining} value={paidAmount || ''}
              onChange={e => { const v = Number(e.target.value) || 0; setPaidAmount(Math.min(v, remaining)); }}
              placeholder="0" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            {remaining > 0 && (
              <p className="text-xs text-slate-400 mt-1">حداکثر: {fmt(remaining)} افغانی</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm">
              انصراف
            </button>
            <button onClick={submit} disabled={submitting}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg font-medium text-sm">
              {submitting ? 'در حال ثبت...' : 'ثبت پرداخت'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
