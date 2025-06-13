import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let mongo;
let adminToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'deptsecretjwt';
  ({ default: app } = await import('../index.js'));
  await mongoose.connect(process.env.MONGODB_URI);

  // create admin user and obtain token
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin@dept.com', password: 'password', firstName: 'Admin', lastName: 'Dept' });
  // promote to admin
  const User = (await import('../src/models/User.js')).default;
  const admin = await User.findOne({ email: 'admin@dept.com' });
  admin.role = 'admin';
  await admin.save();
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@dept.com', password: 'password' });
  adminToken = loginRes.body.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Department endpoints', () => {
  let deptId;
  it('creates a department', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Engineering', description: 'Engg team' })
      .expect(201);
    expect(res.body.name).toBe('Engineering');
    deptId = res.body._id;
  });

  it('lists departments', async () => {
    const res = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('gets a department by id', async () => {
    const res = await request(app)
      .get(`/api/departments/${deptId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body._id).toBe(deptId);
  });
});
