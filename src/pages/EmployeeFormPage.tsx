import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

interface EmployeeForm {
  full_name: string; role: string; salary: string;
  payment_frequency: string; contact: string; joined_at: string;
}

const emptyForm: EmployeeForm = {
  full_name: '', role: '', salary: '', payment_frequency: 'monthly', contact: '',
  joined_at: new Date().toISOString().split('T')[0],
};

const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof EmployeeForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/employees/${id}`)
      .then(res => {
        const e = res.data;
        setForm({
          full_name: e.full_name, role: e.role || '', salary: e.salary?.toString() || '',
          payment_frequency: e.payment_frequency || 'monthly', contact: e.contact || '',
          joined_at: e.joined_at ? e.joined_at.split('T')[0] : '',
        });
      })
      .catch(() => { toast.error('خطا در دریافت اطلاعات کارمند'); navigate('/employees'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('نام کارمند الزامی است'); return; }
    const body = { ...form, salary: form.salary ? Number(form.salary) : 0 };
    setSubmitting(true);
    try {
      if (isEdit) { await api.put(`/employees/${id}`, body); toast.success('کارمند ویرایش شد'); }
      else         { await api.post('/employees', body);      toast.success('کارمند افزوده شد'); }
      navigate('/employees');
    } catch { toast.error('خطا در ذخیره کارمند'); }
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
        <button onClick={() => navigate('/employees')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'ویرایش کارمند' : 'افزودن کارمند'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'اطلاعات کارمند را ویرایش کنید' : 'کارمند جدید اضافه کنید'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-700 pb-2 border-b border-slate-100">اطلاعات شخصی</h2>
          <div>
            <label className={labelCls}>نام کامل <span className="text-red-500">*</span></label>
            <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className={inputCls} placeholder="نام کامل کارمند" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>نقش / پست</label>
              <input type="text" value={form.role} onChange={e => set('role', e.target.value)}
                className={inputCls} placeholder="مثال: صندوقدار، انباردار" />
            </div>
            <div>
              <label className={labelCls}>تماس</label>
              <input type="text" value={form.contact} onChange={e => set('contact', e.target.value)}
                className={inputCls} dir="ltr" placeholder="0700000000" />
            </div>
          </div>
          <div>
            <label className={labelCls}>تاریخ استخدام</label>
            <input type="date" value={form.joined_at} onChange={e => set('joined_at', e.target.value)}
              className={inputCls} dir="ltr" />
          </div>
        </div>

        {/* Salary Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-700 pb-2 border-b border-slate-100">اطلاعات معاش</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>معاش (AFN)</label>
              <input type="number" value={form.salary} onChange={e => set('salary', e.target.value)}
                min="0" className={inputCls} dir="ltr" placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>دوره پرداخت</label>
              <select value={form.payment_frequency} onChange={e => set('payment_frequency', e.target.value)} className={inputCls}>
                <option value="monthly">ماهانه</option>
                <option value="weekly">هفتگی</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <FiSave className="w-4 h-4" />
            {submitting ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'افزودن کارمند'}
          </button>
          <button type="button" onClick={() => navigate('/employees')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
