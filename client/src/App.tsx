import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { BoardPage } from './pages/BoardPage';
import { LoginPage } from './pages/LoginPage';
import { ContributionHistoryPage } from './pages/ContributionHistoryPage';
import { apiClient } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export const App: React.FC = () => {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  // Check existing session on mount
  useEffect(() => {
    apiClient<{ success: boolean; user: any }>('/auth/me')
      .then((res) => {
        if (res.user) setUser(res.user);
      })
      .catch(() => {
        // Not logged in or dev mode
      });
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
            <Route index element={<BoardPage />} />
            <Route path="history" element={<ContributionHistoryPage user={user} />} />
            <Route path="login" element={<LoginPage onLoginSuccess={(u) => setUser(u)} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
