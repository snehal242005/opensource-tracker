import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { redirectForRole } from "../utils";
import AuthLayout from "../components/AuthLayout";
import FormField, { inputClass } from "../components/FormField";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      const snap = await getDoc(doc(db, "users", user.uid));
      const role = snap.exists() ? snap.data().role : null;
      redirectForRole(role, navigate);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-signal-soft hover:text-violet">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            placeholder="Your password"
            required
          />
        </FormField>

        {error && (
          <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full">
          {submitting ? "Logging in..." : "Log In"}
        </button>
      </form>
    </AuthLayout>
  );
}
