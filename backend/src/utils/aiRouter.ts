import { logger } from './logger';

export enum AIModelTier {
  ECONOMY = 'economy',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export interface ModelConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  modelId: string;
}

export class AIModelRouter {
  /**
   * Semantically routes a prompt to the most efficient model tier
   */
  static route(prompt: string): AIModelTier {
    const p = prompt.toLowerCase();

    // Heuristics for PREMIUM (Complex/Creative)
    const complexKeywords = [
      'analiza',
      'arquitectura',
      'optimiza',
      'explica a fondo',
      'reescribe',
      'complejo',
      'debuguea',
      'paso a paso',
    ];

    const isLong = prompt.length > 500;
    const hasComplexKeywords = complexKeywords.some(k => p.includes(k));

    if (isLong || hasComplexKeywords) {
      return AIModelTier.PREMIUM;
    }

    // Heuristics for ECONOMY (Fast/Simple)
    const simpleKeywords = ['hola', 'quien eres', 'dime la hora', 'ping', 'test'];
    const isVeryShort = prompt.length < 50;

    if (isVeryShort || simpleKeywords.some(k => p.includes(k))) {
      return AIModelTier.ECONOMY;
    }

    return AIModelTier.STANDARD;
  }

  /**
   * Gets the recommended model configuration for a given tier
   */
  static getModelConfig(tier: AIModelTier): ModelConfig {
    switch (tier) {
      case AIModelTier.PREMIUM:
        // Use Claude 3.5 Sonnet for premium (Smartest)
        return { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' };
      case AIModelTier.ECONOMY:
        // Use Gemini 1.5 Flash for economy (Cheapest)
        return { provider: 'gemini', modelId: 'gemini-1.5-flash-8b' };
      case AIModelTier.STANDARD:
      default:
        // Use Gemini 3.0 Flash for standard (Fastest/Balanced)
        return { provider: 'gemini', modelId: 'gemini-3.0-flash' };
    }
  }
}
