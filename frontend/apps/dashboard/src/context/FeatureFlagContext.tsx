// Feature Flag Context
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface FeatureFlags {
  ab_test?: 'control' | 'variant';
  newNavbar?: boolean;
  betaFeature?: boolean;
  // extend as needed
}

interface FeatureFlagContextProps {
  flags: FeatureFlags | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextProps | undefined>(undefined);

export const FeatureFlagProvider = ({ children }: { children: ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/flags', {
        credentials: 'include', // send cookies
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFlags(data.flags);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error fetching flags');
      setFlags(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const refresh = () => fetchFlags();

  return (
    <FeatureFlagContext.Provider value={{ flags, loading, error, refresh }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagContextProps => {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  return ctx;
};

