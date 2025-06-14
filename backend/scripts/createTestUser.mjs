import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'admin@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('password123', 12);

    const testUser = new User({
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      notificationPreferences: {
        emailNotifications: true,
        weeklyReminders: true,
        deadlineAlerts: true
      }
    });

    await testUser.save();
    console.log('Test user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser();
