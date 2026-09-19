import { useState } from "react";
import { login, register } from "../api/client";
export default function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "register") {
        await register(email, password);
      }
      await login(email, password);
      onAuthenticated();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full">
      {" "}
      <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-6">
        {mode === "login" ? "Welcome Back" : "Create an Account"}
      </h3>{" "}
      <form className="space-y-4" onSubmit={submit}>
        {" "}
        <div>
          {" "}
          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Email address
          </label>{" "}
          <input
            type="email"
            required
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Password
          </label>{" "}
          <input
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />{" "}
        </div>{" "}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {" "}
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              {" "}
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>{" "}
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>{" "}
            </svg>
          )}{" "}
          {loading
            ? "Authenticating..."
            : mode === "login"
              ? "Sign In"
              : "Register & Sign In"}{" "}
        </button>{" "}
      </form>{" "}
      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-500/30">
          {" "}
          {error}{" "}
        </div>
      )}{" "}
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-zinc-400 ">
        {" "}
        {mode === "login"
          ? "Don't have an account? "
          : "Already registered? "}{" "}
        <button
          type="button"
          className="text-indigo-600 font-medium hover:text-indigo-500 hover:underline transition-all"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {" "}
          {mode === "login" ? "Create one" : "Sign in"}{" "}
        </button>{" "}
      </p>{" "}
    </div>
  );
}
