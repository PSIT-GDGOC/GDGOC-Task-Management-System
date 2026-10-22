export type Role = 'ADMIN' | 'TEAM_LEADER' | 'MEMBER';

export type MembershipStatus = 'CORE_MEMBER' | 'REGULAR_MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  membershipStatus?: MembershipStatus;
  team?: string;
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  membershipStatus?: MembershipStatus;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
}
