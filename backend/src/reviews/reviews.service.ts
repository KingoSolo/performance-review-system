import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { ReviewStatus, ReviewType } from '@prisma/client';

// ============================================================================
// DTOs
// ============================================================================

export interface AnswerDto {
  questionId: string;
  rating?: number | null;
  textAnswer?: string | null;
}

export interface SaveDraftDto {
  answers: AnswerDto[];
}

export interface SubmitReviewDto {
  answers: AnswerDto[];
}

// Response DTOs

export interface QuestionWithAnswer {
  id: string;
  reviewType: string;
  type: string;
  text: string;
  maxChars: number | null;
  order: number;
  answer?: {
    id: string;
    rating: number | null;
    textAnswer: string | null;
  } | null;
}

export interface SelfReviewResponse {
  review: {
    id: string;
    reviewCycleId: string;
    employeeId: string;
    reviewType: string;
    status: string;
    updatedAt: Date;
  };
  questions: QuestionWithAnswer[];
}

// ============================================================================
// Service
// ============================================================================

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create self-review for employee in a cycle
   * Returns review with questions and existing answers
   * CRITICAL: Filter by companyId through reviewCycle relation
   */
  async findOrCreateSelfReview(
    userId: string,
    companyId: string,
    cycleId: string,
  ): Promise<SelfReviewResponse> {
    console.log(
      `📝 Finding/creating self-review for user ${userId} in cycle ${cycleId}`,
    );

    // Verify cycle exists, belongs to company, and is ACTIVE
    const cycle = await this.prisma.reviewCycle.findFirst({
      where: {
        id: cycleId,
        companyId,
        status: 'ACTIVE', // Only allow reviews for active cycles
      },
    });

    if (!cycle) {
      throw new NotFoundException(
        'Review cycle not found, not active, or access denied',
      );
    }

    // Find or create review
    let review = await this.prisma.review.findFirst({
      where: {
        reviewCycleId: cycleId,
        employeeId: userId,
        reviewerId: userId, // SELF review: employee === reviewer
        reviewType: 'SELF',
      },
      include: {
        answers: true,
      },
    });

    if (!review) {
      console.log(`➕ Creating new self-review record`);
      review = await this.prisma.review.create({
        data: {
          reviewCycleId: cycleId,
          employeeId: userId,
          reviewerId: userId,
          reviewType: 'SELF',
          status: 'NOT_STARTED',
        },
        include: {
          answers: true,
        },
      });
    }

    // Get all SELF questions for this company
    const questions = await this.prisma.question.findMany({
      where: {
        companyId,
        reviewType: 'SELF',
      },
      orderBy: { order: 'asc' },
    });

    // Map questions with their answers
    const questionsWithAnswers: QuestionWithAnswer[] = questions.map((q) => {
      const answer = review.answers.find((a) => a.questionId === q.id);
      return {
        id: q.id,
        reviewType: q.reviewType,
        type: q.type,
        text: q.text,
        maxChars: q.maxChars,
        order: q.order,
        answer: answer
          ? {
              id: answer.id,
              rating: answer.rating,
              textAnswer: answer.textAnswer,
            }
          : null,
      };
    });

    return {
      review: {
        id: review.id,
        reviewCycleId: review.reviewCycleId,
        employeeId: review.employeeId,
        reviewType: review.reviewType,
        status: review.status,
        updatedAt: review.updatedAt,
      },
      questions: questionsWithAnswers,
    };
  }

  /**
   * Save draft answers (auto-save)
   * Updates review status to DRAFT if currently NOT_STARTED
   * Uses upsert pattern for answers
   */
  async saveDraft(
    reviewId: string,
    userId: string,
    companyId: string,
    dto: SaveDraftDto,
  ) {
    console.log(
      `💾 Saving draft for review ${reviewId}, ${dto.answers.length} answers`,
    );

    // Verify review exists and belongs to user
    const review = await this.verifyReviewAccess(
      reviewId,
      userId,
      companyId,
    );

    // Validate review is not already submitted
    if (review.status === 'SUBMITTED') {
      throw new BadRequestException('Cannot modify submitted review');
    }

    // Use transaction to update answers and review status atomically
    return this.prisma.$transaction(async (prisma) => {
      // Upsert each answer
      for (const answerDto of dto.answers) {
        await prisma.answer.upsert({
          where: {
            reviewId_questionId: {
              reviewId: reviewId,
              questionId: answerDto.questionId,
            },
          },
          create: {
            reviewId: reviewId,
            questionId: answerDto.questionId,
            rating: answerDto.rating,
            textAnswer: answerDto.textAnswer,
          },
          update: {
            rating: answerDto.rating,
            textAnswer: answerDto.textAnswer,
          },
        });
      }

      // Update review status to DRAFT if currently NOT_STARTED
      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          status: review.status === 'NOT_STARTED' ? 'DRAFT' : review.status,
          updatedAt: new Date(),
        },
      });

      return {
        message: 'Draft saved successfully',
        updatedAt: updatedReview.updatedAt,
      };
    });
  }

  /**
   * Submit review (final submission)
   * Validates all required questions are answered
   * Changes status to SUBMITTED (immutable after this)
   */
  async submitReview(
    reviewId: string,
    userId: string,
    companyId: string,
    dto: SubmitReviewDto,
  ) {
    console.log(`✅ Submitting review ${reviewId}`);

    // Verify review exists and belongs to user
    const review = await this.verifyReviewAccess(
      reviewId,
      userId,
      companyId,
    );

    // Validate review is not already submitted
    if (review.status === 'SUBMITTED') {
      throw new BadRequestException('Review already submitted');
    }

    // Get all required questions
    const questions = await this.prisma.question.findMany({
      where: {
        companyId,
        reviewType: 'SELF',
      },
    });

    // Validate all questions have answers
    const answeredQuestionIds = new Set(
      dto.answers.map((a) => a.questionId),
    );

    const missingAnswers = questions.filter(
      (q) => !answeredQuestionIds.has(q.id),
    );

    if (missingAnswers.length > 0) {
      throw new BadRequestException(
        `Missing answers for ${missingAnswers.length} required question(s)`,
      );
    }

    // Use transaction to save answers and submit
    return this.prisma.$transaction(async (prisma) => {
      // Upsert all answers
      for (const answerDto of dto.answers) {
        await prisma.answer.upsert({
          where: {
            reviewId_questionId: {
              reviewId: reviewId,
              questionId: answerDto.questionId,
            },
          },
          create: {
            reviewId: reviewId,
            questionId: answerDto.questionId,
            rating: answerDto.rating,
            textAnswer: answerDto.textAnswer,
          },
          update: {
            rating: answerDto.rating,
            textAnswer: answerDto.textAnswer,
          },
        });
      }

      // Update review status to SUBMITTED
      const submittedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          status: 'SUBMITTED',
          updatedAt: new Date(),
        },
      });

      return {
        message: 'Review submitted successfully',
        review: submittedReview,
      };
    });
  }

  /**
   * Helper: Verify review exists and user has access
   * CRITICAL: Multi-tenancy check through reviewCycle
   */
  private async verifyReviewAccess(
    reviewId: string,
    userId: string,
    companyId: string,
  ) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        employeeId: userId,
        reviewType: 'SELF',
        reviewCycle: {
          companyId: companyId, // CRITICAL: Multi-tenancy
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found or access denied');
    }

    return review;
  }
}
