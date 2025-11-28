import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hydrate from localStorage
    try {
      const savedUser = localStorage.getItem('user');
      const isAuth = localStorage.getItem('isAuthenticated');
      if (savedUser && isAuth === 'true') {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (e) {
      console.error('AuthProvider: failed to read localStorage', e);
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendOtp = async (email: string) => {
    try {
      await authAPI.sendOtp(email);
      // backend should send OTP to email; no further action here
    } catch (err: any) {
      console.error('AuthProvider.sendOtp failed:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to send OTP. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const verifyOtp = async (email: string, code: string) => {
    try {
      const res = await authAPI.verifyOtp(email, code);

      // Expect backend to return success and optionally user_id/token
      // Adjust parsing below to match your backend response shape
      const success = res.data?.status ?? (res.data?.success ?? true);
      if (!success) {
        const errorMessage = res.data?.message || 'OTP verification failed.';
        throw new Error(errorMessage);
      }

      const userData: User = {
        id: res.data?.user_id || res.data?.id || '',
        email
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      // optionally store token if backend returns one
      if (res.data?.token) {
        localStorage.setItem('authToken', res.data.token);
      }
      localStorage.setItem('isAuthenticated', 'true');
    } catch (err: any) {
      console.error('AuthProvider.verifyOtp failed:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Invalid OTP. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');

    // Best-effort server logout (if endpoint exists)
    const apiUrl = import.meta.env.VITE_API_URL || 'https://islamicdecotweb.onrender.com';
    fetch(`${apiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch((err) => {
      console.warn('Logout server call failed:', err);
      // ignore
    });

    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      sendOtp,
      verifyOtp,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}