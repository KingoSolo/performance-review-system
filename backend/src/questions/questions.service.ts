import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { QuestionType, ReviewType } from '@prisma/client';

export interface CreateQuestionDto {
  reviewType: ReviewType;
  type: QuestionType;
  text: string;
  maxChars?: number;
  order?: number;
}

export interface UpdateQuestionDto {
  reviewType?: ReviewType;
  type?: QuestionType;
  text?: string;
  maxChars?: number;
  order?: number;
}

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all questions for a company, optionally filtered by review type
   * CRITICAL: Always filter by companyId for multi-tenancy
   */
  async findAll(companyId: string, reviewType?: ReviewType) {
    console.log(`📋 Fetching questions for company: ${companyId}, type: ${reviewType || 'all'}`);

    return this.prisma.question.findMany({
      where: {
        companyId,
        ...(reviewType && { reviewType }),
      },
      orderBy: [
        { reviewType: 'asc' },
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Get a single question by ID
   * CRITICAL: Always filter by companyId for multi-tenancy
   */
  async findOne(id: string, companyId: string) {
    console.log(`🔍 Fetching question ${id} for company ${companyId}`);

    const question = await this.prisma.question.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  /**
   * Create a new question
   * CRITICAL: Always set companyId for multi-tenancy
   */
  async create(companyId: string, dto: CreateQuestionDto) {
    console.log(`➕ Creating question for company ${companyId}:`, dto.text.substring(0, 50));

    // If order is not provided, get the next order number for this review type
    let order = dto.order;
    if (order === undefined) {
      const lastQuestion = await this.prisma.question.findFirst({
        where: {
          companyId,
          reviewType: dto.reviewType,
        },
        orderBy: { order: 'desc' },
      });

      order = lastQuestion ? lastQuestion.order + 1 : 0;
    }

    return this.prisma.question.create({
      data: {
        companyId,
        reviewType: dto.reviewType,
        type: dto.type,
        text: dto.text,
        maxChars: dto.maxChars,
        order,
      },
    });
  }

  /**
   * Update a question
   * CRITICAL: Always filter by companyId for multi-tenancy
   */
  async update(id: string, companyId: string, dto: UpdateQuestionDto) {
    console.log(`✏️  Updating question ${id} for company ${companyId}`);

    // Verify the question exists and belongs to the company
    await this.findOne(id, companyId);

    return this.prisma.question.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete a question
   * CRITICAL: Always filter by companyId for multi-tenancy
   */
  async delete(id: string, companyId: string) {
    console.log(`🗑️  Deleting question ${id} for company ${companyId}`);

    // Verify the question exists and belongs to the company
    await this.findOne(id, companyId);

    return this.prisma.question.delete({
      where: { id },
    });
  }

  /**
   * Reorder questions within a review type
   * CRITICAL: Always filter by companyId for multi-tenancy
   */
  async reorder(
    companyId: string,
    reviewType: ReviewType,
    questionIds: string[],
  ) {
    console.log(`🔄 Reordering ${questionIds.length} questions for company ${companyId}, type: ${reviewType}`);

    // Verify all questions belong to the company and review type
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: questionIds },
        companyId,
        reviewType,
      },
    });

    if (questions.length !== questionIds.length) {
      throw new NotFoundException('Some questions not found or do not belong to this company');
    }

    // Update order for each question
    const updates = questionIds.map((id, index) =>
      this.prisma.question.update({
        where: { id },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updates);

    return { message: 'Questions reordered successfully' };
  }

  /**
   * Get questions grouped by review type
   * CRITICAL: Always filter by companyId for multi-tenancy
   */
  async findGroupedByType(companyId: string) {
    console.log(`📊 Fetching grouped questions for company ${companyId}`);

    const questions = await this.findAll(companyId);

    // Group by review type
    const grouped = {
      SELF: questions.filter((q) => q.reviewType === 'SELF'),
      MANAGER: questions.filter((q) => q.reviewType === 'MANAGER'),
      PEER: questions.filter((q) => q.reviewType === 'PEER'),
    };

    return grouped;
  }

  /**
   * Duplicate a question
   * CRITICAL: Always set companyId for multi-tenancy
   */
  async duplicate(id: string, companyId: string) {
    console.log(`📋 Duplicating question ${id} for company ${companyId}`);

    const original = await this.findOne(id, companyId);

    // Get the next order number
    const lastQuestion = await this.prisma.question.findFirst({
      where: {
        companyId,
        reviewType: original.reviewType,
      },
      orderBy: { order: 'desc' },
    });

    const nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    return this.prisma.question.create({
      data: {
        companyId,
        reviewType: original.reviewType,
        type: original.type,
        text: `${original.text} (Copy)`,
        maxChars: original.maxChars,
        order: nextOrder,
      },
    });
  }
}
