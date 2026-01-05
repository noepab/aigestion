import { useEffect, useState } from 'react';
import { useDataProcessor } from '../../hooks/useDataProcessor';
import { VirtualList } from '../ui/VirtualList';

interface LogEntry {
  id: string;
  timestamp: string;
  level?: string;
  message: string;
  source?: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  height?: number;
  className?: string;
}

export default function LogViewer({ logs, height = 300, className = '' }: LogViewerProps) {
  const [filter, setFilter] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(logs);
  const { processor, isReady } = useDataProcessor();
  const [isFiltering, setIsFiltering] = useState(false);

  // Use Worker for filtering
  useEffect(() => {
    const filterLogs = async () => {
      if (!filter) {
        setFilteredLogs(logs);
        return;
      }

      setIsFiltering(true);
      try {
        if (isReady && processor) {
          // Off-main-thread filtering
          // We map our specific LogEntry to the 'any' type expected by worker for now
          // Ideally worker matching types should be stricter
          const results = await processor.filterLogs(logs, filter);
          setFilteredLogs(results);
        } else {
          // Fallback if worker not ready
          const lowerFilter = filter.toLowerCase();
          const results = logs.filter(
            (log) =>
              log.message.toLowerCase().includes(lowerFilter) ||
              log.level?.toLowerCase().includes(lowerFilter) ||
              log.source?.toLowerCase().includes(lowerFilter)
          );
          setFilteredLogs(results);
        }
      } catch (error) {
        console.error('Worker error:', error);
      } finally {
        setIsFiltering(false);
      }
    };

    const timeout = setTimeout(filterLogs, 300); // Debounce
    return () => clearTimeout(timeout);
  }, [filter, logs, isReady, processor]);

  const getLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'info': return 'text-cyan-400';
      case 'warn': return 'text-amber-400';
      case 'error': return 'text-rose-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          {isFiltering && (
             <div className="absolute right-3 top-1/2 -translate-y-1/2">
               <div className="w-3 h-3 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
             </div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {filteredLogs.length} items {isReady ? '(Worker Active)' : ''}
        </div>
      </div>

      {/* Virtual List */}
      <div className="bg-slate-950/50 rounded-lg border border-slate-800/50 overflow-hidden">
        <VirtualList
          items={filteredLogs}
          height={height}
          estimateSize={28} // Approx line height
          itemKey={(item) => item.id || item.timestamp + item.message}
          renderItem={(log) => (
            <div className="flex items-start gap-3 px-3 py-1 hover:bg-white/5 transition-colors font-mono text-xs border-b border-slate-800/30">
              <span className="text-gray-600 whitespace-nowrap min-w-[80px]">
                {log.timestamp}
              </span>
              {log.level && (
                <span className={`font-bold w-[50px] ${getLevelColor(log.level)}`}>
                  [{log.level}]
                </span>
              )}
              {log.source && (
                <span className="text-purple-400/70 w-[60px] truncate">
                  [{log.source}]
                </span>
              )}
              <span className="text-gray-300 break-all">
                {log.message}
              </span>
            </div>
          )}
        />
      </div>
    </div>
  );
}
