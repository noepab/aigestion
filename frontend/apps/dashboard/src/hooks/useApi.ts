import apiService from '@/services/api';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

/**
 * Hook para obtener contenedores Docker
 */
export function useDockerContainers(options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: ['docker', 'containers'],
    queryFn: () => apiService.docker.getContainers(),
    refetchInterval: 5000, // Actualizar cada 5 segundos
    ...options,
  });
}

/**
 * Hook para obtener estadísticas de un contenedor específico
 */
export function useContainerStats(containerId: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: ['docker', 'container', containerId, 'stats'],
    queryFn: () => apiService.docker.getContainerStats(containerId),
    enabled: !!containerId,
    refetchInterval: 2000, // Actualizar cada 2 segundos
    ...options,
  });
}

/**
 * Hook para obtener métricas del sistema
 */
export function useSystemMetrics(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: ['system', 'metrics'],
    queryFn: () => apiService.system.getMetrics(),
    refetchInterval: 3000, // Actualizar cada 3 segundos
    ...options,
  });
}

/**
 * Hook para obtener modelos de IA
 */
export function useAIModels(options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: ['ai', 'models'],
    queryFn: () => apiService.ai.getModels(),
    ...options,
  });
}

/**
 * Hook para obtener modelo activo de IA
 */
export function useActiveAIModel(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: ['ai', 'active-model'],
    queryFn: () => apiService.ai.getActiveModel(),
    refetchInterval: 10000, // Actualizar cada 10 segundos
    ...options,
  });
}

/**
 * Hook para obtener logs recientes
 */
export function useRecentLogs(limit = 100, options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: ['logs', 'recent', limit],
    queryFn: () => apiService.logs.getRecent(limit),
    refetchInterval: 5000, // Actualizar cada 5 segundos
    ...options,
  });
}

/**
 * Hook para obtener estadísticas de usuarios
 */
export function useUserStats(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => apiService.users.getStats(),
    ...options,
  });
}

/**
 * Hook para obtener overview de analytics
 */
export function useAnalyticsOverview(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => apiService.analytics.getOverview(),
    refetchInterval: 30000, // Actualizar cada 30 segundos
    ...options,
  });
}

/**
 * Hook para obtener actividad de usuarios (analytics)
 */
export function useAnalyticsUserActivity(timeRange?: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: ['analytics', 'user-activity', timeRange],
    queryFn: () => apiService.analytics.getUserActivity(timeRange),
    ...options,
  });
}

/**
 * Hook para obtener uso del sistema (analytics)
 */
export function useAnalyticsSystemUsage(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: ['analytics', 'system-usage'],
    queryFn: () => apiService.analytics.getSystemUsage(),
    refetchInterval: 30000, // Actualizar cada 30 segundos
    ...options,
  });
}

/**
 * Hook para obtener tasas de error (analytics)
 */
export function useAnalyticsErrorRates(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: ['analytics', 'error-rates'],
    queryFn: () => apiService.analytics.getErrorRates(),
    refetchInterval: 30000, // Actualizar cada 30 segundos
    ...options,
  });
}

/**
 * Hook para obtener commits recientes de Git
 */
export function useGitCommits(limit = 10, options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: ['git', 'commits', limit],
    queryFn: () => apiService.git.getRecentCommits(limit),
    ...options,
  });
}

/**
 * Hook para health check
 */
export function useHealthCheck(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.health.check(),
    refetchInterval: 60000, // Actualizar cada minuto
    ...options,
  });
}
