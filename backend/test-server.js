import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/users.js';
import okrRoutes from './src/routes/okrs.js';
import timeEntryRoutes from './src/routes/timeEntries.js';
import reviewCycleRoutes from './src/routes/reviewCycles.js';
import feedbackRoutes from './src/routes/feedback.js';
import analyticsRoutes from './src/routes/api/analytics.js';
import errorHandler from './src/middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
let mongod;

// Setup in-memory MongoDB for testing
const setupTestDB = async () => {
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log(`✅ Test MongoDB connected: ${uri}`);
  } catch (error) {
    console.error('❌ Test Database connection failed:', error.message);
    process.exit(1);
  }
};

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000 // Increase limit for testing
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: '40+ endpoints available'
  });
});

// Debug endpoint to list all routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

// Test data creation endpoint
app.post('/api/debug/create-test-data', async (req, res) => {
  try {
    // Import models
    const User = (await import('./src/models/User.js')).default;
    const bcrypt = (await import('bcryptjs')).default;

    // Create test admin user
    const hashedPassword = await bcrypt.hash('password123', 12);
    const adminUser = new User({
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
      isActive: true
    });
    await adminUser.save();

    // Create test employee
    const employeeUser = new User({
      email: 'employee@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Employee',
      role: 'employee',
      managerId: adminUser._id,
      isActive: true
    });
    await employeeUser.save();

    res.json({
      message: 'Test data created successfully',
      users: [
        { email: 'admin@test.com', password: 'password123', role: 'admin' },
        { email: 'employee@test.com', password: 'password123', role: 'employee' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/okrs', okrRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/review-cycles', reviewCycleRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  await setupTestDB();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Create test data: POST http://localhost:${PORT}/api/debug/create-test-data`);
    console.log(`📋 List routes: http://localhost:${PORT}/api/debug/routes`);
  });
};

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down test server...');
  if (mongod) {
    await mongod.stop();
  }
  await mongoose.disconnect();
  process.exit(0);
});

startServer().catch(console.error);

export default app;
