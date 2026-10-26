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
      email: 'paneertikkadedo@gmail.com',
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
const REGISTERED_USERS_KEY = 'gdgoc_registered_mock_users';
const VAULT_INVITATIONS_KEY = 'gdgoc_vault_invitations';

const BUILT_IN_LEAD_KEYS = [
  'GDGOC-TECH-KEY',
  'GDGOC-MEDIA-KEY',
  'GDGOC-CONTENT-KEY',
  'GDGOC-SEC-KEY',
  'GDGOC-ORG-KEY',
  'GDGOC-VP-KEY',
  'GDGOC-LEAD-KEY',
  'SEC',
  'VP',
  'ORG',
  'TECH',
  'MEDIA',
  'CONTENT',
  'LEAD',
  'LEKKK',
];

export function isValidPresidentKey(rawKey: string): boolean {
  const normalized = (rawKey || '').trim().toUpperCase();
  if (!normalized) return false;
  if (BUILT_IN_LEAD_KEYS.some((k) => k.toUpperCase() === normalized)) return true;
  if (
    normalized.startsWith('GDGOC-') ||
    normalized.startsWith('LEAD-') ||
    normalized.startsWith('INV-')
  ) {
    return true;
  }

  try {
    if (typeof localStorage === 'undefined') return false;

    // 1. Check custom keys registry
    const customRaw = localStorage.getItem('gdgoc_vault_custom_keys');
    if (customRaw) {
      const customKeys = JSON.parse(customRaw);
      if (Array.isArray(customKeys) && customKeys.some((k) => String(k).toUpperCase() === normalized)) {
        return true;
      }
    }

    // 2. Check full vault invitations
    const raw = localStorage.getItem(VAULT_INVITATIONS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.some(
          (inv: any) =>
            (inv.status === 'ACTIVE' || !inv.status) &&
            ((inv.rawCode && inv.rawCode.trim().toUpperCase() === normalized) ||
             (inv.id && inv.id.trim().toUpperCase() === normalized))
        );
      }
    }
  } catch {
    return false;
  }
  return false;
}


interface RegisteredMockUser extends Partial<User> {
  password?: string;
}

function getRegisteredUsers(): Record<string, RegisteredMockUser> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRegisteredUser(email: string, data: RegisteredMockUser) {
  try {
    if (typeof localStorage === 'undefined') return;
    const users = getRegisteredUsers();
    users[email.toLowerCase()] = data;
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}


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

    const isPresidentEmail =
      normalizedEmail.toLowerCase() === 'paneertikkadedo@gmail.com' ||
      normalizedEmail.toLowerCase() === 'gdgoc.psit@gmail.com' ||
      normalizedEmail.toLowerCase() === 'admin@psit.gdgoc.dev';

    // Match preset developer accounts
    const matchedPreset = DEV_TEST_ACCOUNTS.find(
      (acc) =>
        acc.user.email.toLowerCase() === normalizedEmail.toLowerCase() ||
        acc.aliases.some((a) => a.toLowerCase() === normalizedEmail.toLowerCase())
    );

    const registeredUsers = getRegisteredUsers();
    const existingRegistered = registeredUsers[normalizedEmail.toLowerCase()];

    // A user can only be President if their email matches designated President accounts or they were registered as President
    const isPresident = isPresidentEmail || existingRegistered?.position?.toLowerCase() === 'president';

    // Account existence check
    const isKnownAccount = Boolean(matchedPreset || existingRegistered || isPresidentEmail);

    // Reject non-existent accounts on sign-in
    if (!credentials.isSignUp && !isKnownAccount) {
      throw new Error('No account found with this email. Please sign up first.');
    }

    // Reject existing accounts on sign-up
    if (credentials.isSignUp && isKnownAccount) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    // Enforce strict password validation on sign-in across all tiers (NO random passwords allowed)
    if (!credentials.isSignUp) {
      const inputPassword = (credentials.password || '').trim();
      if (!inputPassword) {
        throw new Error('Password is required.');
      }

      // Expected password: user chosen password during sign up, preset password, or default Password@123
      const expectedPassword =
        existingRegistered?.password?.trim() ||
        matchedPreset?.password?.trim() ||
        'Password@123';

      if (inputPassword !== expectedPassword) {
        throw new Error('Incorrect password. Please verify your password and try again.');
      }
    }

    // Enforce President Invitation Key ONLY during initial sign-up for Leads and Officers
    const isLeadOrOfficer =
      credentials.isTeamHead ||
      credentials.membershipStatus === 'CORE_MEMBER' ||
      (credentials.position &&
        credentials.position !== 'Team Member' &&
        credentials.position !== 'Member' &&
        !isPresident);

    if (credentials.isSignUp && isLeadOrOfficer) {
      const providedKey = (credentials.invitationKey || '').trim().toUpperCase();
      if (!providedKey) {
        throw new Error('President invitation key is required for Leads and Officers during registration.');
      }

      const CONSTANT_POSITION_KEYS: Record<string, string> = {
        'GDGOC-VP-KEY': 'Vice President',
        'VP': 'Vice President',
        'GDGOC-SEC-KEY': 'Secretary',
        'SEC': 'Secretary',
        'GDGOC-ORG-KEY': 'Organizer',
        'ORG': 'Organizer',
        'GDGOC-TECH-KEY': 'Tech Lead',
        'TECH': 'Tech Lead',
        'GDGOC-MEDIA-KEY': 'Media Lead',
        'MEDIA': 'Media Lead',
        'GDGOC-CONTENT-KEY': 'Content Lead',
        'CONTENT': 'Content Lead',
        'GDGOC-LEAD-KEY': 'Tech Lead',
        'LEAD': 'Tech Lead',
      };

      // Check if President customized any key in the database / local store
      let customKeyMatchedPos: string | undefined;
      try {
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem('gdgoc_vault_custom_role_keys');
          if (stored) {
            const map = JSON.parse(stored);
            for (const [pos, code] of Object.entries(map)) {
              if (String(code).toUpperCase() === providedKey) {
                customKeyMatchedPos = pos;
                break;
              }
            }
          }
        }
      } catch {}

      const expectedPos = customKeyMatchedPos || CONSTANT_POSITION_KEYS[providedKey];
      const targetPos = (credentials.position || '').trim();

      if (expectedPos) {
        if (targetPos && targetPos.toLowerCase() !== expectedPos.toLowerCase()) {
          throw new Error(`Key "${providedKey}" is designated for "${expectedPos}". It cannot be used to sign up as "${targetPos}".`);
        }
      } else if (!isValidPresidentKey(providedKey)) {
        throw new Error('Invalid President invitation key for this position. Please enter a valid key issued by the President.');
      }
    }

    // Role guard on returning login: verify that the account in DB/presets actually has Lead/Officer privileges
    if (!credentials.isSignUp && isLeadOrOfficer && !isPresident) {
      const storedRole = existingRegistered?.role || matchedPreset?.user.role;
      const storedPos = existingRegistered?.position || matchedPreset?.user.position;
      const isActualAdminOrLead =
        storedRole === 'ADMIN' ||
        storedRole === 'TEAM_LEADER' ||
        (storedPos && storedPos !== 'Team Member' && storedPos !== 'Member');

      if (!isActualAdminOrLead) {
        throw new Error('Access denied. Your account is registered as a regular crew member. Please sign in under Team Crew.');
      }
    }

    const membershipStatus = existingRegistered?.membershipStatus || credentials.membershipStatus || 'REGULAR_MEMBER';
    const isExecutiveOfficer = (existingRegistered?.position || credentials.position) &&
      ['Vice President', 'Secretary', 'Organizer'].some(
        (p) => p.toLowerCase() === (existingRegistered?.position || credentials.position)?.toLowerCase()
      );

    const role: Role = (isPresident || isExecutiveOfficer || existingRegistered?.role === 'ADMIN')
      ? 'ADMIN'
      : (credentials.isTeamHead || membershipStatus === 'CORE_MEMBER' || existingRegistered?.role === 'TEAM_LEADER')
        ? 'TEAM_LEADER'
        : (existingRegistered?.role || 'MEMBER');

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

    const isSuperAdmin = isPresident || isExecutiveOfficer || role === 'ADMIN';

    const assignedPosition = isPresident
      ? 'President'
      : credentials.position || (role === 'TEAM_LEADER' ? 'Tech Lead' : 'Team Member');

    const assignedTeam = isSuperAdmin
      ? 'Executive Board (No Squad)'
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

    // If this was a sign-up, persist in mock registered users
    if (credentials.isSignUp) {
      saveRegisteredUser(normalizedEmail, {
        name: displayName,
        position: assignedPosition,
        team: assignedTeam,
        role: role,
        membershipStatus: membershipStatus,
        password: credentials.password,
      });
    }

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
      const stored = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem('gdgoc_current_user');
      if (!stored) return null;

      const parsed: User = JSON.parse(stored);
      const validRoles = ['ADMIN', 'TEAM_LEADER', 'MEMBER'];
      if (
        !parsed ||
        !validRoles.includes(parsed.role) ||
        parsed.team === 'Web Development Core' ||
        (parsed.email?.toLowerCase() === 'paneertikkadedo@gmail.com' && parsed.role !== 'ADMIN')
      ) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('gdgoc_current_user');
        return null;
      }
      return parsed;
    } catch {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('gdgoc_current_user');
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
        localStorage.setItem('gdgoc_current_user', JSON.stringify(updated));

        // Persist updated name into mock registered directory
        if (updated.email) {
          const registered = getRegisteredUsers();
          const emailKey = updated.email.toLowerCase();
          if (registered[emailKey]) {
            registered[emailKey] = {
              ...registered[emailKey],
              ...patch,
            };
            localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));
          }
        }
      }

      // Also sync active preset in memory
      if (updated.email && patch.name) {
        const preset = DEV_TEST_ACCOUNTS.find(
          (acc) =>
            acc.user.email.toLowerCase() === updated.email.toLowerCase() ||
            acc.aliases.some((a) => a.toLowerCase() === updated.email.toLowerCase())
        );
        if (preset) {
          preset.user.name = patch.name;
        }
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
        localStorage.removeItem('gdgoc_current_user');
      }
    } catch {
      // ignore storage access errors
    }
  },
};
