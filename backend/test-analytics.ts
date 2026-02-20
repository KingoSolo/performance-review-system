import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAnalytics() {
  try {
    // Get all review cycles
    const cycles = await prisma.reviewCycle.findMany({
      include: {
        company: true,
      },
    });

    console.log('\n📊 Review Cycles:');
    cycles.forEach((cycle) => {
      console.log(`  - ${cycle.name} (${cycle.status}) - Company: ${cycle.company.name}`);
      console.log(`    ID: ${cycle.id}`);
    });

    if (cycles.length === 0) {
      console.log('❌ No review cycles found!');
      return;
    }

    const cycle = cycles[0];

    // Get all users
    const users = await prisma.user.findMany({
      where: { companyId: cycle.companyId },
    });

    console.log('\n👥 Users:');
    users.forEach((user) => {
      console.log(`  - ${user.name} (${user.role}) - ${user.email}`);
    });

    // Get all reviews
    const reviews = await prisma.review.findMany({
      where: { reviewCycleId: cycle.id },
      include: {
        answers: true,
        employee: true,
        reviewer: true,
      },
    });

    console.log('\n📝 Reviews for cycle:', cycle.name);
    console.log(`  Total reviews: ${reviews.length}`);
    reviews.forEach((review) => {
      console.log(`  - ${review.reviewType} by ${review.reviewer.name} for ${review.employee.name}`);
      console.log(`    Status: ${review.status}, Answers: ${review.answers.length}`);
    });

    // Check if there are SUBMITTED reviews
    const submittedReviews = reviews.filter((r) => r.status === 'SUBMITTED');
    console.log(`\n✅ Submitted reviews: ${submittedReviews.length}`);

    if (submittedReviews.length === 0) {
      console.log('⚠️  No submitted reviews - analytics will show no data');
    }

    console.log('\n✅ Analytics test data check complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalytics();
