import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

interface UserForm {
  username: string; full_name: string; password: string; role_id: string;
}

const emptyForm: UserForm = { username: '', full_name: '', password: '', role_id: '3' };

const roles = [
  { id: 1, name: 'مدیر', desc: 'دسترسی کامل به تمام بخش‌ها' },
  { id: 2, name: 'مدیر فروشگاه', desc: 'مدیریت محصولات، فروش و گزارشات' },
  { id: 3, name: 'صندوقدار', desc: 'ثبت فروش و مشاهده محصولات' },
  { id: 4, name: 'انباردار', desc: 'مدیریت موجودی و خریدها' },
  { id: 5, name: 'حسابدار', desc: 'مدیریت مصارف و حساب‌ها' },
];

const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<UserForm>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof UserForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/users/${id}`)
      .then(res => {
        const u = res.data;
        setForm({ username: u.username, full_name: u.full_name || '', password: '', role_id: u.role_id?.toString() || '3' });
      })
      .catch(() => { toast.error('خطا در دریافت اطلاعات کاربر'); navigate('/users'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) { toast.error('نام کاربری الزامی است'); return; }
    if (!form.full_name.trim()) { toast.error('نام کامل الزامی است'); return; }
    if (!isEdit && !form.password.trim()) { toast.error('رمز عبور الزامی است'); return; }
    setSubmitting(true);
    try {
      if (isEdit) {
        const body: Record<string, unknown> = { username: form.username, full_name: form.full_name, role_id: Number(form.role_id) };
        if (form.password.trim()) body.password = form.password;
        await api.put(`/users/${id}`, body);
        toast.success('کاربر ویرایش شد');
      } else {
        await api.post('/auth/register', { username: form.username, password: form.password, full_name: form.full_name, role_id: Number(form.role_id) });
        toast.success('کاربر ایجاد شد');
      }
      navigate('/users');
    } catch { toast.error('خطا در ذخیره کاربر'); }
    finally  { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div dir="rtl" className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/users')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'ویرایش کاربر' : 'افزودن کاربر'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'اطلاعات کاربر را ویرایش کنید' : 'کاربر جدید سیستم اضافه کنید'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-700 pb-2 border-b border-slate-100">اطلاعات حساب کاربری</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>نام کاربری <span className="text-red-500">*</span></label>
              <input type="text" value={form.username} onChange={e => set('username', e.target.value)}
                className={inputCls} dir="ltr" placeholder="username" required />
            </div>
            <div>
              <label className={labelCls}>نام کامل <span className="text-red-500">*</span></label>
              <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                className={inputCls} placeholder="نام کامل" required />
            </div>
          </div>
          <div>
            <label className={labelCls}>
              {isEdit ? 'رمز عبور جدید (خالی = بدون تغییر)' : <>رمز عبور <span className="text-red-500">*</span></>}
            </label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
              className={inputCls} dir="ltr" placeholder="••••••••"
              required={!isEdit} />
          </div>
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-700 pb-2 border-b border-slate-100 mb-4">نقش کاربر</h2>
          <div className="space-y-2">
            {roles.map(role => (
              <label key={role.id}
                className={`flex items-center gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  form.role_id === role.id.toString()
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                <input type="radio" name="role" value={role.id} checked={form.role_id === role.id.toString()}
                  onChange={() => set('role_id', role.id.toString())} className="text-blue-600" />
                <div>
                  <p className={`text-sm font-medium ${form.role_id === role.id.toString() ? 'text-blue-700' : 'text-slate-700'}`}>
                    {role.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{role.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <FiSave className="w-4 h-4" />
            {submitting ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'افزودن کاربر'}
          </button>
          <button type="button" onClick={() => navigate('/users')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
