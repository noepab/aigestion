// src/types/custom.d.ts
declare module 'pg' {
  // Minimal placeholder types to satisfy TypeScript compilation.
  export interface ClientConfig {}
  export class Client {
    constructor(config?: ClientConfig);
    connect(): Promise<void>;
    query(text: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
  }
}

declare module 'pg-pool' {
  import { Client, ClientConfig } from 'pg';
  export interface PoolConfig extends ClientConfig {}
  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<Client>;
    query(text: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
  }
}

declare module 'whatwg-url' {
  export function parseURL(url: string): any;
}
