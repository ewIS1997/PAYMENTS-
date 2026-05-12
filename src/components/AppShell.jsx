import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { IconHome, IconUsers, IconMoney, IconChart, IconSettings, IconLogout, IconPackage, IconSun, IconMoon } from './Icons';

const navItems = [
  { path: '/', label: 'الرئيسية', Icon: IconHome },
  { path: '/customers', label: 'العملاء', Icon: IconUsers },
  { path: '/collection', label: 'التحصيل', Icon: IconMoney },
  { path: '/products', label: 'المنتجات', Icon: IconPackage },
  { path: '/reports', label: 'التقارير', Icon: IconChart },
  { path: '/settings', label: 'الإعدادات', Icon: IconSettings },
];

export default function AppShell({ children }) {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 fixed right-0 top-0 bottom-0">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">نظام الأقساط</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around py-1 z-50 safe-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-1 py-1.5 min-w-0 min-h-[44px] justify-center transition-colors ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <item.Icon className="w-5 h-5" />
            <span className="text-[11px] leading-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mobile Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="md:hidden fixed top-4 left-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
        title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      >
        {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
      </button>
    </div>
  );
}
