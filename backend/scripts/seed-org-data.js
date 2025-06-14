import dotenv from 'dotenv';
import connectDB from '../src/config/database.js';
import Department from '../src/models/Department.js';
import Team from '../src/models/Team.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function seedOrgData() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    await Department.deleteMany({});
    await Team.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create departments
    const engineeringDept = await Department.create({
      name: 'Engineering',
      description: 'Software development and technical operations'
    });

    const marketingDept = await Department.create({
      name: 'Marketing',
      description: 'Marketing and brand management'
    });

    const hrDept = await Department.create({
      name: 'Human Resources',
      description: 'People operations and talent management'
    });

    console.log('Created departments');

    // Create teams
    const frontendTeam = await Team.create({
      name: 'Frontend Team',
      description: 'Frontend development team',
      department: engineeringDept._id
    });

    const backendTeam = await Team.create({
      name: 'Backend Team',
      description: 'Backend development team',
      department: engineeringDept._id
    });

    const digitalMarketingTeam = await Team.create({
      name: 'Digital Marketing',
      description: 'Digital marketing and social media',
      department: marketingDept._id
    });

    const recruitmentTeam = await Team.create({
      name: 'Recruitment',
      description: 'Talent acquisition team',
      department: hrDept._id
    });

    console.log('Created teams');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Engineering users
    const johnDoe = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      password: hashedPassword,
      role: 'manager',
      department: engineeringDept._id,
      team: frontendTeam._id
    });

    await User.create({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@company.com',
      password: hashedPassword,
      role: 'employee',
      department: engineeringDept._id,
      team: frontendTeam._id,
      managerId: johnDoe._id
    });

    await User.create({
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@company.com',
      password: hashedPassword,
      role: 'employee',
      department: engineeringDept._id,
      team: frontendTeam._id,
      managerId: johnDoe._id
    });

    const mikeBrown = await User.create({
      firstName: 'Mike',
      lastName: 'Brown',
      email: 'mike.brown@company.com',
      password: hashedPassword,
      role: 'manager',
      department: engineeringDept._id,
      team: backendTeam._id
    });

    await User.create({
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@company.com',
      password: hashedPassword,
      role: 'employee',
      department: engineeringDept._id,
      team: backendTeam._id,
      managerId: mikeBrown._id
    });

    // Marketing users
    const emilyDavis = await User.create({
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@company.com',
      password: hashedPassword,
      role: 'manager',
      department: marketingDept._id,
      team: digitalMarketingTeam._id
    });

    await User.create({
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.miller@company.com',
      password: hashedPassword,
      role: 'employee',
      department: marketingDept._id,
      team: digitalMarketingTeam._id,
      managerId: emilyDavis._id
    });

    // HR users
    const lisaGarcia = await User.create({
      firstName: 'Lisa',
      lastName: 'Garcia',
      email: 'lisa.garcia@company.com',
      password: hashedPassword,
      role: 'hr',
      department: hrDept._id,
      team: recruitmentTeam._id
    });

    await User.create({
      firstName: 'Tom',
      lastName: 'Anderson',
      email: 'tom.anderson@company.com',
      password: hashedPassword,
      role: 'employee',
      department: hrDept._id,
      team: recruitmentTeam._id,
      managerId: lisaGarcia._id
    });

    // Create an admin user
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Created users');

    // Verify the data
    const deptCount = await Department.countDocuments();
    const teamCount = await Team.countDocuments();
    const userCount = await User.countDocuments();

    console.log(`\n=== Data Summary ===`);
    console.log(`Departments: ${deptCount}`);
    console.log(`Teams: ${teamCount}`);
    console.log(`Users: ${userCount}`);

    console.log('\n✅ Sample organization data created successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@company.com / password123');
    console.log('Manager: john.doe@company.com / password123');
    console.log('Employee: alice.smith@company.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedOrgData();
