import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000/api';
const TEST_EMAIL = 'test-admin@company.com';
const TEST_PASSWORD = 'password123';

async function main() {
  // Get auth token
  console.log('🔑 Getting auth token...');
  const authResponse = await fetch(`${API_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  if (!authResponse.ok) {
    throw new Error('Failed to authenticate');
  }

  const authData: any = await authResponse.json();
  const token = authData.session.access_token;
  console.log('✅ Auth token obtained\n');

  // Create test review cycle
  console.log('📝 Creating test review cycle...');
  const cycleResponse = await fetch(`${API_URL}/review-cycles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Test Cycle for Reviewer Assignment',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      reviewConfigs: [
        {
          stepNumber: 1,
          reviewType: 'SELF',
          startDate: '2026-03-01',
          endDate: '2026-03-10',
        },
        {
          stepNumber: 2,
          reviewType: 'MANAGER',
          startDate: '2026-03-11',
          endDate: '2026-03-20',
        },
        {
          stepNumber: 3,
          reviewType: 'PEER',
          startDate: '2026-03-21',
          endDate: '2026-03-31',
        },
      ],
    }),
  });

  if (!cycleResponse.ok) {
    const error = await cycleResponse.text();
    throw new Error(`Failed to create cycle: ${error}`);
  }

  const cycle: any = await cycleResponse.json();
  console.log('✅ Created test review cycle:');
  console.log('   ID:', cycle.id);
  console.log('   Name:', cycle.name);
  console.log('   Status:', cycle.status);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
