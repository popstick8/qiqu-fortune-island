import type { StockPricePoint } from "@monopoly/shared";

interface StockLineChartProps {
  history: StockPricePoint[];
  days: number;
  height?: number;
}

export function StockLineChart({ history, days, height = 90 }: StockLineChartProps) {
  const points = history.slice(-days);
  if (points.length < 2) {
    return <div className="stockChartEmpty">暂无走势</div>;
  }

  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(1, max - min);
  const width = 240;
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.price - min) / range) * (height - 12) - 6;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="stockLineChart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="股票走势">
      <path className="chartGridLine" d={`M0 ${height - 8}H${width}`} />
      <path className="chartGridLine" d={`M0 8H${width}`} />
      <path className="chartArea" d={`${path} L${width} ${height - 8} L0 ${height - 8} Z`} />
      <path className="chartLine" d={path} />
      <title>最低 {min}，最高 {max}</title>
    </svg>
  );
}
