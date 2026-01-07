import { useEffect,useState } from 'react';

export function useAnalyticsData() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for now
    setData({
      users: 120,
      sessions: 450,
      bounceRate: 45,
      revenue: [
        { name: 'Jan', value: 100 },
        { name: 'Feb', value: 200 },
      ],
      conversions: [
        { name: 'Step 1', value: 100 },
        { name: 'Step 2', value: 80 },
      ],
    });
    setIsLoading(false);
  }, []);

  return { data, isLoading };
}
