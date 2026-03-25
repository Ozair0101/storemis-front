import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

interface AccountForm {
  name: string; type: string; currency: string; balance: string;
}

const emptyForm: AccountForm = { name: '', type: 'cash', currency: 'AFN', balance: '0' };

const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

const typeIcons: Record<string, string> = {
  cash: '💵', bank: '🏦', 'mobile wallet': '📱',
};

export default function AccountFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof AccountForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/accounts/${id}`)
      .then(res => {
        const a = res.data;
        setForm({ name: a.name, type: a.type || 'cash', currency: a.currency || 'AFN', balance: a.balance?.toString() || '0' });
      })
      .catch(() => { toast.error('خطا در دریافت اطلاعات حساب'); navigate('/accounts'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('نام حساب الزامی است'); return; }
    const body = { ...form, balance: Number(form.balance) };
    setSubmitting(true);
    try {
      if (isEdit) { await api.put(`/accounts/${id}`, body); toast.success('حساب ویرایش شد'); }
      else         { await api.post('/accounts', body);      toast.success('حساب افزوده شد'); }
      navigate('/accounts');
    } catch { toast.error('خطا در ذخیره حساب'); }
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
        <button onClick={() => navigate('/accounts')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'ویرایش حساب' : 'افزودن حساب'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'اطلاعات حساب را ویرایش کنید' : 'حساب مالی جدید اضافه کنید'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-700 pb-2 border-b border-slate-100">اطلاعات حساب</h2>
          <div>
            <label className={labelCls}>نام حساب <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              className={inputCls} placeholder="مثال: صندوق نقد، بانک کابل" required />
          </div>

          {/* Account Type - Card Select */}
          <div>
            <label className={labelCls}>نوع حساب</label>
            <div className="grid grid-cols-3 gap-3 mt-1">
              {[['cash', 'نقدی'], ['bank', 'بانکی'], ['mobile wallet', 'موبایل']].map(([val, label]) => (
                <button key={val} type="button" onClick={() => set('type', val)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    form.type === val
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}>
                  <span className="text-xl">{typeIcons[val]}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>ارز</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)} className={inputCls}>
                <option value="AFN">AFN — افغانی</option>
                <option value="USD">USD — دالر</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{isEdit ? 'موجودی فعلی' : 'موجودی اولیه'}</label>
              <input type="number" value={form.balance} onChange={e => set('balance', e.target.value)}
                min="0" step="any" className={inputCls} dir="ltr" placeholder="0" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <FiSave className="w-4 h-4" />
            {submitting ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'افزودن حساب'}
          </button>
          <button type="button" onClick={() => navigate('/accounts')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
