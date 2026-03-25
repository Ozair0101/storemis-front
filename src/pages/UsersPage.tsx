import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface User { id: number; username: string; full_name: string; role_id: number; created_at: string; }

const roles: Record<number, string> = {
  1: 'مدیر', 2: 'مدیر فروشگاه', 3: 'صندوقدار', 4: 'انباردار', 5: 'حسابدار',
};

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { toast.error('خطا در بارگذاری کاربران'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await api.delete(`/users/${deleting.id}`);
      toast.success('کاربر حذف شد');
      setDeleting(null);
      fetchUsers();
    } catch { toast.error('خطا در حذف کاربر'); }
    finally  { setSubmitting(false); }
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">کاربران</h1>
        <button onClick={() => navigate('/users/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium">
          <FiPlus className="w-4 h-4" /> افزودن کاربر
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-slate-500">هیچ کاربری یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['نام کاربری','نام کامل','نقش','تاریخ ایجاد','عملیات'].map(h => (
                    <th key={h} className="text-right px-6 py-3 text-xs font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800" dir="ltr">{u.username}</td>
                    <td className="px-6 py-4 text-slate-600">{u.full_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {roles[u.role_id] || 'نامشخص'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('fa-AF') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/users/${u.id}/edit`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleting(u)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleting(null)} />
          <div dir="rtl" className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">تایید حذف</h3>
            <p className="text-sm text-slate-600 mb-6">
              آیا مطمئن هستید که می‌خواهید کاربر <span className="font-bold">{deleting.full_name}</span> را حذف کنید؟
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium">
                {submitting ? 'در حال حذف...' : 'حذف'}
              </button>
              <button onClick={() => setDeleting(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
