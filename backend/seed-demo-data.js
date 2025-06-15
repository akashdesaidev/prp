import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Import models
import User from './src/models/User.js';
import Department from './src/models/Department.js';
import Team from './src/models/Team.js';
import OKR from './src/models/OKR.js';
import Feedback from './src/models/Feedback.js';
import ReviewCycle from './src/models/ReviewCycle.js';
import TimeEntry from './src/models/TimeEntry.js';

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Demo data
const demoData = {
  users: [
    {
      email: 'admin@demotech.com',
      password: 'Demo123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      department: 'Executive',
      isActive: true
    },
    {
      email: 'hr@demotech.com',
      password: 'Demo123!',
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'hr',
      department: 'Human Resources',
      isActive: true
    },
    {
      email: 'john.manager@demotech.com',
      password: 'Demo123!',
      firstName: 'John',
      lastName: 'Smith',
      role: 'manager',
      department: 'Engineering',
      isActive: true
    },
    {
      email: 'jane.dev@demotech.com',
      password: 'Demo123!',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'employee',
      department: 'Engineering',
      isActive: true
    },
    {
      email: 'mike.designer@demotech.com',
      password: 'Demo123!',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'employee',
      department: 'Design',
      isActive: true
    },
    {
      email: 'lisa.analyst@demotech.com',
      password: 'Demo123!',
      firstName: 'Lisa',
      lastName: 'Chen',
      role: 'employee',
      department: 'Product',
      isActive: true
    }
  ],

  departments: [
    { name: 'Executive', description: 'Executive Leadership' },
    { name: 'Engineering', description: 'Software Development' },
    { name: 'Design', description: 'Product Design & UX' },
    { name: 'Product', description: 'Product Management' },
    { name: 'Human Resources', description: 'HR Operations' },
    { name: 'Marketing', description: 'Marketing & Growth' }
  ],

  teams: [
    { name: 'Frontend Team', departmentName: 'Engineering', description: 'UI/UX Development' },
    { name: 'Backend Team', departmentName: 'Engineering', description: 'API & Infrastructure' },
    { name: 'UX Research', departmentName: 'Design', description: 'User Experience Research' },
    { name: 'Visual Design', departmentName: 'Design', description: 'Brand & Visual Design' },
    {
      name: 'Product Strategy',
      departmentName: 'Product',
      description: 'Product Planning & Strategy'
    }
  ]
};

// Sample OKRs data
const sampleOKRs = [
  {
    title: 'Improve Product Quality & Customer Satisfaction',
    description: 'Focus on delivering high-quality features that delight customers',
    type: 'company',
    status: 'active',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    keyResults: [
      {
        title: 'Increase NPS score from 7 to 9',
        description: 'Improve overall customer satisfaction',
        targetValue: 9,
        currentValue: 7.5,
        score: 6,
        unit: 'score'
      },
      {
        title: 'Reduce customer support tickets by 25%',
        description: 'Minimize issues through better quality',
        targetValue: 75,
        currentValue: 85,
        score: 7,
        unit: 'tickets'
      },
      {
        title: 'Achieve 99% uptime',
        description: 'Maintain system reliability',
        targetValue: 99,
        currentValue: 98.2,
        score: 8,
        unit: 'percentage'
      }
    ]
  },
  {
    title: 'Enhance Development Velocity',
    description: 'Improve team productivity and code quality',
    type: 'department',
    department: 'Engineering',
    status: 'active',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    keyResults: [
      {
        title: 'Deploy 2 major features per month',
        description: 'Increase feature delivery rate',
        targetValue: 6,
        currentValue: 4,
        score: 7,
        unit: 'features'
      },
      {
        title: 'Reduce bug backlog by 50%',
        description: 'Improve code quality',
        targetValue: 25,
        currentValue: 35,
        score: 6,
        unit: 'bugs'
      }
    ]
  }
];

// Sample feedback data
const sampleFeedback = [
  {
    content:
      'Jane consistently delivers high-quality code and is always willing to help team members. Her problem-solving skills are exceptional.',
    rating: 9,
    type: 'public',
    category: 'skills',
    tags: ['problem-solving', 'teamwork', 'code-quality'],
    sentimentScore: 'positive',
    isAnonymous: false
  },
  {
    content:
      "Mike's design work has significantly improved user engagement. His attention to detail and creative approach are impressive.",
    rating: 8,
    type: 'public',
    category: 'skills',
    tags: ['creativity', 'attention-to-detail', 'user-experience'],
    sentimentScore: 'positive',
    isAnonymous: false
  },
  {
    content:
      'Lisa shows great initiative in product research and presents findings clearly to stakeholders.',
    rating: 8,
    type: 'public',
    category: 'initiatives',
    tags: ['research', 'communication', 'initiative'],
    sentimentScore: 'positive',
    isAnonymous: false
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Team.deleteMany({});
    await OKR.deleteMany({});
    await Feedback.deleteMany({});
    await ReviewCycle.deleteMany({});
    await TimeEntry.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create departments
    const departments = await Department.insertMany(demoData.departments);
    console.log('🏢 Created departments');

    // Create teams
    const teamsWithDeptIds = demoData.teams.map((team) => ({
      ...team,
      department: departments.find((d) => d.name === team.departmentName)._id
    }));
    const teams = await Team.insertMany(teamsWithDeptIds);
    console.log('👥 Created teams');

    // Create users with hashed passwords
    const usersWithHashedPasswords = await Promise.all(
      demoData.users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );
    const users = await User.insertMany(usersWithHashedPasswords);
    console.log('👤 Created users');

    // Set up manager relationships
    const johnManager = users.find((u) => u.email === 'john.manager@demotech.com');
    const janeDev = users.find((u) => u.email === 'jane.dev@demotech.com');
    const mikeDesigner = users.find((u) => u.email === 'mike.designer@demotech.com');
    const lisaAnalyst = users.find((u) => u.email === 'lisa.analyst@demotech.com');

    // Update manager relationships
    await User.findByIdAndUpdate(janeDev._id, { managerId: johnManager._id });
    await User.findByIdAndUpdate(mikeDesigner._id, { managerId: johnManager._id });
    await User.findByIdAndUpdate(lisaAnalyst._id, { managerId: johnManager._id });

    console.log('👔 Set up manager relationships');

    // Create OKRs
    const adminUser = users.find((u) => u.role === 'admin');
    const okrsWithUserIds = sampleOKRs.map((okr) => ({
      ...okr,
      assignedTo: okr.type === 'company' ? adminUser._id : johnManager._id,
      createdBy: adminUser._id
    }));
    const okrs = await OKR.insertMany(okrsWithUserIds);
    console.log('🎯 Created OKRs');

    // Link department OKR to company OKR
    const companyOKR = okrs.find((o) => o.type === 'company');
    const deptOKR = okrs.find((o) => o.type === 'department');
    if (companyOKR && deptOKR) {
      await OKR.findByIdAndUpdate(deptOKR._id, { parentOkrId: companyOKR._id });
      console.log('🔗 Linked OKR hierarchy');
    }

    // Create feedback
    const feedbackWithUserIds = sampleFeedback.map((feedback, index) => ({
      ...feedback,
      fromUserId: johnManager._id,
      toUserId: index === 0 ? janeDev._id : index === 1 ? mikeDesigner._id : lisaAnalyst._id
    }));
    await Feedback.insertMany(feedbackWithUserIds);
    console.log('💬 Created feedback');

    // Create a review cycle
    const reviewCycle = new ReviewCycle({
      name: 'Q1 2024 Performance Review',
      type: 'quarterly',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-31'),
      gracePeriodDays: 3,
      status: 'active',
      participants: [
        { userId: janeDev._id, role: 'reviewee', status: 'pending' },
        { userId: mikeDesigner._id, role: 'reviewee', status: 'pending' },
        { userId: lisaAnalyst._id, role: 'reviewee', status: 'pending' },
        { userId: johnManager._id, role: 'manager', status: 'pending' }
      ],
      createdBy: adminUser._id
    });
    await reviewCycle.save();
    console.log('🔄 Created review cycle');

    // Create time entries
    const timeEntries = [
      {
        userId: janeDev._id,
        okrId: deptOKR._id,
        date: new Date(),
        hoursSpent: 6,
        description: 'Worked on bug fixes and code reviews',
        category: 'direct_work'
      },
      {
        userId: mikeDesigner._id,
        okrId: companyOKR._id,
        date: new Date(),
        hoursSpent: 4,
        description: 'User research and design improvements',
        category: 'direct_work'
      },
      {
        userId: lisaAnalyst._id,
        okrId: companyOKR._id,
        date: new Date(),
        hoursSpent: 5,
        description: 'Product analysis and stakeholder meetings',
        category: 'collaboration'
      }
    ];
    await TimeEntry.insertMany(timeEntries);
    console.log('⏰ Created time entries');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Demo Data Summary:');
    console.log(`👤 Users: ${users.length}`);
    console.log(`🏢 Departments: ${departments.length}`);
    console.log(`👥 Teams: ${teams.length}`);
    console.log(`🎯 OKRs: ${okrs.length}`);
    console.log(`💬 Feedback: ${feedbackWithUserIds.length}`);
    console.log(`🔄 Review Cycles: 1`);
    console.log(`⏰ Time Entries: ${timeEntries.length}`);

    console.log('\n🔑 Demo Login Credentials:');
    console.log('Admin: admin@demotech.com / Demo123!');
    console.log('HR: hr@demotech.com / Demo123!');
    console.log('Manager: john.manager@demotech.com / Demo123!');
    console.log('Employee: jane.dev@demotech.com / Demo123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();
