import { useRef, useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';

interface RealTimeChartProps {
  data: Array<{ timestamp: number; value: number }>;
  maxDataPoints?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  label?: string;
  unit?: string;
  showGrid?: boolean;
  showAxes?: boolean;
}

const RealTimeChart = memo(function RealTimeChart({
  data,
  maxDataPoints = 50,
  height = 200,
  color = '#00f3ff',
  fillColor = 'rgba(0, 243, 255, 0.1)',
  label,
  unit = '',
  showGrid = true,
  showAxes = true,
}: RealTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height,
        });
      }
    });

    resizeObserver.observe(canvas.parentElement!);
    return () => resizeObserver.disconnect();
  }, [height]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get visible data points
    const visibleData = data.slice(-maxDataPoints);
    if (visibleData.length < 2) return;

    // Calculate scales
    const maxValue = Math.max(...visibleData.map((d) => d.value), 1);
    const minValue = Math.min(...visibleData.map((d) => d.value), 0);
    const valueRange = maxValue - minValue || 1;

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (chartWidth / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, canvas.height - padding);
        ctx.stroke();
      }
    }

    // Draw axes
    if (showAxes) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;

      // Y-axis
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.stroke();

      // X-axis
      ctx.beginPath();
      ctx.moveTo(padding, canvas.height - padding);
      ctx.lineTo(canvas.width - padding, canvas.height - padding);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';

      for (let i = 0; i <= 5; i++) {
        const value = maxValue - (valueRange / 5) * i;
        const y = padding + (chartHeight / 5) * i;
        ctx.fillText(`${value.toFixed(1)}${unit}`, padding - 10, y + 4);
      }
    }

    // Draw area fill
    ctx.fillStyle = fillColor;
    ctx.beginPath();

    visibleData.forEach((point, index) => {
      const x = padding + (chartWidth / (maxDataPoints - 1)) * index;
      const normalizedValue = (point.value - minValue) / valueRange;
      const y = canvas.height - padding - normalizedValue * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, canvas.height - padding);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    visibleData.forEach((point, index) => {
      const x = padding + (chartWidth / (maxDataPoints - 1)) * index;
      const normalizedValue = (point.value - minValue) / valueRange;
      const y = canvas.height - padding - normalizedValue * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw current value indicator
    if (visibleData.length > 0) {
      const lastPoint = visibleData[visibleData.length - 1];
      const x = canvas.width - padding;
      const normalizedValue = (lastPoint.value - minValue) / valueRange;
      const y = canvas.height - padding - normalizedValue * chartHeight;

      // Dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [data, dimensions, maxDataPoints, color, fillColor, unit, showGrid, showAxes]);

  const currentValue = data.length > 0 ? data[data.length - 1].value : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full">
      {label && (
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            {label}
          </span>
          <span className="text-lg font-bold text-white font-mono">
            {currentValue.toFixed(2)}
            {unit}
          </span>
        </div>
      )}
      <div className="relative w-full bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
        <canvas ref={canvasRef} className="w-full" style={{ height: `${height}px` }} />
      </div>
    </motion.div>
  );
});

export default RealTimeChart;
