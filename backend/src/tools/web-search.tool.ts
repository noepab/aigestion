import { tavily } from '@tavily/core';
import { z } from 'zod';

import { BaseTool } from './base.tool';

/**
 * SearchWebTool
 *
 * Performs a web search using the Tavily API. Includes comprehensive input validation,
 * environment variable checks, and detailed error handling to aid debugging.
 */
export class SearchWebTool extends BaseTool<{ query: string }> {
  /** Human‑readable name of the tool */
  name = 'search_web';

  /** Description used by the AI agent */
  description = 'Performs a web search to retrieve up‑to‑date information on a given topic.';

  /** Zod schema for input validation */
  schema = z.object({
    query: z
      .string()
      .min(1, { message: 'The search query must not be empty.' })
      .max(200, { message: 'The search query is too long (max 200 characters).' })
      .describe('The search query or topic to look up on the web.'),
  });

  /**
   * Execute the web search.
   *
   * @param input - Object containing the `query` string.
   * @returns An object with the answer and a list of result items.
   * @throws Will throw an error if the API key is missing or the request fails.
   */
  async execute(input: { query: string }): Promise<any> {
    // Runtime guard for empty query strings
    if (!input.query || input.query.trim().length === 0) {
      throw new Error('Search query cannot be empty.');
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY environment variable is not set.');
    }

    const client = tavily({ apiKey });
    try {
      const response = await client.search(input.query, {
        searchDepth: 'basic',
        includeAnswer: true,
        maxResults: 5,
      });

      return {
        answer: response.answer,
        results: response.results.map(r => ({
          title: r.title,
          url: r.url,
          content: r.content,
        })),
      };
    } catch (error: any) {
      // Re‑throw with a clearer message for troubleshooting.
      throw new Error(`Web search failed: ${error.message}`);
    }
  }
}
