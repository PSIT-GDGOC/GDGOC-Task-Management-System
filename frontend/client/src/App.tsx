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
        <AppRouter
          user={user}
          onLoginSuccess={(u) => setUser(u)}
          onLogout={handleLogout}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
