import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

interface CustomerForm {
  name: string; phone: string; email: string; address: string; is_regular: boolean;
}

const emptyForm: CustomerForm = { name: '', phone: '', email: '', address: '', is_regular: false };

const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof CustomerForm>(k: K, v: CustomerForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/customers/${id}`)
      .then(res => {
        const c = res.data;
        setForm({ name: c.name, phone: c.phone || '', email: c.email || '',
          address: c.address || '', is_regular: c.is_regular || false });
      })
      .catch(() => { toast.error('خطا در دریافت اطلاعات مشتری'); navigate('/customers'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('نام مشتری الزامی است'); return; }
    setSubmitting(true);
    try {
      if (isEdit) { await api.put(`/customers/${id}`, form); toast.success('مشتری ویرایش شد'); }
      else         { await api.post('/customers', form);      toast.success('مشتری افزوده شد'); }
      navigate('/customers');
    } catch { toast.error('خطا در ذخیره مشتری'); }
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
        <button onClick={() => navigate('/customers')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'ویرایش مشتری' : 'افزودن مشتری'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'اطلاعات مشتری را ویرایش کنید' : 'مشتری جدید اضافه کنید'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-700 pb-2 border-b border-slate-100">اطلاعات مشتری</h2>
          <div>
            <label className={labelCls}>نام مشتری <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              className={inputCls} placeholder="نام مشتری" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>تلفن</label>
              <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)}
                className={inputCls} dir="ltr" placeholder="0700000000" />
            </div>
            <div>
              <label className={labelCls}>ایمیل</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className={inputCls} dir="ltr" placeholder="example@email.com" />
            </div>
          </div>
          <div>
            <label className={labelCls}>آدرس</label>
            <textarea value={form.address} onChange={e => set('address', e.target.value)}
              rows={3} className={inputCls + ' resize-none'} placeholder="آدرس مشتری" />
          </div>

          {/* Is Regular Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-sm font-medium text-slate-700">مشتری دایمی</p>
              <p className="text-xs text-slate-500 mt-0.5">مشتریان دایمی از تخفیف‌های ویژه بهره‌مند می‌شوند</p>
            </div>
            <button type="button" onClick={() => set('is_regular', !form.is_regular)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.is_regular ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.is_regular ? 'translate-x-1' : 'translate-x-6'}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <FiSave className="w-4 h-4" />
            {submitting ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'افزودن مشتری'}
          </button>
          <button type="button" onClick={() => navigate('/customers')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
