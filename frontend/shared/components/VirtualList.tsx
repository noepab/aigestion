import React from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface VirtualListProps<T> {
  items: T[];
  height?: number | string;
  itemSize: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
}

export function VirtualList<T>({
  items,
  height = '100%',
  itemSize,
  renderItem,
  className,
}: VirtualListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return renderItem(item, index, style);
  };

  return (
    <div style={{ height, width: '100%' }} className={className}>
      <AutoSizer>
        {({ height: autoHeight, width: autoWidth }) => (
          <List height={autoHeight} itemCount={items.length} itemSize={itemSize} width={autoWidth}>
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}
