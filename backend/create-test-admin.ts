import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const testEmail = 'test-admin@company.com';
  const testPassword = 'password123';

  console.log('🔍 Checking if test admin exists...');

  // Check if user already exists
  const existing = await prisma.user.findMany({
    where: { email: testEmail }
  });

  if (existing.length > 0) {
    console.log('✅ Test admin already exists:', testEmail);
    return;
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create in Supabase Auth
  console.log('📝 Creating user in Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error('❌ Supabase auth failed:', authError?.message);
    process.exit(1);
  }

  // Create in local database
  console.log('📝 Creating user in local database...');
  const user = await prisma.user.create({
    data: {
      id: authData.user.id,
      companyId: 'cmlsrhjcm0000c94xdjg4bebm', // John sports
      name: 'Test Admin',
      email: testEmail,
      password: '',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created test admin:', testEmail);
  console.log('   Password:', testPassword);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
