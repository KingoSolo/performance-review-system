import { Module } from '@nestjs/common';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [ScoringController],
  providers: [ScoringService, PrismaService],
  exports: [ScoringService],
})
export class ScoringModule {}
