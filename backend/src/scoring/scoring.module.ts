import { Module, forwardRef } from '@nestjs/common';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [ScoringController],
  providers: [ScoringService, PrismaService],
  exports: [ScoringService],
})
export class ScoringModule {}
