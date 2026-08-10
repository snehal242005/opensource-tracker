const STAGES = [
  { label: "PR Raised", short: "Raised", glow: "#6C63FF" },
  { label: "Under Review", short: "Review", glow: "#B490FF" },
  { label: "Changes Requested", short: "Changes", glow: "#FFB454" },
  { label: "Approved", short: "Approved", glow: "#2FE6A5" },
  { label: "Merged", short: "Merged", glow: "#2FE6A5" },
];

const DURATION = 7;

export default function PipelineRail({ compact = false, className = "" }) {
  const n = STAGES.length;
  const edgeOffset = 50 / n;

  return (
    <div className={className}>
      <div className="relative" style={{ height: compact ? 20 : 24 }}>
        <div
          className="absolute top-1/2 h-px -translate-y-1/2 opacity-40"
          style={{
            left: `${edgeOffset}%`,
            right: `${edgeOffset}%`,
            background: "linear-gradient(90deg, #6C63FF, #B490FF 35%, #FFB454 60%, #2FE6A5)",
          }}
        />
        <div
          className="absolute top-1/2"
          style={{ left: `${edgeOffset}%`, right: `${edgeOffset}%` }}
        >
          <span
            className="pipeline-runner absolute top-1/2 rounded-full"
            style={{ animationDuration: `${DURATION}s` }}
          />
        </div>

        <div className="relative flex h-full items-center justify-between">
          {STAGES.map((s, i) => (
            <span
              key={s.label}
              className="pipeline-node rounded-full"
              style={{
                "--glow": s.glow,
                width: compact ? 8 : 10,
                height: compact ? 8 : 10,
                background: s.glow,
                animationDelay: `${(i / (n - 1)) * DURATION}s`,
                animationDuration: `${DURATION}s`,
                boxShadow: i === n - 1 ? `0 0 10px 2px ${s.glow}99` : "none",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex justify-between">
        {STAGES.map((s) => (
          <span
            key={s.label}
            className="w-0 flex-1 text-center font-mono text-[9.5px] uppercase tracking-wide text-muted first:text-left last:text-right"
          >
            <span className={compact ? "hidden sm:inline" : "inline"}>{s.label}</span>
            <span className={compact ? "sm:hidden" : "hidden"}>{s.short}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
