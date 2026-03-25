import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

interface Category { category_id: number; name: string; }
interface Supplier  { supplier_id: number; name: string; }

interface ProductForm {
  barcode: string; name: string; category_id: string;
  supplier_id: string; purchase_price: string; sale_price: string;
  stock_quantity: string; unit: string;
}

const emptyForm: ProductForm = {
  barcode: '', name: '', category_id: '', supplier_id: '',
  purchase_price: '', sale_price: '', stock_quantity: '', unit: 'عدد',
};

const unitOptions = ['عدد', 'کیلوگرام', 'لیتر', 'کارتن', 'متر'];

const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof ProductForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const fetchDropdowns = async () => {
      const [catRes, supRes] = await Promise.all([api.get('/categories'), api.get('/suppliers')]);
      setCategories(catRes.data);
      setSuppliers(supRes.data);
    };
    fetchDropdowns().catch(() => toast.error('خطا در دریافت اطلاعات'));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`)
      .then(res => {
        const p = res.data;
        setForm({
          barcode: p.barcode || '',
          name: p.name || '',
          category_id: p.category_id?.toString() || '',
          supplier_id: p.supplier_id?.toString() || '',
          purchase_price: p.purchase_price?.toString() || '',
          sale_price: p.sale_price?.toString() || '',
          stock_quantity: p.stock_quantity?.toString() || '',
          unit: p.unit || 'عدد',
        });
      })
      .catch(() => { toast.error('خطا در دریافت اطلاعات محصول'); navigate('/products'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('نام محصول الزامی است'); return; }
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
    setSubmitting(true);
    try {
      if (isEdit) { await api.put(`/products/${id}`, body); toast.success('محصول ویرایش شد'); }
      else         { await api.post('/products', body);     toast.success('محصول افزوده شد'); }
      navigate('/products');
    } catch { toast.error('خطا در ذخیره محصول'); }
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
        <button onClick={() => navigate('/products')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'ویرایش محصول' : 'افزودن محصول'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'اطلاعات محصول را ویرایش کنید' : 'اطلاعات محصول جدید را وارد کنید'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            اطلاعات اصلی
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>نام محصول <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  className={inputCls} placeholder="نام محصول" required />
              </div>
              <div>
                <label className={labelCls}>بارکد</label>
                <input type="text" value={form.barcode} onChange={e => set('barcode', e.target.value)}
                  className={inputCls} placeholder="بارکد محصول" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>دسته‌بندی</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className={inputCls}>
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>تامین‌کننده</label>
                <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} className={inputCls}>
                  <option value="">انتخاب تامین‌کننده</option>
                  {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Stock Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            قیمت و موجودی
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>قیمت خرید (AFN)</label>
              <input type="number" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)}
                min="0" step="any" className={inputCls} placeholder="0" dir="ltr" />
            </div>
            <div>
              <label className={labelCls}>قیمت فروش (AFN)</label>
              <input type="number" value={form.sale_price} onChange={e => set('sale_price', e.target.value)}
                min="0" step="any" className={inputCls} placeholder="0" dir="ltr" />
            </div>
            <div>
              <label className={labelCls}>موجودی</label>
              <input type="number" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)}
                min="0" className={inputCls} placeholder="0" dir="ltr" />
            </div>
            <div>
              <label className={labelCls}>واحد</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className={inputCls}>
                {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <FiSave className="w-4 h-4" />
            {submitting ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'افزودن محصول'}
          </button>
          <button type="button" onClick={() => navigate('/products')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
