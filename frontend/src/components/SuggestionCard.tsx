interface SuggestionCardProps {
  suggestion: string;
  index: number;
  darkMode: boolean;
}

export default function SuggestionCard({ suggestion, index, darkMode }: SuggestionCardProps) {
  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border text-sm ${
        darkMode
          ? "bg-slate-800 border-slate-700 text-slate-200"
          : "bg-slate-50 border-slate-200 text-slate-800"
      }`}
    >
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
        {index}
      </span>
      <p>{suggestion}</p>
    </div>
  );
}
