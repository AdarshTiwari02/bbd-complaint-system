import { Request, Response, NextFunction } from 'express';
import { createError } from './error-handler';

/**
 * Middleware to authenticate requests using an API key
 * The API key should be passed in the X-API-Key header
 */
export function apiKeyAuth(req: Request, _res: Response, next: NextFunction) {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.AI_SERVICE_API_KEY;

  // If no API key is configured, allow all requests (for development)
  if (!expectedApiKey) {
    if (process.env.NODE_ENV === 'production') {
      return next(createError('API key authentication is required in production', 401, 'AUTH_REQUIRED'));
    }
    return next();
  }

  if (!apiKey) {
    return next(createError('API key is required. Please provide X-API-Key header', 401, 'AUTH_REQUIRED'));
  }

  if (apiKey !== expectedApiKey) {
    return next(createError('Invalid API key', 401, 'AUTH_INVALID'));
  }

  next();
}

