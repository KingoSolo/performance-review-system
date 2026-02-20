import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api';

// Test credentials (test admin user)
const TEST_EMAIL = 'test-admin@company.com';
const TEST_PASSWORD = 'password123';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function getAuthToken(): Promise<string> {
  console.log('🔑 Getting auth token...');

  const response = await fetch(`${API_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate');
  }

  const data: any = await response.json();
  console.log('✅ Auth token obtained');
  return data.session.access_token;
}

async function test1_createAssignment(token: string, reviewCycleId: string) {
  console.log('\n📝 Test 1: Create valid reviewer assignment...');

  try {
    // Get two employees
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      take: 2,
    });

    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      take: 2,
    });

    const peers = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      take: 4,
      skip: 1, // Skip the employee we're assigning to
    });

    const employeeId = employees[0].id;
    const managerIds = [managers[0].id];
    const peerIds = peers.slice(0, 3).map(p => p.id);

    const response = await fetch(`${API_URL}/reviewer-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        reviewCycleId,
        employeeId,
        assignments: [
          ...managerIds.map(id => ({ reviewerId: id, reviewerType: 'MANAGER' })),
          ...peerIds.map(id => ({ reviewerId: id, reviewerType: 'PEER' })),
        ],
      }),
    });

    if (response.ok) {
      results.push({
        test: 'Create valid assignment',
        status: 'PASS',
        message: 'Successfully created assignment with 1 manager and 3 peers',
      });
      console.log('✅ PASS: Assignment created');
    } else {
      const error = await response.text();
      results.push({
        test: 'Create valid assignment',
        status: 'FAIL',
        message: `Failed: ${response.status}`,
        details: error,
      });
      console.log('❌ FAIL:', error);
    }
  } catch (error: any) {
    results.push({
      test: 'Create valid assignment',
      status: 'FAIL',
      message: error.message,
    });
    console.log('❌ FAIL:', error.message);
  }
}

async function test2_insufficientPeers(token: string, reviewCycleId: string) {
  console.log('\n📝 Test 2: Validation - insufficient peers (should fail)...');

  try {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      take: 1,
      skip: 1,
    });

    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      take: 1,
    });

    const peers = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      take: 2, // Only 2 peers (should fail - need 3-5)
      skip: 2,
    });

    const response = await fetch(`${API_URL}/reviewer-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        reviewCycleId,
        employeeId: employees[0].id,
        assignments: [
          { reviewerId: managers[0].id, reviewerType: 'MANAGER' },
          ...peers.map(p => ({ reviewerId: p.id, reviewerType: 'PEER' })),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      if (error.includes('peer') || error.includes('3-5')) {
        results.push({
          test: 'Validation - insufficient peers',
          status: 'PASS',
          message: 'Correctly rejected assignment with <3 peers',
        });
        console.log('✅ PASS: Validation worked (rejected insufficient peers)');
      } else {
        results.push({
          test: 'Validation - insufficient peers',
          status: 'FAIL',
          message: 'Wrong error message',
          details: error,
        });
        console.log('❌ FAIL: Wrong error message');
      }
    } else {
      results.push({
        test: 'Validation - insufficient peers',
        status: 'FAIL',
        message: 'Should have rejected but accepted',
      });
      console.log('❌ FAIL: Should have rejected assignment');
    }
  } catch (error: any) {
    results.push({
      test: 'Validation - insufficient peers',
      status: 'FAIL',
      message: error.message,
    });
    console.log('❌ FAIL:', error.message);
  }
}

async function test3_noManagers(token: string, reviewCycleId: string) {
  console.log('\n📝 Test 3: Validation - no managers (should fail)...');

  try {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      take: 1,
      skip: 2,
    });

    const peers = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      take: 4,
      skip: 3,
    });

    const response = await fetch(`${API_URL}/reviewer-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        reviewCycleId,
        employeeId: employees[0].id,
        assignments: peers.slice(0, 3).map(p => ({ reviewerId: p.id, reviewerType: 'PEER' })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      if (error.includes('manager')) {
        results.push({
          test: 'Validation - no managers',
          status: 'PASS',
          message: 'Correctly rejected assignment with 0 managers',
        });
        console.log('✅ PASS: Validation worked (rejected 0 managers)');
      } else {
        results.push({
          test: 'Validation - no managers',
          status: 'FAIL',
          message: 'Wrong error message',
          details: error,
        });
        console.log('❌ FAIL: Wrong error message');
      }
    } else {
      results.push({
        test: 'Validation - no managers',
        status: 'FAIL',
        message: 'Should have rejected but accepted',
      });
      console.log('❌ FAIL: Should have rejected');
    }
  } catch (error: any) {
    results.push({
      test: 'Validation - no managers',
      status: 'FAIL',
      message: error.message,
    });
    console.log('❌ FAIL:', error.message);
  }
}

async function test4_selfAssignment(token: string, reviewCycleId: string) {
  console.log('\n📝 Test 4: Validation - self-assignment (should fail)...');

  try {
    const employee = await prisma.user.findFirst({
      where: { role: 'EMPLOYEE' },
    });

    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      take: 1,
    });

    const response = await fetch(`${API_URL}/reviewer-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        reviewCycleId,
        employeeId: employee!.id,
        assignments: [
          { reviewerId: managers[0].id, reviewerType: 'MANAGER' },
          { reviewerId: employee!.id, reviewerType: 'PEER' }, // Self-assignment
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      if (error.includes('self') || error.includes('themselves')) {
        results.push({
          test: 'Validation - self-assignment',
          status: 'PASS',
          message: 'Correctly rejected self-assignment',
        });
        console.log('✅ PASS: Validation worked (rejected self-assignment)');
      } else {
        results.push({
          test: 'Validation - self-assignment',
          status: 'FAIL',
          message: 'Wrong error message',
          details: error,
        });
        console.log('❌ FAIL: Wrong error message');
      }
    } else {
      results.push({
        test: 'Validation - self-assignment',
        status: 'FAIL',
        message: 'Should have rejected but accepted',
      });
      console.log('❌ FAIL: Should have rejected self-assignment');
    }
  } catch (error: any) {
    results.push({
      test: 'Validation - self-assignment',
      status: 'FAIL',
      message: error.message,
    });
    console.log('❌ FAIL:', error.message);
  }
}

async function test5_getAssignments(token: string, reviewCycleId: string) {
  console.log('\n📝 Test 5: Retrieve assignments...');

  try {
    const response = await fetch(`${API_URL}/reviewer-assignments?reviewCycleId=${reviewCycleId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data: any = await response.json();
      results.push({
        test: 'Retrieve assignments',
        status: 'PASS',
        message: `Successfully retrieved ${data.length} employee assignments`,
        details: { count: data.length },
      });
      console.log('✅ PASS: Retrieved', data.length, 'assignments');
    } else {
      results.push({
        test: 'Retrieve assignments',
        status: 'FAIL',
        message: `Failed: ${response.status}`,
      });
      console.log('❌ FAIL');
    }
  } catch (error: any) {
    results.push({
      test: 'Retrieve assignments',
      status: 'FAIL',
      message: error.message,
    });
    console.log('❌ FAIL:', error.message);
  }
}

async function main() {
  try {
    console.log('🧪 Starting Backend API Tests for Reviewer Assignments\n');
    console.log('=' .repeat(60));

    // Get auth token
    const token = await getAuthToken();

    // Create or get test review cycle
    const cycle = await prisma.reviewCycle.findFirst({
      where: { status: 'DRAFT' },
    });

    if (!cycle) {
      console.error('❌ No DRAFT review cycle found. Please create one first.');
      process.exit(1);
    }

    console.log('✅ Using review cycle:', cycle.name);
    const reviewCycleId = cycle.id;

    // Run tests
    await test1_createAssignment(token, reviewCycleId);
    await test2_insufficientPeers(token, reviewCycleId);
    await test3_noManagers(token, reviewCycleId);
    await test4_selfAssignment(token, reviewCycleId);
    await test5_getAssignments(token, reviewCycleId);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;

    results.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${r.test}: ${r.message}`);
      if (r.details) {
        console.log('   Details:', JSON.stringify(r.details));
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('='.repeat(60) + '\n');

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED!\n');
    } else {
      console.log('⚠️  SOME TESTS FAILED\n');
    }

  } catch (error) {
    console.error('💥 Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
