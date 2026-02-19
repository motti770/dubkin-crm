'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { User, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);   // triggers exit animation
  const [mounted, setMounted]     = useState(false);   // entrance animation

  // Entrance animation on mount
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
      // Trigger exit animation, then navigate
      setSuccess(true);
      setTimeout(() => router.push('/'), 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-gray-950 flex items-center justify-center px-4 overflow-hidden"
      dir="rtl"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)',
          transition: 'opacity 0.6s',
          opacity: success ? 0 : 1,
        }}
      />

      {/* Card */}
      <div
        className="w-full max-w-sm relative z-10"
        style={{
          opacity:   mounted && !success ? 1 : 0,
          transform: mounted && !success ? 'translateY(0) scale(1)' : success ? 'translateY(-24px) scale(0.97)' : 'translateY(24px) scale(0.97)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl font-black text-white tracking-tight mb-1">
            Dubkin<span className="text-blue-500">.</span>
          </div>
          <p className="text-gray-500 text-sm">כניסה לפלטפורמה</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-5"
        >
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 tracking-wide uppercase">
              שם משתמש
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="mordi"
              required
              autoComplete="username"
              autoFocus
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3
                         text-white placeholder-gray-600 focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 tracking-wide uppercase">
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3
                         text-white placeholder-gray-600 focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/60 border border-red-800/60 text-red-400 rounded-xl px-4 py-3 text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full relative overflow-hidden bg-blue-600 hover:bg-blue-500
                       disabled:opacity-60 text-white font-semibold py-3 rounded-xl
                       transition-all duration-200 text-sm tracking-wide
                       active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <span
              style={{
                opacity: loading || success ? 0 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              כניסה
            </span>
            {(loading || success) && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-gray-700 text-xs mt-6">גישה מורשית בלבד</p>
      </div>

      {/* Full-screen flash on success */}
      <div
        className="fixed inset-0 bg-gray-950 pointer-events-none z-20"
        style={{
          opacity: success ? 1 : 0,
          transition: 'opacity 0.4s ease 0.3s',
        }}
      />
    </div>
  );
}
