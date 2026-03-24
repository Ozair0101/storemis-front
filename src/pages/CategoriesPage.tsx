import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

interface Category {
  category_id: number;
  name: string;
  description: string | null;
}

interface CategoryForm {
  name: string;
  description: string;
}

const emptyForm: CategoryForm = {
  name: '',
  description: '',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch {
      toast.error('خطا در دریافت دسته‌بندی‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setForm({
      name: category.name,
      description: category.description || '',
    });
    setEditingId(category.category_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('نام دسته‌بندی الزامی است');
      return;
    }

    const body = {
      name: form.name,
      description: form.description,
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await api.put(`/categories/${editingId}`, body);
        toast.success('دسته‌بندی با موفقیت ویرایش شد');
      } else {
        await api.post('/categories', body);
        toast.success('دسته‌بندی با موفقیت افزوده شد');
      }
      closeModal();
      fetchCategories();
    } catch {
      toast.error('خطا در ذخیره دسته‌بندی');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success('دسته‌بندی با موفقیت حذف شد');
      setDeleteConfirm(null);
      fetchCategories();
    } catch {
      toast.error('خطا در حذف دسته‌بندی');
    }
  };

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">دسته‌بندی‌ها</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
        >
          <FiPlus className="w-4 h-4" />
          افزودن دسته‌بندی
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="mr-3 text-slate-500 text-sm">در حال بارگذاری...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            دسته‌بندی‌ای یافت نشد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 w-16">
                    شماره
                  </th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">
                    نام
                  </th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">
                    توضیحات
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-slate-600 w-28">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr
                    key={cat.category_id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-3 text-slate-500">{index + 1}</td>
                    <td className="py-3 px-3 text-slate-800 font-medium">
                      {cat.name}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {cat.description || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ویرایش"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(cat.category_id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal}></div>
          <div
            dir="rtl"
            className="relative bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  نام دسته‌بندی <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="نام دسته‌بندی"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  توضیحات
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="توضیحات دسته‌بندی (اختیاری)"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {submitting
                    ? 'در حال ذخیره...'
                    : editingId
                    ? 'ویرایش'
                    : 'افزودن'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          ></div>
          <div dir="rtl" className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              تایید حذف
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              آیا مطمئن هستید که می‌خواهید این دسته‌بندی را حذف کنید؟ این عمل
              قابل بازگشت نیست.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                حذف
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
