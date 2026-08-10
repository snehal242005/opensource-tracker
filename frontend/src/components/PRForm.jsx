import { useState } from "react";
import { PR_STAGES } from "../constants";
import FormField, { inputClass } from "./FormField";

export default function PRForm({ onCreate, onDone }) {
  const [repo, setRepo] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState(PR_STAGES[0]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onCreate({ repo, url, title, stage });
      setRepo("");
      setUrl("");
      setTitle("");
      setStage(PR_STAGES[0]);
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Repository">
        <input
          className={inputClass}
          placeholder="owner/repo"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Pull request title">
        <input
          className={inputClass}
          placeholder="Fix flaky test in CI"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Pull request URL">
        <input
          className={inputClass}
          placeholder="https://github.com/owner/repo/pull/123"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Stage">
        <select className={inputClass} value={stage} onChange={(e) => setStage(e.target.value)}>
          {PR_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FormField>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Adding..." : "Add PR"}
        </button>
      </div>
    </form>
  );
}
