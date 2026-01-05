// Importing as any to avoid TS2709 errors
import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
type VertexAI = any;
type GenerativeModel = any;
import { logger } from '../../utils/logger';

export class VertexAIService {
  private vertexAI: VertexAI | null = null;
  private model: GenerativeModel | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

      if (!projectId) {
        logger.warn('GOOGLE_CLOUD_PROJECT_ID not set. Vertex AI service will be disabled.');
        return;
      }

      this.vertexAI = new VertexAI({ project: projectId, location });
      this.model = this.vertexAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // Or configurable model
      this.isInitialized = true;
      logger.info('Vertex AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Vertex AI service', error);
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.isInitialized || !this.model) {
      logger.warn('Vertex AI not initialized, returning mock response');
      return 'Vertex AI not configurated. Mock response.';
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || '';
    } catch (error) {
      logger.error('Error generating text with Vertex AI', error);
      throw error;
    }
  }

  async chat(history: any[], message: string): Promise<string> {
    if (!this.isInitialized || !this.model) {
      logger.warn('Vertex AI not initialized, returning mock response');
      return 'Vertex AI not configurated. Mock response.';
    }

    try {
      // Map simple history format to Vertex AI Content format if needed
      // This implementation assumes 'history' is already compatible or simple enough
      // real implementation might need mapping. For now, starting a fresh chat for simplicity of this task
      // or implementing a basic chat session.

      const chat = this.model.startChat({
        history: history as any, // Expecting correct format or empty
      });

      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || '';
    } catch (error) {
      logger.error('Error comparing chat with Vertex AI', error);
      throw error;
    }
  }
}

export const vertexAIService = new VertexAIService();
