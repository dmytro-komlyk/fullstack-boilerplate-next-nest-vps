import { hash } from 'bcryptjs';
import 'dotenv/config';
import { prisma } from './src/index.ts';

async function main() {
  const email = process.env.APP_SUPER_ADMIN_EMAIL;
  const password = process.env.APP_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Missing APP_SUPER_ADMIN_EMAIL or APP_SUPER_ADMIN_PASSWORD in .env');
  }

  const hashedPassword = await hash(password, 12);

  console.log(`🚀 Seeding admin: ${email}...`);

  await prisma.user.upsert({
    where: { email: email },
    update: {
      role: 'SUPER_ADMIN',
    },
    create: {
      email: email,
      password: hashedPassword,
      nickName: 'Admin',
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
      forcePasswordChange: true,
      isTwoFactorEnabled: false,
      twoFactorSetupPending: true,
    },
  });
}

main()
  .then(() => {
    console.log('✅ Seed success: Super Admin created or already exists.');
  })
  .catch((e) => {
    console.error('❌ Seed failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
