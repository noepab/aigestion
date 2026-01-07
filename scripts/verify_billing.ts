import 'reflect-metadata';
import { container } from '../backend/src/config/inversify.config';
import { TYPES } from '../backend/src/types';
import { UsageService } from '../backend/src/services/usage.service';

async function verifyMeteredBilling() {
  console.log('--- Verificando Metered Billing ---');

  const usageService = container.get<UsageService>(TYPES.UsageService);

  const prompt = 'Hola, ¿cómo estás?';
  const completion = 'Hola, soy Nexus AI. Estoy aquí para ayudarte con tu negocio y optimizar tus procesos.';

  const promptTokens = usageService.countTokens(prompt);
  const completionTokens = usageService.countTokens(completion);

  console.log(`Prompt tokens: ${promptTokens}`);
  console.log(`Completion tokens: ${completionTokens}`);
  console.log(`Total tokens: ${promptTokens + completionTokens}`);

  // Test costing
  const userId = '65a1234567890abcdef12345'; // Example Mongo ID
  console.log('Traqueando uso simulado...');

  await usageService.trackUsage({
    userId,
    provider: 'gemini',
    modelId: 'gemini-3.0-flash',
    prompt,
    completion
  });

  console.log('✅ Verificación completada (Check logs for Stripe mock output)');
}

verifyMeteredBilling();
