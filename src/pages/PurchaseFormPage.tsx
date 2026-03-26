import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

interface Supplier { supplier_id: number; name: string; }
interface Product { product_id: number; name: string; purchase_price: number; sale_price: number; }
interface Account { account_id: number; name: string; type: string; currency: string; }
interface Sarafi { sarafi_id: number; name: string; currency: string; }
interface Item { product_id: number; name: string; quantity: number; unit_price: number; }

const fmt = (n: number) => n.toLocaleString('fa-AF');
const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';

export default function PurchaseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sarafis, setSarafis] = useState<Sarafi[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'sarafi'>('account');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [sarafiId, setSarafiId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);

  // Add-item form
  const [newProductId, setNewProductId] = useState<number | ''>('');
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get('/suppliers'),
      api.get('/products'),
      api.get('/accounts'),
      api.get('/sarafis'),
      isEdit ? api.get(`/purchases/${id}`) : Promise.resolve(null),
    ])
      .then(([sRes, pRes, aRes, srRes, editRes]) => {
        const sData = Array.isArray(sRes.data) ? sRes.data : sRes.data.data ?? [];
        const pData = Array.isArray(pRes.data) ? pRes.data : pRes.data.data ?? [];
        setSuppliers(sData);
        setProducts(pData);
        setAccounts(aRes.data);
        setSarafis(srRes.data);
        if (aRes.data.length > 0) setAccountId(aRes.data[0].account_id);

        if (editRes?.data) {
          const d = editRes.data;
          setSupplierId(d.supplier_id || '');
          setInvoiceNumber(d.invoice_number || '');
          setPaidAmount(Number(d.paid_amount) || 0);
          setDueDate(d.due_date ? d.due_date.split('T')[0] : '');
          if (d.items) {
            setItems(d.items.map((i: any) => ({
              product_id: i.product_id,
              name: i.product_name || i.name || '',
              quantity: i.quantity,
              unit_price: Number(i.unit_price),
            })));
          }
        }
      })
      .catch(() => toast.error('خطا در بارگذاری اطلاعات'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const addItem = () => {
    if (!newProductId || newQty <= 0 || newPrice <= 0) {
      toast.error('لطفاً محصول، تعداد و قیمت را وارد کنید');
      return;
    }
    if (items.some(i => i.product_id === newProductId)) {
      toast.error('این محصول قبلاً اضافه شده است');
      return;
    }
    const product = products.find(p => p.product_id === newProductId);
    if (!product) return;
    setItems(prev => [...prev, { product_id: product.product_id, name: product.name, quantity: newQty, unit_price: newPrice }]);
    setNewProductId('');
    setNewQty(1);
    setNewPrice(0);
  };

  const removeItem = (pid: number) => setItems(prev => prev.filter(i => i.product_id !== pid));

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const handleSubmit = async () => {
    if (!supplierId) { toast.error('لطفاً تامین‌کننده را انتخاب کنید'); return; }
    if (items.length === 0) { toast.error('لطفاً حداقل یک محصول اضافه کنید'); return; }

    setSubmitting(true);
    try {
      const selectedAccount = accounts.find(a => a.account_id === accountId);
      const body = {
        supplier_id: supplierId,
        invoice_number: invoiceNumber,
        payment_type: paymentMethod === 'sarafi' ? 'sarafi' : (selectedAccount?.type || 'cash'),
        account_id: paymentMethod === 'account' ? (accountId || null) : null,
        sarafi_id: paymentMethod === 'sarafi' ? (sarafiId || null) : null,
        paid_amount: paidAmount,
        due_date: dueDate || null,
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
      };

      if (isEdit) {
        await api.put(`/purchases/${id}`, body);
        toast.success('خرید ویرایش شد');
      } else {
        await api.post('/purchases', body);
        toast.success('خرید با موفقیت ثبت شد');
      }
      navigate('/purchases');
    } catch {
      toast.error('خطا در ثبت خرید');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div dir="rtl" className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/purchases')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'ویرایش خرید' : 'ثبت خرید جدید'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">مشخصات خرید و اقلام را وارد کنید</p>
        </div>
      </div>

      {/* ═══ Section 1: Basic Info ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-bold text-slate-700 pb-3 mb-4 border-b border-slate-100">اطلاعات خرید</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">تامین‌کننده <span className="text-red-500">*</span></label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value ? Number(e.target.value) : '')} className={inputCls}>
              <option value="">انتخاب تامین‌کننده...</option>
              {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
            </select>
          </div>

          {/* Invoice */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">شماره فاکتور</label>
            <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="شماره فاکتور" className={inputCls} />
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">روش پرداخت</label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-2">
              <button type="button" onClick={() => setPaymentMethod('account')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${paymentMethod === 'account' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>
                حساب مستقیم
              </button>
              <button type="button" onClick={() => setPaymentMethod('sarafi')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${paymentMethod === 'sarafi' ? 'bg-white shadow text-amber-700' : 'text-slate-500'}`}>
                از طریق صرافی
              </button>
            </div>
            {paymentMethod === 'account' ? (
              <select value={accountId} onChange={e => setAccountId(e.target.value ? Number(e.target.value) : '')} className={inputCls}>
                <option value="">انتخاب حساب...</option>
                {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name} ({a.currency})</option>)}
              </select>
            ) : (
              <select value={sarafiId} onChange={e => setSarafiId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50">
                <option value="">انتخاب صرافی...</option>
                {sarafis.map(s => <option key={s.sarafi_id} value={s.sarafi_id}>{s.name} ({s.currency})</option>)}
              </select>
            )}
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">تاریخ سررسید</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} dir="ltr" />
          </div>
        </div>
      </div>

      {/* ═══ Section 2: Items ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-bold text-slate-700 pb-3 mb-4 border-b border-slate-100">اقلام خرید</h2>

        {/* Add item row */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end mb-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">محصول</label>
            <select value={newProductId} onChange={e => {
              const pid = e.target.value ? Number(e.target.value) : '';
              setNewProductId(pid);
              if (pid) {
                const p = products.find(p => p.product_id === pid);
                if (p) setNewPrice(Number(p.purchase_price) || Number(p.sale_price) || 0);
              }
            }} className={inputCls}>
              <option value="">انتخاب محصول...</option>
              {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">تعداد</label>
            <input type="number" min={1} value={newQty} onChange={e => setNewQty(Number(e.target.value) || 1)} className={inputCls} dir="ltr" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">قیمت واحد</label>
            <input type="number" min={0} value={newPrice || ''} onChange={e => setNewPrice(Number(e.target.value) || 0)} className={inputCls} dir="ltr" />
          </div>
          <button onClick={addItem}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
            <FiPlus className="w-4 h-4" /> افزودن
          </button>
        </div>

        {/* Items table */}
        {items.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            هنوز محصولی اضافه نشده است
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500">
                  <th className="text-right px-4 py-3 font-semibold">#</th>
                  <th className="text-right px-4 py-3 font-semibold">محصول</th>
                  <th className="text-center px-4 py-3 font-semibold">تعداد</th>
                  <th className="text-center px-4 py-3 font-semibold">قیمت واحد</th>
                  <th className="text-center px-4 py-3 font-semibold">مجموع</th>
                  <th className="text-center px-4 py-3 font-semibold w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.product_id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{fmt(item.unit_price)} AFN</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">{fmt(item.quantity * item.unit_price)} AFN</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => removeItem(item.product_id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ Section 3: Totals & Submit ═══ */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
        {/* Totals card */}
        <div className="w-full sm:w-80 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">مجموع کل</span>
            <span className="font-bold text-lg text-blue-700">{fmt(totalAmount)} AFN</span>
          </div>
          <div className="px-5 py-3 flex items-center justify-between gap-3">
            <label className="text-sm text-slate-600 whitespace-nowrap">مبلغ پرداختی</label>
            <input type="number" min={0} max={totalAmount} value={paidAmount || ''}
              onChange={e => { const v = Number(e.target.value) || 0; setPaidAmount(Math.min(v, totalAmount)); }}
              placeholder="0" dir="ltr"
              className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          {totalAmount > 0 && paidAmount < totalAmount && (
            <div className="px-5 py-2 bg-red-50 flex justify-between text-sm">
              <span className="text-red-700">باقی‌مانده</span>
              <span className="font-bold text-red-700">{fmt(totalAmount - paidAmount)} AFN</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button onClick={() => navigate('/purchases')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition">
            انصراف
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition">
            <FiSave className="w-4 h-4" />
            {submitting ? 'در حال ثبت...' : isEdit ? 'ذخیره تغییرات' : 'ثبت خرید'}
          </button>
        </div>
      </div>
    </div>
  );
}
