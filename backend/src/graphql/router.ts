import express from 'express';
import { graphqlHTTP } from 'express-graphql';

import { createDataloaders } from './dataloaders';
import { schema } from './schema';

/**
 * GraphQL Router
 * Endpoint: /graphql
 */
export function createGraphQLRouter() {
  const router = express.Router();

  router.all(
    '/',
    graphqlHTTP(async (req: any) => ({
      schema,
      rootValue: {},
      context: {
        req,
        dataloaders: createDataloaders(),
      },
      graphiql: process.env.NODE_ENV === 'development',
      pretty: process.env.NODE_ENV === 'development',
      customFormatErrorFn: (error: any) => ({
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_ERROR',
        },
      }),
    })),
  );

  return router;
}
