// Feature Flags controller
import { Request, Response } from 'express';
import { FeatureFlags, defaultFeatureFlags } from '../utils/featureFlags';
import { logger } from '../utils/logger';

/** GET /api/v1/flags – returns the flags attached by middleware */
export const getFeatureFlags = (req: Request, res: Response) => {
  const flags = (req as any).flags || defaultFeatureFlags;
  res.json({ success: true, flags });
};

/** POST /api/v1/flags/:name – updates a flag via cookie */
export const setFeatureFlag = (req: Request, res: Response): void => {
  const { name } = req.params;
  const { value } = req.body;

  // Validate flag name exists
  if (!(name in defaultFeatureFlags)) {
    res.status(400).json({ success: false, message: 'Invalid flag name' });
    return;
  }

  // Determine allowed values based on default type
  const defaultVal = defaultFeatureFlags[name as keyof FeatureFlags];
  const allowedValues =
    typeof defaultVal === 'boolean' ? ['true', 'false'] : ['control', 'variant'];
  if (!allowedValues.includes(String(value))) {
    res.status(400).json({ success: false, message: 'Invalid flag value' });
    return;
  }

  // Set cookie (30‑day maxAge, httpOnly, sameSite lax)
  res.cookie(name, String(value), {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
  });
  logger.info(`Flag ${name} set to ${value}`);

  // Return updated flags (merge with existing)
  const updatedFlags = { ...(req as any).flags, [name]: value } as FeatureFlags;
  res.json({ success: true, flags: updatedFlags });
};
