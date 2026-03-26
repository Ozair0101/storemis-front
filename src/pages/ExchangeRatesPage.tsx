import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';

interface Rate { rate_id: number; currency: string; rate_to_afn: number; updated_at: string; }

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [newCurrency, setNewCurrency] = useState('');
  const [newRate, setNewRate] = useState('');
  const [adding, setAdding] = useState(false);

  const fetch = () => {
    api.get('/exchange-rates')
      .then(r => { setRates(r.data); const m: Record<string, string> = {}; r.data.forEach((rt: Rate) => { m[rt.currency] = String(rt.rate_to_afn); }); setEditing(m); })
      .catch(() => toast.error('خطا در بارگذاری'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const saveRate = async (currency: string) => {
    const val = Number(editing[currency]);
    if (!val || val <= 0) { toast.error('نرخ باید بزرگتر از صفر باشد'); return; }
    setSaving(currency);
    try {
      await api.put(`/exchange-rates/${currency}`, { rate_to_afn: val });
      toast.success(`نرخ ${currency} ذخیره شد`);
      fetch();
    } catch { toast.error('خطا در ذخیره'); }
    finally { setSaving(null); }
  };

  const addRate = async () => {
    if (!newCurrency.trim() || !newRate || Number(newRate) <= 0) { toast.error('ارز و نرخ را وارد کنید'); return; }
    setAdding(true);
    try {
      await api.put(`/exchange-rates/${newCurrency.toUpperCase()}`, { rate_to_afn: Number(newRate) });
      toast.success('ارز جدید اضافه شد');
      setNewCurrency(''); setNewRate('');
      fetch();
    } catch { toast.error('خطا در ذخیره'); }
    finally { setAdding(false); }
  };

  const deleteRate = async (currency: string) => {
    try {
      await api.delete(`/exchange-rates/${currency}`);
      toast.success('حذف شد');
      fetch();
    } catch { toast.error('خطا در حذف'); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div dir="rtl" className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">نرخ ارزها</h1>
        <p className="text-sm text-slate-500 mt-1">نرخ تبدیل هر ارز به افغانی (AFN) — برای محاسبه صحیح گزارشات</p>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">نحوه کار:</p>
        <p>هر مبلغ که به ارز خارجی ثبت شود، در گزارشات به افغانی تبدیل می‌شود. مثلاً اگر نرخ دالر ۷۱ باشد، فروش ۱۰۰ دالری = ۷,۱۰۰ افغانی در گزارش نمایش داده می‌شود.</p>
      </div>

      {/* Rates cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rates.map(r => (
          <div key={r.currency} className={`bg-white rounded-xl border border-slate-200 p-5 ${r.currency === 'AFN' ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700">
                  {r.currency}
                </span>
                <div>
                  <p className="font-bold text-slate-800">{r.currency}</p>
                  <p className="text-[10px] text-slate-400">
                    آخرین بروزرسانی: {new Date(r.updated_at).toLocaleDateString('fa-AF')}
                  </p>
                </div>
              </div>
              {r.currency !== 'AFN' && (
                <button onClick={() => deleteRate(r.currency)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {r.currency === 'AFN' ? (
              <div className="bg-slate-50 rounded-lg px-4 py-3 text-center">
                <p className="text-xs text-slate-500">ارز پایه</p>
                <p className="text-lg font-bold text-slate-800">۱ AFN = ۱ AFN</p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs text-slate-500">۱ {r.currency} = چند AFN؟</label>
                <div className="flex gap-2">
                  <input type="number" min={0} step="0.01" value={editing[r.currency] ?? ''}
                    onChange={e => setEditing(p => ({ ...p, [r.currency]: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" dir="ltr" />
                  <button onClick={() => saveRate(r.currency)} disabled={saving === r.currency}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm">
                    <FiSave className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  مثال: ۱۰۰ {r.currency} = {Number(editing[r.currency] || 0) > 0 ? (100 * Number(editing[r.currency])).toLocaleString('fa-AF') : '—'} AFN
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Add new currency */}
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-5 flex flex-col justify-center">
          <p className="text-sm font-semibold text-slate-600 mb-3">افزودن ارز جدید</p>
          <div className="space-y-2">
            <input value={newCurrency} onChange={e => setNewCurrency(e.target.value.toUpperCase())}
              placeholder="کد ارز (مثلاً EUR)" maxLength={5}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
            <input type="number" min={0} step="0.01" value={newRate} onChange={e => setNewRate(e.target.value)}
              placeholder="نرخ به AFN"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
            <button onClick={addRate} disabled={adding}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
              <FiPlus className="w-4 h-4" /> {adding ? 'در حال ذخیره...' : 'افزودن'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
