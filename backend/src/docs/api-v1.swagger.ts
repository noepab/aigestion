/**
 * OpenAPI 3.0 / Swagger Documentation
 * Sprint 1: REST API v1 Refactoring
 *
 * Generated: 2025-12-16
 * Status: Partial (Phase 1 of REST refactoring)
 */

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'NEXUS V1 API',
    description: 'NEXUS V1 Platform REST API - v1 Standardized',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@NEXUS V1.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.NEXUS V1.com',
      description: 'Production server',
    },
  ],
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['System'],
        summary: 'Health check endpoint',
        description: 'Returns system health status',
        responses: {
          200: {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'number', example: 200 },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        uptime: { type: 'number', example: 12345.67 },
                        version: { type: 'string', example: '1.0.0' },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/users/{userId}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            description: 'User ID (UUID or number)',
            schema: {
              type: 'string',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
        ],
        responses: {
          200: {
            description: 'User retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'number', example: 200 },
                    data: {
                      $ref: '#/components/schemas/User',
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number (1-indexed)',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10, maximum: 100 },
            description: 'Items per page (max 100)',
          },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string', enum: ['createdAt', 'name', 'email'] },
            description: 'Sort field',
          },
          {
            name: 'order',
            in: 'query',
            schema: { type: 'string', enum: ['ASC', 'DESC'] },
            description: 'Sort order',
          },
        ],
        responses: {
          200: {
            description: 'Users list retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'number', example: 200 },
                    data: {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/User' },
                        },
                        pagination: {
                          $ref: '#/components/schemas/Pagination',
                        },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'name'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                  },
                  name: {
                    type: 'string',
                    minLength: 2,
                    example: 'John Doe',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'number', example: 201 },
                    data: { $ref: '#/components/schemas/User' },
                    timestamp: { type: 'string', format: 'date-time' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          name: { type: 'string', example: 'John Doe' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 42 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'number', example: 400 },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Email is required' },
              timestamp: { type: 'string', format: 'date-time' },
              requestId: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
  },
};
