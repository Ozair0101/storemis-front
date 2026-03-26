import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiX,
  FiShoppingCart,
  FiList,
  FiEye,
  FiDollarSign,
} from 'react-icons/fi';

/* ───────── Types ───────── */
interface Product {
  product_id: number;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
}

interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
}

interface Customer {
  customer_id: number;
  name: string;
}

interface Sale {
  sale_id: number;
  customer_name: string;
  user_name: string;
  invoice_number: string;
  total_amount: number;
  discount_amount: number;
  paid_amount: number;
  payment_type: string;
  status: string;
  date: string;
}

interface SaleDetail extends Sale {
  items: {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

/* ───────── Helpers ───────── */
const paymentLabel: Record<string, string> = {
  cash: 'نقد',
  bank: 'بانکی',
  mobile: 'موبایل',
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-red-100 text-red-700',
  };
  const label: Record<string, string> = {
    completed: 'تکمیل شده',
    partial: 'ناقص',
    pending: 'در انتظار',
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {label[status] ?? status}
    </span>
  );
};

const formatNumber = (n: number) =>
  n.toLocaleString('fa-AF', { minimumFractionDigits: 0 });

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<'pos' | 'list'>('pos');

  return (
    <div dir="rtl" className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition ${
            activeTab === 'pos'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FiShoppingCart size={16} />
          فروش جدید
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition ${
            activeTab === 'list'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FiList size={16} />
          لیست فروش‌ها
        </button>
      </div>

      {activeTab === 'pos' ? <POSView /> : <SalesListView />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   POS View
   ═══════════════════════════════════════════════════════ */
function POSView() {
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<{ account_id: number; name: string; type: string; currency: string }[]>([]);
  const [sarafis, setSarafis] = useState<{ sarafi_id: number; name: string; currency: string }[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'sarafi'>('account');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [sarafiId, setSarafiId] = useState<number | ''>('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    barcodeRef.current?.focus();
    api.get('/customers').then((r) => setCustomers(r.data)).catch(() => {});
    api.get('/accounts').then((r) => {
      setAccounts(r.data);
      if (r.data.length > 0) setAccountId(r.data[0].account_id);
    }).catch(() => {});
    api.get('/sarafis').then((r) => setSarafis(r.data)).catch(() => {});
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── barcode scan ── */
  const handleBarcodeScan = async () => {
    if (!barcode.trim()) return;
    try {
      const { data } = await api.get(`/products/barcode/${barcode.trim()}`);
      addToCart({
        product_id: data.product_id,
        name: data.name,
        price: parseFloat(data.sale_price ?? data.price ?? 0),
        stock: data.stock_quantity ?? data.stock ?? 0,
        barcode: data.barcode,
      });
      setBarcode('');
    } catch {
      toast.error('محصول با این بارکد یافت نشد');
    }
    barcodeRef.current?.focus();
  };

  /* ── product search ── */
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!term.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/products', { params: { search: term } });
        const raw = Array.isArray(data) ? data : data.data ?? [];
        const list = raw.map((p: any) => ({
          product_id: p.product_id,
          name: p.name,
          price: parseFloat(p.sale_price ?? p.price ?? 0),
          stock: p.stock_quantity ?? p.stock ?? 0,
          barcode: p.barcode,
        }));
        setSearchResults(list);
        setShowDropdown(list.length > 0);
      } catch {
        setSearchResults([]);
      }
    }, 300);
  };

  /* ── cart helpers ── */
  const addToCart = useCallback((p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === p.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.product_id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product_id: p.product_id, name: p.name, quantity: 1, unit_price: p.price }];
    });
    setSearchTerm('');
    setShowDropdown(false);
  }, []);

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.product_id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem = (id: number) => setCart((prev) => prev.filter((i) => i.product_id !== id));

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = Math.max(subtotal - discount, 0);

  /* ── submit sale ── */
  const submitSale = async () => {
    if (cart.length === 0) {
      toast.error('سبد خرید خالی است');
      return;
    }
    setSubmitting(true);
    try {
      const selectedAccount = accounts.find(a => a.account_id === accountId);
      await api.post('/sales', {
        customer_id: customerId || null,
        payment_type: paymentMethod === 'sarafi' ? 'sarafi' : (selectedAccount?.type || 'cash'),
        account_id: paymentMethod === 'account' ? (accountId || null) : null,
        sarafi_id: paymentMethod === 'sarafi' ? (sarafiId || null) : null,
        discount_amount: discount,
        paid_amount: paidAmount,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      });
      toast.success('فروش با موفقیت ثبت شد');
      setCart([]);
      setCustomerId('');
      setDiscount(0);
      setPaidAmount(0);
      barcodeRef.current?.focus();
    } catch {
      toast.error('خطا در ثبت فروش');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── render ── */
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* ─── Left: Cart area ─── */}
      <div className="flex-1 space-y-4">
        {/* Barcode */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-600 mb-1">اسکن بارکد</label>
          <input
            ref={barcodeRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
            placeholder="بارکد را اسکن کنید یا تایپ نمایید..."
            className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Product search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-slate-600 mb-1">جستجوی محصول</label>
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="نام محصول را جستجو کنید..."
              className="w-full pr-10 pl-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          {showDropdown && (
            <div className="absolute z-20 left-4 right-4 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.product_id}
                  onClick={() => addToCart(p)}
                  className="w-full text-right px-4 py-2.5 hover:bg-blue-50 flex justify-between items-center border-b last:border-0"
                >
                  <span className="font-medium text-slate-700">{p.name}</span>
                  <span className="text-sm text-slate-500">{formatNumber(p.price)} افغانی</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <FiShoppingCart /> سبد خرید
            </h3>
            <span className="text-sm text-slate-500">{cart.length} قلم</span>
          </div>

          {cart.length === 0 ? (
            <div className="p-10 text-center text-slate-400">سبد خرید خالی است</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 text-right font-medium">محصول</th>
                    <th className="px-4 py-2.5 text-center font-medium">تعداد</th>
                    <th className="px-4 py-2.5 text-center font-medium">قیمت واحد</th>
                    <th className="px-4 py-2.5 text-center font-medium">مجموع</th>
                    <th className="px-4 py-2.5 text-center font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.product_id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{item.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateQty(item.product_id, -1)}
                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600"
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.product_id, 1)}
                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600"
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {formatNumber(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800">
                        {formatNumber(item.quantity * item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="p-1 rounded-md text-red-500 hover:bg-red-50"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Payment panel ─── */}
      <div className="w-full lg:w-80 xl:w-96 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">مشتری (اختیاری)</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">بدون مشتری</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment method toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">روش پرداخت</label>
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
              <select value={accountId}
                onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm">
                {accounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>{a.name} ({a.currency})</option>
                ))}
              </select>
            ) : (
              <select value={sarafiId}
                onChange={(e) => setSarafiId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-amber-50 text-sm">
                <option value="">انتخاب صرافی...</option>
                {sarafis.map((s) => (
                  <option key={s.sarafi_id} value={s.sarafi_id}>{s.name} ({s.currency})</option>
                ))}
              </select>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Totals */}
          <div className="space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>جمع فرعی</span>
              <span className="font-semibold">{formatNumber(subtotal)} افغانی</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="text-slate-600 whitespace-nowrap">تخفیف</label>
              <input
                type="number"
                min={0}
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-100">
              <span>مجموع کل</span>
              <span className="text-blue-700">{formatNumber(total)} افغانی</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="text-slate-600 whitespace-nowrap">مبلغ پرداختی</label>
              <input
                type="number"
                min={0}
                value={paidAmount || ''}
                onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {paidAmount > 0 && paidAmount > total && (
              <div className="flex justify-between text-green-600 text-sm">
                <span>باقی‌مانده</span>
                <span>{formatNumber(paidAmount - total)} افغانی</span>
              </div>
            )}
          </div>

          <button
            onClick={submitSale}
            disabled={submitting || cart.length === 0}
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg font-bold text-lg transition"
          >
            {submitting ? 'در حال ثبت...' : 'ثبت فروش'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Sales List View
   ═══════════════════════════════════════════════════════ */
function SalesListView() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentTarget, setPaymentTarget] = useState<Sale | null>(null);

  useEffect(() => { fetchSales(); }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sales');
      setSales(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      toast.error('خطا در دریافت لیست فروش‌ها');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">در حال بارگذاری...</div>
        ) : sales.length === 0 ? (
          <div className="p-10 text-center text-slate-400">هیچ فروشی ثبت نشده است</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">شماره</th>
                  <th className="px-4 py-3 text-right font-medium">مشتری</th>
                  <th className="px-4 py-3 text-center font-medium">مبلغ کل</th>
                  <th className="px-4 py-3 text-center font-medium">تخفیف</th>
                  <th className="px-4 py-3 text-center font-medium">پرداخت شده</th>
                  <th className="px-4 py-3 text-center font-medium">نوع پرداخت</th>
                  <th className="px-4 py-3 text-center font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-center font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-center font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.sale_id} className="border-b last:border-0 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-700">{s.invoice_number || `#${s.sale_id}`}</td>
                    <td className="px-4 py-3 text-slate-600">{s.customer_name || '---'}</td>
                    <td className="px-4 py-3 text-center font-semibold">{formatNumber(s.total_amount)}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{formatNumber(s.discount_amount)}</td>
                    <td className="px-4 py-3 text-center">{formatNumber(s.paid_amount)}</td>
                    <td className="px-4 py-3 text-center">{paymentLabel[s.payment_type] ?? s.payment_type}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(s.status)}</td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">
                      {new Date(s.date).toLocaleDateString('fa-AF')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/sales/${s.sale_id}`)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                          title="مشاهده"
                        >
                          <FiEye size={15} />
                        </button>
                        {s.status !== 'completed' && (
                          <button
                            onClick={() => setPaymentTarget(s)}
                            className="p-1.5 rounded-md text-green-600 hover:bg-green-50"
                            title="ثبت پرداخت"
                          >
                            <FiDollarSign size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentTarget && (
        <SalePaymentModal
          sale={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onUpdated={() => { setPaymentTarget(null); fetchSales(); }}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Sale Payment Modal
   ═══════════════════════════════════════════════════════ */
function SalePaymentModal({ sale, onClose, onUpdated }: {
  sale: Sale; onClose: () => void; onUpdated: () => void;
}) {
  const [newAmount, setNewAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'sarafi'>('account');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [sarafiId, setSarafiId] = useState<number | ''>('');
  const [accounts, setAccounts] = useState<{ account_id: number; name: string; type: string; currency: string }[]>([]);
  const [sarafis, setSarafis] = useState<{ sarafi_id: number; name: string; currency: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const net = sale.total_amount - sale.discount_amount;
  const remaining = net - sale.paid_amount;

  useEffect(() => {
    api.get('/accounts').then(r => { setAccounts(r.data); if (r.data.length > 0) setAccountId(r.data[0].account_id); }).catch(() => {});
    api.get('/sarafis').then(r => setSarafis(r.data)).catch(() => {});
  }, []);

  const submit = async () => {
    if (newAmount <= 0) { toast.error('لطفاً مبلغ پرداخت را وارد کنید'); return; }
    setSubmitting(true);
    try {
      const selectedAccount = accounts.find(a => a.account_id === accountId);
      await api.put(`/sales/${sale.sale_id}/payment`, {
        paid_amount: sale.paid_amount + newAmount,
        payment_type: paymentMethod === 'sarafi' ? 'sarafi' : (selectedAccount?.type || 'cash'),
        account_id: paymentMethod === 'account' ? (accountId || null) : null,
        sarafi_id: paymentMethod === 'sarafi' ? (sarafiId || null) : null,
      });
      toast.success('پرداخت با موفقیت ثبت شد');
      onUpdated();
    } catch { toast.error('خطا در ثبت پرداخت'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">ثبت پرداخت بقیه</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><FiX size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">مبلغ خالص فروش</span>
              <span className="font-semibold">{formatNumber(net)} افغانی</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">پرداخت شده تاکنون</span>
              <span className="font-semibold text-green-600">{formatNumber(sale.paid_amount)} افغانی</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-red-600 font-bold">
              <span>باقی‌مانده</span>
              <span>{formatNumber(remaining)} افغانی</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">روش پرداخت</label>
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
              <select value={accountId} onChange={e => setAccountId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm">
                <option value="">انتخاب حساب...</option>
                {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name} ({a.currency})</option>)}
              </select>
            ) : (
              <select value={sarafiId} onChange={e => setSarafiId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-amber-50 text-sm">
                <option value="">انتخاب صرافی...</option>
                {sarafis.map(s => <option key={s.sarafi_id} value={s.sarafi_id}>{s.name} ({s.currency})</option>)}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">مبلغ پرداخت</label>
            <input type="number" min={0} max={remaining} value={newAmount || ''} onChange={e => setNewAmount(Number(e.target.value) || 0)}
              placeholder="0" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm">
              انصراف
            </button>
            <button onClick={submit} disabled={submitting}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg font-medium text-sm">
              {submitting ? 'در حال ثبت...' : 'ثبت پرداخت'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
