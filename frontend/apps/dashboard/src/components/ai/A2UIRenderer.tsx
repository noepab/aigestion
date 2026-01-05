import React from 'react';
import { GlassCard } from '@nexus-v1/frontend-shared';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { GlassChartTooltip } from '@nexus-v1/frontend-shared';

interface A2UIComponent {
  type: string;
  props: any;
}

interface A2UIRendererProps {
  data: A2UIComponent;
}

export const A2UIRenderer: React.FC<A2UIRendererProps> = ({ data }) => {
  if (!data) return null;

  switch (data.type) {
    case 'chart':
      const { type, data: chartData, title } = data.props;
      return (
        <GlassCard className="w-full h-64 mt-4">
          <h4 className="text-sm font-bold text-gray-300 mb-2">{title}</h4>
          <ResponsiveContainer width="100%" height="100%">
            {type === 'bar' ? (
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#666" fontSize={10} />
                <Tooltip content={<GlassChartTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                   <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#666" fontSize={10} />
                <Tooltip content={<GlassChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="url(#colorValue)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </GlassCard>
      );

    // case 'table': ... (Future implementation)

    default:
      return <div className="text-red-400 text-xs">Unsupported Component: {data.type}</div>;
  }
};
