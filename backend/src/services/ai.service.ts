import { injectable, inject } from 'inversify';
import { GoogleGenerativeAI } from '@google/generative-ai';
// Types for function declarations and schema types are loosely typed as any to avoid TS2709 errors
type FunctionDeclaration = any;
import { env } from '../config/env.schema';
import { Readable } from 'stream';
import { TYPES } from '../types';
// import { StripeService } from './stripe.service';
import { AnalyticsService } from './analytics.service';
// import { SearchService } from './search.service';
import { SearchWebTool } from '../tools/web-search.tool';
import { RagService } from './rag.service';
import { logger } from '../utils/logger';

export interface AIStreamParams {
    prompt: string;
    history?: { role: 'user' | 'assistant' | 'system'; content: string }[];
    userId: string;
}

import { StripeTool } from '../tools/stripe.tool';

@injectable()
export class AIService {
    private genAI: any;
    private model: any;

    constructor(
        @inject(TYPES.AnalyticsService) private analyticsService: AnalyticsService,
        // @inject(TYPES.SearchService) private searchService: SearchService,
        @inject(TYPES.RagService) private ragService: RagService
    ) {
        if (!env.GEMINI_API_KEY) {
            logger.warn('GEMINI_API_KEY is missing. AIService will fail.');
            // Throwing error might crash server on startup if instantiated eagerly,
            // but safer to warn and let calls fail.
        }
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
        // Using gemini-2.0-flash for speed and tool capability, consistent with GeminiAnalysisService
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    private getTools(): FunctionDeclaration[] {
        return [
            {
                name: 'get_revenue_analytics',
                description: 'Get monthly revenue data for the dashboard.',
                parameters: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: 'get_user_growth',
                description: 'Get user growth trends for the last 14 days.',
                parameters: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: 'search_web',
                description: 'Search the web for real-time information, news, or technical documentation.',
                parameters: {
                    type: "object" as any,
                    properties: {
                        query: { type: "string", description: 'The search query.' },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'get_codebase_context',
                description: 'Read the codebase to understand the project architecture, files, or specific implementation details. Use this when asked about the "project", "code", "architecture", or "how something works" in this app.',
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: 'Optional focus or query to filter the context (currently returns full context)' }
                    },
                },
            },
            {
                name: 'manage_subscription',
                description: 'Manage user subscriptions, check status, or generate checkout/portal links. Use this tool when the user asks about their billing, subscription, or upgrading plan.',
                parameters: {
                    type: "object",
                    properties: {
                        action: { type: "string", enum: ['get_status', 'create_checkout', 'create_portal'], description: 'The action to perform.' },
                        userId: { type: "string", description: 'The ID of the user context (implicit).' },
                        priceId: { type: "string", description: 'The Stripe Price ID for checkout (required if action is create_checkout).' }
                    },
                    required: ['action']
                },
            }
        ];
    }

    public async streamChat(params: AIStreamParams): Promise<Readable> {
        const stream = new Readable({ read() { } });

        // Map OpenAI roles to Gemini roles
        // Gemini only supports 'user' and 'model' (assistant). 'system' instructions are set at model init,
        // but here we are using chat, so we pass system prompt as first user part or rely on model config if we re-init.
        // For simplicity, we'll prepend system instruction to the conversation history.

        const systemInstruction = `You are Nexus AI, an advanced agent.
        When asked about revenue or users, use the provided tools.
        If a tool gives you data, summarize it briefly and the UI will render it.
        Current User ID: ${params.userId}.
        Use the 'search_web' tool whenever the user asks for current information, news, or something you don't know.`;

        const history = (params.history || []).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user', // Map assistant -> model
            parts: [{ text: msg.content }]
        }));

        // Gemini ChatSession
        const chat = this.model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 2048,
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
            tools: [{ functionDeclarations: this.getTools() }]
        });

        const runner = async () => {
            try {
                const result = await chat.sendMessageStream(params.prompt);

                let fullText = '';

                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();

                    if (chunkText) {
                        fullText += chunkText;
                        // Emit text delta in the format Frontend expects
                        stream.push(`data: ${JSON.stringify({ type: 'text', content: chunkText })}\n\n`);
                    }

                    // Handle tool calls
                    // Gemini 2.0 Flash tool execution logic
                    const functionCalls = chunk.functionCalls();
                    if (functionCalls && functionCalls.length > 0) {
                        for (const call of functionCalls) {
                            const name = call.name;
                            const args = call.args as any;

                            logger.info(`[AIService] Tool Call: ${name}`, args);

                            let toolResult = '';
                            if (name === 'get_revenue_analytics') {
                                const data = await this.analyticsService.getDashboardData();
                                toolResult = JSON.stringify(data.revenue);
                                stream.push(`data: ${JSON.stringify({ type: 'a2ui', component: 'chart', props: { title: 'Revenue Overview', type: 'area', data: data.revenue } })}\n\n`);
                            } else if (name === 'get_user_growth') {
                                const data = await this.analyticsService.getDashboardData();
                                toolResult = JSON.stringify(data.users);
                                stream.push(`data: ${JSON.stringify({ type: 'a2ui', component: 'chart', props: { title: 'User Growth', type: 'bar', data: data.users } })}\n\n`);
                            } else if (name === 'search_web') {
                                const query = args.query;
                                stream.push(`data: ${JSON.stringify({ type: 'text', content: `\n\nSearching web for: "${query}"...\n\n` })}\n\n`);
                                const searchTool = new SearchWebTool();
                                const results = await searchTool.execute({ query });
                                toolResult = JSON.stringify(results);
                            } else if (name === 'get_codebase_context') {
                                stream.push(`data: ${JSON.stringify({ type: 'text', content: `\n\nReading codebase context...\n\n` })}\n\n`);
                                const context = await this.ragService.getProjectContext(args.query);
                                toolResult = context;
                            } else if (name === 'manage_subscription') {
                                stream.push(`data: ${JSON.stringify({ type: 'text', content: `\n\nAccessing subscription data...\n\n` })}\n\n`);
                                const stripeTool = new StripeTool();
                                // Inject userId from params into the tool execution context (or arguments if model skipped it)
                                const toolInput = { ...args, userId: params.userId };
                                const result = await stripeTool.execute(toolInput);
                                toolResult = JSON.stringify(result);
                            }

                            // Send tool output back to model to get final summary
                            // Gemini requires a simplified structure for tool responses:
                            // Removed unused toolResponse block

                            // Send tool response to the chat to continue conversation
                            // Simplified handling: after executing tool, push tool result as text and continue streaming.
                            stream.push(`data: ${JSON.stringify({ type: 'text', content: toolResult })}\n\n`);
                            // Note: In a full implementation, you would send the result back to the model for further processing.
                        }
                    }
                }

                stream.push('data: [DONE]\n\n');
                stream.push(null);

            } catch (error) {
                logger.error(error, '[AIService] Error in streamChat');
                stream.emit('error', error);
                stream.push(null);
            }
        };

        runner();
        return stream;
    }

    /**
     * Generate content (Single-shot)
     */
    public async generateContent(prompt: string): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            logger.error(error, '[AIService] Error in generateContent');
            return 'Error generating content.';
        }
    }

    /**
     * Chat (Non-streaming)
     */
    public async chat(history: any[], message: string): Promise<string> {
        try {
            const chat = this.model.startChat({
                history: history.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                }))
            });
            const result = await chat.sendMessage(message);
            return result.response.text();
        } catch (error) {
            logger.error(error, '[AIService] Error in chat');
            return 'Error in chat processing.';
        }
    }
}
