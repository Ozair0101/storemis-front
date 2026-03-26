import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiPhone, FiMapPin } from 'react-icons/fi';

interface Sarafi {
  sarafi_id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  balance: number;
  currency: string;
}

const afn = (n: number | string | null | undefined, cur = 'AFN') =>
  Number(n ?? 0).toLocaleString('fa-AF') + ` ${cur}`;

export default function SarafisPage() {
  const navigate = useNavigate();
  const [sarafis, setSarafis] = useState<Sarafi[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Sarafi | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetch = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/sarafis');
      setSarafis(data);
    } catch { toast.error('خطا در بارگذاری صرافی‌ها'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await api.delete(`/sarafis/${deleting.sarafi_id}`);
      toast.success('صرافی حذف شد');
      setDeleting(null);
      fetch();
    } catch { toast.error('خطا در حذف صرافی'); }
    finally { setSubmitting(false); }
  };

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">صرافی‌ها</h1>
          <p className="text-sm text-slate-500 mt-1">مدیریت صرافی‌ها و حواله‌جات</p>
        </div>
        <button onClick={() => navigate('/sarafis/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium">
          <FiPlus className="w-4 h-4" /> افزودن صرافی
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sarafis.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-20 text-center text-slate-500">
          هیچ صرافی ثبت نشده است
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sarafis.map(s => {
            const bal = Number(s.balance);
            const isPositive = bal >= 0;
            return (
              <div key={s.sarafi_id}
                onClick={() => navigate(`/sarafis/${s.sarafi_id}`)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group">

                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center text-xl">
                      🏦
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{s.name}</h3>
                      {s.contact_person && (
                        <p className="text-xs text-slate-500">{s.contact_person}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); navigate(`/sarafis/${s.sarafi_id}/edit`); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit2 className="w-4 h-4" /></button>
                    <button onClick={e => { e.stopPropagation(); setDeleting(s); }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Contact info */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
                  {s.phone && (
                    <span className="flex items-center gap-1"><FiPhone className="w-3 h-3" />{s.phone}</span>
                  )}
                  {s.address && (
                    <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" />{s.address}</span>
                  )}
                </div>

                {/* Balance */}
                <div className={`rounded-lg px-4 py-3 ${isPositive ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                  <p className="text-xs text-slate-500 mb-0.5">
                    {isPositive ? 'طلب ما از صرافی' : 'بدهی ما به صرافی'}
                  </p>
                  <p className={`text-xl font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                    {afn(Math.abs(bal), s.currency)}
                  </p>
                </div>

                <p className="mt-3 text-xs text-slate-400 text-center">کلیک برای مشاهده معاملات</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleting(null)} />
          <div dir="rtl" className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">تایید حذف</h3>
            <p className="text-sm text-slate-600 mb-6">
              آیا مطمئن هستید که می‌خواهید صرافی <span className="font-bold">{deleting.name}</span> را حذف کنید؟
              تمام معاملات مربوط نیز حذف خواهد شد.
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
