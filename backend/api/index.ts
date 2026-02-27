import { createApp } from '../src/index.js';

// Vercel serverless entrypoint
// Re-uses the same Express app but as a serverless function
const app = createApp();
export default app;
