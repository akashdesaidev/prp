# 🚀 AI-Driven Performance Review Platform (PRP)

**Enterprise-grade performance management system inspired by Lattice and 15Five**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-green?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?logo=mongodb)](https://mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-blue?logo=openai)](https://openai.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-blue?logo=tailwindcss)](https://tailwindcss.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [AI Features](#ai-features)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

## 🎯 Overview

PRP is a comprehensive performance management platform that combines traditional HR processes with AI-powered insights. It simplifies performance reviews, goal tracking, and continuous feedback for modern organizations.

### Key Benefits

- **AI-Powered Insights**: Automated review suggestions, sentiment analysis, and coaching recommendations
- **360° Reviews**: Comprehensive feedback from peers, managers, and direct reports
- **OKR Management**: Cascading objectives with real-time progress tracking
- **Continuous Feedback**: Real-time feedback culture with skill tagging
- **Advanced Analytics**: Data-driven insights into team performance and engagement
- **Enterprise Security**: Role-based access control, audit logs, and compliance features

## ✨ Features

### 🔐 Authentication & User Management

- **JWT-based Authentication** with refresh tokens (15-minute access tokens)
- **Role-based Access Control** (Admin, HR, Manager, Employee)
- **User Onboarding Flow** with email invitations
- **Bulk User Import** via CSV with validation
- **Manager Hierarchy** tracking with history
- **Organization Structure** (Departments & Teams)

### 📈 OKR & Goal Management

- **Hierarchical OKRs** (Company → Department → Team → Individual)
- **Progress Tracking** with 1-10 scoring system
- **Time Allocation** tracking per objective
- **OKR Cascading** with parent-child relationships
- **Smart Check-ins** with AI-powered suggestions
- **Visual Progress Dashboards**

### 🔄 Performance Reviews

- **360° Review Cycles** (Self, Peer, Manager, Upward)
- **Customizable Review Templates** with competency-based questions
- **Anonymous Peer Reviews** with 3-reviewer minimum
- **Review Scheduling** (Quarterly, Half-yearly, Annual, Custom)
- **Grace Period Management** with deadline enforcement
- **Emergency Override Cycles** for urgent reviews
- **Star Rating System** (1-10 scale) with visual feedback

### 💬 Continuous Feedback

- **Public & Private Feedback** with privacy controls
- **Skill Tagging System** (free-form tagging)
- **Company Values Integration** for value-based feedback
- **Anonymous Feedback Options** for sensitive situations
- **Feedback Moderation** with admin controls
- **Real-time Notifications** for feedback events

### 🤖 AI-Powered Features

- **Auto-Generated Review Suggestions** using OpenAI/Gemini
- **Self-Assessment Summarizer** with key themes extraction
- **Sentiment Analysis** (Positive/Neutral/Negative)
- **AI Quality Flags** for vague or incomplete responses
- **Smart Coaching Recommendations** based on feedback history
- **Performance Scoring Algorithm** with weighted components
- **Fallback AI Providers** (OpenAI → Gemini → Manual)

### 📊 Analytics & Reporting

- **Role-specific Dashboards** for all user types
- **Team Performance Analytics** with trend analysis
- **Feedback Sentiment Trends** over time
- **OKR Progress Visualization** with completion rates
- **Export Capabilities** (CSV/PDF) with audit trails
- **Engagement Metrics** and participation tracking
- **Advanced Filtering** by date, department, team, and role

### 🔔 Notifications & Alerts

- **Email Notifications** with user preferences
- **Review Reminders** with deadline alerts
- **Feedback Notifications** for real-time updates
- **System Alerts** for admins and managers
- **Scheduled Notifications** with background processing
- **Notification History** with read/unread status

### 🛡️ Security & Compliance

- **Enterprise Security Headers** (CSP, HSTS, XSS Protection)
- **Rate Limiting** with endpoint-specific limits
- **Input Sanitization** and XSS prevention
- **Audit Logging** for all critical actions
- **Data Encryption** for sensitive information
- **GDPR Compliance** with data export/deletion rights
- **Session Management** with secure cookie handling

### 🚀 Performance & Monitoring

- **Redis Caching** with in-memory fallback
- **Database Optimization** with strategic indexing
- **Real-time Monitoring** with health checks
- **Performance Metrics** tracking
- **Kubernetes-ready** health/readiness probes
- **Memory Usage Monitoring** with alerts
- **Core Web Vitals** tracking on frontend

## 🛠 Tech Stack

### Backend

- **Framework**: Express.js 4.18 with ES6 modules
- **Database**: MongoDB 8.0 with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **Caching**: Redis with ioredis client
- **AI Integration**: OpenAI GPT-4 + Google Gemini fallback
- **Email**: Nodemailer with SMTP support
- **Validation**: Zod for request/response validation
- **Testing**: Jest with MongoDB Memory Server
- **Monitoring**: Winston logging + custom metrics
- **Security**: Helmet, CORS, rate limiting

### Frontend

- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS + ShadCN UI components
- **State Management**: React Context + hooks
- **HTTP Client**: Axios with interceptors
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library
- **Performance**: Web Vitals monitoring
- **PWA**: Service worker ready

### DevOps & Deployment

- **Hosting**: Vercel (Frontend + Backend)
- **Database**: MongoDB Atlas
- **Caching**: Redis Cloud
- **CI/CD**: GitHub Actions
- **Monitoring**: Built-in health checks
- **Security**: Environment variable management

## 🚀 Quick Start

### Prerequisites

- Node.js 20 LTS or higher
- MongoDB 7.0+ (local or Atlas)
- Redis (optional, for caching)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/prp-platform.git
cd prp-platform
```

2. **Setup Backend**

```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

3. **Setup Frontend**

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Configure your environment variables
npm run dev
```

4. **Create Admin User**

```bash
cd backend
npm run create-admin
```

### Environment Variables

#### Backend (.env)

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/prp-platform

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# CORS
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

The application will automatically create indexes and collections on first run. For production, ensure proper database security and backup strategies.

## 📁 Project Structure

```
prp-platform/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database, email, AI configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (AI, email, etc.)
│   │   └── utils/          # Helper functions
│   ├── tests/              # Backend tests
│   ├── scripts/            # Utility scripts
│   └── index.js            # Server entry point
├── frontend/               # Next.js application
│   ├── app/                # App Router pages
│   ├── components/         # React components
│   ├── context/            # React Context providers
│   ├── lib/                # Utility functions
│   ├── styles/             # Global styles
│   └── tests/              # Frontend tests
├── docs/                   # Documentation
└── scripts/                # Project scripts
```

## 🤖 AI Features

### Review Suggestions

- **Context-aware Prompts**: Uses past feedback and OKR data
- **Multiple AI Providers**: OpenAI GPT-4 primary, Gemini fallback
- **Quality Scoring**: Flags vague or incomplete responses
- **Tone Analysis**: Maintains professional tone

### Sentiment Analysis

- **Real-time Processing**: Analyzes feedback as it's submitted
- **Trend Tracking**: Historical sentiment analysis
- **Alert System**: Notifications for negative sentiment trends
- **Manager Insights**: Aggregated team sentiment reports

### Performance Scoring

The AI scoring algorithm uses weighted components:

- Recent Feedback (35%)
- OKR Progress (25%)
- Peer Reviews (15%)
- Manager Reviews (15%)
- Self-Assessment (5%)
- Tenure Adjustment (5%)

### Testing AI Features

```bash
# Backend AI testing
cd backend
npm test -- --grep "AI"

# Manual AI testing
node scripts/test-ai.js
```

## 📚 API Documentation

### Authentication Endpoints

```bash
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
POST /api/auth/refresh        # Refresh token
POST /api/auth/logout         # User logout
```

### User Management

```bash
GET    /api/users             # List users (paginated)
POST   /api/users             # Create user
GET    /api/users/:id         # Get user details
PUT    /api/users/:id         # Update user
DELETE /api/users/:id         # Soft delete user
POST   /api/users/bulk-import # CSV bulk import
```

### OKR Management

```bash
GET    /api/okrs              # List OKRs (filtered)
POST   /api/okrs              # Create OKR
GET    /api/okrs/:id          # Get OKR details
PUT    /api/okrs/:id          # Update OKR
DELETE /api/okrs/:id          # Soft delete OKR
```

### Review Cycles

```bash
GET    /api/review-cycles     # List review cycles
POST   /api/review-cycles     # Create review cycle
GET    /api/review-cycles/:id # Get cycle details
PUT    /api/review-cycles/:id # Update cycle
```

### Feedback

```bash
GET    /api/feedback          # List feedback (filtered)
POST   /api/feedback          # Create feedback
PUT    /api/feedback/:id      # Update feedback
DELETE /api/feedback/:id      # Hide feedback (soft delete)
```

### AI Services

```bash
POST   /api/ai/suggest-review      # Generate review suggestions
POST   /api/ai/summarize-assessment # Summarize self-assessment
POST   /api/ai/analyze-sentiment   # Analyze feedback sentiment
```

### Analytics

```bash
GET    /api/analytics/dashboard     # Dashboard metrics
GET    /api/analytics/team-performance # Team analytics
GET    /api/analytics/feedback-trends  # Feedback analytics
GET    /api/analytics/okr-progress    # OKR analytics
```

### Monitoring

```bash
GET    /api/monitoring/health   # Health check
GET    /api/monitoring/metrics  # Performance metrics (admin)
GET    /api/monitoring/system   # System information (admin)
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Backend Deployment**

```bash
cd backend
vercel --prod
```

2. **Frontend Deployment**

```bash
cd frontend
vercel --prod
```

3. **Environment Variables**
   Configure production environment variables in Vercel dashboard.

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individual services
docker build -t prp-backend ./backend
docker build -t prp-frontend ./frontend
```

### Production Checklist

- [ ] Configure production database (MongoDB Atlas)
- [ ] Setup Redis for caching
- [ ] Configure email service (SMTP)
- [ ] Set up AI API keys (OpenAI/Gemini)
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up SSL certificates
- [ ] Configure rate limiting
- [ ] Set up error tracking

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
npm test -- --grep "auth"  # Specific test suite
```

### Frontend Testing

```bash
cd frontend
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
```

### Load Testing

```bash
cd backend
node load-test.js          # Basic load testing
```

## 📊 Performance Metrics

### Backend Performance

- **Response Time**: < 120ms average (with caching)
- **Database Queries**: 60-80% improvement with indexing
- **Memory Usage**: Monitored with 512MB/1GB alerts
- **Cache Hit Ratio**: Target 70%+ for frequent data

### Frontend Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: Optimized with tree shaking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint + Prettier configuration
- Write tests for new features
- Update documentation
- Follow semantic commit conventions
- Ensure all tests pass before PR

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Lattice](https://lattice.com) and [15Five](https://15five.com)
- Built with [ShadCN UI](https://ui.shadcn.com) components
- AI powered by [OpenAI](https://openai.com) and [Google Gemini](https://gemini.google.com)

**Made with ❤️ by the PRP Team**
