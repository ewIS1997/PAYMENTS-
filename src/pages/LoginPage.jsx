import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { findLocalUser } from '../firebase/localUsers';
import { IconWarning, IconEye, IconEyeOff } from '../components/Icons';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { localLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);

    const found = findLocalUser(trimmedUser, trimmedPass);

    if (!found) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      setLoading(false);
      return;
    }

    localLogin(found);
    navigate('/');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'CapsLock') {
      setCapsLock(e.getModifierState('CapsLock'));
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'CapsLock') {
      setCapsLock(e.getModifierState('CapsLock'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">نظام إدارة الأقساط</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">قم بتسجيل الدخول للمتابعة</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
          <p className="text-amber-800 dark:text-amber-300 text-base text-center flex items-center justify-center gap-2">
            <IconWarning className="w-5 h-5 shrink-0" />
            وضع تجريبي — بيانات مخزنة محلياً
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              اسم المستخدم
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:opacity-60"
              placeholder="amr, ahmed, ewis ..."
              required
              dir="ltr"
              autoComplete="username"
              maxLength={50}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:opacity-60 ltr"
                placeholder="••••••••"
                required
                dir="ltr"
                autoComplete="current-password"
                maxLength={128}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1"
                tabIndex={-1}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
              </button>
            </div>
            {capsLock && (
              <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                <IconWarning className="w-4 h-4" />
                Caps Lock مفعل — كلمة المرور حساسة لحالة الأحرف
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-lg" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xl font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
