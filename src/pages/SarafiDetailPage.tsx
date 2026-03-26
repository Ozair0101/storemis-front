import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiPhone, FiMapPin, FiEdit2 } from 'react-icons/fi';

/* ─── Types ─── */
interface Sarafi {
  sarafi_id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  balance: number;
  currency: string;
}

interface SarafiTx {
  sarafi_tx_id: number;
  type: string;
  amount: number;
  currency: string;
  account_name: string | null;
  reference: string | null;
  description: string | null;
  date: string;
  user_name: string | null;
}

interface Account {
  account_id: number;
  name: string;
  type: string;
  currency: string;
}

/* ─── Helpers ─── */
const afn = (n: number | string | null | undefined, cur = 'AFN') =>
  Number(n ?? 0).toLocaleString('fa-AF') + ` ${cur}`;

const txTypeConfig: Record<string, { label: string; bg: string; text: string; sign: '+' | '-' }> = {
  deposit:          { label: 'واریز به صرافی',       bg: 'bg-blue-100',   text: 'text-blue-700',   sign: '+' },
  withdrawal:       { label: 'دریافت از صرافی',      bg: 'bg-green-100',  text: 'text-green-700',  sign: '-' },
  supplier_payment: { label: 'پرداخت تامین‌کننده',    bg: 'bg-orange-100', text: 'text-orange-700', sign: '-' },
  customer_receipt: { label: 'دریافت مشتری',         bg: 'bg-purple-100', text: 'text-purple-700', sign: '+' },
  exchange:         { label: 'تبادل ارز',             bg: 'bg-slate-100',  text: 'text-slate-700',  sign: '-' },
};

/* ─── Component ─── */
export default function SarafiDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sarafi, setSarafi] = useState<Sarafi | null>(null);
  const [txs, setTxs] = useState<SarafiTx[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emptyTx = { type: 'deposit', amount: '', account_id: '', description: '', reference: '' };
  const [form, setForm] = useState(emptyTx);

  const fetchAll = async () => {
    try {
      const [sRes, tRes, aRes] = await Promise.all([
        api.get(`/sarafis/${id}`),
        api.get(`/sarafis/${id}/transactions`),
        api.get('/accounts'),
      ]);
      setSarafi(sRes.data);
      setTxs(tRes.data);
      setAccounts(aRes.data);
    } catch { toast.error('خطا در بارگذاری'); navigate('/sarafis'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) fetchAll(); }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { toast.error('مبلغ نامعتبر'); return; }
    if ((form.type === 'deposit' || form.type === 'withdrawal') && !form.account_id) {
      toast.error('لطفاً حساب را انتخاب کنید'); return;
    }
    setSubmitting(true);
    try {
      await api.post(`/sarafis/${id}/transactions`, {
        type: form.type,
        amount: Number(form.amount),
        account_id: form.account_id ? Number(form.account_id) : null,
        description: form.description || null,
        reference: form.reference || null,
      });
      toast.success('معامله ثبت شد');
      setForm(emptyTx);
      setShowForm(false);
      fetchAll();
    } catch { toast.error('خطا در ثبت معامله'); }
    finally { setSubmitting(false); }
  };

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!sarafi) return null;

  const bal = Number(sarafi.balance);
  const isPositive = bal >= 0;

  return (
    <div dir="rtl" className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sarafis')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{sarafi.name}</h1>
            <p className="text-sm text-slate-500">دفتر معاملات صرافی</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/sarafis/${sarafi.sarafi_id}/edit`)}
            className="flex items-center gap-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium">
            <FiEdit2 className="w-4 h-4" /> ویرایش
          </button>
          <button onClick={() => { setForm(emptyTx); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <FiPlus className="w-4 h-4" /> ثبت معامله
          </button>
        </div>
      </div>

      {/* ── Sarafi Info + Balance ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">مشخصات صرافی</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">شخص تماس</p>
              <p className="font-medium text-slate-800 mt-0.5">{sarafi.contact_person || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">شماره تماس</p>
              <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                {sarafi.phone ? <><FiPhone className="w-3 h-3 text-slate-400" />{sarafi.phone}</> : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">آدرس</p>
              <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                {sarafi.address ? <><FiMapPin className="w-3 h-3 text-slate-400" />{sarafi.address}</> : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">واحد پول</p>
              <p className="font-medium text-slate-800 mt-0.5">{sarafi.currency}</p>
            </div>
          </div>
          {sarafi.notes && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">یادداشت</p>
              <p className="text-sm text-slate-600 mt-0.5">{sarafi.notes}</p>
            </div>
          )}
        </div>

        {/* Balance card */}
        <div className={`rounded-2xl border p-5 flex flex-col justify-center items-center text-center ${
          isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-xs text-slate-500 mb-2">
            {isPositive ? 'طلب ما از صرافی' : 'بدهی ما به صرافی'}
          </p>
          <p className={`text-3xl font-extrabold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {afn(Math.abs(bal), sarafi.currency)}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {txs.length > 0 ? `${txs.length} معامله ثبت شده` : 'بدون معامله'}
          </p>
        </div>
      </div>

      {/* ── New Transaction Form ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
            <h3 className="font-bold text-blue-800 text-sm">ثبت معامله جدید</h3>
            <button onClick={() => setShowForm(false)} className="text-blue-400 hover:text-blue-600 text-lg leading-none">&times;</button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">نوع معامله *</label>
                <select value={form.type} onChange={e => set('type', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="deposit">واریز به صرافی (ما پول می‌دهیم)</option>
                  <option value="withdrawal">دریافت از صرافی (ما پول می‌گیریم)</option>
                  <option value="supplier_payment">صرافی به تامین‌کننده پرداخت کرد</option>
                  <option value="customer_receipt">مشتری از طریق صرافی پرداخت کرد</option>
                  <option value="exchange">تبادل ارز</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">مبلغ *</label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0" dir="ltr" />
              </div>

              {/* Account (only for deposit/withdrawal) */}
              {(form.type === 'deposit' || form.type === 'withdrawal') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">حساب *</label>
                  <select value={form.account_id} onChange={e => set('account_id', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">انتخاب حساب...</option>
                    {accounts.map(a => (
                      <option key={a.account_id} value={a.account_id}>{a.name} ({a.currency})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">مرجع</label>
                <input value={form.reference} onChange={e => set('reference', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="مثلاً: خرید #۵" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">توضیحات</label>
              <input value={form.description} onChange={e => set('description', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="جزئیات معامله..." />
            </div>

            {/* Hint about what will happen */}
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
              {form.type === 'deposit' && '💡 این مبلغ از حساب شما کم شده و به موجودی صرافی اضافه می‌شود (صرافی به شما بدهکار می‌شود)'}
              {form.type === 'withdrawal' && '💡 این مبلغ به حساب شما اضافه شده و از موجودی صرافی کم می‌شود'}
              {form.type === 'supplier_payment' && '💡 صرافی از طرف شما به تامین‌کننده پرداخت کرده. موجودی صرافی کاهش می‌یابد (شما به صرافی بدهکار می‌شوید)'}
              {form.type === 'customer_receipt' && '💡 مشتری از طریق صرافی پول داده. موجودی صرافی افزایش می‌یابد (صرافی به شما بدهکار می‌شود)'}
              {form.type === 'exchange' && '💡 تبادل ارز. موجودی صرافی بر اساس نوع تراکنش تنظیم می‌شود'}
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm text-slate-600 hover:text-slate-800 px-4 py-2">انصراف</button>
              <button type="submit" disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
                {submitting ? 'در حال ثبت...' : 'ثبت معامله'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Transactions Ledger ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">دفتر معاملات</h2>
        </div>

        {txs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">هیچ معامله‌ای ثبت نشده است</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="text-right px-5 py-3 font-semibold">تاریخ</th>
                  <th className="text-right px-5 py-3 font-semibold">نوع</th>
                  <th className="text-left px-5 py-3 font-semibold">مبلغ</th>
                  <th className="text-right px-5 py-3 font-semibold">حساب</th>
                  <th className="text-right px-5 py-3 font-semibold">مرجع</th>
                  <th className="text-right px-5 py-3 font-semibold">توضیحات</th>
                  <th className="text-right px-5 py-3 font-semibold">کاربر</th>
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => {
                  const cfg = txTypeConfig[tx.type] ?? { label: tx.type, bg: 'bg-slate-100', text: 'text-slate-600', sign: '+' };
                  return (
                    <tr key={tx.sarafi_tx_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('fa-AF')}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-left font-bold whitespace-nowrap">
                        <span className={cfg.sign === '+' ? 'text-green-700' : 'text-red-700'}>
                          {cfg.sign}{afn(tx.amount, tx.currency)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{tx.account_name || '—'}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{tx.reference || '—'}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{tx.description || '—'}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{tx.user_name || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
