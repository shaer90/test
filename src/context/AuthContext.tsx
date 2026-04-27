import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

export interface User {
  _id: string;
  username: string;
  name: string;
  phone: string;
  role: 'customer' | 'member' | 'super_admin' | 'admin';
  subscriberCode?: string;
  sponsorCode?: string;
  availableCommission?: number;
  totalCommission?: number;
  country?: string;
  city?: string;
  isVerified?: boolean;
  verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  username: string;
  name: string;
  phone: string;
  password: string;
  role: 'customer' | 'member';
  sponsorCode?: string;
  country?: string;
  city?: string;
  ageGroup?: string;
  reminderEnabled?: boolean;
  lastPeriodDate?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to restore session from httpOnly cookie
  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      const u = (res.data as { user?: User | null }).user;
      setUser(u ?? null);
    } catch {
      setUser(null);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await authAPI.login({ username, password });
    setUser(res.data.user);
  };

  const register = async (data: RegisterData) => {
    const res = await authAPI.register(data);
    setUser(res.data.user);
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    setUser(null);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    await authAPI.changePassword({ currentPassword, newPassword });
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updatePassword, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
