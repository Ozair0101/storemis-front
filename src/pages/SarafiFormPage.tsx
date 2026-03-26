import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

const emptyForm = { name: '', contact_person: '', phone: '', address: '', notes: '', currency: 'AFN' };

export default function SarafiFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/sarafis/${id}`)
      .then(res => {
        const s = res.data;
        setForm({
          name: s.name || '',
          contact_person: s.contact_person || '',
          phone: s.phone || '',
          address: s.address || '',
          notes: s.notes || '',
          currency: s.currency || 'AFN',
        });
      })
      .catch(() => { toast.error('صرافی یافت نشد'); navigate('/sarafis'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('نام صرافی الزامی است'); return; }
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/sarafis/${id}`, form);
        toast.success('صرافی ویرایش شد');
      } else {
        await api.post('/sarafis', form);
        toast.success('صرافی ثبت شد');
      }
      navigate('/sarafis');
    } catch { toast.error('خطا در ذخیره صرافی'); }
    finally { setSubmitting(false); }
  };

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div dir="rtl" className="pmx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/sarafis')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'ویرایش صرافی' : 'ثبت صرافی جدید'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">مشخصات صرافی را وارد کنید</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">نام صرافی *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="مثلاً: صرافی احمد" />
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">شخص تماس</label>
              <input value={form.contact_person} onChange={e => set('contact_person', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="نام شخص" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">شماره تماس</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="0700-000-000" dir="ltr" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">آدرس</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="آدرس صرافی" />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">واحد پول</label>
            <select value={form.currency} onChange={e => set('currency', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="AFN">افغانی (AFN)</option>
              <option value="USD">دالر (USD)</option>
              <option value="IRR">تومان (IRR)</option>
              <option value="PKR">کلدار (PKR)</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">یادداشت</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="توضیحات اضافی..." />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button type="button" onClick={() => navigate('/sarafis')}
            className="text-sm text-slate-600 hover:text-slate-800">
            انصراف
          </button>
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <FiSave className="w-4 h-4" />
            {submitting ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'ثبت صرافی'}
          </button>
        </div>
      </form>
    </div>
  );
}
