import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';

interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SaleDetail {
  sale_id: number;
  invoice_number: string | null;
  customer_name: string | null;
  user_name: string | null;
  total_amount: number;
  discount_amount: number;
  paid_amount: number;
  payment_type: string;
  status: string;
  date: string;
  items: SaleItem[];
}

const afn = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString('fa-AF', { minimumFractionDigits: 0 });

const PAYMENT: Record<string, string> = {
  cash: 'نقد', bank: 'بانکی', mobile: 'پرداخت موبایل', card: 'کارت',
};

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  completed: { label: 'تکمیل شده', bg: 'bg-green-100', text: 'text-green-700' },
  partial:   { label: 'ناقص',       bg: 'bg-amber-100',  text: 'text-amber-700'  },
  pending:   { label: 'در انتظار',  bg: 'bg-red-100',    text: 'text-red-700'    },
};

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/sales/${id}`)
      .then(r => setSale(r.data))
      .catch(() => { toast.error('خطا در دریافت اطلاعات فروش'); navigate('/sales'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!sale) return null;

  const st = STATUS[sale.status] ?? { label: sale.status, bg: 'bg-slate-100', text: 'text-slate-600' };
  const subtotal = Number(sale.total_amount);
  const discount = Number(sale.discount_amount);
  const net      = subtotal - discount;
  const paid     = Number(sale.paid_amount);
  const balance  = paid - net;

  return (
    <div dir="rtl" className="mx-auto space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate('/sales')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">بازگشت به فروش‌ها</span>
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <FiPrinter className="w-4 h-4" />
          چاپ
        </button>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 1 — Invoice identity
         ═══════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">شماره فاکتور</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {sale.invoice_number ?? `#${sale.sale_id}`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date(sale.date).toLocaleDateString('fa-AF', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <span className={`self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-bold ${st.bg} ${st.text}`}>
          {st.label}
        </span>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 2 — Customer & Sale info
         ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Customer card */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">اطلاعات مشتری</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">نام مشتری</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {sale.customer_name || <span className="text-slate-400 font-normal">مشتری حضوری</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">فروشنده</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">{sale.user_name || '—'}</p>
            </div>
          </div>
        </div>

        {/* Payment card */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">اطلاعات پرداخت</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">روش پرداخت</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {PAYMENT[sale.payment_type] ?? sale.payment_type}
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

      {/* ═══════════════════════════════════════
          SECTION 3 — Items table
         ═══════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">اقلام فروش</h2>
        </div>

        {!sale.items?.length ? (
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
              {sale.items.map((item, idx) => (
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

      {/* ═══════════════════════════════════════
          SECTION 4 — Totals
         ═══════════════════════════════════════ */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 bg-white rounded-2xl border border-slate-200 overflow-hidden">

          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">جمع فرعی</span>
            <span className="font-medium text-slate-800">{afn(subtotal)} AFN</span>
          </div>

          {discount > 0 && (
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
              <span className="text-slate-500">تخفیف</span>
              <span className="font-medium text-orange-600">− {afn(discount)} AFN</span>
            </div>
          )}

          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm bg-slate-50">
            <span className="font-semibold text-slate-700">مبلغ خالص</span>
            <span className="font-bold text-slate-900 text-base">{afn(net)} AFN</span>
          </div>

          <div className="px-5 py-3 border-b border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">پرداخت شده</span>
            <span className="font-semibold text-green-700">{afn(paid)} AFN</span>
          </div>

          {/* Balance row — most important, largest */}
          <div className={`px-5 py-4 flex justify-between items-center ${balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className={`text-sm font-bold ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {balance >= 0 ? 'پس‌داد (تحویلی)' : 'بدهی باقی‌مانده'}
            </span>
            <span className={`text-xl font-extrabold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {afn(Math.abs(balance))} <span className="text-sm font-semibold">AFN</span>
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
