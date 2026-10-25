export type Role = 'ADMIN' | 'TEAM_LEADER' | 'MEMBER';

export type MembershipStatus = 'CORE_MEMBER' | 'REGULAR_MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  position?: string;
  membershipStatus?: MembershipStatus;
  team?: string;
  avatarUrl?: string;
  isTeamHead?: boolean;
}

export interface LoginCredentials {
  email: string;
  name?: string;
  password?: string;
  membershipStatus?: MembershipStatus;
  position?: string;
  team?: string;
  teamSlug?: string;
  isTeamHead?: boolean;
  invitationKey?: string;
  rememberMe?: boolean;
  isSignUp?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
}
