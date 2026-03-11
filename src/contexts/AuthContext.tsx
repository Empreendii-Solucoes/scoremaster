'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ProfileType } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  profileType: ProfileType;
  theme: 'dark' | 'light';
  loading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ error?: string }>;
  setProfileType: (type: ProfileType) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  name: string;
  phone: string;
  profile_choice: string;
  cpf?: string;
  cnpj?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileType, setProfileType] = useState<ProfileType>('PF');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carrega usuário do localStorage ao montar
  useEffect(() => {
    const stored = localStorage.getItem('sm_user');
    const storedTheme = localStorage.getItem('sm_theme') as 'dark' | 'light' | null;
    const storedProfile = localStorage.getItem('sm_profile') as ProfileType | null;
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    if (storedTheme) setTheme(storedTheme);
    if (storedProfile) setProfileType(storedProfile);
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Erro ao fazer login.' };

    setUser(data.user);
    localStorage.setItem('sm_user', JSON.stringify(data.user));

    // Auto-select profile
    const profiles = data.user.profiles || {};
    const ptype: ProfileType = 'PF' in profiles ? 'PF' : 'PJ';
    setProfileType(ptype);
    localStorage.setItem('sm_profile', ptype);

    return {};
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    localStorage.removeItem('sm_user');
    localStorage.removeItem('sm_theme');
    localStorage.removeItem('sm_profile');
    router.push('/login');
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) return { error: result.error || 'Erro ao registrar.' };

    setUser(result.user);
    localStorage.setItem('sm_user', JSON.stringify(result.user));
    return {};
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`/api/users/${user.username}`);
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      localStorage.setItem('sm_user', JSON.stringify(updated));
    }
  }, [user]);

  const handleSetTheme = useCallback((t: 'dark' | 'light') => {
    setTheme(t);
    localStorage.setItem('sm_theme', t);
  }, []);

  const handleSetProfileType = useCallback((type: ProfileType) => {
    setProfileType(type);
    localStorage.setItem('sm_profile', type);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profileType,
      theme,
      loading,
      login,
      logout,
      register,
      setProfileType: handleSetProfileType,
      setTheme: handleSetTheme,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
