import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { PrismaService } from '../common/services/prisma.service';

// ============================================================================
// DTOs
// ============================================================================

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

export interface NotificationPreferences {
  cycleStarted: boolean;
  reviewAssigned: boolean;
  reminders: boolean;
  scoreAvailable: boolean;
}

// ============================================================================
// Service
// ============================================================================

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.EMAIL_SERVICE_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@performanceapp.com';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('✅ Email service initialized');
    } else {
      this.logger.warn('⚠️  EMAIL_SERVICE_KEY not set - emails will be logged only');
    }
  }

  // ============================================================================
  // Core Email Sending
  // ============================================================================

  private async sendEmail(notification: EmailNotification): Promise<void> {
    try {
      if (!this.resend) {
        this.logger.log(`📧 [DEV MODE] Email to ${notification.to}:`);
        this.logger.log(`   Subject: ${notification.subject}`);
        this.logger.log(`   Body: ${notification.html.substring(0, 200)}...`);
        return;
      }

      await this.resend.emails.send({
        from: this.fromEmail,
        to: notification.to,
        subject: notification.subject,
        html: notification.html,
      });

      this.logger.log(`✅ Email sent to ${notification.to}: ${notification.subject}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to send email to ${notification.to}:`, error.message);
    }
  }

  // ============================================================================
  // Email Templates
  // ============================================================================

  private cycleStartedTemplate(
    userName: string,
    cycleName: string,
    endDate: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Review Cycle Started</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>A new performance review cycle has started:</p>
            <p><strong>${cycleName}</strong></p>
            <p>Deadline: <strong>${new Date(endDate).toLocaleDateString()}</strong></p>
            <p>Please complete your self-review and any assigned peer reviews before the deadline.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employee" class="button">Go to Dashboard</a>
          </div>
          <div class="footer">
            <p>This is an automated message from the Performance Review System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private reviewAssignedTemplate(
    reviewerName: string,
    employeeName: string,
    reviewType: string,
    cycleName: string,
  ): string {
    const type = reviewType === 'MANAGER' ? 'manager review' : 'peer review';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Review Assigned</h1>
          </div>
          <div class="content">
            <p>Hi ${reviewerName},</p>
            <p>You have been assigned a ${type} for <strong>${employeeName}</strong> in the <strong>${cycleName}</strong> cycle.</p>
            <p>Please complete the review at your earliest convenience.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/manager/reviews" class="button">Complete Review</a>
          </div>
          <div class="footer">
            <p>This is an automated message from the Performance Review System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private reminderTemplate(
    userName: string,
    pendingCount: number,
    cycleName: string,
    daysLeft: number,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Review Deadline Approaching</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <div class="warning">
              <strong>Reminder:</strong> You have <strong>${pendingCount}</strong> pending review(s) in the <strong>${cycleName}</strong> cycle.
            </div>
            <p>Deadline in <strong>${daysLeft} days</strong>!</p>
            <p>Please complete your pending reviews to ensure timely feedback.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employee" class="button">Complete Reviews</a>
          </div>
          <div class="footer">
            <p>This is an automated message from the Performance Review System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private scoreAvailableTemplate(
    employeeName: string,
    score: number,
    cycleName: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .score-box { background-color: #d1fae5; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0; }
          .score { font-size: 48px; font-weight: bold; color: #10b981; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your Review Score is Ready</h1>
          </div>
          <div class="content">
            <p>Hi ${employeeName},</p>
            <p>Your performance review score for <strong>${cycleName}</strong> is now available!</p>
            <div class="score-box">
              <div class="score">${score.toFixed(2)}</div>
              <div>out of 5.00</div>
            </div>
            <p>View your detailed feedback and score breakdown in your dashboard.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employee/scores" class="button">View Details</a>
          </div>
          <div class="footer">
            <p>This is an automated message from the Performance Review System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ============================================================================
  // Public Notification Methods
  // ============================================================================

  async sendCycleStartedNotifications(
    cycleId: string,
    companyId: string,
  ): Promise<void> {
    this.logger.log(`📧 Sending cycle started notifications for cycle ${cycleId}`);

    const cycle = await this.prisma.reviewCycle.findFirst({
      where: { id: cycleId, companyId },
    });

    if (!cycle) {
      this.logger.error('Cycle not found');
      return;
    }

    // Get all employees in the company
    const employees = await this.prisma.user.findMany({
      where: { companyId, role: 'EMPLOYEE' },
    });

    this.logger.log(`Sending to ${employees.length} employees`);

    for (const employee of employees) {
      await this.sendEmail({
        to: employee.email,
        subject: `New Review Cycle: ${cycle.name}`,
        html: this.cycleStartedTemplate(
          employee.name,
          cycle.name,
          cycle.endDate.toISOString(),
        ),
      });
    }
  }

  async sendReviewAssignedNotification(
    reviewerId: string,
    employeeId: string,
    reviewType: 'MANAGER' | 'PEER',
    cycleId: string,
  ): Promise<void> {
    this.logger.log(
      `📧 Sending review assigned notification to reviewer ${reviewerId}`,
    );

    const [reviewer, employee, cycle] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: reviewerId } }),
      this.prisma.user.findUnique({ where: { id: employeeId } }),
      this.prisma.reviewCycle.findUnique({ where: { id: cycleId } }),
    ]);

    if (!reviewer || !employee || !cycle) {
      this.logger.error('Reviewer, employee, or cycle not found');
      return;
    }

    await this.sendEmail({
      to: reviewer.email,
      subject: `Review Assigned: ${employee.name}`,
      html: this.reviewAssignedTemplate(
        reviewer.name,
        employee.name,
        reviewType,
        cycle.name,
      ),
    });
  }

  async sendPendingReviewReminders(): Promise<void> {
    this.logger.log('📧 Checking for pending review reminders');

    // Get active cycles ending in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const cycles = await this.prisma.reviewCycle.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: threeDaysFromNow,
          gte: new Date(),
        },
      },
      include: {
        company: true,
      },
    });

    this.logger.log(`Found ${cycles.length} cycles with upcoming deadlines`);

    for (const cycle of cycles) {
      const daysLeft = Math.ceil(
        (cycle.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      // Get users with pending reviews
      const reviews = await this.prisma.review.findMany({
        where: {
          reviewCycleId: cycle.id,
          status: { not: 'SUBMITTED' },
        },
        include: {
          reviewer: true,
        },
      });

      // Group by reviewer
      const reviewsByUser = new Map<string, number>();
      reviews.forEach((review) => {
        const count = reviewsByUser.get(review.reviewerId) || 0;
        reviewsByUser.set(review.reviewerId, count + 1);
      });

      this.logger.log(
        `Sending reminders to ${reviewsByUser.size} users for cycle ${cycle.name}`,
      );

      for (const [userId, pendingCount] of reviewsByUser) {
        const user = reviews.find((r) => r.reviewerId === userId)?.reviewer;
        if (user) {
          await this.sendEmail({
            to: user.email,
            subject: `Reminder: ${pendingCount} Pending Reviews`,
            html: this.reminderTemplate(
              user.name,
              pendingCount,
              cycle.name,
              daysLeft,
            ),
          });
        }
      }
    }
  }

  async sendScoreAvailableNotification(
    employeeId: string,
    cycleId: string,
    score: number,
  ): Promise<void> {
    this.logger.log(
      `📧 Sending score available notification to employee ${employeeId}`,
    );

    const [employee, cycle] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: employeeId } }),
      this.prisma.reviewCycle.findUnique({ where: { id: cycleId } }),
    ]);

    if (!employee || !cycle) {
      this.logger.error('Employee or cycle not found');
      return;
    }

    await this.sendEmail({
      to: employee.email,
      subject: `Your Review Score for ${cycle.name}`,
      html: this.scoreAvailableTemplate(employee.name, score, cycle.name),
    });
  }

  // ============================================================================
  // Notification Preferences
  // ============================================================================

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (user?.notificationPreferences) {
      return user.notificationPreferences as unknown as NotificationPreferences;
    }

    // Default: all enabled
    return {
      cycleStarted: true,
      reviewAssigned: true,
      reminders: true,
      scoreAvailable: true,
    };
  }

  async updateUserPreferences(
    userId: string,
    preferences: NotificationPreferences,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: preferences as unknown as any },
    });

    this.logger.log(`Updated notification preferences for user ${userId}`);
  }
}
