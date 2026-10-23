import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  try {
    await seedDatabase(prisma, process.env.SYSTEM_OWNER_EMAIL);
    console.log('Core teams seeded successfully.');
    console.log(
      process.env.SYSTEM_OWNER_EMAIL
        ? 'Configured system owner bootstrapped.'
        : 'SYSTEM_OWNER_EMAIL not set; owner bootstrap skipped.',
    );
  } catch {
    // Do not print connection strings or user data in database errors.
    console.error(
      'Database seed failed. Check database connectivity, migrations, and owner email.',
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
