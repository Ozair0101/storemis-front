import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ═══════════════════════ Types ═══════════════════════ */

interface SalesSummary {
  summary: {
    total_orders: number;
    total_sales: number;
    total_discounts: number;
    total_received: number;
    total_outstanding: number;
  };
  daily: { day: string; orders: number; sales: number; received: number }[];
}

interface PurchaseSummary {
  summary: {
    total_orders: number;
    total_purchases: number;
    total_paid: number;
    total_outstanding: number;
  };
  by_supplier: {
    supplier_name: string;
    orders: number;
    total_amount: number;
    paid_amount: number;
  }[];
}

interface ExpenseSummary {
  summary: { total_expenses: number; total_amount: number };
  by_category: { category: string; count: number; total_amount: number }[];
}

interface ProfitLoss {
  total_sales: number;
  total_discounts: number;
  net_sales: number;
  total_purchases: number;
  gross_profit: number;
  total_expenses: number;
  net_profit: number;
}

interface TopProduct {
  product_id: number;
  name: string;
  barcode: string;
  total_sold: number;
  total_revenue: number;
}

interface StockProduct {
  product_id: number;
  barcode: string;
  name: string;
  stock_quantity: number;
  purchase_price: number;
  sale_price: number;
  stock_cost_value: number;
  stock_sale_value: number;
  category_name: string;
}

interface StockReport {
  products: StockProduct[];
  totals: {
    total_items: number;
    total_cost_value: number;
    total_sale_value: number;
  };
}

/* ═══════════════════════ Helpers ═══════════════════════ */

const fmt = (n: number) => n.toLocaleString('fa-AF');
const fmtMoney = (n: number) => `${fmt(n)} AFN`;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function monthStartISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/* ── Reusable small components ── */

function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent = 'blue',
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-50 text-blue-700',
    green: 'border-green-500 bg-green-50 text-green-700',
    red: 'border-red-500 bg-red-50 text-red-700',
    orange: 'border-orange-500 bg-orange-50 text-orange-700',
    purple: 'border-purple-500 bg-purple-50 text-purple-700',
    teal: 'border-teal-500 bg-teal-50 text-teal-700',
  };
  const c = colors[accent] ?? colors.blue;
  return (
    <div className={`rounded-xl border-r-4 p-4 ${c}`}>
      <p className="text-sm opacity-75 mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

/* ═══════════════════════ Tab Definitions ═══════════════════════ */

type TabKey =
  | 'sales'
  | 'purchase'
  | 'expense'
  | 'profitloss'
  | 'topproducts'
  | 'stock';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'sales', label: 'گزارش فروش' },
  { key: 'purchase', label: 'گزارش خرید' },
  { key: 'expense', label: 'گزارش مصارف' },
  { key: 'profitloss', label: 'سود و زیان' },
  { key: 'topproducts', label: 'محصولات پرفروش' },
  { key: 'stock', label: 'گزارش موجودی' },
];

const TAB_HAS_DATES: TabKey[] = [
  'sales',
  'purchase',
  'expense',
  'profitloss',
];

/* ═══════════════════════ Sub-tab components ═══════════════════════ */

/* ── Sales ── */
function SalesTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/reports/sales-summary', { params: { from, to } })
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-slate-400 py-8 text-center">خطا در بارگذاری</p>;

  const s = data.summary;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="کل سفارشات" value={fmt(s.total_orders)} accent="blue" />
        <MetricCard label="کل فروش" value={fmtMoney(s.total_sales)} accent="green" />
        <MetricCard label="تخفیفات" value={fmtMoney(s.total_discounts)} accent="orange" />
        <MetricCard label="دریافت شده" value={fmtMoney(s.total_received)} accent="teal" />
        <MetricCard label="باقیمانده" value={fmtMoney(s.total_outstanding)} accent="red" />
      </div>

      {/* Chart */}
      {data.daily.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">نمودار فروش روزانه</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Bar dataKey="sales" name="فروش" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="received" name="دریافتی" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-4 py-3 text-right font-medium">روز</th>
              <th className="px-4 py-3 text-right font-medium">سفارشات</th>
              <th className="px-4 py-3 text-right font-medium">فروش</th>
              <th className="px-4 py-3 text-right font-medium">دریافتی</th>
            </tr>
          </thead>
          <tbody>
            {data.daily.map((d) => (
              <tr key={d.day} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{d.day}</td>
                <td className="px-4 py-3">{fmt(d.orders)}</td>
                <td className="px-4 py-3 font-semibold">{fmtMoney(d.sales)}</td>
                <td className="px-4 py-3">{fmtMoney(d.received)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Purchase ── */
function PurchaseTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<PurchaseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/reports/purchase-summary', { params: { from, to } })
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-slate-400 py-8 text-center">خطا در بارگذاری</p>;

  const s = data.summary;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="کل سفارشات" value={fmt(s.total_orders)} accent="blue" />
        <MetricCard label="کل خرید" value={fmtMoney(s.total_purchases)} accent="orange" />
        <MetricCard label="پرداخت شده" value={fmtMoney(s.total_paid)} accent="green" />
        <MetricCard label="باقیمانده" value={fmtMoney(s.total_outstanding)} accent="red" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-4 py-3 text-right font-medium">تامین کننده</th>
              <th className="px-4 py-3 text-right font-medium">سفارشات</th>
              <th className="px-4 py-3 text-right font-medium">مبلغ کل</th>
              <th className="px-4 py-3 text-right font-medium">پرداخت شده</th>
              <th className="px-4 py-3 text-right font-medium">باقیمانده</th>
            </tr>
          </thead>
          <tbody>
            {data.by_supplier.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{row.supplier_name}</td>
                <td className="px-4 py-3">{fmt(row.orders)}</td>
                <td className="px-4 py-3 font-semibold">{fmtMoney(row.total_amount)}</td>
                <td className="px-4 py-3 text-green-600">{fmtMoney(row.paid_amount)}</td>
                <td className="px-4 py-3 text-red-600">
                  {fmtMoney(row.total_amount - row.paid_amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Expense ── */
function ExpenseTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/reports/expense-summary', { params: { from, to } })
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-slate-400 py-8 text-center">خطا در بارگذاری</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard label="تعداد مصارف" value={fmt(data.summary.total_expenses)} accent="blue" />
        <MetricCard label="مجموع مصارف" value={fmtMoney(data.summary.total_amount)} accent="red" />
      </div>

      {/* Chart */}
      {data.by_category.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">مصارف بر اساس دسته‌بندی</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_category} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={120} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Bar dataKey="total_amount" name="مبلغ" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-4 py-3 text-right font-medium">دسته‌بندی</th>
              <th className="px-4 py-3 text-right font-medium">تعداد</th>
              <th className="px-4 py-3 text-right font-medium">مجموع مبلغ</th>
            </tr>
          </thead>
          <tbody>
            {data.by_category.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{row.category}</td>
                <td className="px-4 py-3">{fmt(row.count)}</td>
                <td className="px-4 py-3 font-semibold">{fmtMoney(row.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Profit / Loss ── */
function ProfitLossTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<ProfitLoss | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/reports/profit-loss', { params: { from, to } })
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-slate-400 py-8 text-center">خطا در بارگذاری</p>;

  const isProfit = data.net_profit >= 0;

  return (
    <div dir="rtl" className="space-y-5">

      {/* ═══ Result Banner ═══ */}
      <div className={`rounded-2xl border-2 p-6 text-center ${
        isProfit ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
      }`}>
        <p className="text-sm text-slate-500 mb-2">نتیجه نهایی</p>
        <p className={`text-4xl font-extrabold mb-1 ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
          {isProfit ? '+' : '-'}{fmtMoney(Math.abs(data.net_profit))}
        </p>
        <p className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
          {isProfit ? 'سود خالص — شما سودآور هستید' : 'زیان خالص — مصارف بیشتر از درآمد است'}
        </p>
      </div>

      {/* ═══ Visual Flow: 3 Steps ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* STEP 1: Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 px-5 py-3">
            <p className="text-white text-xs font-semibold uppercase tracking-wider">مرحله ۱ — درآمد</p>
            <p className="text-white/70 text-[11px]">پول که از فروش بدست آمده</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">کل فروش</span>
              <span className="text-sm font-bold text-slate-800">{fmtMoney(data.total_sales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">تخفیفات داده شده</span>
              <span className="text-sm font-medium text-orange-600">− {fmtMoney(data.total_discounts)}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-blue-700">فروش خالص</span>
              <span className="text-lg font-extrabold text-blue-700">{fmtMoney(data.net_sales)}</span>
            </div>
          </div>
        </div>

        {/* STEP 2: Cost of Goods */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-orange-500 px-5 py-3">
            <p className="text-white text-xs font-semibold uppercase tracking-wider">مرحله ۲ — قیمت تمام شده</p>
            <p className="text-white/70 text-[11px]">پول که برای خرید اجناس خرج شده</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">فروش خالص</span>
              <span className="text-sm font-bold text-blue-700">{fmtMoney(data.net_sales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">کل خریدها</span>
              <span className="text-sm font-medium text-orange-600">− {fmtMoney(data.total_purchases)}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold" style={{ color: data.gross_profit >= 0 ? '#15803d' : '#dc2626' }}>
                سود ناخالص
              </span>
              <span className="text-lg font-extrabold" style={{ color: data.gross_profit >= 0 ? '#15803d' : '#dc2626' }}>
                {data.gross_profit >= 0 ? '' : '−'}{fmtMoney(Math.abs(data.gross_profit))}
              </span>
            </div>
          </div>
        </div>

        {/* STEP 3: Operating Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className={`px-5 py-3 ${isProfit ? 'bg-green-600' : 'bg-red-600'}`}>
            <p className="text-white text-xs font-semibold uppercase tracking-wider">مرحله ۳ — مصارف عملیاتی</p>
            <p className="text-white/70 text-[11px]">کرایه، معاش، برق، ترانسپورت و ...</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">سود ناخالص</span>
              <span className="text-sm font-bold" style={{ color: data.gross_profit >= 0 ? '#15803d' : '#dc2626' }}>
                {fmtMoney(data.gross_profit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">کل مصارف</span>
              <span className="text-sm font-medium text-orange-600">− {fmtMoney(data.total_expenses)}</span>
            </div>
            <div className={`border-t pt-3 flex justify-between items-center ${isProfit ? 'border-green-100' : 'border-red-100'}`}>
              <span className={`text-sm font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                سود خالص (نتیجه)
              </span>
              <span className={`text-lg font-extrabold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                {isProfit ? '' : '−'}{fmtMoney(Math.abs(data.net_profit))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Simple Explanation ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3">خلاصه محاسبه</h3>
        <div className="space-y-2">
          {/* Row: Sales */}
          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">۱</div>
            <div className="flex-1 flex justify-between items-center">
              <span className="text-sm text-slate-700">کل فروش − تخفیفات = <span className="font-bold text-blue-700">فروش خالص</span></span>
              <span className="text-sm font-bold text-blue-700">{fmtMoney(data.net_sales)}</span>
            </div>
          </div>
          {/* Row: Gross */}
          <div className="flex items-center gap-3 py-2 border-t border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold shrink-0">۲</div>
            <div className="flex-1 flex justify-between items-center">
              <span className="text-sm text-slate-700">فروش خالص − خریدها = <span className="font-bold" style={{ color: data.gross_profit >= 0 ? '#15803d' : '#dc2626' }}>سود ناخالص</span></span>
              <span className="text-sm font-bold" style={{ color: data.gross_profit >= 0 ? '#15803d' : '#dc2626' }}>{fmtMoney(data.gross_profit)}</span>
            </div>
          </div>
          {/* Row: Net */}
          <div className={`flex items-center gap-3 py-2 border-t border-slate-100`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>۳</div>
            <div className="flex-1 flex justify-between items-center">
              <span className="text-sm text-slate-700">سود ناخالص − مصارف = <span className={`font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>سود خالص</span></span>
              <span className={`text-base font-extrabold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>{fmtMoney(data.net_profit)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Top Products ── */
function TopProductsTab() {
  const [data, setData] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reports/top-products', { params: { limit: 10 } })
      .then((r) => setData(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Chart */}
      {data.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            ده محصول پرفروش
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={140} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="total_sold" name="تعداد فروش" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-4 py-3 text-right font-medium">#</th>
              <th className="px-4 py-3 text-right font-medium">نام محصول</th>
              <th className="px-4 py-3 text-right font-medium">بارکد</th>
              <th className="px-4 py-3 text-right font-medium">تعداد فروش</th>
              <th className="px-4 py-3 text-right font-medium">درآمد کل</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={p.product_id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400">{fmt(i + 1)}</td>
                <td className="px-4 py-3 text-slate-700 font-medium">{p.name}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{p.barcode}</td>
                <td className="px-4 py-3">{fmt(p.total_sold)}</td>
                <td className="px-4 py-3 font-semibold text-green-700">{fmtMoney(p.total_revenue)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  داده‌ای یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Stock Report ── */
function StockTab() {
  const [data, setData] = useState<StockReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reports/stock-report')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-slate-400 py-8 text-center">خطا در بارگذاری</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="مجموع اقلام" value={fmt(data.totals.total_items)} accent="blue" />
        <MetricCard label="ارزش خرید موجودی" value={fmtMoney(data.totals.total_cost_value)} accent="orange" />
        <MetricCard label="ارزش فروش موجودی" value={fmtMoney(data.totals.total_sale_value)} accent="green" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-4 py-3 text-right font-medium">بارکد</th>
              <th className="px-4 py-3 text-right font-medium">نام محصول</th>
              <th className="px-4 py-3 text-right font-medium">دسته‌بندی</th>
              <th className="px-4 py-3 text-right font-medium">موجودی</th>
              <th className="px-4 py-3 text-right font-medium">قیمت خرید</th>
              <th className="px-4 py-3 text-right font-medium">قیمت فروش</th>
              <th className="px-4 py-3 text-right font-medium">ارزش خرید</th>
              <th className="px-4 py-3 text-right font-medium">ارزش فروش</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p) => (
              <tr key={p.product_id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-500">{p.barcode}</td>
                <td className="px-4 py-3 text-slate-700 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.category_name}</td>
                <td className={`px-4 py-3 font-semibold ${p.stock_quantity <= 5 ? 'text-red-600' : 'text-slate-800'}`}>
                  {fmt(p.stock_quantity)}
                </td>
                <td className="px-4 py-3">{fmtMoney(p.purchase_price)}</td>
                <td className="px-4 py-3">{fmtMoney(p.sale_price)}</td>
                <td className="px-4 py-3">{fmtMoney(p.stock_cost_value)}</td>
                <td className="px-4 py-3 font-semibold text-green-700">{fmtMoney(p.stock_sale_value)}</td>
              </tr>
            ))}
            {data.products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  محصولی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════ Main Page ═══════════════════════ */

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('sales');
  const [from, setFrom] = useState(monthStartISO);
  const [to, setTo] = useState(todayISO);

  /* We use a key trick so that date-dependent tabs refetch when dates change */
  const dateKey = `${from}_${to}`;

  const hasDates = TAB_HAS_DATES.includes(activeTab);

  const renderTab = useCallback(() => {
    switch (activeTab) {
      case 'sales':
        return <SalesTab key={dateKey} from={from} to={to} />;
      case 'purchase':
        return <PurchaseTab key={dateKey} from={from} to={to} />;
      case 'expense':
        return <ExpenseTab key={dateKey} from={from} to={to} />;
      case 'profitloss':
        return <ProfitLossTab key={dateKey} from={from} to={to} />;
      case 'topproducts':
        return <TopProductsTab />;
      case 'stock':
        return <StockTab />;
    }
  }, [activeTab, dateKey, from, to]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">گزارشات</h1>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1 bg-slate-100 rounded-xl p-1 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Date range filters ── */}
      {hasDates && (
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">از تاریخ:</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">تا تاریخ:</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* ── Tab Content ── */}
      {renderTab()}
    </div>
  );
}
