import { GoogleGenerativeAI } from '@google/generative-ai';

import { env } from '../config/env.schema';
import { logger } from './logger';

/**
 * Type aliases for common union types
 */
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Complexity = 'beginner' | 'intermediate' | 'advanced';
export type ImportanceLevel = 'high' | 'medium' | 'low';

/**
 * Interface para el análisis de video generado por IA
 */
export interface VideoAnalysis {
  summary: string;
  keyPoints: string[];
  topics: string[];
  sentiment: Sentiment;
  sentimentScore: number;
  actionItems?: string[];
  questions?: string[];
  quotes?: string[];
  language: string;
  complexity: Complexity;
  estimatedReadingTime: number; // minutos
}

/**
 * Interface para timestamps importantes
 */
export interface VideoTimestamp {
  time: string;
  description: string;
  importance: ImportanceLevel;
}

/**
 * Servicio de análisis de videos con Gemini AI
 */
export class GeminiAnalysisService {
  private readonly genAI: any;
  private readonly model: any;
  private readonly isConfigured: boolean;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      logger.warn('Gemini API key no configurada. El análisis de IA no estará disponible.');
      this.genAI = null;
      this.model = null;
      this.isConfigured = false;
      return;
    }

    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    this.isConfigured = true;
    logger.info('Servicio de análisis Gemini inicializado');
  }

  /**
   * Verifica si el servicio está disponible
   */
  isAvailable(): boolean {
    return this.isConfigured && this.model !== null;
  }

  /**
   * Obtiene el modelo de forma segura
   */
  private getModel(): any {
    if (!this.model) {
      throw new Error('Gemini API no está configurada');
    }
    return this.model;
  }

  /**
   * Analiza una transcripción con Gemini AI
   */
  async analyzeTranscript(
    transcript: string,
    videoTitle: string,
    videoUrl: string,
  ): Promise<VideoAnalysis> {
    const model = this.getModel();

    try {
      logger.info(`Analizando transcripción con Gemini: ${videoTitle}`);

      const prompt = `
Analiza la siguiente transcripción de un video de YouTube y proporciona un análisis detallado en formato JSON.

TÍTULO DEL VIDEO: ${videoTitle}
URL: ${videoUrl}

TRANSCRIPCIÓN:
${transcript.substring(0, 30000)} // Limitar a ~30k caracteres

Por favor, proporciona un análisis completo en formato JSON con la siguiente estructura:
{
  "summary": "Resumen conciso del video en 3-4 oraciones",
  "keyPoints": ["Punto clave 1", "Punto clave 2", ...],
  "topics": ["Tema 1", "Tema 2", ...],
  "sentiment": "positive/neutral/negative",
  "sentimentScore": 0.0-1.0,
  "actionItems": ["Acción práctica 1", "Acción práctica 2", ...],
  "questions": ["Pregunta reflexiva 1", "Pregunta reflexiva 2", ...],
  "quotes": ["Cita destacable 1", "Cita destacable 2", ...],
  "language": "idioma detectado",
  "complexity": "beginner/intermediate/advanced",
  "estimatedReadingTime": número_de_minutos
}

Reglas:
- El resumen debe ser claro y conciso
- Incluye 5-7 puntos clave principales
- Identifica 3-5 temas o categorías principales
- El sentimiento debe reflejar el tono general del contenido
- Las acciones deben ser específicas y prácticas
- Las preguntas deben fomentar la reflexión
- Las citas deben ser las más impactantes o memorables
- Estima el tiempo de lectura basándote en la longitud del texto
- Responde SOLO con el JSON, sin texto adicional
`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Extraer JSON de la respuesta
      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = jsonRegex.exec(text);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
      }

      const analysis: VideoAnalysis = JSON.parse(jsonMatch[0]);

      logger.info(`Análisis completado para: ${videoTitle}`);
      return analysis;
    } catch (error) {
      logger.error(error, 'Error analizando transcripción con Gemini:');
      throw error;
    }
  }

  /**
   * Genera timestamps importantes del video
   */
  async generateTimestamps(transcript: string, videoTitle: string): Promise<VideoTimestamp[]> {
    const model = this.getModel();

    try {
      const prompt = `
Analiza esta transcripción de video y genera timestamps importantes que ayuden a navegar el contenido.

TÍTULO: ${videoTitle}
TRANSCRIPCIÓN: ${transcript.substring(0, 20000)}

Genera un array JSON de timestamps con esta estructura:
[
  {
    "time": "00:00",
    "description": "Introducción al tema",
    "importance": "medium"
  },
  ...
]

Reglas:
- Genera 5-10 timestamps clave
- Distribuye los timestamps a lo largo del video
- Usa formato MM:SS o HH:MM:SS
- La descripción debe ser clara y específica
- importance puede ser "high", "medium", o "low"
- Responde SOLO con el array JSON
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonRegex = /\[[\s\S]*\]/;
      const jsonMatch = jsonRegex.exec(text);
      if (!jsonMatch) {
        throw new Error('No se pudieron extraer timestamps de la respuesta');
      }

      const timestamps: VideoTimestamp[] = JSON.parse(jsonMatch[0]);
      return timestamps;
    } catch (error) {
      logger.error(error, 'Error generando timestamps:');
      return []; // Retornar array vacío en caso de error
    }
  }

  /**
   * Genera un resumen ejecutivo corto
   */
  async generateExecutiveSummary(transcript: string, maxLength = 280): Promise<string> {
    if (!this.isAvailable() || !this.model) {
      return transcript.substring(0, maxLength) + '...';
    }

    try {
      const prompt = `
Resume el siguiente texto en máximo ${maxLength} caracteres, manteniendo la esencia del mensaje:

${transcript.substring(0, 10000)}

Responde SOLO con el resumen, sin comillas ni texto adicional.
`;

      const result = await this.model.generateContent(prompt);
      const summary = result.response.text().trim();

      return summary.substring(0, maxLength);
    } catch (error) {
      logger.error(error, 'Error generando resumen ejecutivo:');
      return transcript.substring(0, maxLength) + '...';
    }
  }

  /**
   * Traduce una transcripción a otro idioma
   */
  async translateTranscript(transcript: string, targetLanguage = 'en'): Promise<string> {
    const model = this.getModel();

    try {
      logger.info(`Traduciendo transcripción a ${targetLanguage}`);

      const prompt = `
Traduce el siguiente texto al ${targetLanguage}. Mantén el formato y la estructura del texto original.

TEXTO:
${transcript.substring(0, 30000)}

Responde SOLO con la traducción, sin texto adicional.
`;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      logger.error(error, 'Error traduciendo transcripción:');
      throw error;
    }
  }

  /**
   * Genera tags/categorías para el video
   */
  async generateTags(transcript: string, videoTitle: string): Promise<string[]> {
    if (!this.isAvailable() || !this.model) {
      return [];
    }

    try {
      const prompt = `
Genera tags/categorías relevantes para este video basándote en el título y transcripción.

TÍTULO: ${videoTitle}
TRANSCRIPCIÓN: ${transcript.substring(0, 5000)}

Genera un array JSON de 5-10 tags relevantes.
Responde SOLO con el array JSON: ["tag1", "tag2", ...]
`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();

      const jsonRegex = /\[[\s\S]*?\]/;
      const jsonMatch = jsonRegex.exec(text);
      if (!jsonMatch) {
        return [];
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error(error, 'Error generando tags:');
      return [];
    }
  }

  /**
   * Detecta el nivel de complejidad del contenido
   */
  async detectComplexity(transcript: string): Promise<Complexity> {
    if (!this.isAvailable() || !this.model) {
      return 'intermediate';
    }

    try {
      const prompt = `
Analiza el nivel de complejidad técnica del siguiente contenido.
Responde SOLO con una palabra: "beginner", "intermediate", o "advanced"

CONTENIDO:
${transcript.substring(0, 5000)}
`;

      const result = await this.model.generateContent(prompt);
      const complexity = result.response.text().trim().toLowerCase();

      if (this.isValidComplexity(complexity)) {
        return complexity;
      }

      return 'intermediate';
    } catch (error) {
      logger.error(error, 'Error detectando complejidad:');
      return 'intermediate';
    }
  }

  /**
   * Type guard para validar Complexity
   */
  private isValidComplexity(value: string): value is Complexity {
    return ['beginner', 'intermediate', 'advanced'].includes(value);
  }

  /**
   * Genera metadata SEO optimizada para YouTube
   */
  async generateSEOMetadata(
    transcript: string,
    currentTitle: string,
  ): Promise<{
    title: string;
    description: string;
    tags: string[];
  }> {
    if (!this.isAvailable() || !this.model) {
      throw new Error('Gemini AI no disponible para generación SEO');
    }

    try {
      const prompt = `
Eres un experto en YouTube SEO y Copywriting. Tu tarea es optimizar los metadatos de un video basado en su transcripción.

TÍTULO ACTUAL: ${currentTitle}
TRANSCRIPCIÓN:
${transcript.substring(0, 15000)}

Genera un JSON con la siguiente estructura (Sin Markdown):
{
  "title": "Un título de alto CTR (Click Through Rate), atractivo, con palabras clave, max 60 caracteres",
  "description": "Una descripción detallada (min 200 palabras) optimizada para SEO. Incluye resumen, puntos clave con emojis, y llamadas a la acción. NO incluyas hashtags aquí.",
  "tags": ["array", "de", "15", "tags", "relevantes", "separados", "por", "comas"]
}

Reglas:
- El título debe ser "Punchy" y profesional.
- La descripción debe ser estructurada y fácil de leer.
- Los tags deben incluir variaciones de cola larga (long-tail keywords).
`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();

      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = jsonRegex.exec(text);

      if (!jsonMatch) {
        throw new Error('Formato JSON inválido en respuesta de Gemini');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error(error, 'Error generando SEO Metadata con Gemini:');
      throw error;
    }
  }
}

// Singleton instance
export const geminiAnalysisService = new GeminiAnalysisService();
