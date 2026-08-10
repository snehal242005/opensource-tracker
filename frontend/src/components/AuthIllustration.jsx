import Logo from "./Logo";
import PipelineRail from "./PipelineRail";

export default function AuthIllustration() {
  return (
    <div className="surface-glow relative hidden overflow-hidden rounded-3xl border border-line bg-panel p-10 lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-signal/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-grow/10 blur-3xl" />

      <div className="relative z-10">
        <Logo className="h-10 w-10" />
        <h2 className="mt-8 font-heading text-3xl font-semibold leading-[1.15] text-paper">
          Track every contribution,
          <br />
          <span className="text-signal-soft">one PR at a time.</span>
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
          Log pull requests, sync automatically from GitHub, and watch your
          open source journey move from <span className="font-mono text-paper">raised</span> to{" "}
          <span className="font-mono text-grow">merged</span>.
        </p>
      </div>

      <div className="relative z-10 mt-10 rounded-2xl border border-line-strong bg-panel-2/60 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Live pipeline
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-grow">
            <span className="h-1.5 w-1.5 rounded-full bg-grow" style={{ animation: "pulse 2s ease-in-out infinite" }} />
            tracking
          </span>
        </div>

        <PipelineRail className="mt-5" />

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4">
          <div>
            <p className="font-mono text-lg font-semibold text-paper">128</p>
            <p className="text-[11px] text-muted">PRs raised</p>
          </div>
          <div>
            <p className="font-mono text-lg font-semibold text-pulse">34</p>
            <p className="text-[11px] text-muted">In review</p>
          </div>
          <div>
            <p className="font-mono text-lg font-semibold text-grow">86</p>
            <p className="text-[11px] text-muted">Merged</p>
          </div>
        </div>
      </div>
    </div>
  );
}
