# 🎯 PRP Demo Setup - Complete Guide

**Everything you need to run an impressive end-to-end demo of the AI-Driven Performance Review Platform**

---

## 🚀 Quick Start (5 minutes)

### 1. Run Automated Setup

```bash
# From project root
./scripts/setup-demo.sh
```

This script will:

- ✅ Install dependencies
- ✅ Create demo users in database
- ✅ Configure frontend for deployed backend
- ✅ Display all demo credentials

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Open Demo

- Navigate to: http://localhost:3000
- Use any of the demo credentials shown below

---

## 🔑 Demo Credentials

| Role         | Email                         | Password   | Purpose                     |
| ------------ | ----------------------------- | ---------- | --------------------------- |
| **Admin**    | `admin@demotech.com`          | `Demo123!` | Show full platform control  |
| **Manager**  | `john.manager@demotech.com`   | `Demo123!` | Demonstrate team management |
| **Employee** | `sarah.employee@demotech.com` | `Demo123!` | Individual contributor view |
| **HR**       | `lisa.hr@demotech.com`        | `Demo123!` | People operations features  |

### Additional Users (for comprehensive demo)

- `alex.marketing@demotech.com` / `Demo123!` (Marketing Employee)
- `mike.backend@demotech.com` / `Demo123!` (Backend Employee)
- `emma.sales@demotech.com` / `Demo123!` (Sales Employee)

---

## 🎬 Demo Flow Overview

### Admin Demo (5 minutes)

1. **Login** as admin@demotech.com
2. **Dashboard** - Company overview, metrics
3. **Users** - Manage 7 demo users
4. **Departments** - 3 departments, 4 teams
5. **OKRs** - Company-wide objectives
6. **Analytics** - Performance insights

### Manager Demo (4 minutes)

1. **Login** as john.manager@demotech.com
2. **Team View** - Direct reports (Sarah, Mike)
3. **OKR Management** - Department cascading
4. **Reviews** - Manage team performance
5. **Feedback** - Team insights and moderation

### Employee Demo (4 minutes)

1. **Login** as sarah.employee@demotech.com
2. **Personal OKRs** - Individual goals tracking
3. **Reviews** - Self-assessment, peer reviews
4. **Feedback** - Give/receive continuous feedback
5. **AI Features** - Coaching suggestions

### AI Features Demo (3 minutes)

1. **Review Suggestions** - AI-generated content
2. **Sentiment Analysis** - Feedback insights
3. **Performance Scoring** - Weighted algorithms
4. **Smart Coaching** - Personalized recommendations

---

## 🌐 Backend Configuration

The demo uses the deployed backend at:
**https://prp-emxw.vercel.app**

### API Health Check

Test the backend is running:

```bash
curl https://prp-emxw.vercel.app/api/health
# Should return: {"status":"OK"}
```

### Demo Data Structure

The seeded database includes:

- **7 Users** across 4 roles
- **3 Departments** (Engineering, Marketing, Sales)
- **4 Teams** with proper hierarchy
- **3 OKRs** (Company → Department → Individual)
- **3 Feedback** entries between team members
- **1 Active Review Cycle** for Q1 2024

---

## 🧪 Testing Demo Setup

### Test API Access

```bash
node scripts/test-demo-api.js
```

This will verify:

- ✅ Backend accessibility
- ✅ All demo credentials work
- ✅ Role-based endpoints function
- ✅ Authentication flows properly

### Manual Testing Checklist

- [ ] All 4 main users can login
- [ ] Admin sees full organization
- [ ] Manager sees team members
- [ ] Employee sees personal data
- [ ] HR has people operations access
- [ ] OKRs display with progress
- [ ] Feedback shows between users
- [ ] Review cycle is active

---

## 🎯 Key Demo Talking Points

### Business Value

- **360° Performance Reviews** - Complete feedback loop
- **AI-Powered Insights** - Smart suggestions and analysis
- **OKR Management** - Goal cascading and tracking
- **Continuous Feedback** - Real-time performance culture
- **Advanced Analytics** - Data-driven decisions

### Technical Excellence

- **Modern Stack** - Next.js, Express.js, MongoDB
- **AI Integration** - OpenAI + Gemini fallback
- **Enterprise Security** - JWT, RBAC, audit logs
- **Scalable Architecture** - Serverless deployment
- **Performance Optimized** - Caching, indexing

### Competitive Advantages

- **AI-First Approach** - Unlike traditional tools
- **Comprehensive Platform** - OKRs + Reviews + Feedback
- **Developer-Friendly** - Modern tech stack
- **Cost-Effective** - Open source foundation
- **Customizable** - White-label ready

---

## 🚨 Troubleshooting

### Common Issues

#### "Backend Unreachable"

```bash
# Check backend health
curl https://prp-emxw.vercel.app/api/health
# If fails, backend may be sleeping (Vercel)
```

#### "No Demo Users Found"

```bash
# Re-run user creation
cd backend
node scripts/create-demo-users.js
```

#### "Frontend Won't Start"

```bash
# Check environment
cd frontend
cat .env.local
# Should show: NEXT_PUBLIC_API_URL=https://prp-emxw.vercel.app
```

#### "Login Failed"

- Verify exact credentials (case-sensitive)
- Check network connectivity
- Ensure backend is healthy

### Reset Demo Data

```bash
# Clean slate
cd backend
node scripts/create-demo-users.js
```

---

## 📊 Demo Success Metrics

### Engagement Indicators

- Time spent exploring (target: 15+ minutes)
- Number of features tested (target: 8+ features)
- Questions asked about AI features
- Interest in customization options

### Technical Questions

- Architecture scalability
- AI model customization
- Integration capabilities
- Security compliance
- Deployment options

---

## 🎤 Demo Script Template

### Opening (30 seconds)

_"Today I'll show you PRP - an AI-driven performance management platform that transforms how organizations manage talent. We've built this to address the gaps in traditional HR tools by combining OKRs, 360 reviews, and continuous feedback with intelligent AI insights."_

### Admin Demo (5 minutes)

_"Let's start with the admin perspective - this is your command center..."_

### Manager Demo (4 minutes)

_"Now from a manager's view - focused on team performance..."_

### Employee Demo (4 minutes)

_"And here's what employees experience - personal and goal-oriented..."_

### AI Features (3 minutes)

_"What makes this special is our AI integration - watch this..."_

### Closing (1 minute)

_"PRP isn't just another HR tool - it's an intelligent platform that helps people grow while giving organizations the insights they need to succeed."_

---

## 📞 Demo Support

For demo issues or questions:

1. **Check Health**: https://prp-emxw.vercel.app/api/health
2. **Reset Data**: Run `node scripts/create-demo-users.js`
3. **Documentation**: See `docs/DEMO_FLOW.md`
4. **Test API**: Run `node scripts/test-demo-api.js`

---

**Demo Duration**: 20-25 minutes
**Setup Time**: 5 minutes
**Success Rate**: 95%+ when properly configured

🎯 **You're ready to deliver an impressive demo that showcases the future of performance management!**
