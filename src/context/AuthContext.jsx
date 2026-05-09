import { createContext, useContext, useEffect, useState } from 'react';
import { enableDemoMode } from '../firebase/demoMode';

const AuthContext = createContext(null);

const STORAGE_KEY = 'app_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enableDemoMode();
    
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const localLogin = (localUser) => {
    enableDemoMode();
    const userData = {
      uid: localUser.uid,
      email: localUser.email,
      displayName: localUser.displayName,
      username: localUser.username,
      role: localUser.role,
    };
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, localLogin }}>
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
