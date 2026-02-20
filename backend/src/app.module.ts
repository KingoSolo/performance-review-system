import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuestionsModule } from './questions/questions.module';
import { ReviewCyclesModule } from './review-cycles/review-cycles.module';
import { ReviewerAssignmentsModule } from './reviewer-assignments/reviewer-assignments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ScoringModule } from './scoring/scoring.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { PrismaService } from './common/services/prisma.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    QuestionsModule,
    ReviewCyclesModule,
    ReviewerAssignmentsModule,
    ReviewsModule,
    ScoringModule,
  ],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant context middleware to all routes except auth
    consumer
      .apply(TenantContextMiddleware)
      .exclude('auth/signin', 'auth/signup')
      .forRoutes('*');
  }
}
