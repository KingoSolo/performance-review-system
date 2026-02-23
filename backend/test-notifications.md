# Notification System Testing Guide

## ✅ Email Service Status
- Email service initialized with Resend API key
- Notifications endpoints registered:
  - GET  /api/notifications/preferences
  - PUT  /api/notifications/preferences

## How to Test Each Notification Type

### 1. Test "Cycle Started" Email

**Trigger:** Activate a review cycle

```bash
# 1. Login as admin
curl -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"cuquojafreipi-6821@yopmail.com","password":"password123"}' \
  | jq -r '.session.access_token' > /tmp/token.txt

TOKEN=$(cat /tmp/token.txt)

# 2. Create a new DRAFT cycle
CYCLE=$(curl -X POST http://localhost:4000/api/review-cycles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Email Notification Cycle",
    "startDate":"2026-02-22",
    "endDate":"2026-03-31",
    "reviewConfigs":[{
      "stepNumber":1,
      "reviewType":"SELF",
      "startDate":"2026-02-22",
      "endDate":"2026-03-31"
    }]
  }')

CYCLE_ID=$(echo $CYCLE | jq -r '.id')
echo "Created cycle: $CYCLE_ID"

# 3. Activate the cycle (this triggers the email!)
curl -X POST "http://localhost:4000/api/review-cycles/$CYCLE_ID/activate" \
  -H "Authorization: Bearer $TOKEN"

# ✅ Check backend logs for: "📧 Sending cycle started notifications"
# ✅ Check your email inbox for the notification
```

### 2. Test "Score Available" Email

**Trigger:** Calculate an employee's score

```bash
# Prerequisites: Need submitted reviews first
# Use existing test data with submitted reviews

TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"cuquojafreipi-6821@yopmail.com","password":"password123"}' \
  | jq -r '.session.access_token')

# Calculate score for employee in existing cycle
curl -X POST "http://localhost:4000/api/scoring/calculate/cmlu75q97000ac9dleozcm2hd/toiddeucricraucre-7906@yopmail.com" \
  -H "Authorization: Bearer $TOKEN"

# ✅ Check backend logs for: "📧 Sending score available notification"
# ✅ Employee should receive email with their score
```

### 3. Test "Reminder" Email

**Trigger:** Manual test (cron runs daily at 9 AM automatically)

```bash
# Create a test script to manually trigger reminders
cat > test-reminder.ts << 'SCRIPT'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { NotificationsService } from './src/notifications/notifications.service';

async function testReminders() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);
  
  console.log('🧪 Testing reminder emails...');
  await notificationsService.sendPendingReviewReminders();
  console.log('✅ Test complete');
  
  await app.close();
}

testReminders();
SCRIPT

npx tsx test-reminder.ts
```

### 4. Test Notification Preferences

**Via Frontend:**
1. Go to http://localhost:3002/settings
2. Login as any user
3. Toggle notification preferences
4. Click "Save Preferences"
5. Verify success message

**Via API:**
```bash
# Get preferences
curl -X GET http://localhost:4000/api/notifications/preferences \
  -H "Authorization: Bearer $TOKEN"

# Update preferences
curl -X PUT http://localhost:4000/api/notifications/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cycleStarted": false,
    "reviewAssigned": true,
    "reminders": true,
    "scoreAvailable": true
  }'
```

## Email Verification

### Check Resend Dashboard
1. Go to https://resend.com/emails
2. Login with your account
3. View sent emails and their status
4. Check delivery, opens, clicks

### Check Recipient Inbox
- Use real email addresses in your test users
- Check spam folder if not in inbox
- Verify email content and formatting

## Monitoring Backend Logs

```bash
# Follow backend logs in real-time
tail -f /tmp/backend-notifications.log | grep -i "email\|notification"
```

Look for these log messages:
- ✅ `Email service initialized`
- 📧 `Sending cycle started notifications`
- 📧 `Sending score available notification`
- 📧 `Checking for pending review reminders`
- ✅ `Email sent to user@example.com`
- ❌ `Failed to send email` (if errors)

## Testing Checklist

- [ ] Email service initialized with Resend API key
- [ ] Cycle activation sends emails to all employees
- [ ] Score calculation sends email to specific employee
- [ ] Reminder cron job finds pending reviews
- [ ] User preferences can be retrieved
- [ ] User preferences can be updated
- [ ] Settings page loads and displays preferences
- [ ] Toggle switches work and save correctly
- [ ] Emails appear in Resend dashboard
- [ ] Emails delivered to recipient inboxes

## Troubleshooting

### No Emails Sent
- Check `EMAIL_SERVICE_KEY` in .env
- Verify Resend API key is valid
- Check backend logs for errors
- Verify user email addresses are valid

### Emails in Spam
- Add sender domain verification in Resend
- Use a verified sender email address
- Add SPF/DKIM records to your domain

### Cron Not Running
- Cron runs at 9 AM daily automatically
- Test manually using test script above
- Check backend logs for cron execution

## Advanced Testing

### Load Test
```bash
# Create multiple cycles and activate them
for i in {1..5}; do
  # Create and activate cycle
  # This will send emails to all employees
done
```

### Email Content Preview
Check HTML rendering in different email clients:
- Gmail
- Outlook
- Apple Mail
- Mobile devices

