import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { aiRoutes } from './routes/ai.routes';

// Load environment variables
dotenv.config({ path: '../../.env' });
dotenv.config();

const app: Express = express();
const logger = createLogger();
const PORT = process.env.AI_SERVICE_PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'bbd-ai-service',
    timestamp: new Date().toISOString(),
  });
});

// AI Routes
app.use('/ai', aiRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🤖 BBD AI Service running on port ${PORT}`);
  logger.info(`   Gemini API configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
});

export default app;

