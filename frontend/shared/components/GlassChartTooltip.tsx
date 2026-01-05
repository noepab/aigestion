import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

export const GlassChartTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/40 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-xl">
        <p className="text-sm font-medium text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-neutral-300">
              {entry.name}:
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};
