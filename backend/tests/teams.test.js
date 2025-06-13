import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let mongo;
let adminToken;
let deptId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'teamjwtsecret';
  ({ default: app } = await import('../index.js'));
  await mongoose.connect(process.env.MONGODB_URI);

  // admin user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin@team.com', password: 'password', firstName: 'Admin', lastName: 'Team' });
  const User = (await import('../src/models/User.js')).default;
  const admin = await User.findOne({ email: 'admin@team.com' });
  admin.role = 'admin';
  await admin.save();
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@team.com', password: 'password' });
  adminToken = loginRes.body.accessToken;

  // department
  const deptRes = await request(app)
    .post('/api/departments')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'DeptA' });
  deptId = deptRes.body._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Team endpoints', () => {
  let teamId;
  it('creates team', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Team A', department: deptId })
      .expect(201);
    expect(res.body.name).toBe('Team A');
    teamId = res.body._id;
  });

  it('lists teams', async () => {
    const res = await request(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('gets team', async () => {
    const res = await request(app)
      .get(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body._id).toBe(teamId);
  });
});
