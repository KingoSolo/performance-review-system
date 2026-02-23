import { Module, forwardRef } from '@nestjs/common';
import { ReviewCyclesController } from './review-cycles.controller';
import { ReviewCyclesService } from './review-cycles.service';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [ReviewCyclesController],
  providers: [ReviewCyclesService, PrismaService],
  exports: [ReviewCyclesService],
})
export class ReviewCyclesModule {}
