import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualListProps<T> {
  items: T[];
  height: number | string;
  estimateSize: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemKey?: (item: T) => string | number;
}

export function VirtualList<T>({
  items,
  height,
  estimateSize,
  renderItem,
  className = '',
  itemKey,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className={`overflow-auto custom-scrollbar ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem: VirtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;

          return (
            <div
              key={itemKey ? itemKey(item) : virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
