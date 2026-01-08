import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

import { logger } from '../utils/logger';

interface FileContext {
  path: string;
  content: string;
  size: number;
}

// Basic simulation of TF-IDF / BM25 components
interface SearchResult {
  file: FileContext;
  score: number;
  metadata: {
    keywordScore: number;
    semanticScore: number;
    matches: string[];
  };
}

interface RagSearchResult {
  query: string;
  results: Array<{
    content: string;
    metadata: {
      source: string;
      filename: string;
      type: string;
      [key: string]: any;
    };
    distance?: number;
  }>;
}

export class RagService {
  private readonly rootDir: string;
  private readonly maxContextSize: number = 100000; // ~25k tokens (safe limit)
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes
  private cache: { data: string; timestamp: number } | null = null;
  private fileCache: { files: FileContext[]; timestamp: number } | null = null;
  private readonly mlServiceUrl = 'http://localhost:8000'; // ML Service URL

  private readonly ignoredDirs = new Set([
    'node_modules',
    'dist',
    'build',
    '.git',
    '.turbo',
    'coverage',
    'logs',
    '.trunk',
    '.vscode',
    '.idea',
  ]);

  private readonly ignoredExtensions = new Set([
    '.lock',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.pdf',
    '.zip',
    '.map',
    '.mp4',
    '.mp3',
  ]);

  constructor() {
    this.rootDir = path.resolve(__dirname, '../../../');
  }

  /**
   * Scans the codebase and returns a formatted string of the context.
   * Uses in-memory caching and prepends an ASCII tree of the project structure.
   * If query is provided, performs a Hybrid Search simulation to prioritize relevant files.
   * ALSO queries the Python RAG service for documentation context.
   */
  async getProjectContext(query?: string): Promise<string> {
    try {
      logger.info(`[RagService] Getting context${query ? ` for query: "${query}"` : ' (full)'}...`);

      let context = '';

      // 1. Run File Scan and RAG Query in parallel
      const [files, docContext] = await Promise.all([
        this.getAllFiles(),
        (query && query.trim().length > 0) ? this.queryVectorDb(query) : Promise.resolve(null)
      ]);

      // 2. Generate ASCII Tree (always useful for structure)
      const filePaths = files.map(f => f.path);
      const asciiTree = this.generateAsciiTree(filePaths);

      context += `Project Structure:\n${asciiTree}\n\n`;

      let sortedFiles = files;

      // 3. Hybrid Search / RRF Simulation (Code Context)
      if (query && query.trim().length > 0) {
        context += `[Code Context optimized for query: "${query}"]\n\n`;
        sortedFiles = this.rankFiles(files, query);

        // 3.5 Append Documentation Context
        if (docContext) {
          context += `[Documentation Memory]\n${docContext}\n\n`;
        }
      } else {
        context += `[Full Context - No Query Provided]\n\n`;
        // Default sort by path if no query to maintain stability
        sortedFiles.sort((a, b) => a.path.localeCompare(b.path));
      }

      context += `Here is the codebase context:\n\n`;
      let currentSize = context.length;

      // 4. Context Stuffing with Limit
      let includedCount = 0;
      for (const file of sortedFiles) {
        const fileBlock = `<file path="${file.path}">\n${file.content}\n</file>\n\n`;

        if (currentSize + fileBlock.length > this.maxContextSize) {
          context += `\n<!-- Context truncated due to size limit (${this.maxContextSize} chars). Included ${includedCount} of ${sortedFiles.length} files. -->`;
          break;
        }

        context += fileBlock;
        currentSize += fileBlock.length;
        includedCount++;
      }

      return context;
    } catch (error) {
      logger.error(error, 'Error in RagService:');
      return ''; // Fail gracefully
    }
  }

  /**
   * Queries the external Python RAG service (ml-service) for relevant documentation.
   */
  private async queryVectorDb(query: string): Promise<string | null> {
    try {
      logger.info(`[RagService] Querying Vector DB for: "${query}"`);
      const response = await axios.post<RagSearchResult>(`${this.mlServiceUrl}/recall`, {
        query: query,
        limit: 3
      }, { timeout: 2000 }); // Short timeout to avoid blocking

      if (response.data && response.data.results && response.data.results.length > 0) {
        let docStr = '';
        response.data.results.forEach((res, index) => {
          docStr += `--- Document ${index + 1} (${res.metadata.filename}) ---\n${res.content}\n\n`;
        });
        return docStr;
      }
      return null;
    } catch (error: any) {
      // Log but don't crash
      logger.warn(`[RagService] Failed to query Vector DB: ${error.message}`);
      return `<!-- Failed to retrieve documentation context: ${error.message} -->`;
    }
  }


  private async getAllFiles(): Promise<FileContext[]> {
    if (this.fileCache && Date.now() - this.fileCache.timestamp < this.cacheTTL) {
      return this.fileCache.files;
    }

    const files = await this.scanDirectory(this.rootDir);
    this.fileCache = {
      files,
      timestamp: Date.now(),
    };
    return files;
  }

  /**
   * Ranks files using a simulated Hybrid Search (Keyword + Structural).
   * Calculates a simple score based on:
   * 1. Path/Filename match (Structural/Semantic proxy)
   * 2. Content keyword frequency (TF proxy)
   */
  private rankFiles(files: FileContext[], query: string): FileContext[] {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 2);
    if (terms.length === 0) return files;

    const results: SearchResult[] = files.map(file => {
      let keywordScore = 0;
      let semanticScore = 0;
      const matches: string[] = [];
      const contentLower = file.content.toLowerCase();
      const pathLower = file.path.toLowerCase();

      terms.forEach(term => {
        // Structural Score: Filename matches are high signal
        if (pathLower.includes(term)) {
          semanticScore += 10;
          matches.push(`path:${term}`);
        }

        // Keyword Score: Simple frequency count in content
        // A real BM25 would need document frequency, simplified here to Term Count
        const regex = new RegExp(this.escapeRegExp(term), 'g');
        const count = (contentLower.match(regex) || []).length;
        if (count > 0) {
          keywordScore += count;
        }
      });

      // Normalize scores slightly to prevent massive files from dominating solely by size
      // (Logarithmic dampening for keyword frequency)
      const finalKeywordScore = keywordScore > 0 ? Math.log(1 + keywordScore) : 0;

      // Reciprocal Rank Fusion (Simulated)
      // We just sum them here for simplicity, but in RRF we'd rank lists separately and fuse.
      // Weighted sum: Structure is very important for code retrieval.
      const totalScore = semanticScore * 2 + finalKeywordScore;

      return {
        file,
        score: totalScore,
        metadata: { keywordScore: finalKeywordScore, semanticScore, matches },
      };
    });

    // Sort by Score DESC
    // Return relevant files first, followed by the rest
    const relevantFiles = results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.file);

    // Append unrelated files to fill context if space permits (deduplicated)
    const otherFiles = files.filter(f => !relevantFiles.includes(f));

    return [...relevantFiles, ...otherFiles];
  }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async scanDirectory(dir: string): Promise<FileContext[]> {
    let results: FileContext[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.rootDir, fullPath);

        if (entry.isDirectory()) {
          if (!this.ignoredDirs.has(entry.name)) {
            const subResults = await this.scanDirectory(fullPath);
            results = results.concat(subResults);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (!this.ignoredExtensions.has(ext)) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              results.push({
                path: relativePath,
                content: content,
                size: content.length,
              });
            } catch (err: any) {
              logger.warn(`Could not read file ${fullPath}: ${err.message}`);
            }
          }
        }
      }
    } catch (error) {
      logger.error(error, `Failed to scan dir ${dir}:`);
    }

    return results;
  }

  /**
   * Generates a simple ASCII tree from a list of relative file paths.
   */
  private generateAsciiTree(paths: string[]): string {
    const tree: any = {};
    for (const p of paths) {
      const parts = p.split(path.sep);
      let current = tree;
      for (const part of parts) {
        current[part] = current[part] || {};
        current = current[part];
      }
    }

    return this.printTree(tree);
  }

  private printTree(node: any, prefix = ''): string {
    const keys = Object.keys(node).sort();
    let result = '';

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const isLast = i === keys.length - 1;
      const connector = isLast ? '└── ' : '├── ';

      result += `${prefix}${connector}${key}\n`;

      const children = node[key];
      if (Object.keys(children).length > 0) {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        result += this.printTree(children, childPrefix);
      }
    }
    return result;
  }
}

export const ragService = new RagService();
