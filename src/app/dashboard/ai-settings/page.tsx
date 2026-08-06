'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AISettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [visionModel, setVisionModel] = useState('qwen/qwen3.6-27b');
  const [textModel, setTextModel] = useState('llama-3.3-70b-versatile');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/ai-settings');
      const data = await res.json();
      if (!data.error) {
        setApiKey(data.apiKeys?.[0] || '');
        setVisionModel(data.visionModel || 'qwen/qwen3.6-27b');
        setTextModel(data.textModel || 'llama-3.3-70b-versatile');
      }
    } catch (err) {
      console.error('Failed to fetch AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const apiKeys = apiKey.trim() ? [apiKey.trim()] : [];
      await fetch('/api/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys, visionModel, textModel }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save AI settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a192f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#64ffda] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8892b0] text-sm">Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a192f]">
      <header className="sticky top-0 z-10 bg-[#0a192f]/80 backdrop-blur-md border-b border-[#233554]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[#8892b0] hover:text-[#64ffda] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-white font-semibold text-lg">Setări AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Configurare Groq AI</h1>
          <p className="text-[#8892b0] text-sm">
            Key-ul și modelele sunt stocate în Firestore și sunt citite automat de aplicația mobilă.
          </p>
        </div>

        <form onSubmit={handleSave} className="bg-[#172a45] rounded-2xl p-6 border border-[#233554]">
          {/* API Key */}
          <div className="mb-6">
            <label className="block text-[#8892b0] text-sm mb-2">Groq API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-4 py-3 rounded-lg bg-[#0a192f] border border-[#233554] text-white placeholder-[#8892b0]/50 focus:outline-none focus:border-[#64ffda]/40 transition-colors font-mono text-sm"
            />
            <p className="text-[#8892b0]/60 text-xs mt-2">
              Obține key-ul de la <span className="text-[#64ffda]">console.groq.com/keys</span>
            </p>
          </div>

          {/* Vision Model */}
          <div className="mb-6">
            <label className="block text-[#8892b0] text-sm mb-2">Model Vision (imagini)</label>
            <select
              value={visionModel}
              onChange={(e) => setVisionModel(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40 transition-colors"
            >
              <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b</option>
            </select>
            <p className="text-[#8892b0]/60 text-xs mt-2">
              Folosit pentru: scanare mâncare, analiză analize medicale
            </p>
          </div>

          {/* Text Model */}
          <div className="mb-6">
            <label className="block text-[#8892b0] text-sm mb-2">Model Text (chat)</label>
            <select
              value={textModel}
              onChange={(e) => setTextModel(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40 transition-colors"
            >
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
              <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (mai rapid)</option>
              <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
              <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (mai rapid)</option>
            </select>
            <p className="text-[#8892b0]/60 text-xs mt-2">
              Folosit pentru: sugestii mese, chat nutriționist
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-[#64ffda] text-[#0a192f] font-medium hover:bg-[#64ffda]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 rounded-lg bg-[#233554] text-[#8892b0] font-medium hover:bg-[#233554]/80 transition-colors"
            >
              Înapoi
            </button>
            {saved && (
              <span className="text-[#64ffda] text-sm font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvat!
              </span>
            )}
          </div>
        </form>

        {/* Info box */}
        <div className="mt-6 bg-[#172a45]/50 rounded-xl p-4 border border-[#233554]/50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#64ffda] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-[#8892b0] text-sm space-y-1">
              <p>Setările sunt stocate în Firestore la <code className="text-[#64ffda] text-xs">config/groq_settings</code>.</p>
              <p>Aplicația mobilă citește automat aceste valori — fără update pe Google Play / App Store.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
