import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface Account { id: number; name: string; type: string; currency: string; balance: number; }
interface Transaction { id: number; amount: number; type: string; reference: string; date: string; }

const typeLabels: Record<string, string> = { cash: 'نقدی', bank: 'بانکی', 'mobile wallet': 'کیف پول موبایل' };
const typeColors: Record<string, string> = {
  cash: 'bg-green-100 text-green-700', bank: 'bg-blue-100 text-blue-700',
  'mobile wallet': 'bg-purple-100 text-purple-700',
};
const typeEmoji: Record<string, string> = { cash: '💵', bank: '🏦', 'mobile wallet': '📱' };

function formatCurrency(n: number, currency: string): string {
  return new Intl.NumberFormat('fa-AF').format(n) + ` ${currency}`;
}

export default function AccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch { toast.error('خطا در بارگذاری حساب‌ها'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const openTransactions = async (acc: Account) => {
    setSelectedAccount(acc);
    setLoadingTx(true);
    try {
      const res = await api.get(`/accounts/${acc.id}/transactions`);
      setTransactions(res.data);
    } catch { toast.error('خطا در بارگذاری تراکنش‌ها'); }
    finally  { setLoadingTx(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await api.delete(`/accounts/${deleting.id}`);
      toast.success('حساب حذف شد');
      setDeleting(null);
      fetchAccounts();
    } catch { toast.error('خطا در حذف حساب'); }
    finally  { setSubmitting(false); }
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">حساب‌ها</h1>
        <button onClick={() => navigate('/accounts/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium">
          <FiPlus className="w-4 h-4" /> افزودن حساب
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-20 text-center text-slate-500">
          هیچ حسابی یافت نشد
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} onClick={() => openTransactions(acc)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-2xl">
                    {typeEmoji[acc.type] || '💰'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{acc.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[acc.type] || 'bg-gray-100 text-gray-700'}`}>
                      {typeLabels[acc.type] || acc.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); navigate(`/accounts/${acc.id}/edit`); }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleting(acc); }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500 mb-1">موجودی</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(acc.balance, acc.currency)}</p>
              </div>
              <p className="mt-2 text-xs text-slate-400">کلیک برای مشاهده تراکنش‌ها</p>
            </div>
          ))}
        </div>
      )}

      {/* Transactions Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedAccount(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">تراکنش‌های {selectedAccount.name}</h2>
                <p className="text-sm text-slate-500 mt-1">موجودی: {formatCurrency(selectedAccount.balance, selectedAccount.currency)}</p>
              </div>
              <button onClick={() => setSelectedAccount(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingTx ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-20 text-slate-500">هیچ تراکنشی یافت نشد</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['مبلغ','نوع','مرجع','تاریخ'].map(h => (
                        <th key={h} className="text-right px-6 py-3 text-xs font-medium text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800">{formatCurrency(tx.amount, selectedAccount.currency)}</td>
                        <td className="px-6 py-4">
                          {tx.type === 'income'
                            ? <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">درآمد</span>
                            : <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">مصرف</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-slate-600">{tx.reference || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {tx.date ? new Date(tx.date).toLocaleDateString('fa-AF') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleting(null)} />
          <div dir="rtl" className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">تایید حذف</h3>
            <p className="text-sm text-slate-600 mb-6">
              آیا مطمئن هستید که می‌خواهید حساب <span className="font-bold">{deleting.name}</span> را حذف کنید؟
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium">
                {submitting ? 'در حال حذف...' : 'حذف'}
              </button>
              <button onClick={() => setDeleting(null)}
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
