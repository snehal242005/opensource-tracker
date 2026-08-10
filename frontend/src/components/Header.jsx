import { useAuth } from "../context/AuthContext";

const ROLE_STYLES = {
  student: "bg-indigo-100 text-indigo-700",
  mentor: "bg-teal-100 text-teal-700",
  admin: "bg-violet-100 text-violet-700",
};

export default function Header() {
  const { profile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            OS
          </span>
          <span className="font-heading text-lg font-semibold text-slate-900">
            Open Source Tracker
          </span>
        </div>

        {profile && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm font-medium text-slate-700">{profile.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  ROLE_STYLES[profile.role] || "bg-slate-100 text-slate-700"
                }`}
              >
                {profile.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
