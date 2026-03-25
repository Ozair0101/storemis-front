import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

interface SupplierForm {
  name: string; contact_person: string; phone: string;
  email: string; address: string; payment_terms: string;
}

const emptyForm: SupplierForm = {
  name: '', contact_person: '', phone: '', email: '', address: '', payment_terms: 'cash',
};

const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

export default function SupplierFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof SupplierForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/suppliers/${id}`)
      .then(res => {
        const s = res.data;
        setForm({ name: s.name, contact_person: s.contact_person || '', phone: s.phone || '',
          email: s.email || '', address: s.address || '', payment_terms: s.payment_terms || 'cash' });
      })
      .catch(() => { toast.error('خطا در دریافت اطلاعات تامین‌کننده'); navigate('/suppliers'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('نام تامین‌کننده الزامی است'); return; }
    setSubmitting(true);
    try {
      if (isEdit) { await api.put(`/suppliers/${id}`, form); toast.success('تامین‌کننده ویرایش شد'); }
      else         { await api.post('/suppliers', form);      toast.success('تامین‌کننده افزوده شد'); }
      navigate('/suppliers');
    } catch { toast.error('خطا در ذخیره تامین‌کننده'); }
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
        <button onClick={() => navigate('/suppliers')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'ویرایش تامین‌کننده' : 'افزودن تامین‌کننده'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'اطلاعات تامین‌کننده را ویرایش کنید' : 'تامین‌کننده جدید اضافه کنید'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">اطلاعات اصلی</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>نام تامین‌کننده <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                className={inputCls} placeholder="نام تامین‌کننده" required />
            </div>
            <div>
              <label className={labelCls}>شخص رابط</label>
              <input type="text" value={form.contact_person} onChange={e => set('contact_person', e.target.value)}
                className={inputCls} placeholder="نام شخص رابط" />
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
                rows={3} className={inputCls + ' resize-none'} placeholder="آدرس تامین‌کننده" />
            </div>
            <div>
              <label className={labelCls}>شرایط پرداخت</label>
              <select value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} className={inputCls}>
                <option value="cash">نقدی</option>
                <option value="credit">اعتباری</option>
                <option value="installments">اقساطی</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <FiSave className="w-4 h-4" />
            {submitting ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'افزودن تامین‌کننده'}
          </button>
          <button type="button" onClick={() => navigate('/suppliers')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
