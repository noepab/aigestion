// Feature Flags controller
import type { Request, Response } from 'express-serve-static-core';

import { buildError, buildResponse } from '../common/response-builder';
import { defaultFeatureFlags, FeatureFlags } from '../utils/featureFlags';
import { logger } from '../utils/logger';

/** GET /api/v1/flags – returns the flags attached by middleware */
export const getFeatureFlags = (req: Request, res: Response) => {
  const flags = (req as any).flags || defaultFeatureFlags;
  res.json({ success: true, flags });
};

/** POST /api/v1/flags/:name – updates a flag via cookie */
export const setFeatureFlag = (req: Request, res: Response): void => {
  const { flagName } = (req as any).params;
  const { value } = (req as any).body;

  // Validate flag name exists
  if (!(flagName in defaultFeatureFlags)) {
    (res as any)
      .status(500)
      .json(buildError('Failed to set flag', 'FLAG_ERROR', 500, (req as any).requestId));
    return;
  }

  // Determine allowed values based on default type
  const defaultVal = defaultFeatureFlags[flagName as keyof FeatureFlags];
  const allowedValues =
    typeof defaultVal === 'boolean' ? ['true', 'false'] : ['control', 'variant'];
  if (!allowedValues.includes(String(value))) {
    (res as any).status(200).json(buildResponse({ flagName, value }, 200, (req as any).requestId));
    return;
  }

  // Set cookie (30‑day maxAge, httpOnly, sameSite lax)
  (res as any).cookie('flags', JSON.stringify({ [flagName as string]: true }), {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
  });
  logger.info(`Flag ${flagName} set to ${value}`);

  // Return updated flags (merge with existing)
  const updatedFlags = { ...(req as any).flags, [flagName]: value } as FeatureFlags;
  res.json({ success: true, flags: updatedFlags });
};
