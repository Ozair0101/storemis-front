import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineExclamation,
  HiOutlineCash,
  HiOutlineCreditCard,
} from 'react-icons/hi';

/* ────────────── Types ────────────── */

interface Account {
  account_id: number;
  name: string;
  currency: string;
  balance: number;
}

interface DashboardStats {
  total_products: number;
  today_sales: { count: number; total: number };
  total_customers: number;
  low_stock_count: number;
  expenses_this_month: number;
  accounts: Account[];
}

interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string | null;
  total_amount: number;
  status: string;
  created_at: string;
}

/* ────────────── Helpers ────────────── */

const fmt = (n: number) => n.toLocaleString('fa-AF');
const fmtMoney = (n: number, cur = 'AFN') => `${fmt(n)} ${cur}`;

/* ────────────── Component ────────────── */

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, salesRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/sales', { params: { limit: 5 } }),
        ]);
        setStats(statsRes.data);
        const salesData = Array.isArray(salesRes.data)
          ? salesRes.data
          : salesRes.data?.sales ?? salesRes.data?.data ?? [];
        setSales(salesData.slice(0, 5));
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Stat card definitions ── */
  const cards: {
    label: string;
    value: React.ReactNode;
    sub?: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
  }[] = [
    {
      label: 'فروش امروز',
      value: fmtMoney(stats?.today_sales.total ?? 0),
      sub: `${fmt(stats?.today_sales.count ?? 0)} فاکتور`,
      color: 'border-blue-500',
      bg: 'bg-blue-50 text-blue-600',
      icon: <HiOutlineShoppingCart className="w-7 h-7" />,
    },
    {
      label: 'تعداد محصولات',
      value: fmt(stats?.total_products ?? 0),
      color: 'border-green-500',
      bg: 'bg-green-50 text-green-600',
      icon: <HiOutlineCube className="w-7 h-7" />,
    },
    {
      label: 'مشتریان',
      value: fmt(stats?.total_customers ?? 0),
      color: 'border-purple-500',
      bg: 'bg-purple-50 text-purple-600',
      icon: <HiOutlineUsers className="w-7 h-7" />,
    },
    {
      label: 'کمبود موجودی',
      value: fmt(stats?.low_stock_count ?? 0),
      sub: 'محصول',
      color: 'border-red-500',
      bg: 'bg-red-50 text-red-600',
      icon: <HiOutlineExclamation className="w-7 h-7" />,
    },
    {
      label: 'مصارف این ماه',
      value: fmtMoney(stats?.expenses_this_month ?? 0),
      color: 'border-orange-500',
      bg: 'bg-orange-50 text-orange-600',
      icon: <HiOutlineCash className="w-7 h-7" />,
    },
    {
      label: 'حساب‌ها',
      value: null, // rendered custom
      color: 'border-teal-500',
      bg: 'bg-teal-50 text-teal-600',
      icon: <HiOutlineCreditCard className="w-7 h-7" />,
    },
  ];

  const statusLabel: Record<string, string> = {
    completed: 'تکمیل شده',
    pending: 'در انتظار',
    cancelled: 'لغو شده',
    paid: 'پرداخت شده',
    partial: 'قسمی',
  };

  const statusColor: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    partial: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">داشبورد</h1>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-xl shadow-sm border-r-4 ${card.color} p-5 flex items-start gap-4`}
          >
            {/* Icon */}
            <div className={`rounded-lg p-3 ${card.bg} shrink-0`}>
              {card.icon}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500 mb-1">{card.label}</p>

              {/* Accounts card – custom layout */}
              {idx === 5 ? (
                <div className="space-y-1">
                  {(stats?.accounts ?? []).length === 0 && (
                    <p className="text-slate-400 text-sm">حسابی وجود ندارد</p>
                  )}
                  {(stats?.accounts ?? []).map((acc) => (
                    <div
                      key={acc.account_id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-slate-700 truncate ml-2">
                        {acc.name}
                      </span>
                      <span className="font-semibold text-slate-800 whitespace-nowrap">
                        {fmtMoney(acc.balance, acc.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <p className="text-xl font-bold text-slate-800">
                    {card.value}
                  </p>
                  {card.sub && (
                    <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Sales ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            آخرین فروش‌ها
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 bg-slate-50">
                <th className="px-5 py-3 text-right font-medium">
                  شماره فاکتور
                </th>
                <th className="px-5 py-3 text-right font-medium">مشتری</th>
                <th className="px-5 py-3 text-right font-medium">مبلغ</th>
                <th className="px-5 py-3 text-right font-medium">وضعیت</th>
                <th className="px-5 py-3 text-right font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-slate-400"
                  >
                    فروشی یافت نشد
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-slate-700">
                      {sale.invoice_number}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {sale.customer_name ?? 'نامشخص'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      {fmtMoney(sale.total_amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColor[sale.status] ??
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {statusLabel[sale.status] ?? sale.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(sale.created_at).toLocaleDateString('fa-AF')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
