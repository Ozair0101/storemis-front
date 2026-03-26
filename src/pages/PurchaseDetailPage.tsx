import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPrinter, FiDollarSign, FiX } from 'react-icons/fi';

interface PurchaseItem {
  id: number; product_id: number; product_name: string;
  quantity: number; unit_price: number; total_price: number;
}
interface PurchaseDetail {
  purchase_id: number; supplier_name: string; invoice_number: string | null;
  total_amount: number; paid_amount: number; payment_type: string;
  status: string; created_at: string; due_date: string | null;
  items: PurchaseItem[];
}

const afn = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString('fa-AF');

const PAYMENT: Record<string, string> = { cash: 'نقد', bank: 'بانکی', mobile: 'موبایل', sarafi: 'صرافی' };
const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  paid:      { label: 'پرداخت شده', bg: 'bg-green-100', text: 'text-green-700' },
  completed: { label: 'تکمیل شده',  bg: 'bg-green-100', text: 'text-green-700' },
  partial:   { label: 'ناقص',       bg: 'bg-amber-100', text: 'text-amber-700' },
  pending:   { label: 'در انتظار',  bg: 'bg-red-100',   text: 'text-red-700'   },
};

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  const fetchPurchase = () => {
    if (!id) return;
    api.get(`/purchases/${id}`)
      .then(r => setPurchase(r.data))
      .catch(() => { toast.error('خطا در دریافت جزئیات خرید'); navigate('/purchases'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPurchase(); }, [id, navigate]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!purchase) return null;

  const st = STATUS[purchase.status] ?? { label: purchase.status, bg: 'bg-slate-100', text: 'text-slate-600' };
  const total = Number(purchase.total_amount);
  const paid = Number(purchase.paid_amount);
  const remaining = total - paid;

  return (
    <div dir="rtl" className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate('/purchases')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">بازگشت به خریدها</span>
        </button>
        <div className="flex gap-2">
          {remaining > 0 && (
            <button onClick={() => setShowPayment(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <FiDollarSign className="w-4 h-4" />
              ثبت پرداخت
            </button>
          )}
          <button onClick={() => window.print()}
            className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <FiPrinter className="w-4 h-4" /> چاپ
          </button>
        </div>
      </div>

      {/* Invoice identity */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">شماره فاکتور خرید</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {purchase.invoice_number ?? `#${purchase.purchase_id}`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date(purchase.created_at).toLocaleDateString('fa-AF', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <span className={`self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-bold ${st.bg} ${st.text}`}>
          {st.label}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">اطلاعات تامین‌کننده</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">نام تامین‌کننده</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">{purchase.supplier_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">تاریخ سررسید</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {purchase.due_date ? new Date(purchase.due_date).toLocaleDateString('fa-AF') : '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">اطلاعات پرداخت</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">روش پرداخت</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {PAYMENT[purchase.payment_type] ?? purchase.payment_type}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">وضعیت</p>
              <span className={`inline-block mt-0.5 px-3 py-1 rounded-lg text-sm font-semibold ${st.bg} ${st.text}`}>
                {st.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">اقلام خرید</h2>
        </div>
        {!purchase.items?.length ? (
          <div className="py-16 text-center text-slate-400 text-sm">هیچ قلمی یافت نشد</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <th className="text-right px-6 py-3 font-semibold">#</th>
                <th className="text-right px-6 py-3 font-semibold">نام محصول</th>
                <th className="text-center px-6 py-3 font-semibold">تعداد</th>
                <th className="text-left px-6 py-3 font-semibold">قیمت واحد</th>
                <th className="text-left px-6 py-3 font-semibold">مجموع</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, idx) => (
                <tr key={item.id ?? idx} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-4 text-slate-400 text-sm">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800">{item.product_name}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block w-9 h-9 leading-9 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold text-center">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <span className="text-sm text-slate-700">{afn(item.unit_price)}</span>
                    <span className="text-xs text-slate-400 mr-1">AFN</span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <span className="text-sm font-bold text-slate-900">{afn(item.total_price)}</span>
                    <span className="text-xs text-slate-400 mr-1">AFN</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">مبلغ کل</span>
            <span className="font-medium text-slate-800">{afn(total)} AFN</span>
          </div>
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">پرداخت شده</span>
            <span className="font-semibold text-green-700">{afn(paid)} AFN</span>
          </div>
          {remaining > 0 && (
            <div className="px-5 py-4 bg-red-50 flex justify-between items-center">
              <span className="text-sm font-bold text-red-800">باقی‌مانده</span>
              <span className="text-xl font-extrabold text-red-700">{afn(remaining)} <span className="text-sm font-semibold">AFN</span></span>
            </div>
          )}
          {remaining <= 0 && (
            <div className="px-5 py-4 bg-green-50 flex justify-between items-center">
              <span className="text-sm font-bold text-green-800">تسویه شده</span>
              <span className="text-green-700 font-bold">&#10003;</span>
            </div>
          )}
        </div>
      </div>
      {/* Payment Modal */}
      {showPayment && (
        <PurchasePaymentModal
          purchase={purchase}
          onClose={() => setShowPayment(false)}
          onUpdated={() => { setShowPayment(false); fetchPurchase(); }}
        />
      )}
    </div>
  );
}

/* ─── Payment Modal ─── */
function PurchasePaymentModal({ purchase, onClose, onUpdated }: {
  purchase: { purchase_id: number; total_amount: number; paid_amount: number };
  onClose: () => void; onUpdated: () => void;
}) {
  const [newAmount, setNewAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'account' | 'sarafi'>('account');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [sarafiId, setSarafiId] = useState<number | ''>('');
  const [accounts, setAccounts] = useState<{ account_id: number; name: string; type: string; currency: string }[]>([]);
  const [sarafis, setSarafis] = useState<{ sarafi_id: number; name: string; currency: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const total = Number(purchase.total_amount);
  const paid = Number(purchase.paid_amount);
  const remaining = total - paid;

  useEffect(() => {
    api.get('/accounts').then(r => { setAccounts(r.data); if (r.data.length > 0) setAccountId(r.data[0].account_id); }).catch(() => {});
    api.get('/sarafis').then(r => setSarafis(r.data)).catch(() => {});
  }, []);

  const submit = async () => {
    if (newAmount <= 0) { toast.error('لطفاً مبلغ را وارد کنید'); return; }
    setSubmitting(true);
    try {
      const selectedAccount = accounts.find(a => a.account_id === accountId);
      await api.put(`/purchases/${purchase.purchase_id}/payment`, {
        paid_amount: paid + newAmount,
        payment_type: payMethod === 'sarafi' ? 'sarafi' : (selectedAccount?.type || 'cash'),
        account_id: payMethod === 'account' ? (accountId || null) : null,
        sarafi_id: payMethod === 'sarafi' ? (sarafiId || null) : null,
      });
      toast.success('پرداخت ثبت شد');
      onUpdated();
    } catch { toast.error('خطا در ثبت پرداخت'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden" onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">ثبت پرداخت به تامین‌کننده</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><FiX size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">مبلغ کل</span>
              <span className="font-semibold">{afn(total)} AFN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">پرداخت شده</span>
              <span className="font-semibold text-green-600">{afn(paid)} AFN</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-red-600 font-bold">
              <span>باقی‌مانده</span>
              <span>{afn(remaining)} AFN</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">روش پرداخت</label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-2">
              <button type="button" onClick={() => setPayMethod('account')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${payMethod === 'account' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>
                حساب مستقیم
              </button>
              <button type="button" onClick={() => setPayMethod('sarafi')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${payMethod === 'sarafi' ? 'bg-white shadow text-amber-700' : 'text-slate-500'}`}>
                از طریق صرافی
              </button>
            </div>
            {payMethod === 'account' ? (
              <select value={accountId} onChange={e => setAccountId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name} ({a.currency})</option>)}
              </select>
            ) : (
              <select value={sarafiId} onChange={e => setSarafiId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50">
                <option value="">انتخاب صرافی...</option>
                {sarafis.map(s => <option key={s.sarafi_id} value={s.sarafi_id}>{s.name} ({s.currency})</option>)}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">مبلغ پرداخت</label>
            <input type="number" min={0} max={remaining} value={newAmount || ''}
              onChange={e => { const v = Number(e.target.value) || 0; setNewAmount(Math.min(v, remaining)); }}
              placeholder="0" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 outline-none" />
            {remaining > 0 && (
              <p className="text-xs text-slate-400 mt-1">حداکثر: {afn(remaining)} AFN</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium">انصراف</button>
            <button onClick={submit} disabled={submitting}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium">
              {submitting ? 'در حال ثبت...' : 'ثبت پرداخت'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
