# Quick Setup Guide: Gmail + Twilio

This guide will help you quickly set up Gmail for email and Twilio for SMS reminders.

## Gmail Setup

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "GearShift" as the name
5. Click **Generate**
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Add to .env.local
Add these lines to your `.env.local` file:
```
GMAIL_USER="your_email@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"
FROM_EMAIL="your_email@gmail.com"
FROM_NAME="GearShift"
```

**Note**: Remove spaces from the app password when adding it to `.env.local`

## Twilio Setup

### Step 1: Create Twilio Account
1. Go to: https://www.twilio.com/try-twilio
2. Sign up for a free account (includes $15.50 credit for testing)
3. Verify your email and phone number

### Step 2: Get a Phone Number
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Choose a number (US numbers are free for trial accounts)
3. Click **Buy** to get your number

### Step 3: Get Credentials
1. In Twilio Console, go to **Account** → **API Keys & Tokens**
2. You'll see:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)
3. Copy both values

### Step 4: Add to .env.local
Add these lines to your `.env.local` file:
```
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"
```

**Note**: The phone number should include the country code (e.g., +1 for US)

## Complete .env.local Example

```env
# Database
DATABASE_URL="file:./dev.db"

# Gmail Email Configuration
GMAIL_USER="your_email@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"
FROM_EMAIL="your_email@gmail.com"
FROM_NAME="GearShift"

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"

# Optional: Cron Security
CRON_SECRET="your_random_secret_string"
```

## Testing Your Setup

After adding the credentials:

1. **Restart your dev server** (important for env variables to load)

2. **Test Email**:
   ```
   http://localhost:3000/api/reminders/test?email=your_test_email@gmail.com
   ```

3. **Test SMS**:
   ```
   http://localhost:3000/api/reminders/test?phone=+1234567890
   ```

4. **Check the response** - it will tell you if email/SMS is configured and if the test was successful

## Troubleshooting

### Gmail Issues
- **"Invalid login"**: Make sure you're using an App Password, not your regular Gmail password
- **"Less secure app"**: App Passwords bypass this, but make sure 2FA is enabled
- **Not receiving emails**: Check spam folder, verify FROM_EMAIL matches your Gmail address

### Twilio Issues
- **"Invalid phone number"**: Make sure the number includes country code (e.g., +1 for US)
- **"Unauthorized"**: Double-check your Account SID and Auth Token
- **"Insufficient balance"**: Free trial has limits; check your Twilio dashboard

## Next Steps

Once configured:
1. Create reminders from the Reminders page or Job detail pages
2. The cron job will automatically send reminders on the scheduled date
3. Check reminder status in the Reminders page


