import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext(null);

const isFirebaseConfigured = import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here'
  && import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'your_project_id';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setUser({
        uid: 'demo-user',
        email: 'demo@installment.app',
        displayName: 'مستخدم تجريبي',
        isDemo: true,
      });
      setIsDemo(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsDemo(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginDemo = () => {
    setUser({
      uid: 'demo-user',
      email: 'demo@installment.app',
      displayName: 'مستخدم تجريبي',
      isDemo: true,
    });
    setIsDemo(true);
    setLoading(false);
  };

  const logout = async () => {
    if (isDemo) {
      setUser(null);
      setIsDemo(false);
      return;
    }
    try {
      await signOut(auth);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, loginDemo, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
