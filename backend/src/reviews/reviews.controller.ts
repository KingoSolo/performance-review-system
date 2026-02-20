import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ReviewsService,
  SaveDraftDto,
  SubmitReviewDto,
} from './reviews.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyId } from '../common/decorators/company-id.decorator';

@Controller('reviews')
@UseGuards(AuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * GET /reviews/self/:cycleId
   * Get self-review for current user in specified cycle
   * Auto-creates review if it doesn't exist
   */
  @Get('self/:cycleId')
  async getSelfReview(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: any,
    @CompanyId() companyId: string,
  ) {
    return this.reviewsService.findOrCreateSelfReview(
      user.id,
      companyId,
      cycleId,
    );
  }

  /**
   * PATCH /reviews/self/:cycleId/draft
   * Save draft answers (auto-save)
   * Updates review status to DRAFT if not already
   */
  @Patch('self/:cycleId/draft')
  async saveDraft(
    @Param('cycleId') cycleId: string,
    @Body() dto: SaveDraftDto,
    @CurrentUser() user: any,
    @CompanyId() companyId: string,
  ) {
    // First get the review to obtain reviewId
    const { review } = await this.reviewsService.findOrCreateSelfReview(
      user.id,
      companyId,
      cycleId,
    );

    return this.reviewsService.saveDraft(
      review.id,
      user.id,
      companyId,
      dto,
    );
  }

  /**
   * POST /reviews/self/:cycleId/submit
   * Submit final review
   * Validates all questions answered
   * Changes status to SUBMITTED (immutable)
   */
  @Post('self/:cycleId/submit')
  async submitReview(
    @Param('cycleId') cycleId: string,
    @Body() dto: SubmitReviewDto,
    @CurrentUser() user: any,
    @CompanyId() companyId: string,
  ) {
    // First get the review to obtain reviewId
    const { review } = await this.reviewsService.findOrCreateSelfReview(
      user.id,
      companyId,
      cycleId,
    );

    return this.reviewsService.submitReview(
      review.id,
      user.id,
      companyId,
      dto,
    );
  }

  // ============================================================================
  // Manager Review Endpoints
  // ============================================================================

  /**
   * GET /reviews/manager/:cycleId
   * Get list of employees assigned to this manager for review
   * Returns employees with their review status
   */
  @Get('manager/:cycleId')
  async getEmployeesToReview(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: any,
    @CompanyId() companyId: string,
  ) {
    return this.reviewsService.getEmployeesToReview(
      user.id,
      companyId,
      cycleId,
    );
  }

  /**
   * GET /reviews/manager/:cycleId/:employeeId
   * Get manager review form for specific employee
   * Includes employee's self-review answers
   */
  @Get('manager/:cycleId/:employeeId')
  async getManagerReview(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: any,
    @CompanyId() companyId: string,
  ) {
    return this.reviewsService.findOrCreateManagerReview(
      user.id,
      companyId,
      cycleId,
      employeeId,
    );
  }

  /**
   * POST /reviews/manager/:cycleId/:employeeId
   * Save or submit manager review
   * Body should include { answers: [...], submit: boolean }
   */
  @Post('manager/:cycleId/:employeeId')
  async saveManagerReview(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: SaveDraftDto & { submit?: boolean },
    @CurrentUser() user: any,
    @CompanyId() companyId: string,
  ) {
    // First get the review to obtain reviewId
    const { review } = await this.reviewsService.findOrCreateManagerReview(
      user.id,
      companyId,
      cycleId,
      employeeId,
    );

    return this.reviewsService.saveManagerReview(
      review.id,
      user.id,
      companyId,
      { answers: body.answers },
      body.submit || false,
    );
  }
}
