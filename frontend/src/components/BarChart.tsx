interface BarDatum {
  label: string
  value: number
  maxValue: number
}

interface BarChartProps {
  title: string
  items: BarDatum[]
}

export function BarChart({ title, items }: BarChartProps) {
  return (
    <div className="results-card">
      <div className="results-card__eyebrow">Breakdown</div>
      <div className="results-card__title">{title}</div>
      <div className="bar-chart">
        {items.map((item) => {
          const pct = item.maxValue === 0 ? 0 : (item.value / item.maxValue) * 100
          return (
            <div key={item.label} className="bar-chart__row">
              <div className="bar-chart__meta">
                <strong>{item.label}</strong>
                <span>{item.value.toFixed(1)} / {item.maxValue}</span>
              </div>
              <div className="bar-chart__track">
                <div className="bar-chart__fill" style={{ width: `${Math.max(4, pct)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
