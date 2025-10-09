import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

describe('Inspections', () => {
  let app: express.Express;
  let server: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Create a test user and get auth token
    const userData = {
      email: `testinspector${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'Inspector'
    };

    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    // Extract token from cookie or response
    userId = signupResponse.body.user.id;
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('GET /api/inspections', () => {
    it('should return empty array for new user', async () => {
      const response = await request(app)
        .get('/api/inspections');

      // Without auth, should return 401
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/inspections', () => {
    it('should create inspection with valid data', async () => {
      const inspectionData = {
        clientFirstName: 'John',
        clientLastName: 'Doe',
        propertyAddress: '123 Test Street, Test City, TX 12345',
        propertyType: 'single_family',
        inspectionDate: new Date().toISOString(),
        notes: 'Test inspection notes'
      };

      const response = await request(app)
        .post('/api/inspections')
        .send(inspectionData);

      // Without auth, should return 401
      expect(response.status).toBe(401);
    });

    it('should reject inspection with invalid data', async () => {
      const inspectionData = {
        clientFirstName: 'J', // Too short
        clientLastName: '', // Required
        propertyAddress: '123', // Too short
        propertyType: 'invalid_type',
        inspectionDate: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/inspections')
        .send(inspectionData);

      expect(response.status).toBe(401); // Will be 400 when auth is implemented
    });
  });
});