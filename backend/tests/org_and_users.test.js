import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let mongo;
let adminToken;
let deptId;
let teamId;
let empId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'orgtestjwt';
  ({ default: app } = await import('../index.js'));
  await mongoose.connect(process.env.MONGODB_URI);

  // admin user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin@org.com', password: 'password', firstName: 'Admin', lastName: 'Org' });
  const User = (await import('../src/models/User.js')).default;
  const admin = await User.findOne({ email: 'admin@org.com' });
  admin.role = 'admin';
  await admin.save();
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@org.com', password: 'password' });
  adminToken = loginRes.body.accessToken;

  // department + team
  const deptRes = await request(app)
    .post('/api/departments')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Sales' });
  deptId = deptRes.body._id;

  const teamRes = await request(app)
    .post('/api/teams')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Team S', department: deptId });
  teamId = teamRes.body._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Bulk import & manager assign', () => {
  it('bulk creates users', async () => {
    const payload = [
      { email: 'emp1@s.com', password: 'pass123', firstName: 'Emp', lastName: 'One' }
    ];
    const res = await request(app)
      .post('/api/users/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    expect(res.body.created).toBe(1);
  });

  it('assigns manager/department/team', async () => {
    const User = (await import('../src/models/User.js')).default;
    const emp = await User.findOne({ email: 'emp1@s.com' });
    empId = emp._id.toString();

    await request(app)
      .patch(`/api/users/${empId}/manager`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ manager: empId, department: deptId, team: teamId })
      .expect(200);
  });
});

describe('Org tree', () => {
  it('returns hierarchy', async () => {
    const res = await request(app)
      .get('/api/org/tree')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
