import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPhone, FiExternalLink } from 'react-icons/fi';

interface DebtItem {
  type: 'sale' | 'purchase' | 'sarafi';
  id: number;
  label: string;
  phone: string | null;
  reference: string;
  amount: number;
  total: number | null;
  paid: number | null;
  date: string | null;
  due_date?: string | null;
  currency?: string;
  link: string;
}

interface DebtData {
  receivables: DebtItem[];
  payables: DebtItem[];
  summary: {
    total_receivable: number;
    total_payable: number;
    net: number;
    receivable_count: number;
    payable_count: number;
  };
}

const afn = (n: number) => Number(n ?? 0).toLocaleString('fa-AF');

const typeLabel: Record<string, { label: string; bg: string; text: string }> = {
  sale:     { label: 'فروش',       bg: 'bg-blue-50',   text: 'text-blue-700' },
  purchase: { label: 'خرید',       bg: 'bg-orange-50', text: 'text-orange-700' },
  sarafi:   { label: 'صرافی',      bg: 'bg-purple-50', text: 'text-purple-700' },
};

export default function DebtsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DebtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'receivables' | 'payables'>('receivables');

  useEffect(() => {
    api.get('/debts')
      .then(r => setData(r.data))
      .catch(() => toast.error('خطا در بارگذاری بدهی‌ها'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const { receivables, payables, summary } = data;
  const items = tab === 'receivables' ? receivables : payables;

  return (
    <div dir="rtl" className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">بدهی‌ها و طلب‌ها</h1>
        <p className="text-sm text-slate-500 mt-1">خلاصه وضعیت مالی — چه کسی به شما بدهکار است و شما به چه کسی بدهکار هستید</p>
      </div>

      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Receivable */}
        <button onClick={() => setTab('receivables')}
          className={`rounded-2xl border-2 p-5 text-right transition-all ${
            tab === 'receivables' ? 'border-green-400 bg-green-50 shadow-sm' : 'border-slate-200 bg-white hover:border-green-200'
          }`}>
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">طلب ما از دیگران</p>
          <p className="text-3xl font-extrabold text-green-700">{afn(summary.total_receivable)}</p>
          <p className="text-xs text-slate-500 mt-2">{summary.receivable_count} مورد</p>
        </button>

        {/* Payable */}
        <button onClick={() => setTab('payables')}
          className={`rounded-2xl border-2 p-5 text-right transition-all ${
            tab === 'payables' ? 'border-red-400 bg-red-50 shadow-sm' : 'border-slate-200 bg-white hover:border-red-200'
          }`}>
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">بدهی ما به دیگران</p>
          <p className="text-3xl font-extrabold text-red-700">{afn(summary.total_payable)}</p>
          <p className="text-xs text-slate-500 mt-2">{summary.payable_count} مورد</p>
        </button>

        {/* Net */}
        <div className={`rounded-2xl border-2 p-5 ${
          summary.net >= 0 ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
        }`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">خالص</p>
          <p className={`text-3xl font-extrabold ${summary.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {summary.net >= 0 ? '+' : '-'}{afn(Math.abs(summary.net))}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {summary.net >= 0 ? 'شما در مجموع طلبکار هستید' : 'شما در مجموع بدهکار هستید'}
          </p>
        </div>
      </div>

      {/* ═══ Tab indicator ═══ */}
      <div className="flex gap-2">
        <button onClick={() => setTab('receivables')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
            tab === 'receivables' ? 'bg-green-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}>
          طلب‌ها ({summary.receivable_count})
        </button>
        <button onClick={() => setTab('payables')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
            tab === 'payables' ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}>
          بدهی‌ها ({summary.payable_count})
        </button>
      </div>

      {/* ═══ Items List ═══ */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-400">
          {tab === 'receivables' ? 'هیچ طلبی وجود ندارد' : 'هیچ بدهی وجود ندارد'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const tl = typeLabel[item.type] ?? { label: item.type, bg: 'bg-slate-50', text: 'text-slate-600' };
            const isReceivable = tab === 'receivables';
            return (
              <div key={`${item.type}-${item.id}`}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-4 p-4">

                  {/* Left: amount highlight */}
                  <div className={`shrink-0 w-24 h-20 rounded-xl flex flex-col items-center justify-center ${
                    isReceivable ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className={`text-lg font-extrabold ${isReceivable ? 'text-green-700' : 'text-red-700'}`}>
                      {afn(item.amount)}
                    </p>
                    <p className="text-[10px] text-slate-400">{item.currency || 'AFN'}</p>
                  </div>

                  {/* Middle: details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 truncate">{item.label}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tl.bg} ${tl.text}`}>
                        {tl.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{item.reference}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                      {item.phone && (
                        <span className="flex items-center gap-1"><FiPhone className="w-3 h-3" />{item.phone}</span>
                      )}
                      {item.total != null && (
                        <span>مبلغ کل: {afn(item.total)}</span>
                      )}
                      {item.paid != null && (
                        <span>پرداخت شده: {afn(item.paid)}</span>
                      )}
                      {item.date && (
                        <span>{new Date(item.date).toLocaleDateString('fa-AF')}</span>
                      )}
                      {item.due_date && (
                        <span className="text-orange-500 font-medium">
                          سررسید: {new Date(item.due_date).toLocaleDateString('fa-AF')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: action */}
                  <button onClick={() => navigate(item.link)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition">
                    <FiExternalLink className="w-3.5 h-3.5" />
                    مشاهده
                  </button>
                </div>

                {/* Progress bar */}
                {item.total != null && item.paid != null && (
                  <div className="px-4 pb-3">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isReceivable ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min((item.paid / item.total) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {Math.round((item.paid / item.total) * 100)}% پرداخت شده
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
