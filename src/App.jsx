import { useState } from 'react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Input } from './components/Input';
import { ReportView } from './components/ReportView';
import { analyzerService } from './services/analyzer';

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

  const handleAnalyze = async (repoUrl) => {
    const targetUrl = repoUrl || url;
    if (!targetUrl) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await analyzerService.analyzeRepo(targetUrl);
      setReport(result);
    } catch (err) {
      setError(err.message);
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
    <div className="container" style={{ padding: '2rem' }}>
      
      <main>
        {report ? (
          <ReportView report={report} onReset={reset} />
        ) : (
          <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
             <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', background: 'linear-gradient(to right, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
               Decentralization Readiness Analyzer
             </h1>
             <p style={{ color: 'var(--text-secondary)' }}>
               Evaluate the architectural resilience of any open source project.
             </p>
            </div>

            <Card style={{ marginBottom: '2rem' }}>
             <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-primary)' }}>
               <strong>Privacy First:</strong> This tool is 100% serverless and does not require GitHub authentication. Analysis is performed using public data only.
             </div>

             <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
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
