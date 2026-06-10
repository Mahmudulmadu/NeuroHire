interface SparklineProps {
  points: number[]
}

export function Sparkline({ points }: SparklineProps) {
  if (points.length === 0) {
    return <div className="sparkline sparkline--empty">No history yet</div>
  }

  const width = 320
  const height = 100
  const max = Math.max(...points, 100)
  const min = Math.min(...points, 0)
  const range = Math.max(1, max - min)

  const polylinePoints = points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width
      const y = height - ((point - min) / range) * height

      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="sparkline">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="ATS history trend">
        <defs>
          <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#d97757" />
          </linearGradient>
        </defs>
        <polyline points={polylinePoints} fill="none" stroke="url(#sparkline-gradient)" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="sparkline__labels">
        <span>{Math.round(points[0])}</span>
        <span>{Math.round(points[points.length - 1])}</span>
      </div>
    </div>
  )
}