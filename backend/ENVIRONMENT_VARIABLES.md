# Environment Variables Configuration

This document outlines all environment variables required for the PRP Backend application across different environments.

## 🔧 Local Development

Copy `.env.example` to `.env` and configure the following variables:

### Server Configuration

```bash
PORT=5000
NODE_ENV=development
```

### Database

```bash
MONGODB_URI=mongodb://localhost:27017/performance-review-platform
MONGODB_URI_TEST=mongodb://localhost:27017/prp-test
```

### JWT Authentication

```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars-long
JWT_REFRESH_EXPIRES_IN=7d
```

### AI Services

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### Email Configuration

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

### Frontend URLs (CORS)

```bash
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_PROD=https://your-domain.com
```

## 🚀 Production Environment

### Required Vercel Environment Variables

Set these in your Vercel dashboard under Project Settings > Environment Variables:

| Variable             | Value                     | Environment |
| -------------------- | ------------------------- | ----------- |
| `NODE_ENV`           | `production`              | Production  |
| `MONGODB_URI`        | `mongodb+srv://...`       | Production  |
| `JWT_SECRET`         | Strong secret (32+ chars) | Production  |
| `JWT_REFRESH_SECRET` | Strong secret (32+ chars) | Production  |
| `OPENAI_API_KEY`     | `sk-...`                  | Production  |
| `GEMINI_API_KEY`     | Your Gemini key           | Production  |
| `SMTP_HOST`          | `smtp.gmail.com`          | Production  |
| `SMTP_PORT`          | `587`                     | Production  |
| `SMTP_USER`          | Your email                | Production  |
| `SMTP_PASS`          | App password              | Production  |
| `FRONTEND_URL`       | Your frontend URL         | Production  |

## 🔐 GitHub Secrets

Configure these secrets in your GitHub repository settings for CI/CD:

### Vercel Deployment

```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID_BACKEND=your-backend-project-id
```

### Notifications

```bash
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

### Security & Monitoring

```bash
SNYK_TOKEN=your-snyk-security-token
CODECOV_TOKEN=your-codecov-token
```

### Test Environment

```bash
MONGODB_URI_TEST=mongodb://localhost:27017/prp-test
JWT_SECRET_TEST=test-jwt-secret-key-for-ci-pipeline
JWT_REFRESH_SECRET_TEST=test-refresh-secret-key-for-ci
```

## 📋 Environment Setup Checklist

### Local Development

- [ ] Copy `.env.example` to `.env`
- [ ] Set MongoDB connection string
- [ ] Generate JWT secrets (32+ characters)
- [ ] Configure email SMTP settings
- [ ] Set AI API keys
- [ ] Set frontend URL for CORS

### Staging Environment

- [ ] Set all production variables in Vercel
- [ ] Use staging database
- [ ] Configure staging domain
- [ ] Test email functionality

### Production Environment

- [ ] Set all production variables in Vercel
- [ ] Use production database with SSL
- [ ] Configure production domain
- [ ] Enable monitoring and logging
- [ ] Set up error tracking (Sentry)

### CI/CD Pipeline

- [ ] Add all GitHub secrets
- [ ] Configure Vercel integration
- [ ] Set up Slack notifications
- [ ] Enable security scanning
- [ ] Configure code coverage reporting

## 🛡️ Security Best Practices

1. **Never commit secrets to version control**
2. **Use strong, unique secrets for each environment**
3. **Rotate secrets regularly**
4. **Use environment-specific databases**
5. **Enable SSL/TLS for all external connections**
6. **Monitor for security vulnerabilities**
7. **Use least-privilege access for service accounts**

## 🔍 Troubleshooting

### Common Issues

**MongoDB Connection Failed**

- Check connection string format
- Verify network access (IP whitelist)
- Ensure database user has correct permissions

**JWT Token Issues**

- Verify JWT_SECRET is set and consistent
- Check token expiration settings
- Ensure secrets are properly encoded

**Email Not Sending**

- Verify SMTP credentials
- Check Gmail app password (not regular password)
- Ensure "Less secure app access" is disabled (use app passwords)

**AI Services Not Working**

- Verify API keys are valid and active
- Check API quotas and billing
- Ensure proper error handling for fallbacks

## 📞 Support

For environment configuration issues:

1. Check this documentation
2. Verify all required variables are set
3. Check application logs for specific errors
4. Contact the development team
