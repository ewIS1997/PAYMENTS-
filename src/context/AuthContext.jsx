import { createContext, useContext, useEffect, useState } from 'react';
import { enableDemoMode } from '../firebase/demoMode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enableDemoMode();
    setLoading(false);
  }, []);

  const localLogin = (localUser) => {
    enableDemoMode();
    setUser({
      uid: localUser.uid,
      email: localUser.email,
      displayName: localUser.displayName,
      username: localUser.username,
      role: localUser.role,
    });
  };

  const logout = () => {
    setUser(null);
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
