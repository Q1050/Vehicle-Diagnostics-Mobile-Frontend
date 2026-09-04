export function SuggestionChips({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (value: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="shrink-0 rounded-full border border-primary/30 bg-surface-container-lowest px-4 py-2 text-label-md text-primary transition-colors hover:bg-primary/8"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
