import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineUsers,
  HiOutlineShoppingCart,
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineCalculator,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineSwitchHorizontal,
  HiOutlineBell,
  HiOutlineExclamationCircle,
  HiOutlineCurrencyDollar,
  HiOutlineChevronDown,
  HiOutlineClipboardList,
  HiOutlineLibrary,
  HiOutlineCog,
} from 'react-icons/hi';
import type { IconType } from 'react-icons';

interface LayoutProps { children: React.ReactNode; }

/* ─── Menu Structure ─── */
interface MenuItem {
  path: string;
  label: string;
  icon: IconType;
}

interface MenuGroup {
  key: string;
  label: string;
  icon: IconType;
  items: MenuItem[];
}

type NavEntry = { type: 'link'; item: MenuItem } | { type: 'group'; group: MenuGroup };

const navigation: NavEntry[] = [
  // Dashboard — standalone
  { type: 'link', item: { path: '/', label: 'داشبورد', icon: HiOutlineHome } },

  // Inventory
  { type: 'group', group: {
    key: 'inventory', label: 'انبار و محصولات', icon: HiOutlineCube,
    items: [
      { path: '/products', label: 'محصولات', icon: HiOutlineCube },
      { path: '/categories', label: 'دسته\u200Cبندی\u200Cها', icon: HiOutlineTag },
    ],
  }},

  // Buy & Sell
  { type: 'group', group: {
    key: 'transactions', label: 'خرید و فروش', icon: HiOutlineClipboardList,
    items: [
      { path: '/sales', label: 'فروش', icon: HiOutlineCash },
      { path: '/purchases', label: 'خریدها', icon: HiOutlineShoppingCart },
      { path: '/customers', label: 'مشتریان', icon: HiOutlineUsers },
      { path: '/suppliers', label: 'تامین\u200Cکنندگان', icon: HiOutlineTruck },
    ],
  }},

  // Finance
  { type: 'group', group: {
    key: 'finance', label: 'مالی', icon: HiOutlineLibrary,
    items: [
      { path: '/accounts', label: 'حساب\u200Cها', icon: HiOutlineCalculator },
      { path: '/expenses', label: 'مصارف', icon: HiOutlineCreditCard },
      { path: '/sarafis', label: 'صرافی\u200Cها', icon: HiOutlineSwitchHorizontal },
      { path: '/debts', label: 'بدهی‌ها و طلب‌ها', icon: HiOutlineExclamationCircle },
      { path: '/exchange-rates', label: 'نرخ ارزها', icon: HiOutlineCurrencyDollar },
    ],
  }},

  // HR
  { type: 'link', item: { path: '/employees', label: 'کارمندان', icon: HiOutlineUserGroup } },

  // Reports & Settings
  { type: 'group', group: {
    key: 'settings', label: 'گزارشات و تنظیمات', icon: HiOutlineCog,
    items: [
      { path: '/reports', label: 'گزارشات', icon: HiOutlineChartBar },
      { path: '/users', label: 'کاربران', icon: HiOutlineShieldCheck },
    ],
  }},
];

/* ─── Collapsible Group Component ─── */
function SidebarGroup({ group, closeSidebar }: { group: MenuGroup; closeSidebar: () => void }) {
  const location = useLocation();
  const isChildActive = group.items.some(item => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  });
  const [open, setOpen] = useState(isChildActive);

  // Auto-open when a child becomes active
  useEffect(() => { if (isChildActive) setOpen(true); }, [isChildActive]);

  return (
    <li>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
          isChildActive
            ? 'bg-slate-700/60 text-white font-medium'
            : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <group.icon className="w-5 h-5 shrink-0" />
          <span>{group.label}</span>
        </div>
        <HiOutlineChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Sub-items */}
      <ul className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 mt-1' : 'max-h-0'}`}>
        {group.items.map(item => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === '/'}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 pr-11 pl-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </li>
  );
}

/* ─── Main Layout ─── */
export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [debtCount, setDebtCount] = useState(0);

  useEffect(() => {
    const fetchCount = () => {
      api.get('/debts/count').then(r => setDebtCount(r.data.count)).catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeSidebar = () => setSidebarOpen(false);

  const roleLabels: Record<string, string> = {
    admin: 'مدیر سیستم', manager: 'مدیر فروشگاه', cashier: 'صندوقدار', employee: 'کارمند',
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-screen w-64 bg-slate-800 text-white z-50 flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white leading-relaxed">
            سیستم مدیریت فروشگاه
          </h1>
          <button onClick={closeSidebar} className="lg:hidden text-slate-400 hover:text-white">
            <HiOutlineX className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <ul className="space-y-1">
            {navigation.map((entry, idx) => {
              if (entry.type === 'link') {
                const item = entry.item;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                          isActive
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              } else {
                return (
                  <SidebarGroup key={entry.group.key} group={entry.group} closeSidebar={closeSidebar} />
                );
              }
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 text-center">نسخه ۱.۰.۰</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 hover:text-slate-800 p-1">
              <HiOutlineMenu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 hidden sm:block">
              سیستم مدیریت فروشگاه
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button onClick={() => navigate('/debts')}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="بدهی‌ها و طلب‌ها">
              <HiOutlineBell className="w-5 h-5" />
              {debtCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
                  {debtCount > 99 ? '99+' : debtCount}
                </span>
              )}
            </button>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-700">{user?.name || user?.username || 'کاربر'}</p>
              <p className="text-xs text-slate-500">{roleLabels[user?.role || ''] || user?.role || 'نامشخص'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {(user?.name || user?.username || 'ک').charAt(0)}
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              title="خروج">
              <HiOutlineLogout className="w-5 h-5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
