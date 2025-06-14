import mongoose from 'mongoose';
import OKR from './src/models/OKR.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkOKRs() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/performance-review-platform'
    );
    console.log('Connected to MongoDB');

    const count = await OKR.countDocuments();
    console.log('Total OKRs:', count);

    const okrs = await OKR.find().limit(3).populate('assignedTo', 'firstName lastName email');
    console.log('Sample OKRs:');
    okrs.forEach((okr) => {
      console.log(
        `- ${okr.title} (${okr.type}) - Assigned to: ${okr.assignedTo?.firstName} ${okr.assignedTo?.lastName}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOKRs();
