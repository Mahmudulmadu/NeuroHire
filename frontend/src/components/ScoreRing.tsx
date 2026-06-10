interface ScoreRingProps {
  label: string
  value: number
  helper: string
}

export function ScoreRing({ label, value, helper }: ScoreRingProps) {
  const boundedValue = Math.max(0, Math.min(100, value))
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (boundedValue / 100) * circumference
  const gradientId = `ring-gradient-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="score-ring">
      <svg viewBox="0 0 140 140" className="score-ring__svg" role="img" aria-label={`${label} ${boundedValue}%`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#d97757" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={radius} className="score-ring__track" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          className="score-ring__progress"
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="score-ring__content">
        <div>
          <span className="score-ring__value">{Math.round(boundedValue)}</span>
          <span className="score-ring__percent">%</span>
        </div>
        <strong>{label}</strong>
        <p>{helper}</p>
      </div>
    </div>
  )
}