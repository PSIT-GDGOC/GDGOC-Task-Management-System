import { SystemRole } from '@prisma/client';

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  role: SystemRole;
  position?: string | null;
  githubUsername?: string | null;
}
