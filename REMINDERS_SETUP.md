# Automated Reminders Setup Guide

This guide will help you set up automated email and SMS reminders for appointments.

## Overview

The reminder system automatically sends notifications to customers or employees based on the number of days before an appointment. Reminders are processed daily via a cron job.

## Prerequisites

1. Email service account (SendGrid, AWS SES, Gmail, or generic SMTP)
2. SMS service account (Twilio) - optional if you only want email reminders
3. Environment variables configured

## Step 1: Email Service Setup

Choose one of the following email providers:

### Option 1: SendGrid (Recommended)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key in the SendGrid dashboard
3. Add to `.env.local`:
   ```
   SENDGRID_API_KEY="your_sendgrid_api_key_here"
   FROM_EMAIL="noreply@yourdomain.com"
   FROM_NAME="GearShift"
   ```

### Option 2: AWS SES

1. Set up AWS SES in your AWS account
2. Verify your email address or domain
3. Create IAM user with SES permissions
4. Add to `.env.local`:
   ```
   AWS_SES_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="your_aws_access_key"
   AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
   FROM_EMAIL="noreply@yourdomain.com"
   FROM_NAME="GearShift"
   ```

### Option 3: Gmail (Development/Testing)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Add to `.env.local`:
   ```
   GMAIL_USER="your_email@gmail.com"
   GMAIL_APP_PASSWORD="your_app_specific_password"
   FROM_EMAIL="your_email@gmail.com"
   FROM_NAME="GearShift"
   ```

### Option 4: Generic SMTP

1. Get SMTP credentials from your email provider
2. Add to `.env.local`:
   ```
   SMTP_HOST="smtp.example.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your_smtp_username"
   SMTP_PASSWORD="your_smtp_password"
   FROM_EMAIL="noreply@yourdomain.com"
   FROM_NAME="GearShift"
   ```

## Step 2: SMS Service Setup (Optional)

### Twilio Setup

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get a phone number from Twilio
3. Get your Account SID and Auth Token from the Twilio dashboard
4. Add to `.env.local`:
   ```
   TWILIO_ACCOUNT_SID="your_twilio_account_sid"
   TWILIO_AUTH_TOKEN="your_twilio_auth_token"
   TWILIO_PHONE_NUMBER="+1234567890"
   ```

## Step 3: Cron Job Setup

The reminder processing endpoint is at `/api/reminders/process`. You need to set up a cron job to call this endpoint daily.

### Option 1: Vercel Cron (If deploying to Vercel)

The `vercel.json` file is already configured. Vercel will automatically run the cron job daily at 9 AM UTC.

To customize the schedule, edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/reminders/process",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Schedule format: `minute hour day month day-of-week`
- `0 9 * * *` = Daily at 9:00 AM UTC
- `0 */6 * * *` = Every 6 hours
- `0 8 * * 1-5` = Weekdays at 8:00 AM UTC

### Option 2: External Cron Service

Use a service like:
- [cron-job.org](https://cron-job.org/)
- [EasyCron](https://www.easycron.com/)
- [Cronitor](https://cronitor.io/)

Configure it to call:
```
https://your-domain.com/api/reminders/process
```

**Important**: Add authentication by setting `CRON_SECRET` in your `.env.local`:
```
CRON_SECRET="your_random_secret_string_here"
```

Then configure your cron service to send:
```
Authorization: Bearer your_random_secret_string_here
```

### Option 3: Manual Testing

You can manually trigger reminder processing by visiting:
```
http://localhost:3000/api/reminders/process
```

Or using curl:
```bash
curl http://localhost:3000/api/reminders/process
```

## Step 4: Environment Variables Summary

Add these to your `.env.local` file:

```env
# Database
DATABASE_URL="file:./dev.db"

# Email (choose one method)
SENDGRID_API_KEY="your_sendgrid_api_key"
# OR
# AWS_SES_REGION="us-east-1"
# AWS_ACCESS_KEY_ID="your_key"
# AWS_SECRET_ACCESS_KEY="your_secret"
# OR
# GMAIL_USER="your_email@gmail.com"
# GMAIL_APP_PASSWORD="your_app_password"
# OR
# SMTP_HOST="smtp.example.com"
# SMTP_PORT="587"
# SMTP_USER="username"
# SMTP_PASSWORD="password"

FROM_EMAIL="noreply@yourdomain.com"
FROM_NAME="GearShift"

# SMS (optional)
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Cron Security (optional but recommended)
CRON_SECRET="your_random_secret"
```

## How It Works

1. **Reminder Creation**: When you create a reminder, it's stored in the database with `sent: false`
2. **Daily Processing**: The cron job calls `/api/reminders/process` daily
3. **Date Calculation**: The system calculates when each reminder should be sent (job date - daysBefore)
4. **Sending**: On the correct date, reminders are sent via the configured method (email/SMS/app)
5. **Status Update**: After successful sending, `sent` is set to `true` and `sentAt` is recorded

## Testing

1. Create a test reminder with `daysBefore: 0` (same day)
2. Manually call `/api/reminders/process` to test
3. Check the response for sent/failed counts
4. Verify the email/SMS was received

## Troubleshooting

### Emails not sending
- Check email service credentials are correct
- Verify `FROM_EMAIL` is a verified sender (for SES/SendGrid)
- Check server logs for error messages

### SMS not sending
- Verify Twilio credentials
- Check phone number format (should include country code)
- Ensure Twilio account has sufficient balance

### Reminders not processing
- Verify cron job is configured correctly
- Check cron job logs
- Manually test the `/api/reminders/process` endpoint
- Ensure reminders have correct `daysBefore` values

## Security Notes

- Never commit `.env.local` to git
- Use strong, random values for `CRON_SECRET`
- Regularly rotate API keys and tokens
- Monitor your email/SMS service usage and costs


