import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AInspect API',
      version: '1.0.0',
      description: 'Professional Home Inspection Software API',
      contact: {
        name: 'AInspect Support',
        email: process.env.SUPPORT_EMAIL || 'support@ainspect.com',
      },
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['super_admin', 'manager', 'inspector', 'read_only'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        InspectionReport: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            inspectorId: { type: 'string', format: 'uuid' },
            clientFirstName: { type: 'string' },
            clientLastName: { type: 'string' },
            propertyAddress: { type: 'string' },
            propertyType: { type: 'string' },
            inspectionDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['not_started', 'in_progress', 'awaiting_photos', 'ready_to_review', 'completed'] },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            inspectorId: { type: 'string', format: 'uuid' },
            clientName: { type: 'string' },
            clientEmail: { type: 'string', format: 'email' },
            propertyAddress: { type: 'string' },
            bookingDate: { type: 'string', format: 'date' },
            bookingTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
            status: { type: 'string', enum: ['confirmed', 'cancelled', 'completed', 'pending'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Inspections',
        description: 'Inspection report management',
      },
      {
        name: 'Scheduling',
        description: 'Booking and scheduling system',
      },
      {
        name: 'AI Analysis',
        description: 'AI-powered photo and defect analysis',
      },
      {
        name: 'Lead Management',
        description: 'Contractor lead generation and distribution',
      },
      {
        name: 'Admin',
        description: 'Administrative functions and settings',
      },
    ],
  },
  apis: ['./server/routes.ts', './server/*-routes.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Serve swagger docs only in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development' || process.env.ENABLE_DOCS === 'true') {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'AInspect API Documentation',
    }));
    
    // JSON endpoint for the OpenAPI spec
    app.get('/docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });
  }
}