import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyId } from '../common/decorators/company-id.decorator';

@Controller('scoring')
@UseGuards(AuthGuard)
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  /**
   * POST /scoring/calculate/:cycleId/:employeeId
   * Calculate final score for a specific employee
   * Returns detailed breakdown with per-question scores
   */
  @Post('calculate/:cycleId/:employeeId')
  async calculateScore(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: any,
    @CompanyId() companyId: string,
  ) {
    return this.scoringService.calculateFinalScore(
      employeeId,
      cycleId,
      companyId,
    );
  }

  /**
   * POST /scoring/calculate-all/:cycleId
   * Calculate final scores for all employees in the cycle
   * Used for batch processing and reports
   */
  @Post('calculate-all/:cycleId')
  async calculateAllScores(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: any,
    @CompanyId() companyId: string,
  ) {
    return this.scoringService.calculateAllScores(cycleId, companyId);
  }
}
