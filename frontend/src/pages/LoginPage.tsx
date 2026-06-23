import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed. Check your credentials.");
    }
  };

  const inputCls =
    "w-full bg-bg border border-dashed border-border text-fog font-mono text-sm px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors placeholder:text-fog-muted";

  return (
    <div className="grid-bg min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-dashed border-border bg-surface p-8 space-y-6">
        {/* Header */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-2">
            AI PR Copilot
          </p>
          <h1 className="text-2xl font-bold text-fog">Sign in</h1>
          <p className="text-fog-muted text-sm mt-1">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-accent hover:underline underline-offset-2">
              Register free
            </Link>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="border border-dashed border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 font-mono">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-fog-muted mb-2">
              Email
            </label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-fog-muted mb-2">
              Password
            </label>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full clip-notch bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-bold py-3.5 hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? "Signing in…" : (<>Sign in <ArrowRight size={13} /></>)}
          </button>
        </form>
      </div>
    </div>
  );
}
