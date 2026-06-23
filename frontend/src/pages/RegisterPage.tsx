import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    try {
      await register(email, password);
      navigate("/");
    } catch (err: any) {
      if (err?.response) {
        setError(err.response.data?.detail || `Server error ${err.response.status}`);
      } else if (err?.request) {
        setError(
          `Cannot reach server — check VITE_API_BASE (currently: ${import.meta.env.VITE_API_BASE || "not set, using localhost:8000"})`
        );
      } else {
        setError(err?.message || "Registration failed.");
      }
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
          <h1 className="text-2xl font-bold text-fog">Create account</h1>
          <p className="text-fog-muted text-sm mt-1">
            Already registered?{" "}
            <Link to="/login" className="text-accent hover:underline underline-offset-2">
              Sign in
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

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-fog-muted mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              className={inputCls}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full clip-notch bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-bold py-3.5 hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? "Creating account…" : (<>Create account <ArrowRight size={13} /></>)}
          </button>
        </form>

        <p className="font-mono text-[10px] text-fog-muted text-center leading-relaxed">
          By creating an account you agree to our terms of service.
          10 free PR analyses per month, no card required.
        </p>
      </div>
    </div>
  );
}
