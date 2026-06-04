interface RiskGaugeProps {
  score: number;
}

function riskColor(score: number): string {
  if (score <= 33) return "#22c55e"; // green
  if (score <= 66) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function riskLabel(score: number): string {
  if (score <= 33) return "Low Risk";
  if (score <= 66) return "Medium Risk";
  return "High Risk";
}

export default function RiskGauge({ score }: RiskGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const color = riskColor(clampedScore);
  const label = riskLabel(clampedScore);

  // SVG arc parameters
  const r = 54;
  const cx = 70;
  const cy = 70;
  const circumference = Math.PI * r; // half circle
  const dash = (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>
          {clampedScore}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#94a3b8">
          / 100
        </text>
      </svg>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}
