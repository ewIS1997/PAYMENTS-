import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { IconWarning } from '../components/Icons';

const isFirebaseConfigured = import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here'
  && import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'your_project_id';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginDemo } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isFirebaseConfigured) {
      setError('Firebase غير مُعد — استخدم زر "تجربة بدون تسجيل دخول"');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صالح');
      } else if (err.code === 'auth/too-many-requests') {
        setError('تم حظر الحساب مؤقتاً بسبب محاولات تسجيل دخول متعددة فاشلة');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginDemo();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">نظام إدارة الأقساط</h1>
          <p className="text-gray-500 text-lg">قم بتسجيل الدخول للمتابعة</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-base text-center flex items-center justify-center gap-2">
              <IconWarning className="w-5 h-5" />
              وضع تجريبي — Firebase غير مُعد
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="example@email.com"
              required
              dir="ltr"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="••••••••"
              required
              dir="ltr"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xl font-semibold py-4 rounded-lg transition-colors"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleDemoLogin}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-semibold py-4 rounded-lg transition-colors border border-gray-300"
          >
            تجربة بدون تسجيل دخول
          </button>
        </div>
      </div>
    </div>
  );
}
