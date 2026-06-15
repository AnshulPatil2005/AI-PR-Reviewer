import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-100"
          : "bg-gradient-to-br from-slate-50 to-slate-100 text-gray-900"
      }`}
    >
      {/* Header / Nav */}
      <header
        className={`sticky top-0 z-10 border-b px-4 py-3 flex items-center justify-between ${
          darkMode
            ? "bg-slate-900/80 border-slate-700 backdrop-blur-sm"
            : "bg-white/80 border-slate-200 backdrop-blur-sm"
        }`}
      >
        <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
          Agentic PR Copilot
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/history"
                className={`text-sm font-medium hover:text-blue-500 transition ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                History
              </Link>
              <Link
                to="/repos"
                className={`text-sm font-medium hover:text-blue-500 transition ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Repo Analytics
              </Link>
              {/* Quota badge */}
              {user.monthly_quota > 0 && (
                <span
                  title={`Resets ${user.quota_resets_on ?? "next month"}`}
                  className={`hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.analyses_this_month >= user.monthly_quota
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                      : user.analyses_this_month >= user.monthly_quota * 0.8
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                  }`}
                >
                  {user.analyses_this_month}/{user.monthly_quota} this month
                </span>
              )}
              <span className={`text-xs hidden sm:block ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`text-sm font-medium hover:text-blue-500 transition ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                Register
              </Link>
            </>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition text-base"
            title="Toggle theme"
          >
            {darkMode ? "🌞" : "🌙"}
          </button>
        </nav>
      </header>

      {/* Page content */}
      <main>
        <Outlet context={{ darkMode }} />
      </main>
    </div>
  );
}
