import dotenv from 'dotenv';
import connectDB from '../src/config/database.js';
import Department from '../src/models/Department.js';
import Team from '../src/models/Team.js';
import User from '../src/models/User.js';
import OKR from '../src/models/OKR.js';
import Feedback from '../src/models/Feedback.js';
import ReviewCycle from '../src/models/ReviewCycle.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function createDemoUsers() {
  try {
    await connectDB();
    console.log('🔗 Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Team.deleteMany({});
    await OKR.deleteMany({});
    await Feedback.deleteMany({});
    await ReviewCycle.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create DemoTech organization structure
    const engineeringDept = await Department.create({
      name: 'Engineering',
      description: 'Software Development and Technical Operations'
    });

    const marketingDept = await Department.create({
      name: 'Marketing',
      description: 'Marketing and Customer Acquisition'
    });

    const salesDept = await Department.create({
      name: 'Sales',
      description: 'Business Development and Sales'
    });

    console.log('🏢 Created departments');

    // Create teams
    const frontendTeam = await Team.create({
      name: 'Frontend Development',
      description: 'React/Next.js Frontend Team',
      department: engineeringDept._id
    });

    const backendTeam = await Team.create({
      name: 'Backend Development',
      description: 'Node.js/Express Backend Team',
      department: engineeringDept._id
    });

    const digitalMarketingTeam = await Team.create({
      name: 'Digital Marketing',
      description: 'SEO, Content, and Social Media',
      department: marketingDept._id
    });

    const salesTeam = await Team.create({
      name: 'Enterprise Sales',
      description: 'B2B Sales and Account Management',
      department: salesDept._id
    });

    console.log('👥 Created teams');

    // Hash the demo password
    const hashedPassword = await bcrypt.hash('Demo123!', 10);

    // Create Admin User
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'DemoTech',
      email: 'admin@demotech.com',
      password: hashedPassword,
      role: 'admin',
      department: engineeringDept._id,
      isActive: true
    });

    // Create Manager User
    const managerUser = await User.create({
      firstName: 'John',
      lastName: 'Manager',
      email: 'john.manager@demotech.com',
      password: hashedPassword,
      role: 'manager',
      department: engineeringDept._id,
      team: frontendTeam._id,
      isActive: true
    });

    // Create Employee User
    const employeeUser = await User.create({
      firstName: 'Sarah',
      lastName: 'Employee',
      email: 'sarah.employee@demotech.com',
      password: hashedPassword,
      role: 'employee',
      department: engineeringDept._id,
      team: frontendTeam._id,
      managerId: managerUser._id,
      isActive: true
    });

    // Create HR User
    const hrUser = await User.create({
      firstName: 'Lisa',
      lastName: 'HR',
      email: 'lisa.hr@demotech.com',
      password: hashedPassword,
      role: 'hr',
      department: marketingDept._id,
      team: digitalMarketingTeam._id,
      isActive: true
    });

    // Create additional demo users
    await User.create({
      firstName: 'Alex',
      lastName: 'Marketing',
      email: 'alex.marketing@demotech.com',
      password: hashedPassword,
      role: 'employee',
      department: marketingDept._id,
      team: digitalMarketingTeam._id,
      managerId: hrUser._id,
      isActive: true
    });

    const backendEmployee = await User.create({
      firstName: 'Mike',
      lastName: 'Backend',
      email: 'mike.backend@demotech.com',
      password: hashedPassword,
      role: 'employee',
      department: engineeringDept._id,
      team: backendTeam._id,
      managerId: managerUser._id,
      isActive: true
    });

    await User.create({
      firstName: 'Emma',
      lastName: 'Sales',
      email: 'emma.sales@demotech.com',
      password: hashedPassword,
      role: 'employee',
      department: salesDept._id,
      team: salesTeam._id,
      isActive: true
    });

    console.log('👤 Created demo users');

    // Create Company-level OKRs
    const companyOKR = await OKR.create({
      title: 'Achieve $5M ARR by End of Year',
      description:
        'Grow annual recurring revenue to $5 million through product expansion and customer acquisition',
      type: 'company',
      assignedTo: adminUser._id,
      createdBy: adminUser._id,
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      keyResults: [
        {
          title: 'Acquire 500 new enterprise customers',
          description: 'Focus on mid-market and enterprise segments',
          targetValue: 500,
          currentValue: 287,
          score: 6,
          unit: 'customers'
        },
        {
          title: 'Achieve 95% customer retention rate',
          description: 'Reduce churn through improved product and support',
          targetValue: 95,
          currentValue: 92,
          score: 8,
          unit: 'percentage'
        },
        {
          title: 'Launch 3 major product features',
          description: 'AI Analytics, Mobile App, Advanced Reporting',
          targetValue: 3,
          currentValue: 2,
          score: 7,
          unit: 'features'
        }
      ]
    });

    // Create Department-level OKRs
    const engineeringOKR = await OKR.create({
      title: 'Deliver High-Quality Product Features',
      description: 'Build and ship robust features that drive customer success',
      type: 'department',
      parentOkrId: companyOKR._id,
      assignedTo: managerUser._id,
      createdBy: adminUser._id,
      department: 'Engineering',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      keyResults: [
        {
          title: 'Achieve 99.9% uptime',
          description: 'Maintain system reliability and performance',
          targetValue: 99.9,
          currentValue: 99.7,
          score: 8,
          unit: 'percentage'
        },
        {
          title: 'Reduce average bug resolution time to <24 hours',
          description: 'Improve development and QA processes',
          targetValue: 24,
          currentValue: 32,
          score: 6,
          unit: 'hours'
        }
      ]
    });

    // Create Individual OKRs
    await OKR.create({
      title: 'Master Frontend Performance Optimization',
      description: 'Become expert in React performance and modern web optimization techniques',
      type: 'individual',
      parentOkrId: engineeringOKR._id,
      assignedTo: employeeUser._id,
      createdBy: managerUser._id,
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      keyResults: [
        {
          title: 'Complete 5 performance optimization courses',
          description: 'Focus on React, webpack, and web vitals',
          targetValue: 5,
          currentValue: 3,
          score: 6,
          unit: 'courses'
        },
        {
          title: 'Improve app loading time by 40%',
          description: 'Optimize bundle size and implement lazy loading',
          targetValue: 40,
          currentValue: 25,
          score: 7,
          unit: 'percentage'
        }
      ]
    });

    console.log('🎯 Created demo OKRs');

    // Create sample feedback
    await Feedback.create({
      fromUserId: managerUser._id,
      toUserId: employeeUser._id,
      content:
        'Sarah has shown exceptional growth in frontend development. Her recent work on the dashboard redesign was outstanding. She consistently delivers high-quality code and is always willing to help team members.',
      rating: 9,
      type: 'public',
      category: 'skills',
      tags: ['frontend', 'react', 'teamwork', 'quality'],
      sentimentScore: 'positive'
    });

    await Feedback.create({
      fromUserId: backendEmployee._id,
      toUserId: employeeUser._id,
      content:
        "Great collaboration on the API integration project. Sarah's attention to detail and problem-solving skills made the project a success.",
      rating: 8,
      type: 'public',
      category: 'skills',
      tags: ['collaboration', 'problem-solving', 'api'],
      sentimentScore: 'positive'
    });

    await Feedback.create({
      fromUserId: employeeUser._id,
      toUserId: managerUser._id,
      content:
        'John provides excellent technical guidance and creates a supportive environment for learning and growth. His code reviews are thorough and educational.',
      rating: 9,
      type: 'public',
      category: 'values',
      tags: ['leadership', 'mentoring', 'communication'],
      sentimentScore: 'positive'
    });

    console.log('💬 Created demo feedback');

    // Create a sample review cycle
    await ReviewCycle.create({
      name: 'Q1 2024 Performance Review',
      type: 'quarterly',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-31'),
      gracePeriodDays: 3,
      status: 'active',
      participants: [
        {
          userId: employeeUser._id,
          role: 'reviewee',
          status: 'pending'
        },
        {
          userId: managerUser._id,
          role: 'manager',
          status: 'pending'
        },
        {
          userId: backendEmployee._id,
          role: 'peer',
          status: 'pending'
        }
      ],
      createdBy: adminUser._id
    });

    console.log('📊 Created demo review cycle');

    // Display summary
    const userCount = await User.countDocuments();
    const deptCount = await Department.countDocuments();
    const teamCount = await Team.countDocuments();
    const okrCount = await OKR.countDocuments();
    const feedbackCount = await Feedback.countDocuments();

    console.log('\n🎉 Demo data created successfully!');
    console.log('\n=== DEMO CREDENTIALS ===');
    console.log('🔑 Admin User:');
    console.log('   Email: admin@demotech.com');
    console.log('   Password: Demo123!');
    console.log('   Role: Admin (Full Access)');

    console.log('\n👨‍💼 Manager User:');
    console.log('   Email: john.manager@demotech.com');
    console.log('   Password: Demo123!');
    console.log('   Role: Manager (Team Lead)');

    console.log('\n👩‍💻 Employee User:');
    console.log('   Email: sarah.employee@demotech.com');
    console.log('   Password: Demo123!');
    console.log('   Role: Employee (Individual Contributor)');

    console.log('\n👥 HR User:');
    console.log('   Email: lisa.hr@demotech.com');
    console.log('   Password: Demo123!');
    console.log('   Role: HR (People Operations)');

    console.log('\n=== ADDITIONAL DEMO USERS ===');
    console.log('📧 alex.marketing@demotech.com / Demo123! (Marketing Employee)');
    console.log('📧 mike.backend@demotech.com / Demo123! (Backend Employee)');
    console.log('📧 emma.sales@demotech.com / Demo123! (Sales Employee)');

    console.log('\n=== DATA SUMMARY ===');
    console.log(`👥 Users: ${userCount}`);
    console.log(`🏢 Departments: ${deptCount}`);
    console.log(`👨‍👩‍👧‍👦 Teams: ${teamCount}`);
    console.log(`🎯 OKRs: ${okrCount}`);
    console.log(`💬 Feedback: ${feedbackCount}`);
    console.log(`📊 Review Cycles: 1`);

    console.log('\n🌐 Backend API: https://prp-emxw.vercel.app');
    console.log('📱 Frontend Demo: Update NEXT_PUBLIC_API_URL to https://prp-emxw.vercel.app');

    console.log('\n✅ Ready for end-to-end demo testing!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    process.exit(1);
  }
}

createDemoUsers();
