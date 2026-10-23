import { PrismaClient, SystemRole } from '@prisma/client';
import { z } from 'zod';

const coreTeams = [
  {
    name: 'Tech',
    slug: 'tech',
    description: 'Engineering, software development, cloud, and open source.',
  },
  {
    name: 'Media',
    slug: 'media',
    description: 'Design, video production, photography, and brand assets.',
  },
  {
    name: 'Content',
    slug: 'content',
    description: 'Technical writing, blogs, social media content, and documentation.',
  },
];

/** Safe to rerun: retain existing profiles, memberships, and team customization. */
export async function seedDatabase(prisma: PrismaClient, ownerEmail?: string) {
  const normalizedEmail =
    ownerEmail === undefined
      ? undefined
      : z.string().trim().toLowerCase().email().parse(ownerEmail);

  return prisma.$transaction(
    async (tx) => {
      for (const team of coreTeams) {
        await tx.team.upsert({ where: { slug: team.slug }, update: {}, create: team });
      }

      if (normalizedEmail) {
        await tx.user.upsert({
          where: { email: normalizedEmail },
          update: { role: SystemRole.SYSTEM_OWNER },
          create: {
            email: normalizedEmail,
            name: 'Initial System Owner',
            role: SystemRole.SYSTEM_OWNER,
            position: 'System Administrator',
          },
        });
      }
    },
    { maxWait: 15000, timeout: 30000 }
  );
}
