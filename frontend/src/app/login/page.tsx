'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(username, password);
      setSuccess(true);
      setTimeout(() => router.push('/'), 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#e0f2fe] via-[#dbeafe] to-[#bfdbfe] flex items-center justify-center px-4 overflow-hidden font-display"
      dir="rtl"
    >
      {/* Card */}
      <div
        className="w-full max-w-sm relative z-10"
        style={{
          opacity: mounted && !success ? 1 : 0,
          transform: mounted && !success ? 'translateY(0) scale(1)' : success ? 'translateY(-24px) scale(0.97)' : 'translateY(24px) scale(0.97)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl font-extrabold text-slate-900 tracking-tight mb-1">
            Dobkin<span className="text-primary">.</span>
          </div>
          <p className="text-slate-500 text-sm">כניסה לפלטפורמה</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="glass-panel-dark rounded-2xl p-8 shadow-glass space-y-5"
        >
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 tracking-wide uppercase">
              שם משתמש
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="mordi"
                required
                autoComplete="username"
                autoFocus
                className="w-full bg-white/60 border border-slate-200 rounded-xl px-4 py-3 pr-10
                           text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2
                           focus:ring-primary/30 focus:border-primary/50 text-sm transition-all"
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">person</span>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 tracking-wide uppercase">
              סיסמה
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-white/60 border border-slate-200 rounded-xl px-4 py-3 pr-10
                           text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2
                           focus:ring-primary/30 focus:border-primary/50 text-sm transition-all"
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full relative overflow-hidden bg-primary hover:bg-blue-600
                       disabled:opacity-60 text-white font-semibold py-3 rounded-xl
                       transition-all duration-200 text-sm tracking-wide
                       active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40
                       shadow-lg shadow-blue-500/25"
          >
            <span style={{ opacity: loading || success ? 0 : 1, transition: 'opacity 0.2s' }}>
              כניסה
            </span>
            {(loading || success) && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs mt-6">גישה מורשית בלבד</p>
      </div>

      {/* Full-screen flash on success */}
      <div
        className="fixed inset-0 bg-white pointer-events-none z-20"
        style={{
          opacity: success ? 1 : 0,
          transition: 'opacity 0.4s ease 0.3s',
        }}
      />
    </div>
  );
}
