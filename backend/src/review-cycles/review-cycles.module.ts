import { Module } from '@nestjs/common';
import { ReviewCyclesController } from './review-cycles.controller';
import { ReviewCyclesService } from './review-cycles.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [ReviewCyclesController],
  providers: [ReviewCyclesService, PrismaService],
  exports: [ReviewCyclesService],
})
export class ReviewCyclesModule {}
