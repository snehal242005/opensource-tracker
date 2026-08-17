import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listPublicMentors } from "../api";
import { ROLES, YEAR_OPTIONS } from "../constants";
import { redirectForRole } from "../utils";
import AuthLayout from "../components/AuthLayout";
import FormField, { inputClass } from "../components/FormField";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [rollNumber, setRollNumber] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [year, setYear] = useState(YEAR_OPTIONS[0]);
  const [mentorId, setMentorId] = useState("");
  const [mentors, setMentors] = useState([]);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role !== "student") return;
    let cancelled = false;
    setMentorsLoading(true);
    listPublicMentors()
      .then((data) => {
        if (cancelled) return;
        setMentors(data);
        if (data.length > 0) setMentorId((current) => current || data[0].uid);
      })
      .catch(() => {
        if (!cancelled) setMentors([]);
      })
      .finally(() => {
        if (!cancelled) setMentorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup({ name, email, password, role, rollNumber, collegeName, year, mentorId });
      redirectForRole(role, navigate);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      variant="signup"
      title="Create your account"
      subtitle="Track your open source journey"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-signal-soft hover:text-violet">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            required
          />
        </FormField>

        <FormField label="Email">
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </FormField>

        <FormField label="Password">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
        </FormField>

        <FormField label="Role">
          <select
            className={inputClass}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </FormField>

        {role === "student" && (
          <>
            <FormField label="Roll number">
              <input
                className={inputClass}
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. CS21B045"
                required
              />
            </FormField>

            <FormField label="College name">
              <input
                className={inputClass}
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. IIT Bombay"
                required
              />
            </FormField>

            <FormField label="Year">
              <select className={inputClass} value={year} onChange={(e) => setYear(e.target.value)}>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Mentor">
              {mentorsLoading ? (
                <p className="text-sm text-muted">Loading mentors...</p>
              ) : mentors.length === 0 ? (
                <p className="rounded-lg border border-line-strong bg-panel-2 px-3 py-2 text-sm text-muted">
                  No mentors available yet. You can pick one later once a mentor has signed up.
                </p>
              ) : (
                <select className={inputClass} value={mentorId} onChange={(e) => setMentorId(e.target.value)}>
                  {mentors.map((m) => (
                    <option key={m.uid} value={m.uid}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </>
        )}

        {error && (
          <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full">
          {submitting ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </AuthLayout>
  );
}
