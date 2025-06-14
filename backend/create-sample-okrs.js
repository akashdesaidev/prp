import mongoose from 'mongoose';
import OKR from './src/models/OKR.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function createSampleOKRs() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/performance-review-platform'
    );
    console.log('Connected to MongoDB');

    // Get some users to assign OKRs to
    const users = await User.find({ isActive: { $ne: false } }).limit(5);
    console.log(
      'Found users:',
      users.map((u) => `${u.firstName} ${u.lastName} (${u.email})`)
    );

    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      process.exit(1);
    }

    // Clear existing OKRs
    await OKR.deleteMany({});
    console.log('Cleared existing OKRs');

    // Create sample OKRs
    const sampleOKRs = [
      {
        title: 'Increase Customer Satisfaction',
        description: 'Improve overall customer satisfaction scores through better service delivery',
        type: 'company',
        assignedTo: users[0]._id,
        createdBy: users[0]._id,
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        keyResults: [
          {
            title: 'Achieve 90% customer satisfaction score',
            description: 'Measured through quarterly surveys',
            targetValue: 90,
            currentValue: 75,
            score: 7,
            unit: '%'
          },
          {
            title: 'Reduce customer support response time',
            description: 'Average first response time under 2 hours',
            targetValue: 2,
            currentValue: 4,
            score: 5,
            unit: 'hours'
          }
        ]
      },
      {
        title: 'Launch New Product Feature',
        description: 'Successfully launch the new analytics dashboard feature',
        type: 'team',
        assignedTo: users[1]._id,
        createdBy: users[0]._id,
        status: 'active',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-09-30'),
        keyResults: [
          {
            title: 'Complete feature development',
            description: 'All planned features implemented and tested',
            targetValue: 100,
            currentValue: 80,
            score: 8,
            unit: '%'
          },
          {
            title: 'Achieve user adoption rate',
            description: 'At least 60% of active users try the new feature',
            targetValue: 60,
            currentValue: 25,
            score: 4,
            unit: '%'
          }
        ]
      },
      {
        title: 'Improve Personal Productivity',
        description: 'Enhance personal productivity and time management skills',
        type: 'individual',
        assignedTo: users[2]._id,
        createdBy: users[2]._id,
        status: 'active',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-12-31'),
        keyResults: [
          {
            title: 'Complete professional development course',
            description: 'Finish the project management certification',
            targetValue: 1,
            currentValue: 0,
            score: 3,
            unit: 'course'
          },
          {
            title: 'Reduce meeting time by 20%',
            description: 'Optimize calendar and decline unnecessary meetings',
            targetValue: 20,
            currentValue: 10,
            score: 5,
            unit: '%'
          }
        ]
      }
    ];

    // Create OKRs
    const createdOKRs = await OKR.insertMany(sampleOKRs);
    console.log(`Created ${createdOKRs.length} sample OKRs`);

    // Verify creation
    const okrs = await OKR.find().populate('assignedTo', 'firstName lastName email');
    console.log('\nCreated OKRs:');
    okrs.forEach((okr) => {
      console.log(
        `- ${okr.title} (${okr.type}) - Assigned to: ${okr.assignedTo?.firstName} ${okr.assignedTo?.lastName}`
      );
      console.log(`  Key Results: ${okr.keyResults.length}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSampleOKRs();
