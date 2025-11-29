import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

export class EmbeddingService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY not set - embeddings will return mock data');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
  }

  async generateEmbedding(text: string, modelName: string = 'text-embedding-004') {
    try {
      const model = this.genAI.getGenerativeModel({ model: modelName });

      const result = await model.embedContent(text);
      const embedding = result.embedding.values;

      return {
        embedding,
        model: modelName,
        dimensions: embedding.length,
      };
    } catch (error) {
      logger.error('Embedding generation error:', error);
      // Return mock embedding (768 dimensions is typical for text-embedding models)
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random() * 2 - 1);
      return {
        embedding: mockEmbedding,
        model: modelName,
        dimensions: 768,
        error: 'Using mock embedding due to API error',
      };
    }
  }

  async computeSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  async findSimilar(
    queryEmbedding: number[],
    candidates: Array<{ id: string; embedding: number[] }>,
    threshold: number = 0.7,
    limit: number = 5
  ) {
    const similarities = candidates.map((candidate) => ({
      id: candidate.id,
      similarity: this.computeSimilaritySync(queryEmbedding, candidate.embedding),
    }));

    return similarities
      .filter((s) => s.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  private computeSimilaritySync(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

