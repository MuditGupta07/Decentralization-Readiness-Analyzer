import { useState } from 'react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Input } from './components/Input';
import { ReportView } from './components/ReportView';
import { analyzerService } from './services/analyzer';
import { githubService } from './services/github';

const PRELOADED_EXAMPLES = [
  { name: 'Firebase Chat (Risky)', url: 'https://github.com/firebase/quickstart-js' },
  { name: 'Redux Toolkit (Safe)', url: 'https://github.com/reduxjs/redux-toolkit' },
  { name: 'Supabase (Medium)', url: 'https://github.com/supabase/supabase' },
];

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  // Load token from localStorage if available
  const [token, setToken] = useState(() => localStorage.getItem('github_token') || '');

  // Set initial token in service if it exists
  if (token) {
    githubService.setToken(token);
  }

  const handleTokenChange = (t) => {
    setToken(t);
    localStorage.setItem('github_token', t);
    githubService.setToken(t);
  };

  const handleAnalyze = async (repoUrl) => {
    const targetUrl = repoUrl || url;
    if (!targetUrl) return;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzerService.analyzeRepo(targetUrl);
      setReport(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze repository. Check URL or Rate Limit.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setReport(null);
    setUrl('');
    setError(null);
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <header style={{ padding: '4rem 0 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }} className="text-gradient">
          Decentralization Readiness Analyzer
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Evaluate open-source projects for hidden centralization risks and unstoppability.
        </p>
      </header>
      
      <main>
        {report ? (
          <ReportView report={report} onReset={reset} />
        ) : (
          <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
               <button 
                 onClick={() => setShowSettings(!showSettings)}
                 style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
               >
                 {showSettings ? 'Hide Settings' : 'Add GitHub Token (Optional)'}
               </button>
            </div>

            {showSettings && (
              <Card style={{ marginBottom: '2rem', border: '1px solid var(--accent-warn)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: '600', color: 'var(--accent-warn)', fontSize: '0.9rem' }}>
                    GitHub Personal Access Token (PAT)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Required if you are hitting API rate limits (403 Errors).
                  </p>
                  <Input 
                    value={token} 
                    onChange={(e) => handleTokenChange(e.target.value)} 
                    placeholder="ghp_xxxxxxxxxxxx" 
                    type="password"
                  />
                </div>
              </Card>
            )}

            <Card style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  GitHub Repository URL
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Input 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)} 
                    placeholder="https://github.com/owner/repo" 
                  />
                  <Button onClick={() => handleAnalyze()} disabled={loading} style={{ minWidth: '120px' }}>
                    {loading ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
                {error && (
                  <div style={{ color: 'var(--accent-risk)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    ⚠ {error}
                  </div>
                )}
              </div>
            </Card>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                OR TRY AN EXAMPLE
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {PRELOADED_EXAMPLES.map((ex) => (
                  <Button 
                    key={ex.name} 
                    variant="outline" 
                    onClick={() => { setUrl(ex.url); handleAnalyze(ex.url); }}
                    disabled={loading}
                    style={{ fontSize: '0.9rem' }}
                  >
                    {ex.name}
                  </Button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Why use DRA?</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Card style={{ textAlign: 'left' }}>
                  <div style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>👁 Reveal Risks</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Find hidden API dependencies that could break your app.</div>
                </Card>
                <Card style={{ textAlign: 'left' }}>
                  <div style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>🛡 True Resilience</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Ensure your project can survive cloud outages.</div>
                </Card>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}

export default App
