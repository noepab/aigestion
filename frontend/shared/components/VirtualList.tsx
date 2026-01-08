import { List, RowComponentProps } from 'react-window';
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
  const Row = ({ index, style }: RowComponentProps) => {
    const item = items[index];
    // Need to cast the results of renderItem because Row expects ReactElement but renderItem returns ReactNode
    return renderItem(item, index, style) as React.ReactElement;
  };

  return (
    <div style={{ height, width: '100%' }} className={className}>
      <AutoSizer>
        {({ height: autoHeight, width: autoWidth }: { height: number; width: number }) => (
          <List
            rowCount={items.length}
            rowHeight={itemSize}
            rowComponent={Row}
            rowProps={{}}
            style={{ height: autoHeight, width: autoWidth }}
          />
        )}
      </AutoSizer>
    </div>
  );
}
