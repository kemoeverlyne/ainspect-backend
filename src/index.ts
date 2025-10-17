// Vercel Express entry point - uses real backend
import 'dotenv/config';
import express from 'express';

const app = express();

// Trust proxy for proper rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Import and use the real backend routes
async function setupRealBackend() {
  try {
    // Import the real backend routes directly from TypeScript source
    const { registerRoutes } = await import('../server/routes.js');
    const server = await registerRoutes(app);
    
    console.log('Real backend routes loaded successfully');
    return server;
  } catch (error) {
    console.error('Failed to load real backend routes:', error);
    throw error;
  }
}

// Setup the backend
setupRealBackend().catch((error) => {
  console.error('Backend setup failed:', error);
  process.exit(1);
});

// Export the Express app as default (required by Vercel)
export default app;
