import Tesseract from 'tesseract.js';
import axios from 'axios';
import { logger } from '../utils/logger';

export class OcrService {
  async extractText(fileUrl: string, mimeType?: string, language: string = 'eng') {
    try {
      logger.info(`Starting OCR for: ${fileUrl}`);

      // For PDF files, we'd need additional processing
      // For now, focus on images
      if (mimeType === 'application/pdf') {
        return {
          text: 'PDF OCR not implemented yet. Please upload images directly.',
          confidence: 0,
          language,
        };
      }

      // Download the image
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const imageBuffer = Buffer.from(response.data, 'binary');

      // Perform OCR
      const result = await Tesseract.recognize(imageBuffer, language, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const { data } = result;

      logger.info(`OCR completed. Confidence: ${data.confidence}%`);

      return {
        text: data.text.trim(),
        confidence: data.confidence / 100,
        language,
        blocks: data.blocks?.map((block) => ({
          text: block.text,
          boundingBox: block.bbox
            ? {
                x: block.bbox.x0,
                y: block.bbox.y0,
                width: block.bbox.x1 - block.bbox.x0,
                height: block.bbox.y1 - block.bbox.y0,
              }
            : undefined,
        })),
      };
    } catch (error) {
      logger.error('OCR error:', error);
      return {
        text: '',
        confidence: 0,
        language,
        error: (error as Error).message,
      };
    }
  }

  async extractTextFromBuffer(buffer: Buffer, language: string = 'eng') {
    try {
      const result = await Tesseract.recognize(buffer, language);

      return {
        text: result.data.text.trim(),
        confidence: result.data.confidence / 100,
        language,
      };
    } catch (error) {
      logger.error('OCR buffer error:', error);
      return {
        text: '',
        confidence: 0,
        language,
        error: (error as Error).message,
      };
    }
  }
}

