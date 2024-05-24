import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
const url = process.env.APP_ADMIN_URL;
async function main() {
  const text = await prisma.example.upsert({
    update: {},
    create: {
      text: `This is Trpc example text with edit from ${url}`,
    },
    where: { id: '65731bc5fce8c87e24fd4361' },
  });
  console.log({ text });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
