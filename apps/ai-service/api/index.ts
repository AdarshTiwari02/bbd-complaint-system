// Vercel serverless function entry point for AI service
import express, { Request, Response } from 'express';
import cors from 'cors';
import { aiRoutes } from '../src/routes/ai.routes';
import { errorHandler } from '../src/middleware/error-handler';
import { apiKeyAuth } from '../src/middleware/auth.middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'bbd-ai-service',
    timestamp: new Date().toISOString(),
  });
});

// API Key Authentication
app.use(apiKeyAuth);

// AI Routes
app.use('/ai', aiRoutes);

// Error handling
app.use(errorHandler);

export default app;



