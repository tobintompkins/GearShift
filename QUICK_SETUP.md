# Quick Setup: Gmail + Twilio

## Step 1: Get Gmail App Password

1. **Enable 2-Factor Authentication** (if not already):
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)" → Enter "GearShift"
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - Remove spaces when adding to .env.local

## Step 2: Get Twilio Credentials

1. **Sign up for Twilio** (free trial with $15.50 credit):
   - Go to: https://www.twilio.com/try-twilio
   - Create account and verify email/phone

2. **Get a Phone Number**:
   - In Twilio Console → Phone Numbers → Buy a number
   - Choose a US number (free for trial)
   - Copy the number (e.g., +1234567890)

3. **Get API Credentials**:
   - In Twilio Console → Account → API Keys & Tokens
   - Copy **Account SID** (starts with `AC...`)
   - Copy **Auth Token** (click to reveal)

## Step 3: Add to .env.local

Open your `.env.local` file and add these lines (keep your existing DATABASE_URL):

```env
# Database (keep existing)
DATABASE_URL="file:./dev.db"

# Gmail Configuration
GMAIL_USER="your_email@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"
FROM_EMAIL="your_email@gmail.com"
FROM_NAME="GearShift"

# Twilio Configuration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"
```

**Replace the placeholder values with your actual credentials!**

## Step 4: Restart Dev Server

After adding credentials:
```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 5: Test Configuration

1. Visit: http://localhost:3000/reminders/setup
2. Enter a test email and/or phone number
3. Click "Test Configuration"
4. Check if email/SMS was received

## Troubleshooting

**Gmail not working?**
- Make sure you're using an App Password, not your regular password
- Remove spaces from the app password
- Verify 2FA is enabled

**Twilio not working?**
- Trial accounts can only send to verified phone numbers
- Make sure phone number includes country code (+1 for US)
- Check Twilio dashboard for error messages

**Need help?** Visit `/reminders/setup` for detailed instructions and testing tools.


