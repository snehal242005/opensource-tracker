import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";

const ROLE_STYLES = {
  student: "bg-signal/15 text-signal-soft ring-1 ring-inset ring-signal/30",
  mentor: "bg-grow/15 text-grow ring-1 ring-inset ring-grow/30",
  admin: "bg-violet/15 text-violet ring-1 ring-inset ring-violet/30",
};

export default function Header() {
  const { profile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-heading text-lg font-semibold text-paper">
            OpenSource<span className="text-signal-soft"> Hub</span>
          </span>
        </div>

        {profile && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm font-medium text-paper">{profile.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  ROLE_STYLES[profile.role] || "bg-panel-2 text-muted"
                }`}
              >
                {profile.role}
              </span>
            </div>
            <NotificationBell />
            <button onClick={logout} className="btn-secondary !px-3 !py-1.5">
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
