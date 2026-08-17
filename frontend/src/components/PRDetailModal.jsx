import { useEffect, useState } from "react";
import { createFeedback, listFeedbackForPR } from "../api";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";
import StageBadge from "./StageBadge";
import FormField, { inputClass } from "./FormField";

const STATUS_OPTIONS = [
  { value: "comment", label: "Comment only" },
  { value: "approve", label: "Approve" },
  { value: "request_changes", label: "Request changes" },
];

const STATUS_STYLES = {
  approve: "bg-grow/15 text-grow ring-1 ring-inset ring-grow/30",
  request_changes: "bg-coral/15 text-coral ring-1 ring-inset ring-coral/30",
  comment: "bg-signal/15 text-signal-soft ring-1 ring-inset ring-signal/30",
};

const STATUS_LABELS = {
  approve: "Approved",
  request_changes: "Changes requested",
  comment: "Comment",
};

// Groups a flat feedback list into threads: each top-level (parent_id null)
// entry plus every entry (at any depth) descended from it, flattened to one
// reply list -- simple enough to render without a recursive tree component.
function buildThreads(feedbackList) {
  const byId = Object.fromEntries(feedbackList.map((f) => [f.id, f]));
  function rootId(f) {
    let cur = f;
    while (cur.parent_id && byId[cur.parent_id]) cur = byId[cur.parent_id];
    return cur.id;
  }

  const roots = feedbackList.filter((f) => !f.parent_id);
  return roots
    .map((root) => ({
      root,
      replies: feedbackList
        .filter((f) => f.parent_id && f.id !== root.id && rootId(f) === root.id)
        .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || "")),
    }))
    .sort((a, b) => (a.root.created_at || "").localeCompare(b.root.created_at || ""));
}

export default function PRDetailModal({ pr, studentName, canGiveFeedback, onClose, onFeedbackAdded }) {
  const { profile } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [statusRec, setStatusRec] = useState("comment");
  const [submitting, setSubmitting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingId, setReplyingId] = useState(null);

  const canReply = profile?.role === "mentor" || profile?.role === "admin" || profile?.uid === pr.student_id;

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await listFeedbackForPR(pr.id);
      setThreads(buildThreads(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pr.id]);

  async function handleSubmitFeedback(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await createFeedback({ pr_id: pr.id, comment, status_recommendation: statusRec });
      setComment("");
      setStatusRec("comment");
      await refresh();
      onFeedbackAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(rootId) {
    const text = (replyDrafts[rootId] || "").trim();
    if (!text) return;
    setReplyingId(rootId);
    setError("");
    try {
      await createFeedback({ pr_id: pr.id, comment: text, parent_id: rootId });
      setReplyDrafts((d) => ({ ...d, [rootId]: "" }));
      await refresh();
      onFeedbackAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplyingId(null);
    }
  }

  return (
    <Modal title={pr.title} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-2">
        <StageBadge stage={pr.stage} />
        <p className="truncate font-mono text-xs text-muted">{pr.repo}</p>
        {studentName && <p className="text-xs text-muted">· {studentName}</p>}
      </div>

      <a
        href={pr.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-signal-soft hover:text-violet"
      >
        View on GitHub
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M4.25 5.5a.75.75 0 000 1.5h8.19l-3.72 3.72a.75.75 0 101.06 1.06l5-5a.75.75 0 000-1.06l-5-5a.75.75 0 00-1.06 1.06l3.72 3.72H4.25z"
            clipRule="evenodd"
          />
        </svg>
      </a>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="font-heading text-sm font-semibold text-paper">Feedback</h3>

        {loading ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-strong border-t-signal" />
            Loading...
          </div>
        ) : threads.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No feedback yet.</p>
        ) : (
          <div className="mt-3 flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
            {threads.map(({ root, replies }) => (
              <div key={root.id} className="rounded-lg border border-line bg-panel-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-paper">{root.author_name}</span>
                  {root.status_recommendation && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[root.status_recommendation]}`}>
                      {STATUS_LABELS[root.status_recommendation]}
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{root.comment}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {root.created_at ? new Date(root.created_at).toLocaleString() : ""}
                </p>

                {replies.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2 border-l-2 border-line pl-3">
                    {replies.map((r) => (
                      <div key={r.id}>
                        <span className="text-xs font-medium text-paper">{r.author_name}</span>
                        <p className="whitespace-pre-wrap text-sm text-muted">{r.comment}</p>
                        <p className="text-[11px] text-muted">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {canReply && (
                  <div className="mt-2 flex gap-2">
                    <input
                      className={`${inputClass} flex-1`}
                      placeholder="Reply..."
                      value={replyDrafts[root.id] || ""}
                      onChange={(e) => setReplyDrafts((d) => ({ ...d, [root.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleReply(root.id);
                      }}
                    />
                    <button
                      onClick={() => handleReply(root.id)}
                      disabled={replyingId === root.id}
                      className="btn-ghost !px-3"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {canGiveFeedback && (
        <form onSubmit={handleSubmitFeedback} className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
          <h3 className="font-heading text-sm font-semibold text-paper">Add feedback</h3>
          <FormField label="Comment">
            <textarea
              className={inputClass}
              rows={3}
              placeholder="Leave feedback for the student..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Status recommendation">
            <select className={inputClass} value={statusRec} onChange={(e) => setStatusRec(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Posting..." : "Post feedback"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>
      )}
    </Modal>
  );
}
