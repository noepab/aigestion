// src/__tests__/tools/web-search.tool.test.ts
import { SearchWebTool } from '../../../src/tools/web-search.tool';

// Mock the tavily client
jest.mock('@tavily/core', () => ({
  tavily: jest.fn(),
}));

const { tavily } = require('@tavily/core');

describe('SearchWebTool', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws an error when query is empty', async () => {
    const tool = new SearchWebTool();
    await expect(tool.execute({ query: '' })).rejects.toThrow('Search query cannot be empty.');
  });

  it('throws an error when API key is missing', async () => {
    delete process.env.TAVILY_API_KEY;
    const tool = new SearchWebTool();
    await expect(tool.execute({ query: 'test' })).rejects.toThrow('TAVILY_API_KEY environment variable is not set.');
  });

  it('returns answer and results on successful search', async () => {
    process.env.TAVILY_API_KEY = 'dummy-key';
    const mockResponse = {
      answer: 'Mock answer',
      results: [
        { title: 'Title 1', url: 'https://example.com/1', content: 'Content 1' },
        { title: 'Title 2', url: 'https://example.com/2', content: 'Content 2' },
      ],
    };
    const mockClient = { search: jest.fn().mockResolvedValue(mockResponse) };
    (tavily as jest.Mock).mockReturnValue(mockClient);

    const tool = new SearchWebTool();
    const result = await tool.execute({ query: 'test query' });

    expect(tavily).toHaveBeenCalledWith({ apiKey: 'dummy-key' });
    expect(mockClient.search).toHaveBeenCalledWith('test query', {
      searchDepth: 'basic',
      includeAnswer: true,
      maxResults: 5,
    });
    expect(result).toEqual({
      answer: 'Mock answer',
      results: mockResponse.results,
    });
  });
});
