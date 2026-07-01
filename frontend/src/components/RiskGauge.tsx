interface RiskGaugeProps {
  score: number;
}

function riskColor(score: number): string {
  if (score <= 33) return "#00e676";
  if (score <= 66) return "#eab308";
  return "#ef4444";
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

  const r = 54;
  const cx = 70;
  const cy = 70;
  const circumference = Math.PI * r;
  const dash = (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="10"
          strokeLinecap="butt"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="butt"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="bold" fill={color} fontFamily="monospace">
          {clampedScore}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#55554e" fontFamily="monospace">
          / 100
        </text>
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color }}>{label}</span>
    </div>
  );
}
