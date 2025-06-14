import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import '../src/config/validateEnv.js';
import connectDB from '../src/config/database.js';
import errorHandler from '../src/middleware/errorHandler.js';
import authRoutes from '../src/routes/auth.js';
import userRoutes from '../src/routes/users.js';
import departmentRoutes from '../src/routes/departments.js';
import teamRoutes from '../src/routes/teams.js';
import orgRoutes from '../src/routes/org.js';
import okrRoutes from '../src/routes/okrs.js';
import timeEntryRoutes from '../src/routes/timeEntries.js';
import reviewCycleRoutes from '../src/routes/reviewCycles.js';
import reviewSubmissionRoutes from '../src/routes/reviewSubmissions.js';
import feedbackRoutes from '../src/routes/feedback.js';
import aiRoutes from '../src/routes/ai.js';
import settingsRoutes from '../src/routes/settings.js';
import analyticsRoutes from '../src/routes/api/analytics.js';
import monitoringRoutes from '../src/routes/monitoring.js';
import notificationRoutes from '../src/routes/notifications.js';

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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PRP Backend API',
    status: 'running',
    version: '1.0.0'
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

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
