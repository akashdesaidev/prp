import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import './src/config/validateEnv.js';
import connectDB from './src/config/database.js';
import errorHandler from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/users.js';
import departmentRoutes from './src/routes/departments.js';
import teamRoutes from './src/routes/teams.js';
import orgRoutes from './src/routes/org.js';
import okrRoutes from './src/routes/okrs.js';
import timeEntryRoutes from './src/routes/timeEntries.js';
import reviewCycleRoutes from './src/routes/reviewCycles.js';
import reviewSubmissionRoutes from './src/routes/reviewSubmissions.js';
import feedbackRoutes from './src/routes/feedback.js';
import aiRoutes from './src/routes/ai.js';
import settingsRoutes from './src/routes/settings.js';
import analyticsRoutes from './src/routes/api/analytics.js';
import monitoringRoutes from './src/routes/monitoring.js';
import notificationRoutes from './src/routes/notifications.js';
import dashboardRoutes from './src/routes/dashboard.js';
import monitoringService from './src/services/monitoringService.js';

// Load env vars
dotenv.config();

const app = express();

// Connect DB
connectDB();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
);

// Rate limiting - More lenient for development/demo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests for dev/demo
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Only apply rate limiting in production or if specifically enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMITING === 'true') {
  app.use('/api/', limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Monitoring middleware
app.use(monitoringService.requestTracker());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint working',
    routes: app._router.stack.map((r) => r.regexp.toString())
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/okrs', okrRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/review-cycles', reviewCycleRoutes);
app.use('/api/review-submissions', reviewSubmissionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
