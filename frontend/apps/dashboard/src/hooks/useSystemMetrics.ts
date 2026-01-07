import { useEffect,useState } from 'react';

import apiService from '../services/api';

export function useSystemMetrics() {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    uptime: 0,
    lowPerformanceMode: false,
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await apiService.system.getMetrics();
        if (response.data) {
          setMetrics({
            cpu: response.data.cpu.usage || 0,
            memory: response.data.memory.percentage || 0,
            disk: response.data.disk?.usedPercentage || 0,
            uptime: response.data.uptime || 0,
            lowPerformanceMode: false,
          });
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error fetching metrics', error);
        setIsConnected(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, isConnected };
}
