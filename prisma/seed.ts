import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { DEMO_USER_EMAIL, DEMO_USER_ID } from '../src/common/constants/demo-user';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg({
  connectionString,
  options: '-c timezone=UTC',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: DEMO_USER_EMAIL,
    },
    update: {
      id: DEMO_USER_ID,
    },
    create: {
      id: DEMO_USER_ID,
      email: DEMO_USER_EMAIL,
      displayName: 'OfferPath Demo User',
    },
  });

  console.log(`Seeded demo user: ${user.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
