import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

describe('Authentication', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject signup with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(400);
    });

    it('should reject signup with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First create a user
      const userData = {
        email: `testlogin${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      // Then try to login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.user).toHaveProperty('email', userData.email);
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});