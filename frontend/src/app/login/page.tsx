'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(email, password);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-white tracking-tight">
            Dubkin <span className="text-blue-500">CRM</span>
          </div>
          <p className="text-gray-400 mt-2 text-sm">כניסה לפלטפורמה</p>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl space-y-5"
        >
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
                         text-white placeholder-gray-600 focus:outline-none focus:ring-2
                         focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
                         text-white placeholder-gray-600 focus:outline-none focus:ring-2
                         focus:ring-blue-500 text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-950 border border-red-800 text-red-400 rounded-lg px-4 py-2.5 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                       text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          גישה מורשית בלבד
        </p>
      </div>
    </div>
  );
}
