'use client';

// Lightweight inline SVG bar chart — no charting library. Built for the
// owner analytics dashboard's daily reservations/revenue series (~30
// points), not meant as a general-purpose charting component.
export default function BarChart({ data, valueKey, color = 'var(--brand)', formatValue = (v) => v, height = 140 }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const barWidth = 100 / data.length;

  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }} role="img" aria-label={`Daily ${valueKey} over the last ${data.length} days`}>
        {data.map((d, i) => {
          const value = d[valueKey];
          const barHeight = (value / max) * (height - 4);
          return (
            <rect
              key={d.date}
              x={i * barWidth + barWidth * 0.15}
              y={height - barHeight}
              width={barWidth * 0.7}
              height={barHeight}
              fill={color}
              rx="1"
            >
              <title>{`${d.date}: ${formatValue(value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="muted small" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
