import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let mongo;
let token;
let okrId;
let userId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'okrtestsecret';
  ({ default: app } = await import('../index.js'));
  await mongoose.connect(process.env.MONGODB_URI);

  // create user & login
  await request(app).post('/api/auth/register').send({
    email: 'm@o.com',
    password: '123456',
    firstName: 'Manager',
    lastName: 'User'
  });

  const User = (await import('../src/models/User.js')).default;
  const user = await User.findOne({ email: 'm@o.com' });
  user.role = 'admin';
  await user.save();
  userId = user._id;

  const login = await request(app).post('/api/auth/login').send({
    email: 'm@o.com',
    password: '123456'
  });
  token = login.body.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('OKR System', () => {
  it('creates an OKR with embedded key results', async () => {
    const okrData = {
      title: 'Increase Company Revenue',
      description: 'Drive revenue growth through strategic initiatives',
      type: 'company',
      assignedTo: userId.toString(),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      keyResults: [
        {
          title: 'Increase MRR to $100k',
          description: 'Monthly Recurring Revenue target',
          targetValue: 100000,
          currentValue: 75000,
          score: 7,
          unit: 'USD'
        },
        {
          title: 'Acquire 500 new customers',
          description: 'New customer acquisition',
          targetValue: 500,
          currentValue: 200,
          score: 4,
          unit: 'customers'
        }
      ]
    };

    const res = await request(app)
      .post('/api/okrs')
      .set('Authorization', `Bearer ${token}`)
      .send(okrData)
      .expect(201);

    expect(res.body.title).toBe(okrData.title);
    expect(res.body.type).toBe('company');
    expect(res.body.keyResults).toHaveLength(2);
    expect(res.body.keyResults[0].title).toBe('Increase MRR to $100k');
    expect(res.body.assignedTo).toBe(userId.toString());
    expect(res.body.createdBy).toBe(userId.toString());

    okrId = res.body._id;
  });

  it('gets OKRs with role-based filtering', async () => {
    const res = await request(app)
      .get('/api/okrs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('keyResults');
  });

  it('gets a specific OKR by ID', async () => {
    const res = await request(app)
      .get(`/api/okrs/${okrId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body._id).toBe(okrId);
    expect(res.body.title).toBe('Increase Company Revenue');
    expect(res.body.keyResults).toHaveLength(2);
  });

  it('updates an OKR', async () => {
    const updateData = {
      title: 'Increase Company Revenue - Updated',
      status: 'active'
    };

    const res = await request(app)
      .patch(`/api/okrs/${okrId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(res.body.title).toBe(updateData.title);
    expect(res.body.status).toBe('active');
  });

  it('adds a new key result to existing OKR', async () => {
    const newKeyResult = {
      title: 'Improve customer satisfaction',
      description: 'Increase NPS score',
      targetValue: 9,
      currentValue: 7,
      score: 7,
      unit: 'NPS'
    };

    const res = await request(app)
      .post(`/api/okrs/${okrId}/key-results`)
      .set('Authorization', `Bearer ${token}`)
      .send(newKeyResult)
      .expect(200);

    expect(res.body.keyResults).toHaveLength(3);
    expect(res.body.keyResults[2].title).toBe(newKeyResult.title);
  });

  it('updates a key result and creates progress snapshot', async () => {
    // Get the OKR to find a key result ID
    const okrRes = await request(app)
      .get(`/api/okrs/${okrId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const keyResultId = okrRes.body.keyResults[0]._id;

    const updateData = {
      currentValue: 85000,
      score: 8
    };

    const res = await request(app)
      .patch(`/api/okrs/${okrId}/key-results/${keyResultId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(res.body.keyResults[0].currentValue).toBe(85000);
    expect(res.body.keyResults[0].score).toBe(8);
    expect(res.body.progressSnapshots.length).toBeGreaterThan(0);
  });

  it('creates a time entry for an OKR', async () => {
    const timeEntryData = {
      okrId: okrId,
      date: new Date().toISOString(),
      hoursSpent: 4.5,
      description: 'Worked on revenue analysis',
      category: 'direct_work'
    };

    const res = await request(app)
      .post('/api/time-entries')
      .set('Authorization', `Bearer ${token}`)
      .send(timeEntryData)
      .expect(201);

    expect(res.body.okrId).toBe(okrId);
    expect(res.body.hoursSpent).toBe(4.5);
    expect(res.body.userId).toBe(userId.toString());
    expect(res.body.category).toBe('direct_work');
  });

  it('gets time entries with filtering', async () => {
    const res = await request(app)
      .get('/api/time-entries')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('hoursSpent');
    expect(res.body[0]).toHaveProperty('okrId');
  });

  it('prevents non-admin from deleting OKRs', async () => {
    // Create a regular user
    await request(app).post('/api/auth/register').send({
      email: 'employee@test.com',
      password: '123456',
      firstName: 'Employee',
      lastName: 'User'
    });

    const employeeLogin = await request(app).post('/api/auth/login').send({
      email: 'employee@test.com',
      password: '123456'
    });

    await request(app)
      .delete(`/api/okrs/${okrId}`)
      .set('Authorization', `Bearer ${employeeLogin.body.accessToken}`)
      .expect(403);
  });

  it('allows admin to archive OKR (soft delete)', async () => {
    const res = await request(app)
      .delete(`/api/okrs/${okrId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Verify OKR is archived, not deleted
    const archivedOKR = await request(app)
      .get(`/api/okrs/${okrId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(archivedOKR.body.status).toBe('archived');
  });
});
