import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';

interface PurchaseItem {
  id: number; product_id: number; product_name: string;
  quantity: number; unit_price: number; total_price: number;
}
interface PurchaseDetail {
  purchase_id: number; supplier_name: string; invoice_number: string | null;
  total_amount: number; paid_amount: number; payment_type: string;
  status: string; created_at: string; due_date: string | null;
  items: PurchaseItem[];
}

const afn = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString('fa-AF');

const PAYMENT: Record<string, string> = { cash: 'نقد', bank: 'بانکی', mobile: 'موبایل', sarafi: 'صرافی' };
const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  paid:      { label: 'پرداخت شده', bg: 'bg-green-100', text: 'text-green-700' },
  completed: { label: 'تکمیل شده',  bg: 'bg-green-100', text: 'text-green-700' },
  partial:   { label: 'ناقص',       bg: 'bg-amber-100', text: 'text-amber-700' },
  pending:   { label: 'در انتظار',  bg: 'bg-red-100',   text: 'text-red-700'   },
};

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/purchases/${id}`)
      .then(r => setPurchase(r.data))
      .catch(() => { toast.error('خطا در دریافت جزئیات خرید'); navigate('/purchases'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!purchase) return null;

  const st = STATUS[purchase.status] ?? { label: purchase.status, bg: 'bg-slate-100', text: 'text-slate-600' };
  const total = Number(purchase.total_amount);
  const paid = Number(purchase.paid_amount);
  const remaining = total - paid;

  return (
    <div dir="rtl" className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate('/purchases')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">بازگشت به خریدها</span>
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <FiPrinter className="w-4 h-4" /> چاپ
        </button>
      </div>

      {/* Invoice identity */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">شماره فاکتور خرید</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {purchase.invoice_number ?? `#${purchase.purchase_id}`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date(purchase.created_at).toLocaleDateString('fa-AF', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <span className={`self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-bold ${st.bg} ${st.text}`}>
          {st.label}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">اطلاعات تامین‌کننده</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">نام تامین‌کننده</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">{purchase.supplier_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">تاریخ سررسید</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {purchase.due_date ? new Date(purchase.due_date).toLocaleDateString('fa-AF') : '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">اطلاعات پرداخت</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">روش پرداخت</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {PAYMENT[purchase.payment_type] ?? purchase.payment_type}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">وضعیت</p>
              <span className={`inline-block mt-0.5 px-3 py-1 rounded-lg text-sm font-semibold ${st.bg} ${st.text}`}>
                {st.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">اقلام خرید</h2>
        </div>
        {!purchase.items?.length ? (
          <div className="py-16 text-center text-slate-400 text-sm">هیچ قلمی یافت نشد</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <th className="text-right px-6 py-3 font-semibold">#</th>
                <th className="text-right px-6 py-3 font-semibold">نام محصول</th>
                <th className="text-center px-6 py-3 font-semibold">تعداد</th>
                <th className="text-left px-6 py-3 font-semibold">قیمت واحد</th>
                <th className="text-left px-6 py-3 font-semibold">مجموع</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, idx) => (
                <tr key={item.id ?? idx} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-4 text-slate-400 text-sm">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800">{item.product_name}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block w-9 h-9 leading-9 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold text-center">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <span className="text-sm text-slate-700">{afn(item.unit_price)}</span>
                    <span className="text-xs text-slate-400 mr-1">AFN</span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <span className="text-sm font-bold text-slate-900">{afn(item.total_price)}</span>
                    <span className="text-xs text-slate-400 mr-1">AFN</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">مبلغ کل</span>
            <span className="font-medium text-slate-800">{afn(total)} AFN</span>
          </div>
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">پرداخت شده</span>
            <span className="font-semibold text-green-700">{afn(paid)} AFN</span>
          </div>
          {remaining > 0 && (
            <div className="px-5 py-4 bg-red-50 flex justify-between items-center">
              <span className="text-sm font-bold text-red-800">باقی‌مانده</span>
              <span className="text-xl font-extrabold text-red-700">{afn(remaining)} <span className="text-sm font-semibold">AFN</span></span>
            </div>
          )}
          {remaining <= 0 && (
            <div className="px-5 py-4 bg-green-50 flex justify-between items-center">
              <span className="text-sm font-bold text-green-800">تسویه شده</span>
              <span className="text-green-700 font-bold">&#10003;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
