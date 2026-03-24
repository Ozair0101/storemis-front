import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  is_regular: boolean;
}

type CustomerForm = Omit<Customer, 'id'>;

const emptyForm: CustomerForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  is_regular: false,
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch {
      toast.error('خطا در بارگذاری مشتریان');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      is_regular: c.is_regular,
    });
    setShowModal(true);
  };

  const openDelete = (c: Customer) => {
    setDeleting(c);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('نام مشتری الزامی است');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, form);
        toast.success('مشتری با موفقیت ویرایش شد');
      } else {
        await api.post('/customers', form);
        toast.success('مشتری با موفقیت اضافه شد');
      }
      setShowModal(false);
      fetchCustomers();
    } catch {
      toast.error('خطا در ذخیره‌سازی');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await api.delete(`/customers/${deleting.id}`);
      toast.success('مشتری با موفقیت حذف شد');
      setShowDeleteModal(false);
      setDeleting(null);
      fetchCustomers();
    } catch {
      toast.error('خطا در حذف مشتری');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">مشتریان</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          افزودن مشتری
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 text-slate-500">هیچ مشتری‌ای یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-right text-xs font-medium text-slate-600 uppercase tracking-wider px-6 py-3">نام</th>
                  <th className="text-right text-xs font-medium text-slate-600 uppercase tracking-wider px-6 py-3">تلفن</th>
                  <th className="text-right text-xs font-medium text-slate-600 uppercase tracking-wider px-6 py-3">ایمیل</th>
                  <th className="text-right text-xs font-medium text-slate-600 uppercase tracking-wider px-6 py-3">آدرس</th>
                  <th className="text-right text-xs font-medium text-slate-600 uppercase tracking-wider px-6 py-3">مشتری دایمی</th>
                  <th className="text-right text-xs font-medium text-slate-600 uppercase tracking-wider px-6 py-3">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600" dir="ltr">{c.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600" dir="ltr">{c.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{c.address}</td>
                    <td className="px-6 py-4 text-sm">
                      {c.is_regular ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">دایمی</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">عادی</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                          title="ویرایش"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDelete(c)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                          title="حذف"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                {editing ? 'ویرایش مشتری' : 'افزودن مشتری'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نام *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="نام مشتری"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تلفن</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    dir="ltr"
                    placeholder="0700000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ایمیل</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    dir="ltr"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">آدرس</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={2}
                  placeholder="آدرس مشتری"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_regular"
                  checked={form.is_regular}
                  onChange={(e) => setForm({ ...form, is_regular: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_regular" className="text-sm font-medium text-slate-700">مشتری دایمی</label>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'در حال ذخیره...' : editing ? 'ویرایش' : 'ذخیره'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteModal(false)}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">تایید حذف</h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                آیا مطمئن هستید که می‌خواهید مشتری <span className="font-bold text-slate-800">{deleting.name}</span> را حذف کنید؟
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'در حال حذف...' : 'حذف'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
