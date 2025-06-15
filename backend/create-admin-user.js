import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const createAdminUser = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@prp.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);

      // Update role to admin if needed
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('Updated role to admin');
      }
      process.exit(0);
    }

    // Create new admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@prp.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      department: 'IT',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@prp.com');
    console.log('Password: admin123');
    console.log('Role: admin');
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    process.exit(0);
  }
};

createAdminUser();
