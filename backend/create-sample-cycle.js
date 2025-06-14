import mongoose from 'mongoose';
import ReviewCycle from './src/models/ReviewCycle.js';

async function createSampleCycle() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/performance-review-platform'
    );
    console.log('Connected to MongoDB');

    const existingCycles = await ReviewCycle.find({});
    console.log('Found existing cycles:', existingCycles.length);

    if (existingCycles.length === 0) {
      console.log('Creating sample review cycles...');

      const sampleCycles = [
        {
          name: 'Q1 2024 Performance Review',
          type: 'quarterly',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
          status: 'draft',
          gracePeriodDays: 3,
          createdBy: new mongoose.Types.ObjectId(),
          reviewTypes: {
            selfReview: true,
            peerReview: true,
            managerReview: true,
            upwardReview: false
          },
          questions: [
            {
              category: 'overall',
              question: 'How would you rate your overall performance this quarter?',
              requiresRating: true,
              isRequired: true,
              order: 1
            },
            {
              category: 'goals',
              question: 'What were your key achievements this quarter?',
              requiresRating: false,
              isRequired: true,
              order: 2
            }
          ],
          participants: []
        },
        {
          name: 'Annual Review 2024',
          type: 'annual',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31'),
          status: 'active',
          gracePeriodDays: 7,
          createdBy: new mongoose.Types.ObjectId(),
          reviewTypes: {
            selfReview: true,
            peerReview: true,
            managerReview: true,
            upwardReview: true
          },
          questions: [
            {
              category: 'overall',
              question: 'How would you rate your overall performance this year?',
              requiresRating: true,
              isRequired: true,
              order: 1
            }
          ],
          participants: []
        },
        {
          name: 'Mid-Year Review 2024',
          type: 'half-yearly',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-30'),
          status: 'closed',
          gracePeriodDays: 5,
          createdBy: new mongoose.Types.ObjectId(),
          reviewTypes: {
            selfReview: true,
            peerReview: true,
            managerReview: true,
            upwardReview: false
          },
          questions: [
            {
              category: 'overall',
              question: 'How would you rate your overall performance this half-year?',
              requiresRating: true,
              isRequired: true,
              order: 1
            }
          ],
          participants: [
            {
              userId: new mongoose.Types.ObjectId(),
              role: 'reviewee',
              status: 'submitted',
              submittedAt: new Date()
            }
          ]
        }
      ];

      for (const cycleData of sampleCycles) {
        const cycle = new ReviewCycle(cycleData);
        await cycle.save();
        console.log(`Created cycle: ${cycle.name}`);
      }

      console.log('Sample review cycles created successfully');
    } else {
      console.log('Review cycles already exist, skipping creation');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating sample cycles:', error);
    process.exit(1);
  }
}

createSampleCycle();
