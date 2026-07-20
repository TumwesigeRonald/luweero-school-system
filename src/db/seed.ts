import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function seed() {
  // Dynamically import db AFTER dotenv has populated process.env
  const { db } = await import('./index');
  const { teachers } = await import('./schema');
  const bcrypt = (await import('bcryptjs')).default;

  console.log('Seeding initial teacher user...');

  // Hash password "password123"
  const passwordHash = await bcrypt.hash('password123', 10);

  // Insert main teacher account
  await db.insert(teachers).values({
    fullName: 'Admin Teacher',
    email: 'admin@school.com',
    passwordHash: passwordHash,
    role: 'admin',
    isActive: true,
  }).onConflictDoNothing();

  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});