import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { GeminiService } from '../services/gemini.service';
import { OcrService } from '../services/ocr.service';
import { EmbeddingService } from '../services/embedding.service';
import { createError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router() as ExpressRouter;
const geminiService = new GeminiService();
const ocrService = new OcrService();
const embeddingService = new EmbeddingService();

// Classify ticket category
router.post('/classify-ticket', async (req, res, next) => {
  try {
    const { text, title, college, department, additionalContext } = req.body;

    if (!text) {
      throw createError('Text is required', 400, 'VALIDATION_ERROR');
    }

    const result = await geminiService.classifyTicket({
      text,
      title,
      college,
      department,
      additionalContext,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Predict priority
router.post('/predict-priority', async (req, res, next) => {
  try {
    const { text, title, category } = req.body;

    if (!text) {
      throw createError('Text is required', 400, 'VALIDATION_ERROR');
    }

    const result = await geminiService.predictPriority({ text, title, category });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Moderate content
router.post('/moderate', async (req, res, next) => {
  try {
    const { text, checkSpam, checkProfanity, checkHarassment } = req.body;

    if (!text) {
      throw createError('Text is required', 400, 'VALIDATION_ERROR');
    }

    const result = await geminiService.moderateContent({
      text,
      checkSpam: checkSpam ?? true,
      checkProfanity: checkProfanity ?? true,
      checkHarassment: checkHarassment ?? true,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Generate reply draft
router.post('/generate-reply', async (req, res, next) => {
  try {
    const {
      ticketTitle,
      ticketDescription,
      conversationHistory,
      ticketCategory,
      responderRole,
      tone,
    } = req.body;

    if (!ticketTitle || !ticketDescription) {
      throw createError('Ticket title and description are required', 400, 'VALIDATION_ERROR');
    }

    const result = await geminiService.generateReplyDraft({
      ticketTitle,
      ticketDescription,
      conversationHistory: conversationHistory || [],
      ticketCategory,
      responderRole,
      tone: tone || 'formal',
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Summarize ticket
router.post('/summarize-ticket', async (req, res, next) => {
  try {
    const { ticketTitle, ticketDescription, messages, maxLength } = req.body;

    if (!ticketDescription) {
      throw createError('Ticket description is required', 400, 'VALIDATION_ERROR');
    }

    const result = await geminiService.summarizeTicket({
      ticketTitle,
      ticketDescription,
      messages,
      maxLength: maxLength || 200,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Generate embeddings
router.post('/embeddings', async (req, res, next) => {
  try {
    const { text, model } = req.body;

    if (!text) {
      throw createError('Text is required', 400, 'VALIDATION_ERROR');
    }

    const result = await embeddingService.generateEmbedding(text, model);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Find similar tickets (stub - needs database integration)
router.post('/similar-tickets', async (req, res, next) => {
  try {
    const { ticketId, limit, threshold } = req.body;

    // This would need database access to compare embeddings
    // For now, return empty array
    logger.info(`Finding similar tickets for ${ticketId}`, { limit, threshold });

    res.json({
      success: true,
      data: {
        tickets: [],
        searchText: '',
      },
    });
  } catch (error) {
    next(error);
  }
});

// OCR
router.post('/ocr', async (req, res, next) => {
  try {
    const { fileUrl, mimeType, language } = req.body;

    if (!fileUrl) {
      throw createError('File URL is required', 400, 'VALIDATION_ERROR');
    }

    const result = await ocrService.extractText(fileUrl, mimeType, language);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Analyze trends
router.post('/trends', async (req, res, next) => {
  try {
    const { tickets, timeRange } = req.body;

    if (!tickets || !Array.isArray(tickets)) {
      throw createError('Tickets array is required', 400, 'VALIDATION_ERROR');
    }

    const result = await geminiService.analyzeTrends({ tickets, timeRange });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Enhance text
router.post('/enhance-text', async (req, res, next) => {
  try {
    const { text, title, type } = req.body;

    if (!text) {
      throw createError('Text is required', 400, 'VALIDATION_ERROR');
    }

    const result = await geminiService.enhanceText({
      text,
      title,
      type: type || 'complaint',
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Chatbot intake
router.post('/chatbot-intake', async (req, res, next) => {
  try {
    const { messages, currentStep } = req.body;

    if (!messages || !Array.isArray(messages)) {
      throw createError('Messages array is required', 400, 'VALIDATION_ERROR');
    }

    // Check if this is an admin assistant request
    if (currentStep === 'admin_assistant') {
      const result = await geminiService.adminAssistant({ 
        messages,
        context: req.body.context 
      });
      return res.json({ success: true, data: result });
    }

    const result = await geminiService.chatbotIntake({ messages, currentStep });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Admin assistant endpoint
router.post('/admin-assistant', async (req, res, next) => {
  try {
    const { messages, ticketContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      throw createError('Messages array is required', 400, 'VALIDATION_ERROR');
    }

    const context = ticketContext 
      ? `Ticket #${ticketContext.ticketNumber}
Title: ${ticketContext.title}
Category: ${ticketContext.category}
Status: ${ticketContext.status}
Description: ${ticketContext.description}`
      : undefined;

    const result = await geminiService.adminAssistant({ messages, context });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export { router as aiRoutes };

