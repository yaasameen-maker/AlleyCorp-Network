interface ProfileJourneyStepsProps {
  activeStep: "score" | "why" | "history";
}

const STEPS = [
  { id: "score" as const, label: "Score" },
  { id: "why" as const, label: "Why" },
  { id: "history" as const, label: "History" },
];

export function ProfileJourneySteps({ activeStep }: ProfileJourneyStepsProps) {
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <nav aria-label="Profile journey" className="flex items-center gap-2">
      {STEPS.map((step, index) => {
        const isActive = step.id === activeStep;
        const isPast = index < activeIndex;
        return (
          <div key={step.id} className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <div
                className={`w-full h-1 rounded-full transition-colors ${
                  isActive ? "bg-ink" : isPast ? "bg-signal-green/60" : "bg-line"
                }`}
              />
              <span
                className={`text-[10px] font-medium uppercase tracking-wide ${
                  isActive ? "text-ink" : "text-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
