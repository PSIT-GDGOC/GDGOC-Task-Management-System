import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './router';
import { apiClient } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

const ADMIN_STORAGE_KEY = 'gdgoc_admin_user';

export const App: React.FC = () => {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Check existing session on mount
  useEffect(() => {
    apiClient<{ success: boolean; user: any }>('/auth/me')
      .then((res) => {
        if (res.user) {
          setUser(res.user);
          try {
            localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(res.user));
          } catch {}
        }
      })
      .catch(() => {
        // Not logged in or dev mode
      });
  }, []);

  const handleLoginSuccess = (u: any) => {
    setUser(u);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(u));
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      try {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      } catch {}
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter
          user={user}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
