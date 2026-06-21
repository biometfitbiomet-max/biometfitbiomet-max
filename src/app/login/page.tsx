'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (email === 'admin@biometfit.com' && password === 'admin123') {
        localStorage.setItem('admin_authenticated', 'true');
        router.push('/dashboard');
      } else {
        setError('Credențiale invalide');
      }
    } catch (err) {
      setError('Autentificare eșuată');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a192f]">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#64ffda]/10 mb-4">
            <svg className="w-8 h-8 text-[#64ffda]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">BiometFit</h1>
          <p className="text-[#8892b0] mt-1">Panou de administrare</p>
        </div>

        <div className="bg-[#172a45] rounded-2xl shadow-xl border border-[#233554] p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[#8892b0] text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a192f] text-white rounded-xl border border-[#233554] focus:border-[#64ffda] focus:outline-none focus:ring-1 focus:ring-[#64ffda] transition-colors"
                placeholder="admin@biometfit.com"
                required
              />
            </div>
            <div>
              <label className="block text-[#8892b0] text-sm font-medium mb-2">Parolă</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a192f] text-white rounded-xl border border-[#233554] focus:border-[#64ffda] focus:outline-none focus:ring-1 focus:ring-[#64ffda] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-2 border border-red-400/20">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#64ffda] hover:bg-[#64ffda]/90 text-[#0a192f] font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Se încarcă...' : 'Autentificare'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@biometfit.com');
                setPassword('admin123');
              }}
              className="w-full text-[#8892b0] text-sm hover:text-[#64ffda] transition-colors py-2"
            >
              Completare automată credențiale test
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
