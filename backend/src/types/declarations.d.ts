/**
 * Global Type Definitions
 * Unblock compilation for modules with missing or unresolved @types packages
 */

declare module 'express';
declare module 'compression';
declare module 'morgan';
declare module 'jsonwebtoken';
declare module 'bcryptjs';
declare module 'nodemailer';
declare module 'simple-peer';
declare module 'swagger-jsdoc';
declare module 'swagger-ui-express';
declare module 'supertest';
declare module 'uuid';
declare module 'cors';
declare module 'helmet';

// Google Cloud SDKs (if stubbornly missing)
declare module '@google/generative-ai';
declare module '@google-cloud/vertexai';
