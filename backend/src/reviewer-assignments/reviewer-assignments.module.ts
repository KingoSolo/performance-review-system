import { Module } from '@nestjs/common';
import { ReviewerAssignmentsController } from './reviewer-assignments.controller';
import { ReviewerAssignmentsService } from './reviewer-assignments.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [ReviewerAssignmentsController],
  providers: [ReviewerAssignmentsService, PrismaService],
  exports: [ReviewerAssignmentsService],
})
export class ReviewerAssignmentsModule {}
