import { PrismaClient, SystemRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Core Teams
  const teams = [
    { name: 'Tech', slug: 'tech', description: 'Engineering, software development, cloud, and open source.' },
    { name: 'Media', slug: 'media', description: 'Design, video production, photography, and brand assets.' },
    { name: 'Content', slug: 'content', description: 'Technical writing, blogs, social media content, and documentation.' },
  ];

  for (const team of teams) {
    await prisma.team.upsert({
      where: { slug: team.slug },
      update: { description: team.description },
      create: team,
    });
  }
  console.log('✅ Core teams (Tech, Media, Content) seeded.');

  // 2. Bootstrap System Owner if SYSTEM_OWNER_EMAIL is configured
  const ownerEmail = process.env.SYSTEM_OWNER_EMAIL;
  if (ownerEmail) {
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail.toLowerCase().trim() },
      update: { role: SystemRole.SYSTEM_OWNER },
      create: {
        email: ownerEmail.toLowerCase().trim(),
        name: 'Initial System Owner',
        role: SystemRole.SYSTEM_OWNER,
        position: 'System Administrator',
      },
    });
    console.log(`✅ System Owner bootstrapped for: ${owner.email}`);
  } else {
    console.log('ℹ️ SYSTEM_OWNER_EMAIL not set in environment. Skipping owner creation.');
  }

  console.log('🎉 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
