import { STAGE_STYLES } from "../constants";

export default function StageBadge({ stage }) {
  const styles = STAGE_STYLES[stage] || "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {stage}
    </span>
  );
}
