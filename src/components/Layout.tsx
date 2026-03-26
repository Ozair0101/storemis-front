import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
} from 'react-icons/hi';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'داشبورد', icon: HiOutlineHome },
  { path: '/products', label: 'محصولات', icon: HiOutlineCube },
  { path: '/categories', label: 'دسته\u200Cبندی\u200Cها', icon: HiOutlineTag },
  { path: '/suppliers', label: 'تامین\u200Cکنندگان', icon: HiOutlineTruck },
  { path: '/customers', label: 'مشتریان', icon: HiOutlineUsers },
  { path: '/purchases', label: 'خریدها', icon: HiOutlineShoppingCart },
  { path: '/sales', label: 'فروش', icon: HiOutlineCash },
  { path: '/expenses', label: 'مصارف', icon: HiOutlineCreditCard },
  { path: '/sarafis', label: 'صرافی\u200Cها', icon: HiOutlineSwitchHorizontal },
  { path: '/accounts', label: 'حساب\u200Cها', icon: HiOutlineCalculator },
  { path: '/employees', label: 'کارمندان', icon: HiOutlineUserGroup },
  { path: '/reports', label: 'گزارشات', icon: HiOutlineChartBar },
  { path: '/users', label: 'کاربران', icon: HiOutlineShieldCheck },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels: Record<string, string> = {
    admin: 'مدیر سیستم',
    manager: 'مدیر فروشگاه',
    cashier: 'صندوقدار',
    employee: 'کارمند',
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 min-h-screen w-64 bg-slate-800 text-white z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white leading-relaxed">
            سیستم مدیریت فروشگاه
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <HiOutlineX className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setSidebarOpen(false)}
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
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 text-center">
            نسخه ۱.۰.۰
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-800 p-1"
            >
              <HiOutlineMenu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 hidden sm:block">
              سیستم مدیریت فروشگاه
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-sm font-medium text-slate-700">
                {user?.name || user?.username || 'کاربر'}
              </p>
              <p className="text-xs text-slate-500">
                {roleLabels[user?.role || ''] || user?.role || 'نامشخص'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {(user?.name || user?.username || 'ک').charAt(0)}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              title="خروج"
            >
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
