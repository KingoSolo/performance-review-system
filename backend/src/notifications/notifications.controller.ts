import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { NotificationsService, NotificationPreferences } from './notifications.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications/preferences
   * Get user's notification preferences
   */
  @Get('preferences')
  async getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getUserPreferences(user.id);
  }

  /**
   * PUT /notifications/preferences
   * Update user's notification preferences
   */
  @Put('preferences')
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() preferences: NotificationPreferences,
  ) {
    await this.notificationsService.updateUserPreferences(user.id, preferences);
    return { message: 'Notification preferences updated successfully' };
  }
}
