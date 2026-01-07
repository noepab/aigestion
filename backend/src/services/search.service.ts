import axios from 'axios';
import { injectable } from 'inversify';

import { env } from '../config/env.schema';
import { logger } from '../utils/logger';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

@injectable()
export class SearchService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.tavily.com/search';

  constructor() {
    this.apiKey = env.TAVILY_API_KEY;
  }

  async search(query: string, limit = 5): Promise<SearchResult[]> {
    if (!this.apiKey) {
      logger.warn('TAVILY_API_KEY is missing. Web search will not work.');
      return [];
    }

    try {
      const response = await axios.post(this.baseUrl, {
        api_key: this.apiKey,
        query,
        search_depth: 'smart',
        include_images: false,
        include_answer: true,
        max_results: limit,
      });

      return response.data.results || [];
    } catch (error) {
      logger.error(error, `Error performing web search for query: ${query}`);
      return [];
    }
  }
}
