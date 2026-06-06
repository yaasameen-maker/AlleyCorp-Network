interface SuggestedActionCardProps {
  action: string;
}

export function SuggestedActionCard({ action }: SuggestedActionCardProps) {
  return (
    <div className="bg-paper border border-line rounded-xl p-4 animate-fade-in-up">
      <h3 className="mb-2 text-ink text-sm font-semibold uppercase tracking-wide">
        Suggested action
      </h3>
      <p className="text-ink text-sm sm:text-base leading-relaxed">{action}</p>
    </div>
  );
}
