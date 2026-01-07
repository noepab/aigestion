// tests/__mocks__/express.ts
// Simple typed mock utilities for Express Request and Response used in backend tests

import { Request, Response } from 'express-serve-static-core';

export const mockRequest = (overrides: Partial<Request> = {}): Request => {
  const base: Partial<Request> = {
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    method: 'GET',
    ...overrides,
  } as any;
  return base as Request;
};

export const mockResponse = (overrides: Partial<Response> = {}): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    ...overrides,
  } as any;
  return res as Response;
};
