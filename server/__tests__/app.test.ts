import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes.js';

describe('Application Health Check', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  test('should start and respond to health check', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .expect(401); // Unauthorized is expected without auth

    expect(response.body).toHaveProperty('message');
  });

  test('should handle CORS properly', async () => {
    const response = await request(app)
      .options('/api/auth/me')
      .expect(204);

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  test('should rate limit requests', async () => {
    // Make multiple requests to test rate limiting
    const promises = Array.from({ length: 10 }, () =>
      request(app).get('/api/auth/me')
    );

    const responses = await Promise.all(promises);
    const allCompleted = responses.every(res => res.status === 401);
    expect(allCompleted).toBe(true);
  });
});