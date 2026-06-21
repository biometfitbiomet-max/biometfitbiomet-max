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
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Email match:', email === 'admin@biometfit.com');
    console.log('Password match:', password === 'admin123');
    setError('');
    setLoading(true);

    try {
      // Simple admin check - in production, use Firebase Auth
      if (email === 'admin@biometfit.com' && password === 'admin123') {
        console.log('✓ Login successful - setting localStorage');
        localStorage.setItem('admin_authenticated', 'true');
        console.log('✓ localStorage set - redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('✗ Invalid credentials');
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('✗ Login error:', err);
      setError('Login failed');
    } finally {
      console.log('=== LOGIN ATTEMPT END ===');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          BiometFit Admin
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Loading...' : 'Login'}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setEmail('admin@biometfit.com');
              setPassword('admin123');
            }}
            className="w-full bg-gray-600 hover:bg-gray-700 mt-2"
          >
            Auto-fill Test Credentials
          </Button>
          <div className="text-gray-400 text-xs mt-2">
            Test: admin@biometfit.com / admin123
          </div>
        </form>
      </div>
    </div>
  );
}
