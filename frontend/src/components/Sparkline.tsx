interface SparklineProps {
  points: number[]
}

export function Sparkline({ points }: SparklineProps) {
  if (points.length === 0) {
    return <div className="sparkline sparkline--empty">No history yet</div>
  }

  const w = 300
  const h = 70
  const max = Math.max(...points, 100)
  const min = Math.min(...points, 0)
  const range = Math.max(1, max - min)

  const line = points
    .map((p, i) => {
      const x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * w
      const y = h - ((p - min) / range) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="sparkline">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-label="Score trend">
        <defs>
          <linearGradient id="spark-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <polyline points={line} fill="none" stroke="url(#spark-grad)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="sparkline__labels">
        <span>{Math.round(points[0])}</span>
        <span>{Math.round(points[points.length - 1])}</span>
      </div>
    </div>
  )
}
