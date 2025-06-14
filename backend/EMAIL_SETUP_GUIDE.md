# 📧 Email Setup Guide for Performance Review Platform

## Quick Setup Instructions

### Step 1: Create .env file

Copy this template and save it as `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (your existing MongoDB connection)
MONGODB_URI=mongodb+srv://prpuser:prppassword123@cluster0.o1rmxqk.mongodb.net/performance-review-platform?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-for-security
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-different-from-main-secret
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration - CHOOSE ONE OPTION BELOW:

# OPTION 1: Gmail (Recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password

# OPTION 2: Outlook/Hotmail
# SMTP_HOST=smtp-mail.outlook.com
# SMTP_PORT=587
# SMTP_USER=your-email@outlook.com
# SMTP_PASS=your-password

# OPTION 3: Yahoo
# SMTP_HOST=smtp.mail.yahoo.com
# SMTP_PORT=587
# SMTP_USER=your-email@yahoo.com
# SMTP_PASS=your-app-password

# Application URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# AI Configuration (Optional)
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔧 How to Get SMTP Credentials

### Option 1: Gmail (Easiest for Development)

1. **Enable 2-Factor Authentication**:

   - Go to https://myaccount.google.com/
   - Click "Security" → "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**:

   - In Google Account settings, go to Security
   - Click "2-Step Verification" → "App passwords"
   - Select "Mail" from dropdown
   - Generate password (16 characters)
   - Use this password in SMTP_PASS (NOT your regular Gmail password)

3. **Update .env file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=youremail@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop  # Your 16-character app password
   ```

### Option 2: Outlook/Hotmail

1. **Enable App Passwords**:

   - Go to https://account.microsoft.com/security
   - Sign in and go to "Security dashboard"
   - Click "Advanced security options"
   - Turn on "App passwords"

2. **Generate App Password**:

   - Click "Create a new app password"
   - Use this password in your .env file

3. **Update .env file**:
   ```env
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=youremail@outlook.com
   SMTP_PASS=your-app-password
   ```

### Option 3: Yahoo Mail

1. **Enable App Passwords**:

   - Go to Yahoo Account Security
   - Turn on 2-step verification
   - Generate app password for "Mail"

2. **Update .env file**:
   ```env
   SMTP_HOST=smtp.mail.yahoo.com
   SMTP_PORT=587
   SMTP_USER=youremail@yahoo.com
   SMTP_PASS=your-app-password
   ```

## 🧪 Testing Email Setup

After updating your .env file, restart the server and test:

```bash
# Restart the backend server
cd backend
# Kill existing process if running
taskkill /F /IM node.exe
# Start server
npm start
```

The server logs will show:

- ✅ `Email service initialized successfully` (if configured correctly)
- ⚠️ `Email credentials not configured, using test account` (if not configured)

## 📧 Email Features Available

Once configured, the system will automatically send:

1. **Review Reminders**: 7, 3, and 1 days before deadlines
2. **Feedback Notifications**: When someone receives feedback
3. **Cycle Notifications**: When new review cycles are created
4. **Deadline Alerts**: For overdue reviews

## 🔒 Security Notes

- Never commit .env files to git
- Use app passwords, not regular passwords
- Keep credentials secure
- Test with a dedicated email account first

## 🚨 Troubleshooting

**"Invalid login" errors**:

- Make sure you're using app password, not regular password
- Check that 2FA is enabled
- Verify SMTP settings are correct

**"Connection refused" errors**:

- Check firewall settings
- Verify SMTP_HOST and SMTP_PORT
- Try different email provider

**No emails received**:

- Check spam folder
- Verify recipient email addresses
- Check server logs for errors
