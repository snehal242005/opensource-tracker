import Logo from "./Logo";
import PipelineRail from "./PipelineRail";

const PHOTOS = {
  login:
    "https://images.unsplash.com/photo-1654277041218-84424c78f0ae?q=80&w=1162&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  signup:
    "https://plus.unsplash.com/premium_photo-1769163494147-f1af6bd308a5?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

const FEATURES = [
  { label: "GitHub auto-sync", dot: "bg-signal" },
  { label: "Mentor feedback", dot: "bg-pulse" },
  { label: "Merge tracking", dot: "bg-grow" },
];

export default function AuthIllustration({ variant = "login" }) {
  const photo = PHOTOS[variant] || PHOTOS.login;

  return (
    <div className="surface-glow relative hidden overflow-hidden rounded-3xl border border-line bg-panel p-10 lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${photo})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, rgba(10,13,18,0.95) 0%, rgba(10,13,18,0.86) 34%, rgba(15,18,26,0.62) 66%, rgba(10,13,18,0.92) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay"
        style={{
          background:
            "radial-gradient(circle at 12% 8%, rgba(108,99,255,0.55), transparent 45%), radial-gradient(circle at 92% 96%, rgba(47,230,165,0.35), transparent 48%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10">
        <Logo className="h-10 w-10" />
        <h2 className="mt-8 font-heading text-3xl font-semibold leading-[1.15] text-paper">
          Track every contribution,
          <br />
          <span className="text-signal-soft">one PR at a time.</span>
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/75">
          Log pull requests, sync automatically from GitHub, and watch your
          open source journey move from <span className="font-mono text-paper">raised</span> to{" "}
          <span className="font-mono text-grow">merged</span>.
        </p>
      </div>

      <div className="relative z-10 mt-10 rounded-2xl border border-white/10 bg-ink/55 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Pipeline stages
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-grow">
            <span
              className="h-1.5 w-1.5 rounded-full bg-grow"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
            live
          </span>
        </div>

        <PipelineRail className="mt-5" />

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex flex-col gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${f.dot}`} />
              <span className="text-[11px] leading-snug text-muted">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
