import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPrinter, FiDollarSign, FiX } from 'react-icons/fi';

interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SaleDetail {
  sale_id: number;
  invoice_number: string | null;
  customer_name: string | null;
  user_name: string | null;
  total_amount: number;
  discount_amount: number;
  paid_amount: number;
  payment_type: string;
  status: string;
  date: string;
  items: SaleItem[];
}

const afn = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString('fa-AF', { minimumFractionDigits: 0 });

const PAYMENT: Record<string, string> = {
  cash: 'نقد', bank: 'بانکی', mobile: 'پرداخت موبایل', card: 'کارت',
};

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  completed: { label: 'تکمیل شده', bg: 'bg-green-100', text: 'text-green-700' },
  partial:   { label: 'ناقص',       bg: 'bg-amber-100',  text: 'text-amber-700'  },
  pending:   { label: 'در انتظار',  bg: 'bg-red-100',    text: 'text-red-700'    },
};

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  const fetchSale = () => {
    if (!id) return;
    api.get(`/sales/${id}`)
      .then(r => setSale(r.data))
      .catch(() => { toast.error('خطا در دریافت اطلاعات فروش'); navigate('/sales'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSale(); }, [id, navigate]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!sale) return null;

  const st = STATUS[sale.status] ?? { label: sale.status, bg: 'bg-slate-100', text: 'text-slate-600' };
  const subtotal = Number(sale.total_amount);
  const discount = Number(sale.discount_amount);
  const net      = subtotal - discount;
  const paid     = Number(sale.paid_amount);
  const balance  = paid - net;

  return (
    <div dir="rtl" className="mx-auto space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate('/sales')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">بازگشت به فروش‌ها</span>
        </button>
        <div className="flex gap-2">
          {sale.status !== 'completed' && balance < 0 && (
            <button onClick={() => setShowPayment(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <FiDollarSign className="w-4 h-4" />
              ثبت پرداخت بقیه
            </button>
          )}
          <button onClick={() => window.print()}
            className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <FiPrinter className="w-4 h-4" />
            چاپ
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 1 — Invoice identity
         ═══════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">شماره فاکتور</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {sale.invoice_number ?? `#${sale.sale_id}`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date(sale.date).toLocaleDateString('fa-AF', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <span className={`self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-bold ${st.bg} ${st.text}`}>
          {st.label}
        </span>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 2 — Customer & Sale info
         ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Customer card */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">اطلاعات مشتری</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">نام مشتری</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {sale.customer_name || <span className="text-slate-400 font-normal">مشتری حضوری</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">فروشنده</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">{sale.user_name || '—'}</p>
            </div>
          </div>
        </div>

        {/* Payment card */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">اطلاعات پرداخت</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">روش پرداخت</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {PAYMENT[sale.payment_type] ?? sale.payment_type}
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

      {/* ═══════════════════════════════════════
          SECTION 3 — Items table
         ═══════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">اقلام فروش</h2>
        </div>

        {!sale.items?.length ? (
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
              {sale.items.map((item, idx) => (
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

      {/* ═══════════════════════════════════════
          SECTION 4 — Totals
         ═══════════════════════════════════════ */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 bg-white rounded-2xl border border-slate-200 overflow-hidden">

          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">جمع فرعی</span>
            <span className="font-medium text-slate-800">{afn(subtotal)} AFN</span>
          </div>

          {discount > 0 && (
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
              <span className="text-slate-500">تخفیف</span>
              <span className="font-medium text-orange-600">− {afn(discount)} AFN</span>
            </div>
          )}

          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm bg-slate-50">
            <span className="font-semibold text-slate-700">مبلغ خالص</span>
            <span className="font-bold text-slate-900 text-base">{afn(net)} AFN</span>
          </div>

          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">پرداخت شده</span>
            <span className="font-semibold text-green-700">{afn(paid)} AFN</span>
          </div>

          {/* Balance row — most important, largest */}
          <div className={`px-5 py-4 flex justify-between items-center ${balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className={`text-sm font-bold ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {balance >= 0 ? 'پس‌داد (تحویلی)' : 'بدهی باقی‌مانده'}
            </span>
            <span className={`text-xl font-extrabold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {afn(Math.abs(balance))} <span className="text-sm font-semibold">AFN</span>
            </span>
          </div>

        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && <PaymentModal sale={sale} onClose={() => setShowPayment(false)} onUpdated={() => { setShowPayment(false); fetchSale(); }} />}
    </div>
  );
}

/* ─── Payment Modal ─── */
function PaymentModal({ sale, onClose, onUpdated }: {
  sale: { sale_id: number; total_amount: number; discount_amount: number; paid_amount: number };
  onClose: () => void; onUpdated: () => void;
}) {
  const [newAmount, setNewAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'account' | 'sarafi'>('account');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [sarafiId, setSarafiId] = useState<number | ''>('');
  const [accounts, setAccounts] = useState<{ account_id: number; name: string; currency: string }[]>([]);
  const [sarafis, setSarafis] = useState<{ sarafi_id: number; name: string; currency: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const net = Number(sale.total_amount) - Number(sale.discount_amount);
  const remaining = net - Number(sale.paid_amount);
  const f = (n: number) => Number(n ?? 0).toLocaleString('fa-AF');

  useEffect(() => {
    api.get('/accounts').then(r => { setAccounts(r.data); if (r.data.length > 0) setAccountId(r.data[0].account_id); }).catch(() => {});
    api.get('/sarafis').then(r => setSarafis(r.data)).catch(() => {});
  }, []);

  const submit = async () => {
    if (newAmount <= 0) { toast.error('لطفاً مبلغ را وارد کنید'); return; }
    setSubmitting(true);
    try {
      await api.put(`/sales/${sale.sale_id}/payment`, {
        paid_amount: Number(sale.paid_amount) + newAmount,
        payment_type: payMethod === 'sarafi' ? 'sarafi' : 'cash',
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
          <h2 className="text-lg font-bold text-slate-800">ثبت پرداخت بقیه</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><FiX size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">مبلغ خالص</span><span className="font-semibold">{f(net)} AFN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">پرداخت شده</span><span className="font-semibold text-green-600">{f(Number(sale.paid_amount))} AFN</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-red-600 font-bold">
              <span>باقی‌مانده</span><span>{f(remaining)} AFN</span>
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">مبلغ پرداخت</label>
            <input type="number" min={0} max={remaining} value={newAmount || ''} onChange={e => setNewAmount(Number(e.target.value) || 0)}
              placeholder="0" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

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
