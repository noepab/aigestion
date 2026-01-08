// import { Request } from 'express';
// Define all flags used in the application. Extend as needed.
export interface FeatureFlags {
  // Example flags – add more as you create experiments
  ab_test?: 'control' | 'variant';
  newNavbar?: boolean;
  betaFeature?: boolean;
  premiumExitEnabled?: boolean;
}

// Default values for flags when no cookie is present
export const defaultFeatureFlags: FeatureFlags = {
  ab_test: 'control',
  newNavbar: false,
  betaFeature: false,
  premiumExitEnabled: false,
};

/**
 * Retrieve a specific flag value from the request cookies.
 * Falls back to the default value if the cookie is missing or invalid.
 */
export const getFlag = (req: any, name: keyof FeatureFlags): FeatureFlags[typeof name] => {
  const raw = req.cookies?.[name as string];
  if (raw === undefined) {
    return defaultFeatureFlags[name];
  }
  // For boolean flags, interpret "true"/"false"
  if (typeof defaultFeatureFlags[name] === 'boolean') {
    return (raw === 'true') as any;
  }
  // For string‑based flags (e.g., ab_test)
  return raw;
};

/**
 * Build the complete FeatureFlags object for a request.
 */
export const buildFeatureFlags = (req: any): FeatureFlags => {
  const flags: any = {};
  (Object.keys(defaultFeatureFlags) as (keyof FeatureFlags)[]).forEach(key => {
    flags[key] = getFlag(req, key);
  });
  return flags as FeatureFlags;
};
