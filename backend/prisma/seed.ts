import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Find the first company (created during signup)
  const company = await prisma.company.findFirst();

  if (!company) {
    console.error('❌ No company found. Please sign up first to create a company.');
    process.exit(1);
  }

  console.log(`✅ Found company: ${company.name} (${company.id})\n`);

  // Check if users already exist (besides the admin)
  const existingUsers = await prisma.user.findMany({
    where: { companyId: company.id },
  });

  if (existingUsers.length > 1) {
    console.log(`⚠️  Found ${existingUsers.length} existing users. Skipping seed to avoid duplicates.`);
    console.log('   To re-seed, delete existing users first.\n');
    return;
  }

  console.log('Creating test users...\n');

  // Hash password for all test users (using simple password for testing)
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create managers
  const manager1 = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });
  console.log('✅ Created manager: Sarah Johnson');

  const manager2 = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Michael Chen',
      email: 'michael.chen@company.com',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });
  console.log('✅ Created manager: Michael Chen');

  const manager3 = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@company.com',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });
  console.log('✅ Created manager: Emily Rodriguez\n');

  // Create employees under Sarah Johnson
  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'John Smith',
      email: 'john.smith@company.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      managerId: manager1.id,
    },
  });
  console.log('✅ Created employee: John Smith (reports to Sarah)');

  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Alice Williams',
      email: 'alice.williams@company.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      managerId: manager1.id,
    },
  });
  console.log('✅ Created employee: Alice Williams (reports to Sarah)');

  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Bob Martinez',
      email: 'bob.martinez@company.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      managerId: manager1.id,
    },
  });
  console.log('✅ Created employee: Bob Martinez (reports to Sarah)\n');

  // Create employees under Michael Chen
  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'David Lee',
      email: 'david.lee@company.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      managerId: manager2.id,
    },
  });
  console.log('✅ Created employee: David Lee (reports to Michael)');

  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Emma Davis',
      email: 'emma.davis@company.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      managerId: manager2.id,
    },
  });
  console.log('✅ Created employee: Emma Davis (reports to Michael)');

  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Frank Wilson',
      email: 'frank.wilson@company.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      managerId: manager2.id,
    },
  });
  console.log('✅ Created employee: Frank Wilson (reports to Michael)\n');

  // Create employees under Emily Rodriguez
  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Grace Taylor',
      email: 'grace.taylor@company.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      managerId: manager3.id,
    },
  });
  console.log('✅ Created employee: Grace Taylor (reports to Emily)');

  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Henry Anderson',
      email: 'henry.anderson@company.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      managerId: manager3.id,
    },
  });
  console.log('✅ Created employee: Henry Anderson (reports to Emily)');

  // Get final count
  const totalUsers = await prisma.user.count({
    where: { companyId: company.id },
  });

  console.log('\n🎉 Seed completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   Company: ${company.name}`);
  console.log(`   Total Users: ${totalUsers}`);
  console.log(`   - Admins: ${existingUsers.length} (from signup)`);
  console.log(`   - Managers: 3`);
  console.log(`   - Employees: 8`);
  console.log(`\n🔑 All test users password: password123\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
