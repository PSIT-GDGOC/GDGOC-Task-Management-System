import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType, Role } from '../types/auth';
import { authApi } from '../services/api';
import { mockAuthService, isValidPresidentKey } from './mockAuthService';

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
      const emailLower = credentials.email.toLowerCase().trim();
      const isPresidentEmail =
        emailLower === 'adityarajput.86046@gmail.com' ||
        emailLower === 'gdgoc.psit@gmail.com' ||
        emailLower.includes('admin');

      if (
        pos.includes('president') ||
        pos.includes('secretary') ||
        pos.includes('organizer') ||
        isPresidentEmail
      ) {
        role = 'ADMIN';
      } else if (
        credentials.isTeamHead ||
        credentials.membershipStatus === 'CORE_MEMBER' ||
        pos.includes('lead')
      ) {
        role = 'TEAM_LEADER';
      }

      const assignedPosition = isPresidentEmail && !credentials.position ? 'President' : credentials.position;

      const name = credentials.name?.trim() || credentials.email.split('@')[0];
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
          assignedPosition,
          teamSlug,
          credentials.isTeamHead,
          credentials.invitationKey,
          credentials.isSignUp,
          credentials.password,
        );
        setUser(liveUser);
        localStorage.setItem('gdgoc_current_user', JSON.stringify(liveUser));
        if (credentials.name?.trim()) {
          localStorage.setItem(`gdgoc_name_confirmed_${liveUser.id}`, 'true');
        }
        return liveUser;
      } catch (err: any) {
        // If the backend actively rejected the request (e.g. 404 user not found, 409 already exists, 400 validation error),
        // rethrow immediately so the user sees the error and isn't silently logged in via mock!
        const msg = err?.message || '';
        const status = err?.status;
        if (
          (status && status >= 400 && status < 500) ||
          msg.includes('No account found') ||
          msg.includes('already exists') ||
          msg.includes('Incorrect password') ||
          msg.includes('deactivated') ||
          msg.includes('Only one') ||
          msg.includes('Invalid or expired')
        ) {
          // If the remote server rejected the key but it was generated locally in this browser's President Vault,
          // allow local preview login so the user is not blocked before remote deployment completes.
          if (
            msg.includes('Invalid or expired') &&
            credentials.invitationKey &&
            isValidPresidentKey(credentials.invitationKey)
          ) {
            console.info('[Auth] President key validated locally from browser registry; using preview session');
          } else {
            throw err;
          }
        }

        console.warn('[Auth] Live server dev-login unavailable; falling back to local preview session:', err);
        const fallbackUser = await mockAuthService.login(credentials);
        setUser(fallbackUser);
        if (credentials.name?.trim()) {
          localStorage.setItem(`gdgoc_name_confirmed_${fallbackUser.id}`, 'true');
        }
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

  const updateUserName = async (newName: string): Promise<void> => {
    const trimmed = newName.trim();
    if (!trimmed) throw new Error('Name cannot be empty');

    try {
      await authApi.updateName(trimmed);
    } catch (err) {
      console.warn('[Auth] Live server updateName failed; updating local session:', err);
    }

    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, name: trimmed };
      try {
        localStorage.setItem('gdgoc_current_user', JSON.stringify(updated));
        localStorage.setItem(`gdgoc_name_confirmed_${updated.id}`, 'true');
      } catch {
        // ignore
      }
      mockAuthService.updateStoredUser({ name: trimmed });
      return updated;
    });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUserName,
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
