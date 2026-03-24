/**
 * Progress Ring Component - Circular progress indicator
 * Used for remaining life gauge
 */

interface ProgressRingProps {
  percentage: number // 0-100
  color: 'green' | 'amber' | 'red'
  size?: number
  strokeWidth?: number
}

export function ProgressRing({
  percentage,
  color,
  size = 120,
  strokeWidth = 8
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference
  
  const colorMap = {
    green: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444'
  }
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colorMap[color]}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  )
}
