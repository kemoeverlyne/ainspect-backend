// Test setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/ainspect_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';

// Mock OpenAI for tests
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  defects: [],
                  analysis: 'Test analysis result',
                  recommendations: []
                })
              }
            }]
          })
        }
      }
    }))
  };
});

// Mock Sentry for tests
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  Handlers: {
    requestHandler: jest.fn(() => (req: any, res: any, next: any) => next()),
    errorHandler: jest.fn(() => (err: any, req: any, res: any, next: any) => next()),
    tracingHandler: jest.fn(() => (req: any, res: any, next: any) => next())
  },
  Integrations: {
    Http: jest.fn(),
    Express: jest.fn()
  }
}));