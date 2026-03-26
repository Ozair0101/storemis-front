import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

interface ExpenseForm {
  description: string; amount: string; category: string;
  payment_type: string; account_id: string; sarafi_id: string; date: string;
}

interface Account { account_id: number; name: string; type: string; currency: string; }
interface Sarafi { sarafi_id: number; name: string; currency: string; }

const emptyForm: ExpenseForm = {
  description: '', amount: '', category: 'misc', payment_type: 'cash',
  account_id: '', sarafi_id: '', date: new Date().toISOString().split('T')[0],
};

const categoryOptions = [
  { value: 'rent', label: 'کرایه' }, { value: 'utilities', label: 'برق و آب' },
  { value: 'salaries', label: 'معاشات' }, { value: 'transport', label: 'ترانسپورت' },
  { value: 'misc', label: 'متفرقه' },
];

const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

export default function ExpenseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sarafis, setSarafis] = useState<Sarafi[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'sarafi'>('account');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof ExpenseForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/accounts').then(r => {
      setAccounts(r.data);
      if (!isEdit && r.data.length > 0) {
        setForm(f => ({ ...f, account_id: String(r.data[0].account_id) }));
      }
    }).catch(() => {});
    api.get('/sarafis').then(r => setSarafis(r.data)).catch(() => {});

    if (!isEdit) return;
    api.get(`/expenses/${id}`)
      .then(res => {
        const e = res.data;
        setForm({
          description: e.description || '', amount: e.amount?.toString() || '',
          category: e.category || 'misc', payment_type: e.payment_type || 'cash',
          account_id: '', date: e.date ? e.date.split('T')[0] : '',
        });
      })
      .catch(() => { toast.error('خطا در دریافت اطلاعات مصرف'); navigate('/expenses'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error('توضیحات الزامی است'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('مبلغ باید بزرگتر از صفر باشد'); return; }
    const selectedAccount = accounts.find(a => a.account_id === Number(form.account_id));
    const body = {
      ...form,
      amount: Number(form.amount),
      account_id: paymentMethod === 'account' ? (form.account_id ? Number(form.account_id) : null) : null,
      sarafi_id: paymentMethod === 'sarafi' ? (form.sarafi_id ? Number(form.sarafi_id) : null) : null,
      payment_type: paymentMethod === 'sarafi' ? 'sarafi' : (selectedAccount?.type || form.payment_type),
    };
    setSubmitting(true);
    try {
      if (isEdit) { await api.put(`/expenses/${id}`, body); toast.success('مصرف ویرایش شد'); }
      else         { await api.post('/expenses', body);      toast.success('مصرف افزوده شد'); }
      navigate('/expenses');
    } catch { toast.error('خطا در ذخیره مصرف'); }
    finally  { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div dir="rtl" className="mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/expenses')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'ویرایش مصرف' : 'افزودن مصرف'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'اطلاعات مصرف را ویرایش کنید' : 'مصرف جدید ثبت کنید'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-700 pb-2 border-b border-slate-100">جزئیات مصرف</h2>
          <div>
            <label className={labelCls}>توضیحات <span className="text-red-500">*</span></label>
            <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
              className={inputCls} placeholder="توضیحات مصرف" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>مبلغ (AFN) <span className="text-red-500">*</span></label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                min="0" step="any" className={inputCls} dir="ltr" placeholder="0" required />
            </div>
            <div>
              <label className={labelCls}>تاریخ</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className={inputCls} dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>دسته‌بندی</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>روش پرداخت</label>
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
                <select value={form.account_id} onChange={e => set('account_id', e.target.value)} className={inputCls}>
                  <option value="">انتخاب حساب...</option>
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>{a.name} ({a.currency})</option>
                  ))}
                </select>
              ) : (
                <select value={form.sarafi_id} onChange={e => set('sarafi_id', e.target.value)}
                  className="w-full px-3 py-2.5 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50">
                  <option value="">انتخاب صرافی...</option>
                  {sarafis.map(s => (
                    <option key={s.sarafi_id} value={s.sarafi_id}>{s.name} ({s.currency})</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <FiSave className="w-4 h-4" />
            {submitting ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'ثبت مصرف'}
          </button>
          <button type="button" onClick={() => navigate('/expenses')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
