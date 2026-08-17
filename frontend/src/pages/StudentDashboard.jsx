import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createPullRequest,
  getGithubAuthorizeUrl,
  listPullRequests,
  syncGithubPullRequests,
} from "../api";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/PageShell";
import PRForm from "../components/PRForm";
import PRCard from "../components/PRCard";
import PRDetailModal from "../components/PRDetailModal";
import Modal from "../components/Modal";
import EmptyPRsIllustration from "../components/EmptyPRsIllustration";
import StatTile from "../components/StatTile";

const EMPTY_STATE_PHOTO =
  "https://media.istockphoto.com/id/1020834246/photo/html-and-css-code-developing-screenshot.jpg?s=1024x1024&w=is&k=20&c=ApfbIsrROrLyi5R-iSwvL5b8z75F4BKVICD3Hiqa8ZQ=";

export default function StudentDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedPr, setSelectedPr] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await listPullRequests();
      setPrs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // GitHub redirects back to /dashboard?github=connected|error after OAuth.
  useEffect(() => {
    const githubStatus = searchParams.get("github");
    if (!githubStatus) return;

    if (githubStatus === "connected") {
      setNotice('GitHub connected. Click "Sync Now" to pull in your pull requests.');
      refreshProfile();
    } else if (githubStatus === "error") {
      setError("Could not connect your GitHub account. Please try again.");
    }

    searchParams.delete("github");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleCreate(payload) {
    await createPullRequest(payload);
    await refresh();
  }

  async function handleConnectGithub() {
    setConnecting(true);
    setError("");
    try {
      const { authorize_url: authorizeUrl } = await getGithubAuthorizeUrl();
      window.location.href = authorizeUrl;
    } catch (err) {
      setError(err.message);
      setConnecting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError("");
    setNotice("");
    try {
      const summary = await syncGithubPullRequests();
      setNotice(
        `Synced ${summary.fetched} PR${summary.fetched === 1 ? "" : "s"} from GitHub ` +
          `(${summary.created} new, ${summary.updated} updated).`
      );
      await Promise.all([refresh(), refreshProfile()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  const total = prs.length;
  const merged = prs.filter((pr) => pr.stage === "Merged").length;
  const inProgress = prs.filter(
    (pr) => pr.stage !== "Merged" && pr.stage !== "Closed/Rejected"
  ).length;
  const mergeRate = total ? Math.round((merged / total) * 100) : 0;

  return (
    <PageShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-paper">My Pull Requests</h1>
          <p className="mt-1 text-sm text-muted">
            Track every PR you've raised and where it stands.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {profile?.github_connected ? (
            <button onClick={handleSync} disabled={syncing} className="btn-secondary">
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          ) : (
            <button onClick={handleConnectGithub} disabled={connecting} className="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              {connecting ? "Redirecting..." : "Connect GitHub"}
            </button>
          )}

          <button onClick={() => setShowForm(true)} className="btn-primary w-fit">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add PR
          </button>
        </div>
      </div>

      {profile?.github_connected && (
        <p className="mt-2 font-mono text-xs text-muted">
          connected as @{profile.github_username}
          {profile.last_synced_at &&
            ` · last synced ${new Date(profile.last_synced_at).toLocaleString()}`}
        </p>
      )}

      {notice && (
        <p className="mt-4 rounded-lg border border-grow/30 bg-grow/10 px-3 py-2 text-sm text-grow">
          {notice}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
          {error}
        </p>
      )}

      {!loading && total > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Total PRs"
            value={total}
            accent="signal"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-5 w-5">
                <circle cx="4" cy="3.2" r="1.6" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="4" cy="12.8" r="1.6" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="12" cy="12.8" r="1.6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 4.8V11.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M12 11.2V8a3 3 0 0 0-3-3H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            }
          />
          <StatTile
            label="Merged"
            value={merged}
            accent="grow"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-5 w-5">
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatTile
            label="In progress"
            value={inProgress}
            accent="pulse"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-5 w-5">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 4.8V8l2.4 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatTile
            label="Merge rate"
            value={`${mergeRate}%`}
            accent="violet"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-5 w-5">
                <path d="M2.5 12.5v-3M6.5 12.5v-6M10.5 12.5v-4M14 12.5V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-strong border-t-signal" />
            Loading...
          </div>
        ) : prs.length === 0 ? (
          <div className="card relative flex flex-col items-center overflow-hidden border-dashed px-6 py-16 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.12]"
              style={{ backgroundImage: `url(${EMPTY_STATE_PHOTO})` }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 20%, transparent, var(--color-panel) 70%), linear-gradient(180deg, transparent 40%, var(--color-panel) 100%)",
              }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <EmptyPRsIllustration />
              <p className="mt-4 text-sm font-medium text-paper">No pull requests yet.</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Connect GitHub to auto-sync your PRs, or add one manually to
                start tracking your progress.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-sm font-medium text-signal-soft hover:text-violet"
              >
                Add your first one
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prs.map((pr) => (
              <PRCard key={pr.id} pr={pr} onClick={() => setSelectedPr(pr)} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal title="Add a pull request" onClose={() => setShowForm(false)}>
          <PRForm onCreate={handleCreate} onDone={() => setShowForm(false)} />
        </Modal>
      )}

      {selectedPr && (
        <PRDetailModal
          pr={selectedPr}
          canGiveFeedback={false}
          onClose={() => setSelectedPr(null)}
        />
      )}
    </PageShell>
  );
}
