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
import Modal from "../components/Modal";

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

  return (
    <PageShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Pull Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track every PR you've raised and where it stands.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {profile?.github_connected ? (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          ) : (
            <button
              onClick={handleConnectGithub}
              disabled={connecting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              {connecting ? "Redirecting..." : "Connect GitHub"}
            </button>
          )}

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add PR
          </button>
        </div>
      </div>

      {profile?.github_connected && (
        <p className="mt-2 text-xs text-slate-400">
          Connected as GitHub @{profile.github_username}
          {profile.last_synced_at &&
            ` · last synced ${new Date(profile.last_synced_at).toLocaleString()}`}
        </p>
      )}

      {notice && (
        <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">{notice}</p>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : prs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-sm text-slate-500">No pull requests yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Add your first one
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prs.map((pr) => (
              <PRCard key={pr.id} pr={pr} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal title="Add a pull request" onClose={() => setShowForm(false)}>
          <PRForm onCreate={handleCreate} onDone={() => setShowForm(false)} />
        </Modal>
      )}
    </PageShell>
  );
}
