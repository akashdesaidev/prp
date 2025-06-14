import request from 'supertest';
import app from '../index.js';

describe('Review Cycles API', () => {
  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/api/health').expect(200);

      expect(response.body.status).toBe('OK');
    });
  });

  describe('Authentication Required Endpoints', () => {
    test('should require authentication for GET /api/review-cycles', async () => {
      const response = await request(app).get('/api/review-cycles').expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication for POST /api/review-cycles', async () => {
      const response = await request(app)
        .post('/api/review-cycles')
        .send({
          name: 'Test Review Cycle',
          type: 'quarterly',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Review Submissions API', () => {
  test('should require authentication for GET /api/review-submissions/my-submissions', async () => {
    const response = await request(app).get('/api/review-submissions/my-submissions').expect(401);

    expect(response.body.success).toBe(false);
  });
});

describe('Feedback API', () => {
  test('should require authentication for GET /api/feedback/received', async () => {
    const response = await request(app).get('/api/feedback/received').expect(401);

    expect(response.body.success).toBe(false);
  });
});

export default {};
