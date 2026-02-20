import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Supabase-compatible database seed...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized\n');

  // Find the first company (created during signup)
  const company = await prisma.company.findFirst();

  if (!company) {
    console.error('❌ No company found. Please sign up first to create a company.');
    process.exit(1);
  }

  // TypeScript null check satisfied
  const companyId = company.id;
  const companyName = company.name;

  console.log(`✅ Found company: ${companyName} (${companyId})\n`);

  // Check if users already exist (besides the admin)
  const existingUsers = await prisma.user.findMany({
    where: { companyId: companyId },
  });

  if (existingUsers.length > 1) {
    console.log(`⚠️  Found ${existingUsers.length} existing users. Skipping seed to avoid duplicates.`);
    console.log('   To re-seed, delete existing users first.\n');
    return;
  }

  console.log('Creating test users in Supabase Auth and local database...\n');

  const testPassword = 'password123';
  const createdUsers: any[] = [];

  // Helper function to create user in both Supabase and local DB
  async function createUser(
    name: string,
    email: string,
    role: 'MANAGER' | 'EMPLOYEE',
    managerId?: string,
  ) {
    try {
      // 1. Create in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: testPassword,
        email_confirm: true, // Auto-confirm
      });

      if (authError || !authData.user) {
        console.error(`   ❌ Supabase auth failed for ${email}:`, authError?.message);
        return null;
      }

      // 2. Create in local database
      const user = await prisma.user.create({
        data: {
          id: authData.user.id, // Use Supabase user ID
          companyId: companyId,
          name,
          email,
          password: '', // Password managed by Supabase
          role,
          managerId,
        },
      });

      console.log(`✅ Created ${role.toLowerCase()}: ${name} (${email})`);
      return user;
    } catch (error: any) {
      console.error(`   ❌ Failed to create ${name}:`, error.message);
      return null;
    }
  }

  // Create managers
  const manager1 = await createUser('Sarah Johnson', 'sarah.johnson@company.com', 'MANAGER');
  const manager2 = await createUser('Michael Chen', 'michael.chen@company.com', 'MANAGER');
  const manager3 = await createUser('Emily Rodriguez', 'emily.rodriguez@company.com', 'MANAGER');

  console.log('');

  if (!manager1 || !manager2 || !manager3) {
    console.error('❌ Failed to create managers. Aborting seed.');
    process.exit(1);
  }

  // Create employees under Sarah Johnson
  await createUser('John Smith', 'john.smith@company.com', 'EMPLOYEE', manager1.id);
  await createUser('Alice Williams', 'alice.williams@company.com', 'EMPLOYEE', manager1.id);
  await createUser('Bob Martinez', 'bob.martinez@company.com', 'EMPLOYEE', manager1.id);

  console.log('');

  // Create employees under Michael Chen
  await createUser('David Lee', 'david.lee@company.com', 'EMPLOYEE', manager2.id);
  await createUser('Emma Davis', 'emma.davis@company.com', 'EMPLOYEE', manager2.id);
  await createUser('Frank Wilson', 'frank.wilson@company.com', 'EMPLOYEE', manager2.id);

  console.log('');

  // Create employees under Emily Rodriguez
  await createUser('Grace Taylor', 'grace.taylor@company.com', 'EMPLOYEE', manager3.id);
  await createUser('Henry Anderson', 'henry.anderson@company.com', 'EMPLOYEE', manager3.id);

  // Get final count
  const totalUsers = await prisma.user.count({
    where: { companyId: companyId },
  });

  console.log('\n🎉 Seed completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   Company: ${companyName}`);
  console.log(`   Total Users: ${totalUsers}`);
  console.log(`   - Admins: ${existingUsers.length} (from signup)`);
  console.log(`   - Managers: 3`);
  console.log(`   - Employees: 8`);
  console.log(`\n🔑 All test users password: ${testPassword}`);
  console.log(`\n⚠️  IMPORTANT: Users can now sign in with their email and password!`);
  console.log(`   Example: sarah.johnson@company.com / password123\n`);
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
