interface SuggestionCardProps {
  suggestion: string;
  index: number;
}

export default function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  return (
    <div className="border border-dashed border-border bg-surface p-4 text-sm">
      <div className="flex items-start gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent shrink-0 mt-0.5">
          [{String(index).padStart(2, "0")}]
        </span>
        <p className="text-fog-dim leading-relaxed">{suggestion}</p>
      </div>
    </div>
  );
}
