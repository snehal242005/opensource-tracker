const ACCENT_STYLES = {
  signal: "bg-signal/15 text-signal-soft",
  grow: "bg-grow/15 text-grow",
  pulse: "bg-pulse/15 text-pulse",
  violet: "bg-violet/15 text-violet",
};

export default function StatTile({ label, value, accent = "signal", icon }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          ACCENT_STYLES[accent] || ACCENT_STYLES.signal
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-xl font-semibold leading-none text-paper">{value}</p>
        <p className="mt-1 truncate text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
