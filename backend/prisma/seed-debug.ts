import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 DEBUG: Starting seed with detailed logging...\n');

    // Check environment variables
    console.log('🔍 DEBUG: Checking environment variables...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ Set (length: ' + supabaseKey.length + ')' : '❌ Missing'}`);

    if (!supabaseUrl || !supabaseKey) {
      console.error('\n❌ Missing Supabase credentials in .env file');
      console.error('   Make sure .env file exists in backend/ directory');
      process.exit(1);
    }

    // Initialize Supabase
    console.log('\n🔍 DEBUG: Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('   ✅ Supabase client created');

    // Test Supabase connection
    console.log('\n🔍 DEBUG: Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (testError) {
      console.error('   ❌ Supabase connection failed:', testError.message);
      throw testError;
    }
    console.log('   ✅ Supabase connection successful');

    // Check database connection
    console.log('\n🔍 DEBUG: Checking database connection...');
    try {
      await prisma.$connect();
      console.log('   ✅ Database connected');
    } catch (error: any) {
      console.error('   ❌ Database connection failed:', error.message);
      throw error;
    }

    // Find company
    console.log('\n🔍 DEBUG: Looking for company...');
    const company = await prisma.company.findFirst();

    if (!company) {
      console.error('\n❌ No company found in database.');
      console.error('   Please sign up first at http://localhost:3000/signup');
      console.error('   This creates the company that test users will belong to.');
      process.exit(1);
    }

    console.log(`   ✅ Found company: ${company.name} (ID: ${company.id})`);

    // Check existing users
    console.log('\n🔍 DEBUG: Checking existing users...');
    const existingUsers = await prisma.user.findMany({
      where: { companyId: company.id },
    });
    console.log(`   Found ${existingUsers.length} existing user(s)`);

    if (existingUsers.length > 1) {
      console.log('\n⚠️  Multiple users already exist. Skipping seed to avoid duplicates.');
      console.log('   To re-seed, delete test users first via /admin/employees page.');
      return;
    }

    console.log('\n🔍 DEBUG: Starting user creation...\n');

    const testPassword = 'password123';

    // Test creating ONE user first
    console.log('🔍 DEBUG: Creating test user (Sarah Johnson)...');
    console.log('   Step 1: Creating in Supabase Auth...');

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'sarah.johnson@company.com',
      password: testPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('   ❌ Supabase auth.admin.createUser failed!');
      console.error('   Error:', authError);
      console.error('   Message:', authError.message);
      console.error('   Status:', authError.status);
      throw authError;
    }

    if (!authData?.user) {
      console.error('   ❌ No user returned from Supabase');
      throw new Error('Supabase returned no user data');
    }

    console.log('   ✅ Supabase user created:', authData.user.id);
    console.log('   Step 2: Creating in local database...');

    const localUser = await prisma.user.create({
      data: {
        id: authData.user.id,
        companyId: company.id,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        password: '',
        role: 'MANAGER',
      },
    });

    console.log('   ✅ Local user created:', localUser.id);
    console.log('\n✅ TEST USER CREATED SUCCESSFULLY!\n');
    console.log('🎉 If you see this, the seed script works!');
    console.log('   Email: sarah.johnson@company.com');
    console.log('   Password: password123');
    console.log('\n   You can now sign in with this user to test.');
    console.log('   To create all test users, the full seed script should work now.\n');

  } catch (error: any) {
    console.error('\n💥 SEED FAILED WITH ERROR:');
    console.error('   Type:', error.constructor.name);
    console.error('   Message:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    if (error.status) {
      console.error('   HTTP Status:', error.status);
    }
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('\n❌ Fatal error in seed script');
    await prisma.$disconnect();
    process.exit(1);
  });
