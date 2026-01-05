import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

interface FileContext {
    path: string;
    content: string;
    size: number;
}

export class RagService {
    private readonly rootDir: string;
    private readonly maxContextSize: number = 500000; // ~125k tokens
    private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes
    private cache: { data: string; timestamp: number } | null = null;

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
        '.idea'
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
        '.mp3'
    ]);

    constructor() {
        this.rootDir = path.resolve(__dirname, '../../../');
    }

    /**
     * Scans the codebase and returns a formatted string of the context.
     * Uses in-memory caching and prepends an ASCII tree of the project structure.
     */
    async getProjectContext(_query?: string): Promise<string> {
        // 1. Check Cache
        if (this.cache && (Date.now() - this.cache.timestamp < this.cacheTTL)) {
            logger.info('[RagService] Returning cached context');
            return this.cache.data;
        }

        try {
            logger.info('[RagService] Scanning filesystem...');
            const files = await this.scanDirectory(this.rootDir);

            // 2. Generate ASCII Tree
            const filePaths = files.map(f => f.path);
            const asciiTree = this.generateAsciiTree(filePaths);

            let context = `Project Structure:\n${asciiTree}\n\nHere is the codebase context:\n\n`;
            let currentSize = context.length;

            // 3. Context Stuffing with Limit
            for (const file of files) {
                const fileBlock = `<file path="${file.path}">\n${file.content}\n</file>\n\n`;

                if (currentSize + fileBlock.length > this.maxContextSize) {
                    context += `\n<!-- Context truncated due to size limit (${this.maxContextSize} chars) -->`;
                    break;
                }

                context += fileBlock;
                currentSize += fileBlock.length;
            }

            // 4. Update Cache
            this.cache = {
                data: context,
                timestamp: Date.now()
            };

            return context;
        } catch (error) {
            logger.error(error, 'Error in RagService:');
            return ''; // Fail gracefully
        }
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
                                size: content.length
                            });
                        } catch (err) {
                            logger.warn(`Could not read file ${fullPath}: ${(err as any).message}`);
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
