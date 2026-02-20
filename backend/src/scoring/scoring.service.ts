import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

// ============================================================================
// DTOs
// ============================================================================

export interface QuestionScore {
  questionId: string;
  questionText: string;
  questionType: string;
  selfScore: number | null;
  managerScores: number[];
  peerScores: number[];
  managerAvg: number | null;
  peerAvg: number | null;
  overallAvg: number | null;
}

export interface ScoreBreakdown {
  self: number | null;
  manager: number | null;
  peer: number | null;
}

export interface ReviewCounts {
  self_reviews: number;
  manager_reviews: number;
  peer_reviews: number;
}

export interface FinalScoreResponse {
  employeeId: string;
  employeeName: string;
  cycleId: string;
  cycleName: string;
  overall_score: number | null;
  breakdown: ScoreBreakdown;
  by_question: QuestionScore[];
  review_counts: ReviewCounts;
  warnings: string[];
}

export interface AllScoresResponse {
  cycleId: string;
  cycleName: string;
  calculatedAt: Date;
  scores: FinalScoreResponse[];
}

// ============================================================================
// Service
// ============================================================================

@Injectable()
export class ScoringService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate final score for a single employee
   * Formula: (Self + Avg(Managers) + Avg(Peers)) / 3
   * CRITICAL: Only use SUBMITTED reviews, filter by companyId
   */
  async calculateFinalScore(
    employeeId: string,
    cycleId: string,
    companyId: string,
  ): Promise<FinalScoreResponse> {
    console.log(
      `🧮 Calculating final score for employee ${employeeId} in cycle ${cycleId}`,
    );

    // Verify cycle exists and belongs to company
    const cycle = await this.prisma.reviewCycle.findFirst({
      where: {
        id: cycleId,
        companyId,
      },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found or access denied');
    }

    // Get employee details
    const employee = await this.prisma.user.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found or access denied');
    }

    // Get all SUBMITTED reviews for this employee
    const reviews = await this.prisma.review.findMany({
      where: {
        employeeId,
        reviewCycleId: cycleId,
        status: 'SUBMITTED', // CRITICAL: Only submitted reviews
        reviewCycle: {
          companyId, // CRITICAL: Multi-tenancy
        },
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    console.log(`📊 Found ${reviews.length} submitted reviews`);

    // Separate reviews by type
    const selfReview = reviews.find((r) => r.reviewType === 'SELF');
    const managerReviews = reviews.filter((r) => r.reviewType === 'MANAGER');
    const peerReviews = reviews.filter((r) => r.reviewType === 'PEER');

    const warnings: string[] = [];

    // Get all rating questions for this company
    const ratingQuestions = await this.prisma.question.findMany({
      where: {
        companyId,
        type: 'RATING',
      },
      orderBy: { order: 'asc' },
    });

    // Calculate per-question scores
    const byQuestion: QuestionScore[] = ratingQuestions.map((question) => {
      // Get self score
      const selfAnswer = selfReview?.answers.find(
        (a) => a.questionId === question.id,
      );
      const selfScore = selfAnswer?.rating || null;

      // Get manager scores
      const managerScores = managerReviews
        .map((review) => {
          const answer = review.answers.find(
            (a) => a.questionId === question.id,
          );
          return answer?.rating;
        })
        .filter((score): score is number => score !== null && score !== undefined);

      // Get peer scores
      const peerScores = peerReviews
        .map((review) => {
          const answer = review.answers.find(
            (a) => a.questionId === question.id,
          );
          return answer?.rating;
        })
        .filter((score): score is number => score !== null && score !== undefined);

      // Calculate averages
      const managerAvg =
        managerScores.length > 0
          ? managerScores.reduce((sum, s) => sum + s, 0) / managerScores.length
          : null;

      const peerAvg =
        peerScores.length > 0
          ? peerScores.reduce((sum, s) => sum + s, 0) / peerScores.length
          : null;

      // Calculate overall average for this question
      const scores = [selfScore, managerAvg, peerAvg].filter(
        (s): s is number => s !== null,
      );
      const overallAvg =
        scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : null;

      return {
        questionId: question.id,
        questionText: question.text,
        questionType: question.reviewType,
        selfScore,
        managerScores,
        peerScores,
        managerAvg: managerAvg ? Number(managerAvg.toFixed(2)) : null,
        peerAvg: peerAvg ? Number(peerAvg.toFixed(2)) : null,
        overallAvg: overallAvg ? Number(overallAvg.toFixed(2)) : null,
      };
    });

    // Calculate overall category averages
    const selfScores = byQuestion
      .map((q) => q.selfScore)
      .filter((s): s is number => s !== null);
    const selfAvg =
      selfScores.length > 0
        ? selfScores.reduce((sum, s) => sum + s, 0) / selfScores.length
        : null;

    const managerAvgs = byQuestion
      .map((q) => q.managerAvg)
      .filter((s): s is number => s !== null);
    const managerOverallAvg =
      managerAvgs.length > 0
        ? managerAvgs.reduce((sum, s) => sum + s, 0) / managerAvgs.length
        : null;

    const peerAvgs = byQuestion
      .map((q) => q.peerAvg)
      .filter((s): s is number => s !== null);
    const peerOverallAvg =
      peerAvgs.length > 0
        ? peerAvgs.reduce((sum, s) => sum + s, 0) / peerAvgs.length
        : null;

    // Calculate final overall score with fallback logic
    let overallScore: number | null = null;
    const availableScores = [selfAvg, managerOverallAvg, peerOverallAvg].filter(
      (s): s is number => s !== null,
    );

    if (availableScores.length === 3) {
      // Ideal case: all three types available
      overallScore =
        availableScores.reduce((sum, s) => sum + s, 0) /
        availableScores.length;
    } else if (availableScores.length === 2) {
      // Fallback: two types available
      overallScore =
        availableScores.reduce((sum, s) => sum + s, 0) /
        availableScores.length;
      if (!managerOverallAvg) {
        warnings.push('No manager reviews available - using self and peer only');
      } else if (!peerOverallAvg) {
        warnings.push('No peer reviews available - using self and manager only');
      }
    } else if (availableScores.length === 1) {
      // Only self-review available
      overallScore = selfAvg;
      warnings.push(
        'Only self-review available - final score may not be representative',
      );
    } else {
      warnings.push('No reviews available to calculate score');
    }

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      cycleId: cycle.id,
      cycleName: cycle.name,
      overall_score: overallScore ? Number(overallScore.toFixed(2)) : null,
      breakdown: {
        self: selfAvg ? Number(selfAvg.toFixed(2)) : null,
        manager: managerOverallAvg
          ? Number(managerOverallAvg.toFixed(2))
          : null,
        peer: peerOverallAvg ? Number(peerOverallAvg.toFixed(2)) : null,
      },
      by_question: byQuestion,
      review_counts: {
        self_reviews: selfReview ? 1 : 0,
        manager_reviews: managerReviews.length,
        peer_reviews: peerReviews.length,
      },
      warnings,
    };
  }

  /**
   * Calculate final scores for all employees in a cycle
   * Useful for batch processing and reports
   */
  async calculateAllScores(
    cycleId: string,
    companyId: string,
  ): Promise<AllScoresResponse> {
    console.log(`🧮 Calculating all scores for cycle ${cycleId}`);

    // Verify cycle exists and belongs to company
    const cycle = await this.prisma.reviewCycle.findFirst({
      where: {
        id: cycleId,
        companyId,
      },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found or access denied');
    }

    // Get all employees in this company
    const employees = await this.prisma.user.findMany({
      where: {
        companyId,
        role: 'EMPLOYEE', // Only calculate for employees
      },
      orderBy: { name: 'asc' },
    });

    console.log(`👥 Found ${employees.length} employees`);

    // Calculate score for each employee
    const scores: FinalScoreResponse[] = [];
    for (const employee of employees) {
      try {
        const score = await this.calculateFinalScore(
          employee.id,
          cycleId,
          companyId,
        );
        scores.push(score);
      } catch (err: any) {
        console.error(
          `Error calculating score for ${employee.name}:`,
          err.message,
        );
        // Continue with other employees
      }
    }

    return {
      cycleId: cycle.id,
      cycleName: cycle.name,
      calculatedAt: new Date(),
      scores,
    };
  }
}
