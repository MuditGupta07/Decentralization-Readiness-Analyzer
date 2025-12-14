import { useState } from 'react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Input } from './components/Input';
import { ReportView } from './components/ReportView';
import { analyzerService } from './services/analyzer';

const PRELOADED_EXAMPLES = [
  { name: 'Redux Toolkit', url: 'https://github.com/reduxjs/redux-toolkit' },
  { name: 'Supabase', url: 'https://github.com/supabase/supabase' },
];

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [mode, setMode] = useState('online'); // 'online' | 'offline'

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

  const handleLocalAnalyze = async () => {
      setLoading(true);
      setError(null);
      setReport(null);

      try {
          // 1. Prompt for directory
          if (!window.showDirectoryPicker) {
              throw new Error('Your browser does not support the File System Access API. Please use Chrome or Edge.');
          }
          const dirHandle = await window.showDirectoryPicker();
          
          // 2. Run analysis
          const result = await analyzerService.analyzeLocal(dirHandle);
          setReport(result);

      } catch (err) {
          if (err.name === 'AbortError') {
              // User cancelled
              console.log('User cancelled folder selection');
          } else {
              setError(err.message || 'Failed to access local folder');
          }
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
    <div className="container">
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '6rem',
        padding: '1.5rem 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <img src="/logo.png" alt="DecentraLens Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px var(--neon-glow-primary))' }} />
           <h1 style={{ fontSize: '1.25rem', letterSpacing: '0.1em', fontWeight: '400', color: 'var(--text-primary)', marginLeft: '0.5rem', textTransform: 'uppercase' }}>
             Decentra<strong style={{ color: 'var(--neon-primary)' }}>Lens</strong>
           </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', background: 'var(--neon-primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--neon-primary)' }}></span>
            CLIENT_SIDE_ONLY
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <span style={{ width: '6px', height: '6px', background: 'var(--neon-primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--neon-primary)' }}></span>
            NO_TOKENS_REQ
          </span>
        </div>
      </header>

      <main>
        {report ? (
          <ReportView report={report} onReset={reset} />
        ) : (
          <div className="fade-in-up" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            
            {/* Hero Text */}
            <div style={{ marginBottom: '4rem' }} className="animate-float">
             <h2 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
               <span className="text-gradient">Determinism.</span><br />
               <span className="text-gradient">Independence.</span><br />
               <span className="text-neon animate-pulse-glow">Truth.</span>
             </h2>
             <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.8' }}>
               Advanced static analysis to detect centralization bottlenecks.
             </p>
            </div>

            {/* Mode Switcher */}
             <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                 <button 
                    onClick={() => setMode('online')} 
                    style={{ 
                        background: 'none', border: 'none', 
                        color: mode === 'online' ? 'var(--neon-primary)' : 'var(--text-muted)',
                        fontWeight: '700', cursor: 'pointer',
                        borderBottom: mode === 'online' ? '1px solid var(--neon-primary)' : '1px solid transparent',
                        paddingBottom: '0.5rem', transition: 'all 0.3s'
                    }}
                >
                    GITHUB URL (ONLINE)
                 </button>
                 <button 
                    onClick={() => setMode('offline')} 
                     style={{ 
                        background: 'none', border: 'none', 
                        color: mode === 'offline' ? 'var(--neon-secondary)' : 'var(--text-muted)',
                        fontWeight: '700', cursor: 'pointer',
                        borderBottom: mode === 'offline' ? '1px solid var(--neon-secondary)' : '1px solid transparent',
                        paddingBottom: '0.5rem', transition: 'all 0.3s'
                    }}
                 >
                    LOCAL FOLDER (OFFLINE)
                 </button>
             </div>

            {/* Main Input Card */}
            <div className="glass-card animate-float" style={{ padding: '0.75rem', display: 'flex', gap: '1rem', border: `1px solid ${mode === 'online' ? 'rgba(255,255,255,0.08)' : 'rgba(0, 210, 255, 0.2)'}` }}>
                
                {mode === 'online' ? (
                    <>
                        <Input 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)} 
                        placeholder="github.com/owner/repository" 
                        style={{ background: 'transparent', border: 'none', fontSize: '1.1rem', paddingLeft: '1.5rem' }}
                        />
                        <Button onClick={() => handleAnalyze()} disabled={loading} style={{ minWidth: '160px', height: 'auto', borderRadius: '6px' }}>
                            {loading ? 'Scanning...' : 'Execute Scan'}
                        </Button>
                    </>
                ) : (
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <Button variant="info" onClick={handleLocalAnalyze} disabled={loading} style={{ width: '100%', height: '50px', borderRadius: '6px', border: '1px dashed var(--neon-secondary)', color: 'var(--neon-secondary)', background: 'rgba(0,0,0,0.3)' }}>
                            {loading ? 'Scanning Local Disk...' : '📂 Choose Local Project Folder'}
                        </Button>
                    </div>
                )}
            </div>
            
            {/* Error Display */}
            {error && (
                  <div style={{ marginTop: '1.5rem', color: 'var(--neon-risk)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', textShadow: '0 0 10px rgba(255, 62, 62, 0.4)' }}>
                    [ERROR] {error}
                  </div>
            )}

            {/* Quick Actions (Online Only) */}
            {mode === 'online' && (
                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    {PRELOADED_EXAMPLES.map((ex) => (
                    <button 
                        key={ex.name} 
                        onClick={() => { setUrl(ex.url); handleAnalyze(ex.url); }}
                        style={{ 
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => { 
                            e.target.style.borderColor = 'var(--neon-primary)'; 
                            e.target.style.color = 'var(--neon-primary)';
                            e.target.style.boxShadow = '0 0 10px rgba(0, 255, 157, 0.1)';
                        }}
                        onMouseLeave={(e) => { 
                            e.target.style.borderColor = 'rgba(255,255,255,0.05)'; 
                            e.target.style.color = 'var(--text-secondary)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        Load: {ex.name}
                    </button>
                    ))}
                </div>
            )}

          </div>
        )}
      </main>
    </div>
  )
}

export default App
