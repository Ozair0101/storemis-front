import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiX, FiEye, FiDollarSign } from 'react-icons/fi';

/* ───────── Types ───────── */
interface Supplier {
  supplier_id: number;
  name: string;
}

interface Product {
  product_id: number;
  name: string;
  price: number;
}

interface PurchaseItem {
  product_id: number;
  product_name?: string;
  name?: string;
  quantity: number;
  unit_price: number;
  total?: number;
}

interface Purchase {
  purchase_id: number;
  supplier_name: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  payment_type: string;
  status: string;
  created_at: string;
  due_date: string;
}

interface PurchaseDetail extends Purchase {
  items: PurchaseItem[];
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
export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/purchases');
      setPurchases(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      toast.error('خطا در دریافت لیست خریدها');
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (id: number) => {
    try {
      const { data } = await api.get(`/purchases/${id}`);
      setDetail(data);
      setShowDetailModal(true);
    } catch {
      toast.error('خطا در دریافت جزئیات خرید');
    }
  };

  const openPaymentModal = (p: Purchase, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPurchase(p);
    setShowPaymentModal(true);
  };

  return (
    <div dir="rtl" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">خریدها</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition shadow"
        >
          <FiPlus size={16} />
          ثبت خرید جدید
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">در حال بارگذاری...</div>
        ) : purchases.length === 0 ? (
          <div className="p-10 text-center text-slate-400">هیچ خریدی ثبت نشده است</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">شماره</th>
                  <th className="px-4 py-3 text-right font-medium">تامین‌کننده</th>
                  <th className="px-4 py-3 text-center font-medium">فاکتور</th>
                  <th className="px-4 py-3 text-center font-medium">مبلغ کل</th>
                  <th className="px-4 py-3 text-center font-medium">پرداخت شده</th>
                  <th className="px-4 py-3 text-center font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-center font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-center font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr
                    key={p.purchase_id}
                    onClick={() => viewDetail(p.purchase_id)}
                    className="border-b last:border-0 hover:bg-blue-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-medium text-slate-700">{p.purchase_id}</td>
                    <td className="px-4 py-3 text-slate-600">{p.supplier_name}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{p.invoice_number}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {formatNumber(p.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">{formatNumber(p.paid_amount)}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">
                      {new Date(p.created_at).toLocaleDateString('fa-AF')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewDetail(p.purchase_id);
                          }}
                          className="p-1.5 rounded-md cursor-pointer text-blue-600 hover:bg-blue-50"
                          title="مشاهده"
                        >
                          <FiEye size={15} />
                        </button>
                        {p.status !== 'completed' && (
                          <button
                            onClick={(e) => openPaymentModal(p, e)}
                            className="p-1.5 rounded-md cursor-pointer text-green-600 hover:bg-green-50"
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

      {/* Create modal */}
      {showCreateModal && (
        <CreatePurchaseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchPurchases();
          }}
        />
      )}

      {/* Detail modal */}
      {showDetailModal && detail && (
        <DetailModal detail={detail} onClose={() => setShowDetailModal(false)} />
      )}

      {/* Payment modal */}
      {showPaymentModal && selectedPurchase && (
        <PaymentModal
          purchase={selectedPurchase}
          onClose={() => setShowPaymentModal(false)}
          onUpdated={() => {
            setShowPaymentModal(false);
            fetchPurchases();
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Create Purchase Modal
   ═══════════════════════════════════════════════════════ */
function CreatePurchaseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<{ account_id: number; name: string; type: string; currency: string }[]>([]);
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // new item form state
  const [newProductId, setNewProductId] = useState<number | ''>('');
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);

  useEffect(() => {
    api.get('/suppliers').then((r) => setSuppliers(Array.isArray(r.data) ? r.data : r.data.data ?? [])).catch(() => {});
    api.get('/products').then((r) => setProducts(Array.isArray(r.data) ? r.data : r.data.data ?? [])).catch(() => {});
    api.get('/accounts').then((r) => { setAccounts(r.data); if (r.data.length > 0) setAccountId(r.data[0].account_id); }).catch(() => {});
  }, []);

  const addItem = () => {
    if (!newProductId || newQty <= 0 || newPrice <= 0) {
      toast.error('لطفا محصول، تعداد و قیمت را وارد کنید');
      return;
    }
    const product = products.find((p) => p.product_id === newProductId);
    if (!product) return;

    // check duplicate
    if (items.some((i) => i.product_id === newProductId)) {
      toast.error('این محصول قبلا اضافه شده است');
      return;
    }

    setItems([
      ...items,
      { product_id: product.product_id, name: product.name, quantity: newQty, unit_price: newPrice },
    ]);
    setNewProductId('');
    setNewQty(1);
    setNewPrice(0);
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((i) => i.product_id !== id));

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const submit = async () => {
    if (!supplierId) {
      toast.error('لطفا تامین‌کننده را انتخاب کنید');
      return;
    }
    if (items.length === 0) {
      toast.error('لطفا حداقل یک محصول اضافه کنید');
      return;
    }
    setSubmitting(true);
    try {
      const selectedAccount = accounts.find(a => a.account_id === accountId);
      await api.post('/purchases', {
        supplier_id: supplierId,
        invoice_number: invoiceNumber,
        payment_type: selectedAccount?.type || 'cash',
        account_id: accountId || null,
        paid_amount: paidAmount,
        due_date: dueDate || null,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      });
      toast.success('خرید با موفقیت ثبت شد');
      onCreated();
    } catch {
      toast.error('خطا در ثبت خرید');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">ثبت خرید جدید</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Top fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">تامین‌کننده *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">انتخاب تامین‌کننده...</option>
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">شماره فاکتور</label>
              <input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="شماره فاکتور"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">حساب پرداخت</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">انتخاب حساب...</option>
                {accounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>{a.name} ({a.currency})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">تاریخ سررسید</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Add item section */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm">افزودن محصول</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs text-slate-500 mb-1">محصول</label>
                <select
                  value={newProductId}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : '';
                    setNewProductId(id);
                    if (id) {
                      const prod = products.find((p) => p.product_id === id);
                      if (prod) setNewPrice(prod.price);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">انتخاب محصول...</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">تعداد</label>
                <input
                  type="number"
                  min={1}
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">قیمت واحد</label>
                <input
                  type="number"
                  min={0}
                  value={newPrice || ''}
                  onChange={(e) => setNewPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button
                onClick={addItem}
                className="flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
              >
                <FiPlus size={14} />
                افزودن
              </button>
            </div>

            {/* Items table */}
            {items.length > 0 && (
              <div className="overflow-x-auto border border-slate-200 rounded-lg mt-3">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-right font-medium text-slate-600">محصول</th>
                      <th className="px-3 py-2 text-center font-medium text-slate-600">تعداد</th>
                      <th className="px-3 py-2 text-center font-medium text-slate-600">قیمت واحد</th>
                      <th className="px-3 py-2 text-center font-medium text-slate-600">مجموع</th>
                      <th className="px-3 py-2 text-center font-medium text-slate-600 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.product_id} className="border-b last:border-0">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-center">{formatNumber(item.unit_price)}</td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {formatNumber(item.quantity * item.unit_price)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeItem(item.product_id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
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

          {/* Total & paid */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-lg font-bold text-slate-800">
              <span>مجموع کل</span>
              <span className="text-blue-700">{formatNumber(totalAmount)} افغانی</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-slate-600 font-medium">مبلغ پرداختی</label>
              <input
                type="number"
                min={0}
                value={paidAmount || ''}
                onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm transition"
            >
              انصراف
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg font-medium text-sm transition"
            >
              {submitting ? 'در حال ثبت...' : 'ثبت خرید'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Detail Modal
   ═══════════════════════════════════════════════════════ */
function DetailModal({ detail, onClose }: { detail: PurchaseDetail; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            جزئیات خرید - {detail.invoice_number || `#${detail.purchase_id}`}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-slate-500">تامین‌کننده</span>
              <p className="font-medium">{detail.supplier_name}</p>
            </div>
            <div>
              <span className="text-slate-500">نوع پرداخت</span>
              <p className="font-medium">{paymentLabel[detail.payment_type] ?? detail.payment_type}</p>
            </div>
            <div>
              <span className="text-slate-500">تاریخ سررسید</span>
              <p className="font-medium">
                {detail.due_date ? new Date(detail.due_date).toLocaleDateString('fa-AF') : '---'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">وضعیت</span>
              <p className="mt-0.5">{statusBadge(detail.status)}</p>
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-right font-medium text-slate-600">محصول</th>
                  <th className="px-4 py-2 text-center font-medium text-slate-600">تعداد</th>
                  <th className="px-4 py-2 text-center font-medium text-slate-600">قیمت واحد</th>
                  <th className="px-4 py-2 text-center font-medium text-slate-600">مجموع</th>
                </tr>
              </thead>
              <tbody>
                {detail.items?.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="px-4 py-2.5">{item.product_name ?? item.name}</td>
                    <td className="px-4 py-2.5 text-center">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-center">{formatNumber(item.unit_price)}</td>
                    <td className="px-4 py-2.5 text-center font-semibold">
                      {formatNumber(item.total ?? item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">مبلغ کل</span>
              <span className="font-semibold">{formatNumber(detail.total_amount)} افغانی</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2">
              <span>پرداخت شده</span>
              <span className="text-green-700">{formatNumber(detail.paid_amount)} افغانی</span>
            </div>
            {detail.total_amount - detail.paid_amount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>باقی‌مانده</span>
                <span>{formatNumber(detail.total_amount - detail.paid_amount)} افغانی</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Payment Modal
   ═══════════════════════════════════════════════════════ */
function PaymentModal({
  purchase,
  onClose,
  onUpdated,
}: {
  purchase: Purchase;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [paidAmount, setPaidAmount] = useState(0);
  const [accountId, setAccountId] = useState<number | ''>('');
  const [accounts, setAccounts] = useState<{ account_id: number; name: string; type: string; currency: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const remaining = purchase.total_amount - purchase.paid_amount;

  useEffect(() => {
    api.get('/accounts').then((r) => { setAccounts(r.data); if (r.data.length > 0) setAccountId(r.data[0].account_id); }).catch(() => {});
  }, []);

  const submit = async () => {
    if (paidAmount <= 0) {
      toast.error('لطفا مبلغ پرداخت را وارد کنید');
      return;
    }
    setSubmitting(true);
    try {
      const selectedAccount = accounts.find(a => a.account_id === accountId);
      await api.put(`/purchases/${purchase.purchase_id}/payment`, {
        paid_amount: paidAmount,
        payment_type: selectedAccount?.type || 'cash',
        account_id: accountId || null,
      });
      toast.success('پرداخت با موفقیت ثبت شد');
      onUpdated();
    } catch {
      toast.error('خطا در ثبت پرداخت');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">ثبت پرداخت</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">مبلغ کل</span>
              <span className="font-semibold">{formatNumber(purchase.total_amount)} افغانی</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">پرداخت شده تاکنون</span>
              <span className="font-semibold text-green-600">
                {formatNumber(purchase.paid_amount)} افغانی
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-red-600 font-bold">
              <span>باقی‌مانده</span>
              <span>{formatNumber(remaining)} افغانی</span>
            </div>
          </div>

          {/* Account selector */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">حساب پرداخت</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">انتخاب حساب...</option>
              {accounts.map((a) => (
                <option key={a.account_id} value={a.account_id}>{a.name} ({a.currency})</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">مبلغ پرداخت</label>
            <input
              type="number"
              min={0}
              max={remaining}
              value={paidAmount || ''}
              onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm transition"
            >
              انصراف
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg font-medium text-sm transition"
            >
              {submitting ? 'در حال ثبت...' : 'ثبت پرداخت'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
