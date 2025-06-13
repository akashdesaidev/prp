import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import './src/config/validateEnv.js';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/users.js';
import departmentRoutes from './src/routes/departments.js';
import teamRoutes from './src/routes/teams.js';

// Load env vars
dotenv.config();

const app = express();

// Connect DB
connectDB();

// Middlewares
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/teams', teamRoutes);

// Health endpoint
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// 404 for unmatched routes
app.use((_, res) => res.status(404).json({ error: 'Not Found' }));

// Global error handler
import errorHandler from './src/middleware/errorHandler.js';
app.use(errorHandler);

// Only start server locally (skip when in test or production – Vercel handles export)
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
