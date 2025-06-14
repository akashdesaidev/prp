import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import Department from './src/models/Department.js';
import Team from './src/models/Team.js';

dotenv.config();

const createTestData = async () => {
  try {
    await connectDB();

    // Create test departments
    const departments = [
      { name: 'Engineering', description: 'Software Development Team' },
      { name: 'Marketing', description: 'Marketing and Growth Team' },
      { name: 'Sales', description: 'Sales and Business Development' }
    ];

    console.log('Creating departments...');
    const createdDepartments = [];

    for (const dept of departments) {
      const existing = await Department.findOne({ name: dept.name });
      if (!existing) {
        const newDept = new Department(dept);
        await newDept.save();
        createdDepartments.push(newDept);
        console.log(`✅ Created department: ${dept.name}`);
      } else {
        createdDepartments.push(existing);
        console.log(`📋 Department already exists: ${dept.name}`);
      }
    }

    // Create test teams
    const teams = [
      {
        name: 'Backend Team',
        description: 'Backend Development',
        department: createdDepartments[0]._id
      },
      {
        name: 'Frontend Team',
        description: 'Frontend Development',
        department: createdDepartments[0]._id
      },
      {
        name: 'Content Team',
        description: 'Content Creation',
        department: createdDepartments[1]._id
      },
      { name: 'Sales Team', description: 'Direct Sales', department: createdDepartments[2]._id }
    ];

    console.log('Creating teams...');

    for (const team of teams) {
      const existing = await Team.findOne({ name: team.name });
      if (!existing) {
        const newTeam = new Team(team);
        await newTeam.save();
        console.log(`✅ Created team: ${team.name}`);
      } else {
        console.log(`📋 Team already exists: ${team.name}`);
      }
    }

    console.log('\n🎉 Test data creation completed!');
  } catch (error) {
    console.error('Error creating test data:', error.message);
  } finally {
    process.exit(0);
  }
};

createTestData();
