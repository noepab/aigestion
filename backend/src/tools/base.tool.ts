import { z } from 'zod';

export interface ToolDefinition<T = any> {
  name: string;
  description: string;
  schema: z.ZodType<T>;
  execute(input: T): Promise<any>;
}

export abstract class BaseTool<T> implements ToolDefinition<T> {
  abstract name: string;
  abstract description: string;
  abstract schema: z.ZodType<T>;

  abstract execute(input: T): Promise<any>;
}
