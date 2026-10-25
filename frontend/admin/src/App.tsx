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
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  // Check existing session on mount
  useEffect(() => {
    let active = true;
    localStorage.removeItem('gdgoc_admin_user');
    apiClient<{ success: boolean; user: any }>('/auth/me')
      .then((res) => {
        if (active) setUser(res.user || null);
      })
      .catch((err) => {
        if (active && err.statusCode !== 401) setSessionError(err.message);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const handleLoginSuccess = (current: any) => {
    setUser(current);
    setSessionError('');
  };

  const handleLogout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
      queryClient.clear();
      setUser(null);
    } catch (err: any) {
      setSessionError(err.message);
    }
  };
  if (checkingSession)
    return (
      <p role="status" className="p-6">
        Checking your session...
      </p>
    );
  if (sessionError && !user)
    return (
      <div role="alert" className="p-6">
        {sessionError}{' '}
        <button type="button" onClick={() => window.location.reload()}>
          Retry session check
        </button>
      </div>
    );

  return (
    <QueryClientProvider client={queryClient}>
      {sessionError && (
        <div role="alert" className="bg-red-50 p-3 text-red-800">
          {sessionError}
        </div>
      )}
      <BrowserRouter>
        <AppRouter user={user} onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
