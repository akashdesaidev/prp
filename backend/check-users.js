import mongoose from 'mongoose';
import User from './src/models/User.js';

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/performance-review-platform');
    console.log('Connected to MongoDB');

    const users = await User.find({}).select('email role isActive');
    console.log('Existing users:', users);

    if (users.length === 0) {
      console.log('No users found. Creating a test admin user...');

      const adminUser = new User({
        email: 'admin@test.com',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        isActive: true
      });

      await adminUser.save();
      console.log('Created admin user:', adminUser._id);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
