import { User, LoginCredentials, Role } from '../types/auth';

/**
 * ============================================================================
 * TEMPORARY FRONTEND DEVELOPMENT AUTHENTICATION ADAPTER
 * ============================================================================
 * Notice: This adapter is strictly for temporary frontend preview and testing.
 * 
 * In this development preview mode:
 * - Any syntactically valid email is accepted without requiring registration in
 *   a predefined directory or database.
 * - The answer to "Are you a GDGoC PSIT core member?" determines which interface
 *   opens for preview:
 *     - "Yes, I'm a core member" (CORE_MEMBER) -> Opens Team Leader / Core Member interface
 *     - "No, I'm a regular member" (REGULAR_MEMBER) -> Opens Regular Member interface
 * - Passwords are NEVER saved in storage or sent to any server.
 * - This temporary preview bypass is restricted to development mode and will be
 *   replaced by real backend authentication, database, and JWT authorization.
 * ============================================================================
 */

export interface DevAccount {
  user: User;
  aliases: string[];
  password: string;
  label: string;
  description: string;
}

export const DEV_TEST_ACCOUNTS: DevAccount[] = [
  {
    user: {
      id: 'usr_president_01',
      name: 'Aditya Rajput',
      email: 'adityarajput.86046@gmail.com',
      role: 'ADMIN',
      position: 'President',
      membershipStatus: 'CORE_MEMBER',
      team: 'Executive Core',
    },
    aliases: ['admin@psit.gdgoc.dev', 'gdgoc.psit@gmail.com'],
    password: 'Password@123',
    label: 'President Console',
    description: 'Executive Chapter President & Super Admin',
  },
  {
    user: {
      id: 'usr_leader_01',
      name: 'Aman Verma',
      email: 'leader@psit.gdgoc.dev',
      role: 'TEAM_LEADER',
      position: 'Tech Lead',
      membershipStatus: 'CORE_MEMBER',
      team: 'Tech',
    },
    aliases: ['leader@gmail.com', 'core@psit.gdgoc.dev'],
    password: 'Password@123',
    label: 'Squad Lead Preview',
    description: 'Preview Team Leader & Squad Lead workspace',
  },
  {
    user: {
      id: 'usr_member_01',
      name: 'Rohan Gupta',
      email: 'member@psit.gdgoc.dev',
      role: 'MEMBER',
      position: 'Team Member',
      membershipStatus: 'REGULAR_MEMBER',
      team: 'Tech',
    },
    aliases: ['member@gmail.com', 'regular@psit.gdgoc.dev'],
    password: 'Password@123',
    label: 'Regular Member Preview',
    description: 'Preview Regular Member task board',
  },
];

const AUTH_STORAGE_KEY = 'gdgoc_taskflow_session_user';

export const mockAuthService = {
  /**
   * Authenticate any syntactically valid email for frontend preview
   */
  async login(credentials: LoginCredentials): Promise<User> {
    // Simulate brief network latency for realistic loading state
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Security check: restrict temporary preview bypass to development mode
    const isDev =
      typeof import.meta !== 'undefined' && import.meta.env
        ? import.meta.env.DEV
        : typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

    if (!isDev) {
      throw new Error('Production authentication requires backend API integration.');
    }

    const normalizedEmail = credentials.email.trim();
    if (!normalizedEmail) {
      throw new Error('Email address is required.');
    }

    // Determine preview role strictly from the selected membership status and email
    const isPresident =
      normalizedEmail.toLowerCase() === 'adityarajput.86046@gmail.com' ||
      normalizedEmail.toLowerCase() === 'gdgoc.psit@gmail.com' ||
      credentials.position?.toLowerCase().includes('president') ||
      credentials.email.toLowerCase().includes('admin');

    const membershipStatus = credentials.membershipStatus || 'REGULAR_MEMBER';
    const role: Role = isPresident
      ? 'ADMIN'
      : membershipStatus === 'CORE_MEMBER'
        ? 'TEAM_LEADER'
        : 'MEMBER';

    // Derive display name from email prefix (e.g. "alex.kumar@gmail.com" -> "Alex Kumar")
    const matchedPreset = DEV_TEST_ACCOUNTS.find(
      (acc) =>
        acc.user.email.toLowerCase() === normalizedEmail.toLowerCase() ||
        acc.aliases.some((a) => a.toLowerCase() === normalizedEmail.toLowerCase())
    );

    let displayName = credentials.name?.trim() || matchedPreset?.user.name;
    if (!displayName) {
      const emailPrefix = normalizedEmail.split('@')[0] || 'Member';
      displayName = emailPrefix
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
      if (!displayName) displayName = role === 'ADMIN' ? 'President' : role === 'TEAM_LEADER' ? 'Tech Lead' : 'Regular Member';
    }

    const assignedPosition = isPresident
      ? 'President'
      : credentials.position || (role === 'TEAM_LEADER' ? 'Tech Lead' : 'Team Member');

    const assignedTeam = isPresident
      ? 'Executive Core'
      : credentials.team || (credentials.teamSlug ? credentials.teamSlug.toUpperCase() : 'Tech');

    const sessionUser: User = {
      id: isPresident ? 'usr_president_01' : role === 'TEAM_LEADER' ? 'usr_leader_01' : 'usr_member_01',
      name: displayName,
      email: normalizedEmail,
      role: role,
      position: assignedPosition,
      membershipStatus: membershipStatus,
      team: assignedTeam,
    };

    // Store non-sensitive session metadata for refresh persistence
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      }
    } catch {
      // Storage access may be restricted in private/incognito modes
    }

    return sessionUser;
  },

  /**
   * Retrieve active session user from local storage
   */
  getStoredUser(): User | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;

      const parsed: User = JSON.parse(stored);
      const validRoles = ['ADMIN', 'TEAM_LEADER', 'MEMBER'];
      if (
        !parsed ||
        !validRoles.includes(parsed.role) ||
        parsed.team === 'Web Development Core' ||
        (parsed.email?.toLowerCase() === 'adityarajput.86046@gmail.com' && parsed.role !== 'ADMIN')
      ) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return null;
    }
  },

  /**
   * Terminate current session
   */
  updateStoredUser(patch: Partial<User>): User | null {
    const current = this.getStoredUser();
    if (!current) return null;
    const updated = { ...current, ...patch };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {
      // Storage access may be restricted
    }
    return updated;
  },

  logout(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore storage access errors
    }
  },
};
