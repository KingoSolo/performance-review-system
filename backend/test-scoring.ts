import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testScoring() {
  console.log('🧪 Testing Scoring System\n');

  try {
    // 1. Get first active cycle
    const cycle = await prisma.reviewCycle.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (!cycle) {
      console.log('❌ No active review cycle found');
      return;
    }

    console.log(`✅ Found active cycle: ${cycle.name}\n`);

    // 2. Get first employee
    const employee = await prisma.user.findFirst({
      where: {
        companyId: cycle.companyId,
        role: 'EMPLOYEE',
      },
    });

    if (!employee) {
      console.log('❌ No employee found');
      return;
    }

    console.log(`✅ Testing with employee: ${employee.name}\n`);

    // 3. Get all rating questions
    const questions = await prisma.question.findMany({
      where: {
        companyId: cycle.companyId,
        type: 'RATING',
      },
      orderBy: { order: 'asc' },
    });

    console.log(`✅ Found ${questions.length} rating questions\n`);

    // 4. Check existing reviews
    const existingReviews = await prisma.review.findMany({
      where: {
        reviewCycleId: cycle.id,
        employeeId: employee.id,
      },
      include: {
        answers: true,
      },
    });

    console.log('📊 Current Reviews:');
    existingReviews.forEach((r) => {
      console.log(
        `  - ${r.reviewType}: ${r.status} (${r.answers.length} answers)`,
      );
    });
    console.log('');

    // 5. Create test data if no submitted reviews exist
    const hasSubmitted = existingReviews.some((r) => r.status === 'SUBMITTED');

    if (!hasSubmitted && questions.length > 0) {
      console.log('📝 Creating test review data...\n');

      // Create self review
      const selfReview = await prisma.review.upsert({
        where: {
          reviewCycleId_employeeId_reviewerId_reviewType: {
            reviewCycleId: cycle.id,
            employeeId: employee.id,
            reviewerId: employee.id,
            reviewType: 'SELF',
          },
        },
        create: {
          reviewCycleId: cycle.id,
          employeeId: employee.id,
          reviewerId: employee.id,
          reviewType: 'SELF',
          status: 'SUBMITTED',
        },
        update: {
          status: 'SUBMITTED',
        },
      });

      // Add answers with ratings 4
      for (const q of questions.filter((q) => q.reviewType === 'SELF')) {
        await prisma.answer.upsert({
          where: {
            reviewId_questionId: {
              reviewId: selfReview.id,
              questionId: q.id,
            },
          },
          create: {
            reviewId: selfReview.id,
            questionId: q.id,
            rating: 4,
          },
          update: {
            rating: 4,
          },
        });
      }

      console.log('  ✅ Created SELF review with rating 4.0');

      // Get a manager
      const manager = await prisma.user.findFirst({
        where: {
          companyId: cycle.companyId,
          role: 'MANAGER',
        },
      });

      if (manager) {
        // Create manager review
        const managerReview = await prisma.review.upsert({
          where: {
            reviewCycleId_employeeId_reviewerId_reviewType: {
              reviewCycleId: cycle.id,
              employeeId: employee.id,
              reviewerId: manager.id,
              reviewType: 'MANAGER',
            },
          },
          create: {
            reviewCycleId: cycle.id,
            employeeId: employee.id,
            reviewerId: manager.id,
            reviewType: 'MANAGER',
            status: 'SUBMITTED',
          },
          update: {
            status: 'SUBMITTED',
          },
        });

        // Add answers with ratings 5
        for (const q of questions.filter((q) => q.reviewType === 'MANAGER')) {
          await prisma.answer.upsert({
            where: {
              reviewId_questionId: {
                reviewId: managerReview.id,
                questionId: q.id,
              },
            },
            create: {
              reviewId: managerReview.id,
              questionId: q.id,
              rating: 5,
            },
            update: {
              rating: 5,
            },
          });
        }

        console.log('  ✅ Created MANAGER review with rating 5.0');
      }

      // Get peers
      const peers = await prisma.user.findMany({
        where: {
          companyId: cycle.companyId,
          role: 'EMPLOYEE',
          NOT: { id: employee.id },
        },
        take: 3,
      });

      for (const [idx, peer] of peers.entries()) {
        const peerReview = await prisma.review.upsert({
          where: {
            reviewCycleId_employeeId_reviewerId_reviewType: {
              reviewCycleId: cycle.id,
              employeeId: employee.id,
              reviewerId: peer.id,
              reviewType: 'PEER',
            },
          },
          create: {
            reviewCycleId: cycle.id,
            employeeId: employee.id,
            reviewerId: peer.id,
            reviewType: 'PEER',
            status: 'SUBMITTED',
          },
          update: {
            status: 'SUBMITTED',
          },
        });

        // Add answers with varying ratings (3, 4, 5)
        const peerRating = [3, 4, 5][idx] || 4;
        for (const q of questions.filter((q) => q.reviewType === 'PEER')) {
          await prisma.answer.upsert({
            where: {
              reviewId_questionId: {
                reviewId: peerReview.id,
                questionId: q.id,
              },
            },
            create: {
              reviewId: peerReview.id,
              questionId: q.id,
              rating: peerRating,
            },
            update: {
              rating: peerRating,
            },
          });
        }

        console.log(`  ✅ Created PEER review ${idx + 1} with rating ${peerRating}.0`);
      }

      console.log('\n✅ Test data created!\n');
    }

    // 6. Now test the scoring calculation
    console.log('🧮 Calculating Score...\n');

    // Import and use the scoring service
    const { ScoringService } = await import('./src/scoring/scoring.service');
    const scoringService = new ScoringService(prisma as any);

    const score = await scoringService.calculateFinalScore(
      employee.id,
      cycle.id,
      cycle.companyId,
    );

    console.log('📊 SCORING RESULTS:');
    console.log('='.repeat(50));
    console.log(`Employee: ${score.employeeName}`);
    console.log(`Cycle: ${score.cycleName}`);
    console.log(`\n🎯 Overall Score: ${score.overall_score?.toFixed(2) || 'N/A'} / 5.0`);
    console.log(`\n📈 Breakdown:`);
    console.log(`  Self:    ${score.breakdown.self?.toFixed(2) || 'N/A'}`);
    console.log(`  Manager: ${score.breakdown.manager?.toFixed(2) || 'N/A'}`);
    console.log(`  Peer:    ${score.breakdown.peer?.toFixed(2) || 'N/A'}`);
    console.log(`\n📋 Review Counts:`);
    console.log(`  Self Reviews:    ${score.review_counts.self_reviews}`);
    console.log(`  Manager Reviews: ${score.review_counts.manager_reviews}`);
    console.log(`  Peer Reviews:    ${score.review_counts.peer_reviews}`);

    if (score.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      score.warnings.forEach((w) => console.log(`  - ${w}`));
    }

    console.log('\n' + '='.repeat(50));

    // Test formula manually
    const expectedScore =
      (score.breakdown.self! +
        score.breakdown.manager! +
        score.breakdown.peer!) /
      3;
    console.log(
      `\n✓ Formula Check: (${score.breakdown.self} + ${score.breakdown.manager} + ${score.breakdown.peer}) / 3 = ${expectedScore.toFixed(2)}`,
    );
    console.log(
      `  Calculated: ${score.overall_score?.toFixed(2)}, Expected: ${expectedScore.toFixed(2)}`,
    );
    console.log(
      `  ${Math.abs((score.overall_score || 0) - expectedScore) < 0.01 ? '✅ PASS' : '❌ FAIL'}`,
    );

    console.log('\n✅ Scoring test complete!\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testScoring();
