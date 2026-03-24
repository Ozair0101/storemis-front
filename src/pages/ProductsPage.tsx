import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';

interface Product {
  product_id: number;
  barcode: string;
  name: string;
  category_id: number | null;
  category_name: string | null;
  supplier_name: string | null;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  unit: string;
  supplier_id: number | null;
  created_at: string;
}

interface Category {
  category_id: number;
  name: string;
}

interface Supplier {
  supplier_id: number;
  name: string;
}

interface ProductForm {
  barcode: string;
  name: string;
  category_id: string;
  supplier_id: string;
  purchase_price: string;
  sale_price: string;
  stock_quantity: string;
  unit: string;
}

const emptyForm: ProductForm = {
  barcode: '',
  name: '',
  category_id: '',
  supplier_id: '',
  purchase_price: '',
  sale_price: '',
  stock_quantity: '',
  unit: 'عدد',
};

const unitOptions = [
  { value: 'عدد', label: 'عدد' },
  { value: 'کیلوگرام', label: 'کیلوگرام' },
  { value: 'لیتر', label: 'لیتر' },
  { value: 'بسته', label: 'بسته' },
  { value: 'متر', label: 'متر' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch {
      toast.error('خطا در دریافت محصولات');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        api.get('/categories'),
        api.get('/suppliers'),
      ]);
      setCategories(catRes.data);
      setSuppliers(supRes.data);
    } catch {
      toast.error('خطا در دریافت اطلاعات');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchDropdowns();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setForm({
      barcode: product.barcode || '',
      name: product.name,
      category_id: product.category_id?.toString() || '',
      supplier_id: product.supplier_id?.toString() || '',
      purchase_price: product.purchase_price?.toString() || '',
      sale_price: product.sale_price?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '',
      unit: product.unit || 'عدد',
    });
    setEditingId(product.product_id);
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
      toast.error('نام محصول الزامی است');
      return;
    }

    const body = {
      barcode: form.barcode,
      name: form.name,
      category_id: form.category_id ? Number(form.category_id) : null,
      supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : 0,
      sale_price: form.sale_price ? Number(form.sale_price) : 0,
      stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : 0,
      unit: form.unit,
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await api.put(`/products/${editingId}`, body);
        toast.success('محصول با موفقیت ویرایش شد');
      } else {
        await api.post('/products', body);
        toast.success('محصول با موفقیت افزوده شد');
      }
      closeModal();
      fetchProducts();
    } catch {
      toast.error('خطا در ذخیره محصول');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success('محصول با موفقیت حذف شد');
      setDeleteConfirm(null);
      fetchProducts();
    } catch {
      toast.error('خطا در حذف محصول');
    }
  };

  const formatNumber = (n: number | null | undefined) => {
    if (n == null) return '—';
    return Number(n).toLocaleString('fa-AF');
  };

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">محصولات</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
        >
          <FiPlus className="w-4 h-4" />
          افزودن محصول
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="relative mb-5">
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام یا بارکد..."
            className="w-full pr-10 pl-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="mr-3 text-slate-500 text-sm">در حال بارگذاری...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            محصولی یافت نشد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">بارکد</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">نام محصول</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">دسته‌بندی</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">تامین‌کننده</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">قیمت خرید</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">قیمت فروش</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">موجودی</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">واحد</th>
                  <th className="text-center py-3 px-3 font-semibold text-slate-600">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.product_id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      product.stock_quantity < 10
                        ? 'bg-red-50 hover:bg-red-100'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-700 font-mono text-xs">
                      {product.barcode || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium">
                      {product.name}
                      {product.stock_quantity < 10 && (
                        <span className="mr-2 text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                          کم موجود
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {product.category_name || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {product.supplier_name || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {formatNumber(product.purchase_price)}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {formatNumber(product.sale_price)}
                    </td>
                    <td className={`py-3 px-3 font-semibold ${
                      product.stock_quantity < 10 ? 'text-red-600' : 'text-slate-700'
                    }`}>
                      {formatNumber(product.stock_quantity)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{product.unit}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ویرایش"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.product_id)}
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
            className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'ویرایش محصول' : 'افزودن محصول'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* بارکد */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  بارکد
                </label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="بارکد محصول"
                />
              </div>

              {/* نام */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  نام محصول <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="نام محصول"
                />
              </div>

              {/* دسته‌بندی */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  دسته‌بندی
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* تامین‌کننده */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  تامین‌کننده
                </label>
                <select
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">انتخاب تامین‌کننده</option>
                  {suppliers.map((sup) => (
                    <option key={sup.supplier_id} value={sup.supplier_id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* قیمت خرید و فروش */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    قیمت خرید
                  </label>
                  <input
                    type="number"
                    value={form.purchase_price}
                    onChange={(e) =>
                      setForm({ ...form, purchase_price: e.target.value })
                    }
                    min="0"
                    step="any"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    قیمت فروش
                  </label>
                  <input
                    type="number"
                    value={form.sale_price}
                    onChange={(e) =>
                      setForm({ ...form, sale_price: e.target.value })
                    }
                    min="0"
                    step="any"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* موجودی و واحد */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    موجودی
                  </label>
                  <input
                    type="number"
                    value={form.stock_quantity}
                    onChange={(e) =>
                      setForm({ ...form, stock_quantity: e.target.value })
                    }
                    min="0"
                    step="any"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    واحد
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {unitOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buttons */}
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
              آیا مطمئن هستید که می‌خواهید این محصول را حذف کنید؟ این عمل قابل
              بازگشت نیست.
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
