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
  Registered: "bg-slate-100 text-slate-700 ring-slate-200",
  "PR Raised": "bg-sky-100 text-sky-700 ring-sky-200",
  "Under Review": "bg-blue-100 text-blue-700 ring-blue-200",
  "Changes Requested": "bg-amber-100 text-amber-800 ring-amber-200",
  "Re-submitted": "bg-violet-100 text-violet-700 ring-violet-200",
  Approved: "bg-teal-100 text-teal-700 ring-teal-200",
  Merged: "bg-green-100 text-green-700 ring-green-200",
  "Closed/Rejected": "bg-red-100 text-red-700 ring-red-200",
};

export const ROLES = ["student", "mentor", "admin"];
