// Vercel serverless function entry point for built backend
import 'dotenv/config';

// Import the built backend
import app from '../dist/index.js';

// Export the app for Vercel
export default app;