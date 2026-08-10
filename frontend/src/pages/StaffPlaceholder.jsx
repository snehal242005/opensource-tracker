import { useAuth } from "../context/AuthContext";
import PageShell from "../components/PageShell";

export default function StaffPlaceholder() {
  const { profile } = useAuth();
  const roleLabel = profile?.role === "admin" ? "Admin" : "Mentor";

  return (
    <PageShell>
      <h1 className="font-heading text-2xl font-semibold text-paper">{roleLabel} Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Welcome, {profile?.name}.</p>

      <div className="card mt-6 flex flex-col items-center gap-3 border-dashed px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/15 text-signal-soft">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="font-heading text-lg font-semibold text-paper">Coming soon</h2>
        <p className="max-w-sm text-sm text-muted">
          The {roleLabel.toLowerCase()} dashboard — reviewing student PRs, leaving feedback, and
          managing the program — is on the way in a later phase.
        </p>
      </div>
    </PageShell>
  );
}
