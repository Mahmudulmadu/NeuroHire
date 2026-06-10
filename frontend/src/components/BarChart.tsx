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
    <div className="chart-card">
      <div className="section-heading">
        <span>Visualization</span>
        <h3>{title}</h3>
      </div>
      <div className="bar-chart">
        {items.map((item) => {
          const percent = item.maxValue === 0 ? 0 : (item.value / item.maxValue) * 100

          return (
            <div key={item.label} className="bar-chart__row">
              <div className="bar-chart__meta">
                <strong>{item.label}</strong>
                <span>
                  {item.value.toFixed(1)} / {item.maxValue}
                </span>
              </div>
              <div className="bar-chart__track">
                <div className="bar-chart__fill" style={{ width: `${Math.max(8, percent)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}