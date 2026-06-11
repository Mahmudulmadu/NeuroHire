interface ScoreRingProps {
  label: string
  value: number
  helper: string
}

export function ScoreRing({ label, value, helper }: ScoreRingProps) {
  const bounded = Math.max(0, Math.min(100, value))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (bounded / 100) * circumference
  const id = `ring-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="score-ring">
      <svg viewBox="0 0 100 100" className="score-ring__svg" aria-label={`${label} ${bounded}%`}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={radius} className="score-ring__track" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="score-ring__progress"
          stroke={`url(#${id})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring__content">
        <div>
          <span className="score-ring__value">{Math.round(bounded)}</span>
          <span className="score-ring__percent">%</span>
        </div>
        <strong>{label}</strong>
        <p>{helper}</p>
      </div>
    </div>
  )
}
