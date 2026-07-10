import prisma from './config/db';

async function test() {
  try {
    console.log('Testing connection to database...');
    const usersCount = await prisma.user.count();
    console.log(`Connection successful! Total users in database: ${usersCount}`);
  } catch (error: any) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
