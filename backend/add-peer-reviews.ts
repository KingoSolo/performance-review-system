import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPeerReviews() {
  const cycle = await prisma.reviewCycle.findFirst({
    where: { status: 'ACTIVE' },
  });

  if (!cycle) {
    console.log('No active cycle');
    return;
  }

  const employee = await prisma.user.findFirst({
    where: { companyId: cycle.companyId, role: 'EMPLOYEE' },
  });

  if (!employee) {
    console.log('No employee');
    return;
  }

  const peers = await prisma.user.findMany({
    where: {
      companyId: cycle.companyId,
      role: 'EMPLOYEE',
      NOT: { id: employee.id },
    },
    take: 3,
  });

  const questions = await prisma.question.findMany({
    where: {
      companyId: cycle.companyId,
      reviewType: 'PEER',
      type: 'RATING',
    },
  });

  console.log(`Adding ${peers.length} peer reviews...\n`);

  for (const [idx, peer] of peers.entries()) {
    const rating = [3, 4, 5][idx] || 4;

    const review = await prisma.review.create({
      data: {
        reviewCycleId: cycle.id,
        employeeId: employee.id,
        reviewerId: peer.id,
        reviewType: 'PEER',
        status: 'SUBMITTED',
      },
    });

    for (const q of questions) {
      await prisma.answer.create({
        data: {
          reviewId: review.id,
          questionId: q.id,
          rating,
        },
      });
    }

    console.log(`  ✅ Peer review from ${peer.name}: rating ${rating}`);
  }

  console.log('\n✅ Done!');
  await prisma.$disconnect();
}

addPeerReviews().catch((e) => {
  console.error(e);
  process.exit(1);
});
