import { PrismaClient, SystemRole } from '@prisma/client';
import { z } from 'zod';

const coreTeams = [
  {
    name: 'Tech Team',
    slug: 'tech',
    description: 'Engineering, software development, cloud infrastructure, and open-source campus projects.',
  },
  {
    name: 'Media Team',
    slug: 'media',
    description: 'UI/UX design, visual branding, motion graphics, video editing, and event coverage.',
  },
  {
    name: 'Content Team',
    slug: 'content',
    description: 'Technical writing, editorial, documentation, blogs, and social media storytelling.',
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
        await tx.team.upsert({
          where: { slug: team.slug },
          update: { name: team.name, description: team.description },
          create: team,
        });
      }

      if (normalizedEmail) {
        await tx.user.upsert({
          where: { email: normalizedEmail },
          update: { role: SystemRole.SYSTEM_OWNER, position: 'President' },
          create: {
            email: normalizedEmail,
            name: 'President',
            role: SystemRole.SYSTEM_OWNER,
            position: 'President',
          },
        });
      }
    },
    { maxWait: 15000, timeout: 30000 }
  );
}
