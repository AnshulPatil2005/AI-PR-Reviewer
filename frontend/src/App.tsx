import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Always dark — outer pages still receive darkMode=true via context for backward compat
const darkMode = true;

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-bg text-fog">
      {/* ── Nav shell ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-dashed border-border bg-bg/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 group">
              <span className="font-display font-bold text-[17px] text-fog-dim group-hover:text-fog transition-colors tracking-tight">
                AI PR
              </span>
              <span className="font-display font-bold text-[17px] text-accent text-glow tracking-tight">
                Copilot
              </span>
            </Link>

            {/* Right nav */}
            <nav className="flex items-center gap-5">
              {user ? (
                <>
                  <Link
                    to="/history"
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog-muted hover:text-fog transition-colors"
                  >
                    History
                  </Link>
                  <Link
                    to="/repos"
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog-muted hover:text-fog transition-colors"
                  >
                    Analytics
                  </Link>

                  {/* Quota badge */}
                  {user.monthly_quota > 0 && (
                    <span
                      title={`Resets ${user.quota_resets_on ?? "next month"}`}
                      className={`hidden sm:inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-dashed ${
                        user.analyses_this_month >= user.monthly_quota
                          ? "border-red-500/40 text-red-400 bg-red-500/10"
                          : user.analyses_this_month >= user.monthly_quota * 0.8
                          ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                          : "border-accent/30 text-accent bg-accent/5"
                      }`}
                    >
                      {user.analyses_this_month}/{user.monthly_quota}
                    </span>
                  )}

                  <span className="hidden sm:block font-mono text-[9px] text-fog-muted truncate max-w-[160px]">
                    {user.email}
                  </span>

                  <button
                    onClick={handleLogout}
                    className="clip-notch-sm border border-dashed border-border text-fog-muted font-mono text-[10px] uppercase tracking-[0.14em] px-3 py-1.5 hover:border-accent/40 hover:text-fog transition-all"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog-muted hover:text-fog transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="clip-notch-sm bg-accent text-bg font-mono text-[10px] uppercase tracking-[0.14em] font-semibold px-4 py-2 hover:shadow-glow-sm transition-shadow"
                  >
                    Get started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* ── Page outlet ───────────────────────────────────────── */}
      <main>
        <Outlet context={{ darkMode }} />
      </main>
    </div>
  );
}
