import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

export default function CategoryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/categories/${id}`)
      .then(res => { setName(res.data.name); setDescription(res.data.description || ''); })
      .catch(() => { toast.error('خطا در دریافت اطلاعات دسته‌بندی'); navigate('/categories'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('نام دسته‌بندی الزامی است'); return; }
    setSubmitting(true);
    try {
      if (isEdit) { await api.put(`/categories/${id}`, { name, description }); toast.success('دسته‌بندی ویرایش شد'); }
      else         { await api.post('/categories', { name, description });      toast.success('دسته‌بندی افزوده شد'); }
      navigate('/categories');
    } catch { toast.error('خطا در ذخیره دسته‌بندی'); }
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
        <button onClick={() => navigate('/categories')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'اطلاعات دسته‌بندی را ویرایش کنید' : 'دسته‌بندی جدید اضافه کنید'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div>
            <label className={labelCls}>نام دسته‌بندی <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className={inputCls} placeholder="نام دسته‌بندی" required />
          </div>
          <div>
            <label className={labelCls}>توضیحات</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={4} className={inputCls + ' resize-none'} placeholder="توضیحات (اختیاری)" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <FiSave className="w-4 h-4" />
            {submitting ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'افزودن دسته‌بندی'}
          </button>
          <button type="button" onClick={() => navigate('/categories')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
