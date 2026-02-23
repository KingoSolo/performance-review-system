# 🧪 How to Test Email Notifications

## ✅ Prerequisites
- Backend running on port 4000
- Frontend running on port 3002
- Resend API key configured in `.env`

## 🎯 Quick Tests

### Test 1: User Preferences (Easiest)

**1. Open frontend:** http://localhost:3002/login

**2. Login as any user:**
- Email: `toiddeucricraucre-7906@yopmail.com`
- Password: `password123`

**3. Go to Settings:** http://localhost:3002/settings

**4. Test the toggles:**
- Toggle any notification preference
- Click "Save Preferences"
- Verify success message appears

**5. Refresh the page:**
- Your preferences should be persisted

---

### Test 2: Cycle Started Email (Real Email!)

**This will send REAL emails to all employees in the company**

**1. Login as Admin:**
```bash
# Get admin token
curl -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email":"cuquojafreipi-6821@yopmail.com",
    "password":"password123"
  }' | jq -r '.session.access_token' > /tmp/admin_token.txt
```

**2. Create a new review cycle:**
```bash
TOKEN=$(cat /tmp/admin_token.txt)

curl -X POST http://localhost:4000/api/review-cycles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Email Test Cycle",
    "startDate":"2026-02-22",
    "endDate":"2026-03-31",
    "reviewConfigs":[{
      "stepNumber":1,
      "reviewType":"SELF",
      "startDate":"2026-02-22",
      "endDate":"2026-03-31"
    }]
  }' | jq '.'
```

Copy the `id` from the response.

**3. Activate the cycle (THIS SENDS EMAILS!):**
```bash
CYCLE_ID="<paste-cycle-id-here>"

curl -X POST "http://localhost:4000/api/review-cycles/$CYCLE_ID/activate" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**4. Check results:**
- Watch backend logs: `tail -f /tmp/backend-notifications.log`
- Look for: `📧 Sending cycle started notifications`
- Check Resend dashboard: https://resend.com/emails
- Check employee email inboxes (toiddeucricraucre-7906@yopmail.com)

---

### Test 3: Score Available Email

**1. Calculate a score (triggers email):**
```bash
TOKEN=$(cat /tmp/admin_token.txt)

# Use existing cycle with submitted reviews
curl -X POST "http://localhost:4000/api/scoring/calculate/cmlu75q97000ac9dleozcm2hd/toiddeucricraucre-7906@yopmail.com" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**2. Check results:**
- Watch backend logs for: `📧 Sending score available notification`
- Check Resend dashboard
- Check employee email inbox

---

### Test 4: Monitor Backend Logs

**Open a terminal and run:**
```bash
tail -f /tmp/backend-notifications.log | grep --color=always -i "notification\|email\|📧\|✅"
```

**What to look for:**
```
✅ Email service initialized
📧 Sending cycle started notifications for cycle xxx
Sending to 3 employees
✅ Email sent to user@example.com: New Review Cycle: Email Test Cycle
```

---

## 📧 Verify Emails Sent

### Method 1: Resend Dashboard (Best)
1. Go to https://resend.com/emails
2. Login with your Resend account
3. You'll see all sent emails with:
   - ✅ Delivered
   - 📧 Recipient
   - 📝 Subject
   - 🕐 Timestamp

### Method 2: Check Email Inbox
**Test User Emails (use YOPmail for testing):**
- Admin: cuquojafreipi-6821@yopmail.com
- Manager: taffalloumeuddu-9599@yopmail.com
- Employee: toiddeucricraucre-7906@yopmail.com

**Access YOPmail inboxes:**
1. Go to http://www.yopmail.com
2. Enter email address (e.g., `toiddeucricraucre-7906`)
3. Click "Check Inbox"
4. Look for emails from `noreply@performanceapp.com`

---

## 🐛 Troubleshooting

### No Emails Sent?

**Check 1: API Key**
```bash
grep EMAIL_SERVICE_KEY backend/.env
# Should show: EMAIL_SERVICE_KEY="re_xxxxx"
```

**Check 2: Backend Logs**
```bash
grep "Email service initialized" /tmp/backend-notifications.log
# Should show: ✅ Email service initialized
```

**Check 3: Test Resend Connection**
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_JqZAc55P_7pWMtqHy4dc79hLqcWMJXSCi" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@performanceapp.com",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email from Resend</p>"
  }'
```

### Emails Go to Spam?
- Resend's free tier uses shared IPs
- Some emails may go to spam
- Solution: Verify your sender domain in Resend

---

## 📋 Testing Checklist

- [ ] Backend running with email service initialized
- [ ] Can access settings page at /settings
- [ ] Can toggle notification preferences
- [ ] Preferences save successfully
- [ ] Preferences persist after refresh
- [ ] Activating cycle triggers emails
- [ ] Emails appear in Resend dashboard
- [ ] Emails received in test inboxes
- [ ] Email HTML renders correctly
- [ ] Links in emails work

---

## 🚀 Daily Cron Job

The reminder cron job runs automatically every day at 9:00 AM.

**To test manually without waiting:**

1. Open backend code: `src/notifications/notifications-cron.service.ts`
2. Temporarily change schedule:
   ```typescript
   @Cron(CronExpression.EVERY_30_SECONDS) // Test every 30 seconds
   ```
3. Restart backend
4. Watch logs for reminder emails

**Or call the method directly via code:**
```typescript
// In any controller or service
await this.notificationsService.sendPendingReviewReminders();
```

---

## 📊 What Emails Look Like

### Cycle Started
**Subject:** New Review Cycle: Email Test Cycle
**Body:**
- Header with "New Review Cycle Started"
- Cycle name and deadline
- "Go to Dashboard" button
- Professional HTML styling

### Score Available
**Subject:** Your Review Score for Email Test Cycle
**Body:**
- Header with "🎉 Your Review Score is Ready"
- Large score display (e.g., "4.50 out of 5.00")
- "View Details" button
- Congratulatory message

### Reminder
**Subject:** Reminder: 2 Pending Reviews
**Body:**
- Warning header "⏰ Review Deadline Approaching"
- Number of pending reviews
- Days left until deadline
- "Complete Reviews" button

---

## 💡 Pro Tips

1. **Use YOPmail for testing** - disposable inboxes that work instantly
2. **Watch Resend dashboard** - see real-time delivery status
3. **Monitor backend logs** - grep for "email" keywords
4. **Test with different users** - admins, managers, employees
5. **Check spam folders** - free tier emails may go there
6. **Verify HTML rendering** - open emails in Gmail, Outlook, etc.

---

## 🎓 Next Steps

Once basic emails work:
- Add more email templates
- Customize email styling/branding
- Add email tracking (opens, clicks)
- Set up custom sender domain
- Add notification badges to UI
- Implement in-app notifications
