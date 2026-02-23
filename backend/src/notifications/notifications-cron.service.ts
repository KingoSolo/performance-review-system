import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { LoggerService } from '../common/services/logger.service';

@Injectable()
export class NotificationsCronService {
  private readonly logger: LoggerService;

  constructor(private readonly notificationsService: NotificationsService) {
    this.logger = new LoggerService();
    this.logger.setContext('NotificationsCron');
  }

  /**
   * Daily cron job to send reminders for pending reviews
   * Runs every day at 9:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handlePendingReviewReminders() {
    this.logger.log('⏰ Running daily reminder cron job');
    try {
      await this.notificationsService.sendPendingReviewReminders();
      this.logger.log('✅ Reminder cron job completed');
    } catch (error: any) {
      this.logger.error('❌ Reminder cron job failed:', error.message);
    }
  }
}
