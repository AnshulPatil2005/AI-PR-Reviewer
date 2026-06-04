import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type OutletCtx = { darkMode: boolean };

export default function RegisterPage() {
  const { darkMode } = useOutletContext<OutletCtx>();
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    try {
      await register(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed.");
    }
  };

  const inputCls = `w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${
    darkMode
      ? "bg-slate-800 border-slate-700 focus:ring-blue-400 text-slate-100"
      : "bg-white border-slate-300 focus:ring-blue-500 text-slate-900"
  }`;

  return (
    <div className="flex items-center justify-center px-4 py-16">
      <div className={`w-full max-w-sm rounded-2xl shadow-xl p-8 border ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">Create Account</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input type="password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className={`mt-4 text-sm text-center ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
