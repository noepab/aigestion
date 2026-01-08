import fs from 'fs';
import { injectable } from 'inversify';
import path from 'path';

import { logger } from '../../utils/logger';

@injectable()
export class GoogleSecretManagerService {
  /**
   * Loads an array of secret names into `process.env`.
   * @param keys List of secret identifiers (as they appear in GCP Secret Manager).
   */
  async loadSecretsToEnv(keys: string[]): Promise<void> {
    const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
    const hasCreds = credsPath && fs.existsSync(path.resolve(process.cwd(), credsPath));

    if (!hasCreds) {
      logger.warn('Google Cloud credentials not found – skipping Secret Manager loading');
      return;
    }

    let SecretManagerServiceClient: any;
    try {
      const clientModule = await import('@google-cloud/secret-manager');
      SecretManagerServiceClient = clientModule.SecretManagerServiceClient;
    } catch (e) {
      logger.warn('Secret Manager client library not installed – skipping secret loading');
      return;
    }

    const client = new SecretManagerServiceClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (!projectId) {
      logger.warn('GCP project ID not set – cannot build secret names');
      return;
    }

    for (const key of keys) {
      const name = `projects/${projectId}/secrets/${key}/versions/latest`;
      try {
        const [version] = await client.accessSecretVersion({ name });
        const payload = version?.payload?.data?.toString();
        if (payload !== undefined) {
          process.env[key] = payload;
          logger.info(`Secret ${key} loaded into env`);
        }
      } catch (err) {
        logger.error(err, `Failed to load secret ${key}`);
      }
    }
  }
}
