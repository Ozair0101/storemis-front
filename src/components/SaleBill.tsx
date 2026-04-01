import { forwardRef } from 'react';

export interface SaleBillItem {
  name: string;
  quantity: number;
  unit_price: number;
}

export interface SaleBillData {
  sale_id: number;
  invoice_number?: string | null;
  customer_name?: string | null;
  payment_type: string;
  created_at: string;
  items: SaleBillItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid_amount: number;
}

const PAYMENT: Record<string, string> = {
  cash: 'نقد', bank: 'بانکی', mobile: 'موبایل', sarafi: 'صرافی',
};

const fmt = (n: number) => Number(n).toLocaleString('fa-AF', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const SaleBill = forwardRef<HTMLDivElement, { data: SaleBillData }>(({ data }, ref) => {
  const remaining = data.total - data.paid_amount;
  const change = data.paid_amount > data.total ? data.paid_amount - data.total : 0;
  const date = new Date(data.created_at);
  const dateStr = date.toLocaleDateString('fa-AF', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('fa-AF', { hour: '2-digit', minute: '2-digit' });

  return (
    <div ref={ref} dir="rtl" className="bill-root bg-white text-slate-900" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      {/* ─── Header ─── */}
      <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">بل فروش</h1>
        <p className="text-xs text-slate-500 mt-1">سیستم مدیریت فروشگاه</p>
      </div>

      {/* ─── Meta info ─── */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-5 border border-slate-200 rounded-lg p-4 bg-slate-50">
        <div className="flex gap-2">
          <span className="text-slate-500 w-24 shrink-0">شماره بل:</span>
          <span className="font-bold">{data.invoice_number || `#${data.sale_id}`}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-slate-500 w-24 shrink-0">تاریخ:</span>
          <span className="font-bold">{dateStr}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-slate-500 w-24 shrink-0">مشتری:</span>
          <span className="font-bold">{data.customer_name || 'نامشخص'}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-slate-500 w-24 shrink-0">ساعت:</span>
          <span className="font-bold">{timeStr}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-slate-500 w-24 shrink-0">روش پرداخت:</span>
          <span className="font-bold">{PAYMENT[data.payment_type] ?? data.payment_type}</span>
        </div>
      </div>

      {/* ─── Items Table ─── */}
      <table className="w-full text-sm border-collapse mb-5">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="text-right px-3 py-2.5 font-semibold w-10">#</th>
            <th className="text-right px-3 py-2.5 font-semibold">نام کالا</th>
            <th className="text-center px-3 py-2.5 font-semibold w-20">تعداد</th>
            <th className="text-left px-3 py-2.5 font-semibold w-28">قیمت واحد</th>
            <th className="text-left px-3 py-2.5 font-semibold w-32">مجموع</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-3 py-2.5 text-slate-500 border-b border-slate-200">{idx + 1}</td>
              <td className="px-3 py-2.5 font-medium border-b border-slate-200">{item.name}</td>
              <td className="px-3 py-2.5 text-center border-b border-slate-200">{item.quantity}</td>
              <td className="px-3 py-2.5 text-left border-b border-slate-200">{fmt(item.unit_price)}</td>
              <td className="px-3 py-2.5 text-left font-bold border-b border-slate-200">{fmt(item.quantity * item.unit_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── Totals ─── */}
      <div className="flex justify-end mb-6">
        <div className="w-72 border border-slate-300 rounded-lg overflow-hidden">
          <div className="flex justify-between px-4 py-2.5 text-sm border-b border-slate-200">
            <span className="text-slate-600">جمع فرعی:</span>
            <span className="font-bold">{fmt(data.subtotal)} AFN</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between px-4 py-2.5 text-sm border-b border-slate-200 text-orange-600">
              <span>تخفیف:</span>
              <span className="font-bold">- {fmt(data.discount)} AFN</span>
            </div>
          )}
          <div className="flex justify-between px-4 py-2.5 text-sm border-b border-slate-200 font-bold">
            <span>مبلغ قابل پرداخت:</span>
            <span>{fmt(data.total)} AFN</span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm border-b border-slate-200">
            <span className="text-slate-600">پرداخت شده:</span>
            <span className="font-bold text-green-700">{fmt(data.paid_amount)} AFN</span>
          </div>
          {remaining > 0 ? (
            <div className="flex justify-between px-4 py-3 bg-red-50 text-red-700 font-bold text-sm">
              <span>باقی‌مانده:</span>
              <span>{fmt(remaining)} AFN</span>
            </div>
          ) : change > 0 ? (
            <div className="flex justify-between px-4 py-3 bg-blue-50 text-blue-700 font-bold text-sm">
              <span>باقی پول مشتری:</span>
              <span>{fmt(change)} AFN</span>
            </div>
          ) : (
            <div className="flex justify-between px-4 py-3 bg-green-50 text-green-700 font-bold text-sm">
              <span>وضعیت:</span>
              <span>تسویه شده &#10003;</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="text-center mt-10 pt-3 border-t border-dashed border-slate-300">
        <p className="text-sm text-slate-600 mb-1">از خرید شما متشکریم!</p>
        <p className="text-[10px] text-slate-400">
          این بل توسط سیستم مدیریت فروشگاه صادر شده است — {dateStr}
        </p>
      </div>
    </div>
  );
});

SaleBill.displayName = 'SaleBill';
export default SaleBill;
