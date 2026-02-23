import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDashboards() {
  try {
    console.log('\n🔍 Testing Analytics Dashboards\n');
    console.log('='.repeat(60));

    // Get test cycle with data
    const cycle = await prisma.reviewCycle.findFirst({
      where: { name: 'h2 2025 performance skills' },
      include: { company: true },
    });

    if (!cycle) {
      console.log('❌ Test cycle not found!');
      return;
    }

    console.log(`\n✅ Using cycle: ${cycle.name} (${cycle.status})`);
    console.log(`   Company: ${cycle.company.name}`);
    console.log(`   Cycle ID: ${cycle.id}`);

    // Get users
    const admin = await prisma.user.findFirst({
      where: { companyId: cycle.companyId, role: 'ADMIN' },
    });
    const manager = await prisma.user.findFirst({
      where: { companyId: cycle.companyId, role: 'MANAGER' },
    });
    const employee = await prisma.user.findFirst({
      where: { companyId: cycle.companyId, role: 'EMPLOYEE' },
    });

    console.log('\n👥 Test Users:');
    console.log(`   Admin: ${admin?.name} (${admin?.email})`);
    console.log(`   Manager: ${manager?.name} (${manager?.email})`);
    console.log(`   Employee: ${employee?.name} (${employee?.email})`);

    // Check reviews
    const reviews = await prisma.review.findMany({
      where: { reviewCycleId: cycle.id },
      include: {
        answers: { include: { question: true } },
        employee: true,
        reviewer: true,
      },
    });

    console.log(`\n📝 Reviews (${reviews.length} total):`);
    reviews.forEach((review) => {
      console.log(`   - ${review.reviewType}: ${review.reviewer.name} → ${review.employee.name}`);
      console.log(`     Status: ${review.status}, Answers: ${review.answers.length}`);
    });

    // Test data quality
    const submittedReviews = reviews.filter((r) => r.status === 'SUBMITTED');
    console.log(`\n✅ Submitted reviews: ${submittedReviews.length}`);

    if (submittedReviews.length === 0) {
      console.log('⚠️  WARNING: No submitted reviews - dashboards will show no data!');
      console.log('   You need to submit some reviews first.');
    } else {
      console.log('\n🎯 Dashboard Test Results:');
      console.log('   ✓ Admin Dashboard: Should show company-wide analytics');
      console.log('   ✓ Manager Dashboard: Should show team analytics');
      console.log('   ✓ Employee Dashboard: Should show personal analytics');
      
      console.log('\n📊 Expected Data:');
      console.log(`   - Total Employees: ${await prisma.user.count({ where: { companyId: cycle.companyId, role: 'EMPLOYEE' } })}`);
      console.log(`   - Submitted Reviews: ${submittedReviews.length}`);
      console.log(`   - Pending Reviews: ${reviews.length - submittedReviews.length}`);
    }

    console.log('\n🌐 Access Dashboards:');
    console.log('   Admin:    http://localhost:3002/admin');
    console.log('   Manager:  http://localhost:3002/manager');
    console.log('   Employee: http://localhost:3002/employee');
    console.log('\n   Login Credentials:');
    console.log(`   Admin:    ${admin?.email} / password123`);
    console.log(`   Manager:  ${manager?.email} / password123`);
    console.log(`   Employee: ${employee?.email} / password123`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Dashboard test setup complete!');
    console.log('   Open the URLs above in your browser to test the dashboards.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboards();
