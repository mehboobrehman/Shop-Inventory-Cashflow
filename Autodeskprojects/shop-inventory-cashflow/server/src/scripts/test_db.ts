import { prisma } from '../lib/prisma';

async function testConnection() {
  console.log('Testing database connectivity...');
  try {
    // Attempt to query the database
    // Using a simple query that doesn't depend on specific tables yet if possible, 
    // but Prisma needs to know the models.
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Total users in database: ${userCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
