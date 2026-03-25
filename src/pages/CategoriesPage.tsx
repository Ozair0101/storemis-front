import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface Category { category_id: number; name: string; description: string | null; }

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch { toast.error('خطا در دریافت دسته‌بندی‌ها'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success('دسته‌بندی حذف شد');
      setDeleteConfirm(null);
      fetchCategories();
    } catch { toast.error('خطا در حذف دسته‌بندی'); }
  };

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">دسته‌بندی‌ها</h1>
        <button onClick={() => navigate('/categories/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium">
          <FiPlus className="w-4 h-4" /> افزودن دسته‌بندی
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">دسته‌بندی‌ای یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 w-16">شماره</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">نام</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">توضیحات</th>
                  <th className="text-center py-3 px-3 font-semibold text-slate-600 w-28">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, i) => (
                  <tr key={cat.category_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-slate-500">{i + 1}</td>
                    <td className="py-3 px-3 text-slate-800 font-medium">{cat.name}</td>
                    <td className="py-3 px-3 text-slate-600">{cat.description || '—'}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => navigate(`/categories/${cat.category_id}/edit`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(cat.category_id)}
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

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div dir="rtl" className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">تایید حذف</h3>
            <p className="text-sm text-slate-600 mb-6">آیا مطمئن هستید که می‌خواهید این دسته‌بندی را حذف کنید؟</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium">حذف</button>
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
