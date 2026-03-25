import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

interface Product {
  product_id: number; barcode: string; name: string;
  category_name: string | null; supplier_name: string | null;
  purchase_price: number; sale_price: number;
  stock_quantity: number; unit: string; created_at: string;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch { toast.error('خطا در دریافت محصولات'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success('محصول حذف شد');
      setDeleteConfirm(null);
      fetchProducts();
    } catch { toast.error('خطا در حذف محصول'); }
  };

  const fmt = (n: number | null | undefined) =>
    n == null ? '—' : Number(n).toLocaleString('fa-AF');

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">محصولات</h1>
        <button onClick={() => navigate('/products/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium">
          <FiPlus className="w-4 h-4" /> افزودن محصول
        </button>
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="relative mb-5">
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام یا بارکد..."
            className="w-full pr-10 pl-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="mr-3 text-slate-500 text-sm">در حال بارگذاری...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">محصولی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {['بارکد','نام محصول','دسته‌بندی','تامین‌کننده','قیمت خرید','قیمت فروش','موجودی','واحد','عملیات'].map(h => (
                    <th key={h} className={`text-right py-3 px-3 font-semibold text-slate-600 ${h === 'عملیات' ? 'text-center' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.product_id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${p.stock_quantity < 10 ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                    <td className="py-3 px-3 text-slate-700 font-mono text-xs">{p.barcode || '—'}</td>
                    <td className="py-3 px-3 text-slate-800 font-medium">
                      {p.name}
                      {p.stock_quantity < 10 && (
                        <span className="mr-2 text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded">کم موجود</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.category_name || '—'}</td>
                    <td className="py-3 px-3 text-slate-600">{p.supplier_name || '—'}</td>
                    <td className="py-3 px-3 text-slate-700">{fmt(p.purchase_price)}</td>
                    <td className="py-3 px-3 text-slate-700">{fmt(p.sale_price)}</td>
                    <td className={`py-3 px-3 font-semibold ${p.stock_quantity < 10 ? 'text-red-600' : 'text-slate-700'}`}>
                      {fmt(p.stock_quantity)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.unit}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => navigate(`/products/${p.product_id}/edit`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="ویرایش">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(p.product_id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
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

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div dir="rtl" className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">تایید حذف</h3>
            <p className="text-sm text-slate-600 mb-6">آیا مطمئن هستید؟ این عمل قابل بازگشت نیست.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium">
                حذف
              </button>
              <button onClick={() => setDeleteConfirm(null)}
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
