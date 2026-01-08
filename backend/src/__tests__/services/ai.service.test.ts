import 'reflect-metadata';
import { Container } from 'inversify';
import { Readable } from 'stream';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { AnalyticsService } from '../../services/analytics.service';
import type { RagService } from '../../services/rag.service';
import type { UsageService } from '../../services/usage.service';
// import { AIModelRouter, AIModelTier } from '../../utils/aiRouter'; // Removing static import

describe('AIService', () => {
    let container: Container;
    let aiService: any;
    let mockCreate: any;

    const mockAnalyticsService = { getDashboardData: jest.fn() };
    const mockRagService = { getProjectContext: jest.fn() };
    const mockUsageService = { trackUsage: jest.fn() };

    beforeEach(async () => {
        jest.resetModules();

        mockCreate = jest.fn();

        // Dynamic require to ensure we mock the same instance as AIService uses
        const { AIModelRouter, AIModelTier } = require('../../utils/aiRouter');

        jest.spyOn(AIModelRouter, 'route').mockReturnValue(AIModelTier.PREMIUM);
        jest.spyOn(AIModelRouter, 'getModelConfig').mockReturnValue({
            provider: 'openai',
            modelId: 'gpt-4o'
        });

        // Mock OpenAI properly within the isolated module scope
        jest.mock('openai', () => {
            return {
                __esModule: true,
                default: jest.fn().mockImplementation(() => ({
                    chat: { completions: { create: mockCreate } }
                })),
                OpenAI: jest.fn().mockImplementation(() => ({
                    chat: { completions: { create: mockCreate } }
                }))
            };
        });

        // Dynamic require to ensure mocks are applied
        const { AIService } = require('../../services/ai.service');
        const { TYPES } = require('../../types');

        container = new Container();
        container.bind<AnalyticsService>(TYPES.AnalyticsService).toConstantValue(mockAnalyticsService as any);
        container.bind<RagService>(TYPES.RagService).toConstantValue(mockRagService as any);
        container.bind<UsageService>(TYPES.UsageService).toConstantValue(mockUsageService as any);
        container.bind<any>(AIService).toSelf();

        aiService = container.get<any>(AIService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('streamChat', () => {
        it('should use OpenAI streaming when configured', async () => {
            // Mock OpenAI stream response
            const mockStream = {
                [Symbol.asyncIterator]: jest.fn().mockImplementation(function* () {
                    yield { choices: [{ delta: { content: 'Hello' } }] };
                    yield { choices: [{ delta: { content: ' World' } }] };
                }),
            };
            mockCreate.mockResolvedValue(mockStream as any);

            const params = {
                prompt: 'Hello',
                userId: 'test-user',
                history: []
            };

            const stream = await aiService.streamChat(params);

            const chunks: string[] = [];
            for await (const chunk of stream) {
                chunks.push(chunk.toString());
            }

            const output = chunks.join('');
            expect(output).toContain('data: {"type":"text","content":"Hello"}\n\n');
            expect(output).toContain('data: {"type":"text","content":" World"}\n\n');
            expect(output).toContain('data: [DONE]\n\n');

            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
                stream: true,
                model: 'gpt-4o'
            }));
        });
    });
});
