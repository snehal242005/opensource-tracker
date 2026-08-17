import { useState } from "react";
import PRCard from "./PRCard";

export default function StudentGroup({ student, prs, onSelectPr }) {
  const [open, setOpen] = useState(true);
  const merged = prs.filter((pr) => pr.stage === "Merged").length;
  const details = [student?.roll_number, student?.college_name, student?.year].filter(Boolean).join(" · ");

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-panel-2"
      >
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold text-paper">
            {student?.name || "Unknown student"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">{details || "No profile details on file"}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="whitespace-nowrap text-xs text-muted">
            {prs.length} PR{prs.length === 1 ? "" : "s"} · {merged} merged
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-line px-4 py-4">
          {prs.length === 0 ? (
            <p className="text-sm text-muted">No pull requests yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {prs.map((pr) => (
                <PRCard key={pr.id} pr={pr} onClick={() => onSelectPr(pr)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
