import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType, Role } from '../types/auth';
import { authApi } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Old preview identities must never authenticate a real session.
    localStorage.removeItem('gdgoc_current_user');
    authApi
      .getCurrentUser()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const position = credentials.position?.toLowerCase() || '';
    const role: Role =
      credentials.isTeamHead || position.includes('lead')
        ? 'TEAM_LEADER'
        : ['president', 'vice president', 'secretary', 'organizer'].includes(position)
          ? 'ADMIN'
          : 'MEMBER';
    const current = await authApi.loginDev(
      credentials.email.trim().toLowerCase(),
      credentials.isSignUp ? credentials.name?.trim() : undefined,
      role,
      credentials.position,
      credentials.teamSlug || credentials.team?.toLowerCase(),
      credentials.isTeamHead,
      credentials.invitationKey,
      credentials.isSignUp,
      credentials.password,
    );
    setUser(current);
    if (credentials.isSignUp && credentials.name?.trim())
      localStorage.setItem(`gdgoc_name_confirmed_${current.id}`, 'true');
    return current;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign out. Please try again.');
      throw err;
    }
    setAuthError(null);
    localStorage.removeItem('gdgoc_current_user');
    setUser(null);
  };

  const updateUserName = async (newName: string) => {
    const trimmed = newName.trim();
    if (trimmed.length < 2 || trimmed.length > 100)
      throw new Error('Name must be between 2 and 100 characters.');
    const result = await authApi.updateName(trimmed);
    setUser((previous) => (previous ? { ...previous, name: result.user.name } : null));
    if (user) localStorage.setItem(`gdgoc_name_confirmed_${user.id}`, 'true');
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUserName }}
    >
      {authError && (
        <div role="alert" className="bg-red-50 p-3 text-red-800">
          {authError}
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
