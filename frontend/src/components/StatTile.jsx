const ACCENT_STYLES = {
  signal: "bg-signal/15 text-signal-soft ring-1 ring-inset ring-signal/25",
  grow: "bg-grow/15 text-grow ring-1 ring-inset ring-grow/25",
  pulse: "bg-pulse/15 text-pulse ring-1 ring-inset ring-pulse/25",
  violet: "bg-violet/15 text-violet ring-1 ring-inset ring-violet/25",
};

export default function StatTile({ label, value, accent = "signal", icon }) {
  return (
    <div className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_16px_32px_-18px_rgba(108,99,255,0.32)]">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          ACCENT_STYLES[accent] || ACCENT_STYLES.signal
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-xl font-semibold leading-none tabular-nums text-paper">{value}</p>
        <p className="mt-1.5 truncate text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
