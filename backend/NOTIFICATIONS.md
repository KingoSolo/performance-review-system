# Email Notification System

## Overview

Basic email notification system using Resend for transactional emails.

## Features

### Email Templates

1. **Cycle Started** → Sent to all employees when a review cycle is activated
2. **Review Assigned** → Sent to managers/peers when assigned a review (TODO: Add trigger)
3. **Reminder** → Sent 3 days before deadline to users with pending reviews (Daily cron job at 9 AM)
4. **Score Available** → Sent to employees when their review score is calculated

### Triggers

- ✅ **Cycle Activation**: `ReviewCyclesService.activate()` → sends cycle started emails
- ⏳ **Review Assignment**: TODO - Add trigger when creating manager/peer reviews
- ✅ **Daily Cron**: `NotificationsCronService` → sends reminders at 9 AM daily
- ✅ **Score Calculation**: `ScoringService.calculateFinalScore()` → sends score available email

### User Preferences

Users can control which emails they receive via `/settings`:
- Cycle Started
- Review Assigned
- Reminders
- Score Available

Preferences stored in `User.notificationPreferences` (JSON field).

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# Email Configuration
EMAIL_SERVICE_KEY=""  # Get from https://resend.com/api-keys
EMAIL_FROM="noreply@performanceapp.com"
```

### Development Mode

If `EMAIL_SERVICE_KEY` is not set, emails are logged to console instead of sent.

## API Endpoints

### Get Notification Preferences
```
GET /api/notifications/preferences
Authorization: Bearer <token>
```

### Update Notification Preferences
```
PUT /api/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "cycleStarted": true,
  "reviewAssigned": true,
  "reminders": true,
  "scoreAvailable": true
}
```

## Frontend

### Settings Page

Access at `/settings` to manage notification preferences.

### API Client

```typescript
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/notifications';
```

## Testing

### Test Emails in Dev Mode

1. Leave `EMAIL_SERVICE_KEY` empty in `.env`
2. Check console logs for email content
3. Example log:
   ```
   📧 [DEV MODE] Email to user@example.com:
      Subject: New Review Cycle: Q1 2025
      Body: <!DOCTYPE html>...
   ```

### Test with Real Emails

1. Sign up at https://resend.com (free tier: 100 emails/day)
2. Add your API key to `.env`:
   ```env
   EMAIL_SERVICE_KEY="re_xxxxx"
   ```
3. Restart backend
4. Activate a review cycle or calculate scores

## Cron Jobs

### Daily Reminder Job

- **Schedule**: Every day at 9:00 AM
- **Function**: `NotificationsCronService.handlePendingReviewReminders()`
- **Logic**:
  1. Find active cycles ending in ≤3 days
  2. Find users with pending (non-SUBMITTED) reviews
  3. Send reminder emails with pending count

### Disable Cron in Development

Cron jobs run automatically. To test manually:

```typescript
// In your code
await notificationsService.sendPendingReviewReminders();
```

## Future Improvements

- [ ] Add review assigned trigger when creating manager/peer reviews
- [ ] Add in-app notifications (notification badge)
- [ ] Add email templates for:
  - Cycle completion
  - Manager feedback available
  - Peer feedback received
- [ ] Add notification history/audit log
- [ ] Add digest emails (weekly summary)
- [ ] Add Slack/Teams integration
