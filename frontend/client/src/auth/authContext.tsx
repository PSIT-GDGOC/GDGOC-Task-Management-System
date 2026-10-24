import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType, Role } from '../types/auth';
import { authApi } from '../services/api';
import { mockAuthService } from './mockAuthService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount from server or local storage
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        // 1. Try server session first
        const serverUser = await authApi.getCurrentUser();
        if (serverUser && isMounted) {
          setUser(serverUser);
          setIsLoading(false);
          return;
        }

        // 2. Fallback to local stored dev user
        const stored = mockAuthService.getStoredUser();
        if (stored && isMounted) {
          setUser(stored);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      let role: Role = 'MEMBER';
      const pos = credentials.position?.toLowerCase() || '';
      if (
        pos.includes('president') ||
        pos.includes('secretary') ||
        pos.includes('organizer') ||
        credentials.email.toLowerCase().includes('admin')
      ) {
        role = 'ADMIN';
      } else if (
        credentials.isTeamHead ||
        credentials.membershipStatus === 'CORE_MEMBER' ||
        pos.includes('lead')
      ) {
        role = 'TEAM_LEADER';
      }

      const name = credentials.email.split('@')[0];
      const teamSlug =
        credentials.teamSlug ||
        (credentials.team?.toLowerCase().includes('media')
          ? 'media'
          : credentials.team?.toLowerCase().includes('content')
            ? 'content'
            : 'tech');

      try {
        const liveUser = await authApi.loginDev(
          credentials.email,
          name,
          role,
          credentials.position,
          teamSlug,
          credentials.isTeamHead,
          credentials.invitationKey,
        );
        setUser(liveUser);
        localStorage.setItem('gdgoc_current_user', JSON.stringify(liveUser));
        return liveUser;
      } catch (err) {
        console.warn('[Auth] Live server dev-login unavailable; falling back to local preview session:', err);
        const fallbackUser = await mockAuthService.login(credentials);
        setUser(fallbackUser);
        return fallbackUser;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    mockAuthService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
