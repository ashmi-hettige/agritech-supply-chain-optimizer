/**
 * 30-day price chart for one crop at one centre: the daily min–max range as a light band
 * and the average price as a line. Hovering shows that day's prices.
 * @author Ashmi Hettige
 */
import { useState } from 'react';
import { formatDate, formatPrice } from '../utils/format';

const WIDTH = 720;
const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 52 };

function niceTicks(min, max, count = 4) {
  const step = Math.max(1, Math.ceil((max - min) / count / 10) * 10);
  const start = Math.floor(min / step) * step;
  return Array.from({ length: count + 2 }, (_, index) => start + index * step).filter((tick) => tick <= max + step);
}

export default function PriceChart({ days, label }) {
  const [hover, setHover] = useState(null);

  if (days.length < 2) {
    return <p className="text-muted">Not enough price history yet.</p>;
  }

  const values = days.flatMap((day) => [Number(day.minPrice), Number(day.maxPrice)]);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const x = (index) => PAD.left + (index / (days.length - 1)) * plotW;
  const y = (value) => PAD.top + (1 - (Number(value) - yMin) / (yMax - yMin)) * plotH;

  const line = days.map((day, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(day.avgPrice)}`).join(' ');
  const band = [
    ...days.map((day, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(day.maxPrice)}`),
    ...days.map((day, index) => [index, day]).reverse().map(([index, day]) => `L${x(index)},${y(day.minPrice)}`),
    'Z',
  ].join(' ');

  function handleMove(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - box.left) / box.width) * WIDTH;
    const index = Math.round(((svgX - PAD.left) / plotW) * (days.length - 1));
    setHover(Math.min(days.length - 1, Math.max(0, index)));
  }

  const hovered = hover === null ? null : days[hover];

  return (
    <figure className="price-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${label}: average price per day for the last ${days.length} days`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} className="chart-grid" />
            <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" className="chart-axis">{tick}</text>
          </g>
        ))}
        {days.map((day, index) => (index % 7 === 0 || (index === days.length - 1 && index % 7 > 3)) && (
          <text key={day.date} x={x(index)} y={HEIGHT - 8} textAnchor="middle" className="chart-axis">
            {formatDate(day.date).slice(0, -5)}
          </text>
        ))}

        <path d={band} className="chart-band" />
        <path d={line} className="chart-line" />

        {hovered && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} className="chart-cross" />
            <circle cx={x(hover)} cy={y(hovered.avgPrice)} r="5" className="chart-dot" />
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{ left: `${(x(hover) / WIDTH) * 100}%` }}
          role="status"
        >
          <strong>{formatDate(hovered.date)}</strong>
          <span>Average {formatPrice(hovered.avgPrice)}</span>
          <span className="text-muted">Range {formatPrice(hovered.minPrice)} – {formatPrice(hovered.maxPrice)}</span>
        </div>
      )}
      <figcaption className="chart-key">
        <span className="key-line" /> Average price
        <span className="key-band" /> Lowest to highest that day
      </figcaption>
    </figure>
  );
}
