import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    // Connection optimization
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Create database indexes for performance
    await createIndexes();
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ managerId: 1 });
    await db.collection('users').createIndex({ department: 1 });
    await db.collection('users').createIndex({ team: 1 });
    await db.collection('users').createIndex({ isActive: 1 });

    // OKR indexes
    await db.collection('okrs').createIndex({ assignedTo: 1, status: 1 });
    await db.collection('okrs').createIndex({ createdBy: 1 });
    await db.collection('okrs').createIndex({ parentOkrId: 1 });
    await db.collection('okrs').createIndex({ type: 1 });
    await db.collection('okrs').createIndex({ department: 1 });
    await db.collection('okrs').createIndex({ startDate: 1, endDate: 1 });

    // Review Cycle indexes
    await db.collection('reviewcycles').createIndex({ status: 1 });
    await db.collection('reviewcycles').createIndex({ type: 1 });
    await db.collection('reviewcycles').createIndex({ startDate: 1, endDate: 1 });
    await db.collection('reviewcycles').createIndex({ createdBy: 1 });
    await db.collection('reviewcycles').createIndex({ 'participants.userId': 1 });

    // Review Submission indexes
    await db.collection('reviewsubmissions').createIndex({ reviewCycleId: 1, revieweeId: 1 });
    await db.collection('reviewsubmissions').createIndex({ reviewerId: 1 });
    await db.collection('reviewsubmissions').createIndex({ reviewType: 1 });
    await db.collection('reviewsubmissions').createIndex({ submittedAt: 1 });

    // Feedback indexes
    await db.collection('feedback').createIndex({ toUserId: 1, createdAt: -1 });
    await db.collection('feedback').createIndex({ fromUserId: 1 });
    await db.collection('feedback').createIndex({ type: 1 });
    await db.collection('feedback').createIndex({ category: 1 });
    await db.collection('feedback').createIndex({ tags: 1 });
    await db.collection('feedback').createIndex({ isHidden: 1 });

    // Time Entry indexes
    await db.collection('timeentries').createIndex({ userId: 1, date: -1 });
    await db.collection('timeentries').createIndex({ okrId: 1 });
    await db.collection('timeentries').createIndex({ date: 1 });
    await db.collection('timeentries').createIndex({ category: 1 });

    // Department and Team indexes
    await db.collection('departments').createIndex({ name: 1 }, { unique: true });
    await db.collection('teams').createIndex({ name: 1, department: 1 }, { unique: true });
    await db.collection('teams').createIndex({ department: 1 });

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.warn('Some indexes may already exist:', error.message);
  }
};

export default connectDB;
