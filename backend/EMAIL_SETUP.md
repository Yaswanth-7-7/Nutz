# Email Setup Guide for OTP Password Reset

## Current Status
The OTP system is working, but emails are being logged to console instead of sent because email credentials are not configured.

## How to Enable Real Email Sending

### Step 1: Set up Gmail App Password

1. **Go to your Google Account settings:**
   - Visit: https://myaccount.google.com/
   - Sign in with your Gmail account

2. **Enable 2-Factor Authentication:**
   - Go to "Security" tab
   - Click on "2-Step Verification"
   - Enable it if not already enabled

3. **Generate App Password:**
   - Go to "Security" tab
   - Click on "App passwords" (under 2-Step Verification)
   - Select "Mail" as the app
   - Select "Other" as device
   - Enter "SocialApp" as the name
   - Click "Generate"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update Environment Variables

Edit the file `backend/config.env` and update these lines:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

Replace:
- `your-email@gmail.com` with your actual Gmail address
- `your-16-char-app-password` with the 16-character app password (remove spaces)

### Step 3: Restart the Server

After updating the config, restart the backend server:

```bash
cd backend
npm start
```

### Step 4: Test the Email

1. Go to the forgot password page
2. Enter your email address
3. Click "Send OTP"
4. Check your email inbox for the OTP

## Development Mode (Current)

Currently, the system is in development mode, which means:
- ✅ OTPs are generated correctly
- ✅ OTPs are saved to database
- ✅ OTPs are logged to console (you can see them there)
- ❌ Emails are not actually sent

## Console Output Example

When you request an OTP, you'll see something like this in the console:

```
📧 Email Configuration Check:
EMAIL_USER: ❌ Not set
EMAIL_PASS: ❌ Not set
⚠️  Using development mode - emails will be logged instead of sent
📧 DEVELOPMENT EMAIL LOG:
From: "SocialApp" <yaswantsankar@gmail.com>
To: your-email@example.com
Subject: Password Reset OTP - SocialApp
OTP Code: 123456
📧 END EMAIL LOG
```

## Troubleshooting

### If emails still don't send after setup:

1. **Check Gmail settings:**
   - Make sure "Less secure app access" is enabled (if not using App Password)
   - Check if Gmail is blocking the connection

2. **Check firewall/antivirus:**
   - Some security software blocks SMTP connections

3. **Check the console logs:**
   - Look for specific error messages
   - Common errors: "Invalid login", "Authentication failed"

### Alternative: Use the Test Page

You can also use the test page at `/test-reset` to:
- Generate OTPs
- See the OTP in the browser
- Test the reset functionality without email

## Security Notes

- Never commit your email password to version control
- Use App Passwords instead of your main Gmail password
- The OTP expires in 10 minutes for security
- Each OTP can only be used once 