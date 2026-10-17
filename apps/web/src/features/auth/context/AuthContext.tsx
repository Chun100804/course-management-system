import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { UserRole } from '@cms/shared';
import axios from 'axios';
import { apiClient } from '../../../lib/axios';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isRestoring: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const value = localStorage.getItem('cms_user');
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    localStorage.removeItem('cms_user');
    localStorage.removeItem('cms_token');
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [isRestoring, setIsRestoring] = useState(() => Boolean(localStorage.getItem('cms_token')));

  useEffect(() => {
    if (!localStorage.getItem('cms_token')) {
      setIsRestoring(false);
      return;
    }
    apiClient.get<{ data: AuthUser }>('/users/me')
      .then(({ data }) => {
        setUser(data.data);
        localStorage.setItem('cms_user', JSON.stringify(data.data));
      })
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('cms_token');
          localStorage.removeItem('cms_user');
          setUser(null);
        }
      })
      .finally(() => setIsRestoring(false));
  }, []);

  async function authenticate(path: string, body: Record<string, string>): Promise<AuthUser> {
    const { data } = await apiClient.post<{ data: { token: string; user: AuthUser } }>(`/auth/${path}`, body);
    localStorage.setItem('cms_token', data.data.token);
    localStorage.setItem('cms_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isRestoring,
    signIn: (email, password) => authenticate('login', { email, password }),
    signUp: (name, email, password) => authenticate('register', { name, email, password }),
    logout: () => {
      localStorage.removeItem('cms_token');
      localStorage.removeItem('cms_user');
      setUser(null);
    },
  }), [user, isRestoring]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
