import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

// ============================================================================
// DTOs
// ============================================================================

export interface EmployeeScore {
  id: string;
  name: string;
  email: string;
  score: number | null;
}

export interface AdminAnalytics {
  totalEmployees: number;
  activeEmployees: number;
  completionRate: number;
  averageScore: number | null;
  topPerformers: EmployeeScore[];
  pendingReviews: {
    selfReviews: number;
    managerReviews: number;
    peerReviews: number;
  };
  reviewProgress: {
    submitted: number;
    draft: number;
    notStarted: number;
  };
}

export interface ManagerAnalytics {
  teamSize: number;
  teamAverageScore: number | null;
  companyAverageScore: number | null;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    score: number | null;
    reviewsCompleted: number;
    reviewsTotal: number;
  }>;
  pendingReviews: number;
}

export interface EmployeeAnalytics {
  personalScore: number | null;
  companyAverage: number | null;
  scoreBreakdown: {
    self: number | null;
    manager: number | null;
    peer: number | null;
  };
  pendingTasks: {
    selfReview: boolean;
    peerReviews: number;
  };
  reviewCounts: {
    self: number;
    manager: number;
    peer: number;
  };
}

// ============================================================================
// Service
// ============================================================================

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get admin analytics - company-wide statistics
   */
  async getAdminAnalytics(
    cycleId: string,
    companyId: string,
  ): Promise<AdminAnalytics> {
    console.log(`📊 Getting admin analytics for cycle ${cycleId}`);

    // Verify cycle
    const cycle = await this.prisma.reviewCycle.findFirst({
      where: { id: cycleId, companyId },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found or access denied');
    }

    // Get all employees
    const allEmployees = await this.prisma.user.findMany({
      where: { companyId, role: 'EMPLOYEE' },
    });

    // Get all reviews for this cycle
    const allReviews = await this.prisma.review.findMany({
      where: {
        reviewCycleId: cycleId,
        reviewCycle: { companyId },
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    // Calculate scores for all employees
    const employeeScores = await this.calculateAllEmployeeScores(
      cycleId,
      companyId,
      allEmployees,
    );

    const validScores = employeeScores.filter((e) => e.score !== null);
    const averageScore =
      validScores.length > 0
        ? validScores.reduce((sum, e) => sum + e.score!, 0) / validScores.length
        : null;

    // Top performers
    const topPerformers = [...employeeScores]
      .filter((e) => e.score !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);

    // Review progress
    const submitted = allReviews.filter((r) => r.status === 'SUBMITTED').length;
    const draft = allReviews.filter((r) => r.status === 'DRAFT').length;
    const expectedReviews = allEmployees.length * 3; // Self + Manager + Peers (approximate)
    const notStarted = Math.max(0, expectedReviews - submitted - draft);

    const completionRate =
      expectedReviews > 0 ? (submitted / expectedReviews) * 100 : 0;

    // Pending reviews by type
    const selfReviews = allReviews.filter(
      (r) => r.reviewType === 'SELF' && r.status !== 'SUBMITTED',
    ).length;
    const managerReviews = allReviews.filter(
      (r) => r.reviewType === 'MANAGER' && r.status !== 'SUBMITTED',
    ).length;
    const peerReviews = allReviews.filter(
      (r) => r.reviewType === 'PEER' && r.status !== 'SUBMITTED',
    ).length;

    return {
      totalEmployees: allEmployees.length,
      activeEmployees: validScores.length,
      completionRate: Math.round(completionRate),
      averageScore: averageScore ? Number(averageScore.toFixed(2)) : null,
      topPerformers,
      pendingReviews: {
        selfReviews,
        managerReviews,
        peerReviews,
      },
      reviewProgress: {
        submitted,
        draft,
        notStarted,
      },
    };
  }

  /**
   * Get manager analytics - team statistics
   */
  async getManagerAnalytics(
    managerId: string,
    cycleId: string,
    companyId: string,
  ): Promise<ManagerAnalytics> {
    console.log(`📊 Getting manager analytics for manager ${managerId}`);

    // Verify cycle
    const cycle = await this.prisma.reviewCycle.findFirst({
      where: { id: cycleId, companyId },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found or access denied');
    }

    // Get team members (employees this manager is assigned to review)
    const assignments = await this.prisma.reviewerAssignment.findMany({
      where: {
        reviewCycleId: cycleId,
        reviewerId: managerId,
        reviewerType: 'MANAGER',
        reviewCycle: { companyId },
      },
      include: {
        employee: true,
      },
    });

    const teamMemberIds = assignments.map((a) => a.employeeId);

    // Calculate scores for team members
    const teamScores = await Promise.all(
      assignments.map(async (assignment) => {
        const score = await this.calculateEmployeeScore(
          assignment.employeeId,
          cycleId,
          companyId,
        );

        // Count reviews completed for this employee
        const reviews = await this.prisma.review.findMany({
          where: {
            reviewCycleId: cycleId,
            employeeId: assignment.employeeId,
          },
        });

        const completed = reviews.filter((r) => r.status === 'SUBMITTED').length;
        const total = reviews.length;

        return {
          id: assignment.employee.id,
          name: assignment.employee.name,
          email: assignment.employee.email,
          score,
          reviewsCompleted: completed,
          reviewsTotal: total,
        };
      }),
    );

    // Team average
    const validTeamScores = teamScores.filter((t) => t.score !== null);
    const teamAverageScore =
      validTeamScores.length > 0
        ? validTeamScores.reduce((sum, t) => sum + t.score!, 0) /
          validTeamScores.length
        : null;

    // Company average for comparison
    const allEmployees = await this.prisma.user.findMany({
      where: { companyId, role: 'EMPLOYEE' },
    });
    const companyScores = await this.calculateAllEmployeeScores(
      cycleId,
      companyId,
      allEmployees,
    );
    const validCompanyScores = companyScores.filter((e) => e.score !== null);
    const companyAverageScore =
      validCompanyScores.length > 0
        ? validCompanyScores.reduce((sum, e) => sum + e.score!, 0) /
          validCompanyScores.length
        : null;

    // Pending manager reviews
    const pendingReviews = await this.prisma.review.count({
      where: {
        reviewCycleId: cycleId,
        reviewerId: managerId,
        reviewType: 'MANAGER',
        status: { not: 'SUBMITTED' },
      },
    });

    return {
      teamSize: teamMemberIds.length,
      teamAverageScore: teamAverageScore
        ? Number(teamAverageScore.toFixed(2))
        : null,
      companyAverageScore: companyAverageScore
        ? Number(companyAverageScore.toFixed(2))
        : null,
      teamMembers: teamScores,
      pendingReviews,
    };
  }

  /**
   * Get employee analytics - personal statistics
   */
  async getEmployeeAnalytics(
    employeeId: string,
    cycleId: string,
    companyId: string,
  ): Promise<EmployeeAnalytics> {
    console.log(`📊 Getting employee analytics for employee ${employeeId}`);

    // Verify cycle
    const cycle = await this.prisma.reviewCycle.findFirst({
      where: { id: cycleId, companyId },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found or access denied');
    }

    // Get personal reviews
    const reviews = await this.prisma.review.findMany({
      where: {
        reviewCycleId: cycleId,
        employeeId,
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    // Calculate personal score
    const personalScore = await this.calculateEmployeeScore(
      employeeId,
      cycleId,
      companyId,
    );

    // Calculate breakdown
    const selfReview = reviews.find(
      (r) => r.reviewType === 'SELF' && r.status === 'SUBMITTED',
    );
    const managerReviews = reviews.filter(
      (r) => r.reviewType === 'MANAGER' && r.status === 'SUBMITTED',
    );
    const peerReviews = reviews.filter(
      (r) => r.reviewType === 'PEER' && r.status === 'SUBMITTED',
    );

    const breakdown = {
      self: selfReview ? await this.calculateReviewAverage(selfReview) : null,
      manager:
        managerReviews.length > 0
          ? await this.calculateMultipleReviewsAverage(managerReviews)
          : null,
      peer:
        peerReviews.length > 0
          ? await this.calculateMultipleReviewsAverage(peerReviews)
          : null,
    };

    // Company average
    const allEmployees = await this.prisma.user.findMany({
      where: { companyId, role: 'EMPLOYEE' },
    });
    const companyScores = await this.calculateAllEmployeeScores(
      cycleId,
      companyId,
      allEmployees,
    );
    const validScores = companyScores.filter((e) => e.score !== null);
    const companyAverage =
      validScores.length > 0
        ? validScores.reduce((sum, e) => sum + e.score!, 0) / validScores.length
        : null;

    // Pending tasks
    const hasSelfReview = reviews.some(
      (r) => r.reviewType === 'SELF' && r.status === 'SUBMITTED',
    );

    const peerAssignments = await this.prisma.reviewerAssignment.count({
      where: {
        reviewCycleId: cycleId,
        reviewerId: employeeId,
        reviewerType: 'PEER',
      },
    });

    const completedPeerReviews = await this.prisma.review.count({
      where: {
        reviewCycleId: cycleId,
        reviewerId: employeeId,
        reviewType: 'PEER',
        status: 'SUBMITTED',
      },
    });

    return {
      personalScore,
      companyAverage: companyAverage ? Number(companyAverage.toFixed(2)) : null,
      scoreBreakdown: {
        self: breakdown.self ? Number(breakdown.self.toFixed(2)) : null,
        manager: breakdown.manager ? Number(breakdown.manager.toFixed(2)) : null,
        peer: breakdown.peer ? Number(breakdown.peer.toFixed(2)) : null,
      },
      pendingTasks: {
        selfReview: !hasSelfReview,
        peerReviews: peerAssignments - completedPeerReviews,
      },
      reviewCounts: {
        self: selfReview ? 1 : 0,
        manager: managerReviews.length,
        peer: peerReviews.length,
      },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async calculateEmployeeScore(
    employeeId: string,
    cycleId: string,
    companyId: string,
  ): Promise<number | null> {
    const reviews = await this.prisma.review.findMany({
      where: {
        reviewCycleId: cycleId,
        employeeId,
        status: 'SUBMITTED',
        reviewCycle: { companyId },
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (reviews.length === 0) return null;

    const selfReview = reviews.find((r) => r.reviewType === 'SELF');
    const managerReviews = reviews.filter((r) => r.reviewType === 'MANAGER');
    const peerReviews = reviews.filter((r) => r.reviewType === 'PEER');

    const scores: number[] = [];

    if (selfReview) {
      const avg = await this.calculateReviewAverage(selfReview);
      if (avg !== null) scores.push(avg);
    }

    if (managerReviews.length > 0) {
      const avg = await this.calculateMultipleReviewsAverage(managerReviews);
      if (avg !== null) scores.push(avg);
    }

    if (peerReviews.length > 0) {
      const avg = await this.calculateMultipleReviewsAverage(peerReviews);
      if (avg !== null) scores.push(avg);
    }

    if (scores.length === 0) return null;

    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }

  private async calculateReviewAverage(review: any): Promise<number | null> {
    const ratings = review.answers
      .filter((a: any) => a.question.type === 'RATING' && a.rating !== null)
      .map((a: any) => a.rating);

    if (ratings.length === 0) return null;

    return ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
  }

  private async calculateMultipleReviewsAverage(
    reviews: any[],
  ): Promise<number | null> {
    const averages = await Promise.all(
      reviews.map((r) => this.calculateReviewAverage(r)),
    );

    const validAverages = averages.filter((a) => a !== null) as number[];

    if (validAverages.length === 0) return null;

    return (
      validAverages.reduce((sum, a) => sum + a, 0) / validAverages.length
    );
  }

  private async calculateAllEmployeeScores(
    cycleId: string,
    companyId: string,
    employees: any[],
  ): Promise<EmployeeScore[]> {
    return Promise.all(
      employees.map(async (emp) => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        score: await this.calculateEmployeeScore(emp.id, cycleId, companyId),
      })),
    );
  }
}
