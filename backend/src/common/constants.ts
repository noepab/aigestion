export const EVENTS = {
  ANALYTICS_UPDATE: 'analytics:update',
  ANALYTICS_TRAFFIC: 'analytics:traffic',
  SYSTEM_METRICS: 'system:metrics',
  DOCKER_UPDATE: 'docker:update',
};

export const QUEUES = {
  YOUTUBE_TRANSCRIPTION: 'youtube-transcription',
};

export const API_VERSION = 'v1';

export const CORS_WHITELIST = [
  'http://localhost:3000',
  'http://localhost:5173',
  // Add production domains here
];
