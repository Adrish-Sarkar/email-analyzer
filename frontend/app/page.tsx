'use client';
import { useState } from 'react';

interface AnalysisResults {
  score: number;
  hasPersonalization: boolean;
  flaggedWords: string[];
}

export default function Home() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      console.error("Error connecting to backend API", err);
      setError(err.message || "Failed to connect to backend API");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-lg p-6 border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Cold Email Health Analyzer</h1>
        <p className="text-sm text-slate-500 mb-6">Analyze email variations for high-volume delivery checks.</p>

        <textarea
          className="w-full h-48 p-4 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          placeholder="Paste your cold email copy here... Use templates tags like {{first_name}} to optimize scores."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-4 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Analyzing Content...' : 'Run Diagnostics'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && (
          <div className="mt-8 p-6 bg-slate-100 rounded-md border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Diagnostics Result</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-4 rounded shadow-sm">
                <span className="block text-xs text-slate-400 font-bold uppercase">Deliverability Score</span>
                <span className={`text-3xl font-extrabold ${results.score > 70 ? 'text-green-600' : 'text-red-500'}`}>
                  {results.score} / 100
                </span>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <span className="block text-xs text-slate-400 font-bold uppercase">Personalization Check</span>
                <span className={`text-lg font-bold ${results.hasPersonalization ? 'text-green-600' : 'text-amber-500'}`}>
                  {results.hasPersonalization ? '✓ Active Tags Found' : '✗ Missing {{merge_tags}}'}
                </span>
              </div>
            </div>

            {results.flaggedWords && results.flaggedWords.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">
                <strong>Spam Triggers Detected:</strong> {results.flaggedWords.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}