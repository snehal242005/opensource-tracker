export const PR_STAGES = [
  "Registered",
  "PR Raised",
  "Under Review",
  "Changes Requested",
  "Re-submitted",
  "Approved",
  "Merged",
  "Closed/Rejected",
];

// Tailwind pill classes per stage: bg/text/ring must share the same hue.
export const STAGE_STYLES = {
  Registered: "bg-panel-2 text-muted ring-line-strong",
  "PR Raised": "bg-signal/15 text-signal-soft ring-signal/30",
  "Under Review": "bg-violet/15 text-violet ring-violet/30",
  "Changes Requested": "bg-pulse/15 text-pulse ring-pulse/30",
  "Re-submitted": "bg-sky-400/15 text-sky-400 ring-sky-400/30",
  Approved: "bg-grow/10 text-grow ring-grow/25",
  Merged: "bg-grow/20 text-grow ring-grow/40",
  "Closed/Rejected": "bg-coral/15 text-coral ring-coral/30",
};

export const ROLES = ["student", "mentor", "admin"];
