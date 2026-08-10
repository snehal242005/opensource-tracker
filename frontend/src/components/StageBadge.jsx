import { STAGE_STYLES } from "../constants";

export default function StageBadge({ stage }) {
  const styles = STAGE_STYLES[stage] || "bg-panel-2 text-muted ring-line-strong";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {stage}
    </span>
  );
}
