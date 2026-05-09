import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconHome, IconUsers, IconMoney, IconReceipt, IconChart, IconSettings, IconLogout, IconPackage } from './Icons';

const navItems = [
  { path: '/', label: 'الرئيسية', Icon: IconHome },
  { path: '/customers', label: 'العملاء', Icon: IconUsers },
  { path: '/collection', label: 'التحصيل', Icon: IconMoney },
  { path: '/products', label: 'المنتجات', Icon: IconPackage },
  { path: '/receipts', label: 'الإيصالات', Icon: IconReceipt },
  { path: '/reports', label: 'التقارير', Icon: IconChart },
  { path: '/settings', label: 'الإعدادات', Icon: IconSettings },
];

export default function AppShell({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-l border-gray-200 fixed right-0 top-0 bottom-0">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">نظام الأقساط</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-lg text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <IconLogout className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:mr-64 pb-24 md:pb-0">
        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-1 z-50 safe-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-1 py-1.5 min-w-0 min-h-[44px] justify-center transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <item.Icon className="w-5 h-5" />
            <span className="text-[11px] leading-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
