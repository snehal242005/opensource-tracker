import StageBadge from "./StageBadge";

export default function PRCard({ pr }) {
  const isAuto = pr.source === "auto";
  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 shadow-[0_1px_0_rgba(255,255,255,0.02)_inset] transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_16px_32px_-16px_rgba(108,99,255,0.35)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold leading-snug text-paper">{pr.title}</h3>
        <StageBadge stage={pr.stage} />
      </div>

      <div className="flex items-center gap-2">
        <p className="truncate font-mono text-xs text-muted">{pr.repo}</p>
        <span
          title={isAuto ? "Synced automatically from GitHub" : "Added manually"}
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isAuto
              ? "bg-signal/15 text-signal-soft ring-1 ring-inset ring-signal/30"
              : "bg-panel-2 text-muted ring-1 ring-inset ring-line-strong"
          }`}
        >
          {isAuto ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          ) : null}
          {isAuto ? "GitHub sync" : "Manual"}
        </span>
      </div>

      <a
        href={pr.url}
        target="_blank"
        rel="noreferrer"
        className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-signal-soft transition group-hover:gap-1.5 hover:text-violet"
      >
        View pull request
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M4.25 5.5a.75.75 0 000 1.5h8.19l-3.72 3.72a.75.75 0 101.06 1.06l5-5a.75.75 0 000-1.06l-5-5a.75.75 0 00-1.06 1.06l3.72 3.72H4.25z"
            clipRule="evenodd"
          />
        </svg>
      </a>
    </div>
  );
}
