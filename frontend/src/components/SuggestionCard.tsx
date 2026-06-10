interface SuggestionCardProps {
  suggestion: string;
  index: number;
  darkMode: boolean;
}

export default function SuggestionCard({ suggestion, index, darkMode }: SuggestionCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 text-sm ${
        darkMode ? "bg-slate-900/80 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
          {index}
        </span>
        <p className="font-medium leading-relaxed">{suggestion}</p>
      </div>
    </div>
  );
}
