import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { User, LoginCredentials, AuthContextType, Role } from '../types/auth';
import { authApi } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [sessionError, setSessionError] = useState<string | null>(null);
  const mounted = useRef(false);
  const restoreVersion = useRef(0);
  const retrySession = useCallback(async () => {
    const version = ++restoreVersion.current;
    setIsLoading(true);
    setSessionError(null);
    try {
      const current = await authApi.getCurrentUser();
      if (mounted.current && version === restoreVersion.current) setUser(current);
    } catch (err) {
      if (mounted.current && version === restoreVersion.current)
        setSessionError(
          err instanceof Error ? err.message : 'The server is temporarily unavailable.',
        );
    } finally {
      if (mounted.current && version === restoreVersion.current) setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    try {
      localStorage.removeItem('gdgoc_current_user');
      localStorage.removeItem('gdgoc_taskflow_session_user');
    } catch {
      /* No preview identity is restored. */
    }
    void retrySession();
    const expireSession = () => {
      restoreVersion.current += 1;
      setIsLoading(false);
      setUser(null);
      setSessionError(null);
      setAuthError('Your session has expired. Please sign in again.');
    };
    window.addEventListener('taskhub:session-expired', expireSession);
    return () => {
      mounted.current = false;
      restoreVersion.current += 1;
      window.removeEventListener('taskhub:session-expired', expireSession);
    };
  }, [retrySession]);

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
    restoreVersion.current += 1;
    setUser(current);
    setIsLoading(false);
    setSessionError(null);
    setAuthError(null);
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
    restoreVersion.current += 1;
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
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sessionError,
        retrySession,
        login,
        logout,
        updateUserName,
      }}
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
