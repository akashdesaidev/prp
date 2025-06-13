import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let mongo;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'testsecretjwt';
  ({ default: app } = await import('../index.js'));
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Complete Auth Flow', () => {
  let accessToken;
  let refreshToken;
  it('registers, logs in and refreshes token', async () => {
    // register
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'flow@example.com',
        password: 'password',
        firstName: 'Flow',
        lastName: 'User'
      })
      .expect(201);

    // login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'flow@example.com', password: 'password' })
      .expect(200);

    accessToken = loginRes.body.accessToken;
    refreshToken = loginRes.body.refreshToken;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    // refresh
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(refreshRes.body.accessToken).toBeDefined();
  });
});

describe('Role-based access control', () => {
  let adminToken;
  let employeeToken;
  it('creates admin and employee users', async () => {
    // create admin
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User'
      });
    // manually promote to admin
    const User = (await import('../src/models/User.js')).default;
    const admin = await User.findOne({ email: 'admin@example.com' });
    admin.role = 'admin';
    await admin.save();

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });
    adminToken = adminLogin.body.accessToken;

    // employee
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'emp@example.com',
        password: 'password',
        firstName: 'Emp',
        lastName: 'User'
      });
    const empLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'emp@example.com', password: 'password' });
    employeeToken = empLogin.body.accessToken;
  });

  it('allows admin to list users and forbids employee', async () => {
    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(403);
  });
});
