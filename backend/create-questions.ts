import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestQuestions() {
  // Get active cycle first
  const cycle = await prisma.reviewCycle.findFirst({
    where: { status: 'ACTIVE' },
    include: { company: true },
  });

  if (!cycle) {
    console.log('No active cycle found');
    await prisma.$disconnect();
    return;
  }

  const company = cycle.company;
  console.log(`Creating test rating questions for company: ${company.name} (cycle: ${cycle.name})...\n`);

  try {
    const q1 = await prisma.question.create({
      data: {
        companyId: company.id,
        reviewType: 'SELF',
        type: 'RATING',
        text: 'Rate your overall performance this period',
        order: 1,
      },
    });
    console.log('✅ Created SELF question');

    const q2 = await prisma.question.create({
      data: {
        companyId: company.id,
        reviewType: 'MANAGER',
        type: 'RATING',
        text: 'Rate this employee overall performance',
        order: 1,
      },
    });
    console.log('✅ Created MANAGER question');

    const q3 = await prisma.question.create({
      data: {
        companyId: company.id,
        reviewType: 'PEER',
        type: 'RATING',
        text: 'Rate this peer overall collaboration',
        order: 1,
      },
    });
    console.log('✅ Created PEER question');

    console.log('\n✅ All test questions created successfully!');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  Questions already exist, skipping creation');
    } else {
      throw error;
    }
  }

  await prisma.$disconnect();
}

createTestQuestions().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
