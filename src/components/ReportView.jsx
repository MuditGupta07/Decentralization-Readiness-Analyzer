import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';

export const ReportView = ({ report, onReset }) => {
  const { repoInfo, score, evidence, architecture, offline, limitations } = report;

  const getVariant = (riskLabel) => {
    if (riskLabel === 'High') return 'risk';
    if (riskLabel === 'Medium') return 'warn';
    if (riskLabel === 'Human Review Required') return 'review';
    return 'safe';
  };

  const getOfflineVariant = (status) => {
      if (status === 'Offline-Capable') return 'safe';
      if (status === 'Partially Offline') return 'warn';
      return 'neutral';
  };

  return (
    <div className="fade-in-up">
      {/* HUD Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Button variant="outline" onClick={onReset} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', height: 'auto', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }}>
              ← NEW_SCAN
            </Button>
            <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                TARGET: <span style={{ color: 'var(--neon-primary)' }}>{repoInfo?.full_name || 'UNKNOWN_TARGET'}</span>
            </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            SYS.TIME: {new Date(report.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Primary Status Module */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.5fr) 1fr', gap: '2rem', marginBottom: '3rem' }}>
          
          <Card style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: `1px solid ${score.color}` }}>
             <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: score.color, boxShadow: `0 0 20px ${score.color}` }}></div>
             
             <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>// SYSTEM VERDICT</div>
             
             <div style={{ fontSize: '3rem', fontWeight: '800', color: '#fff', lineHeight: '1', marginBottom: '0.5rem', textShadow: `0 0 30px ${score.color}` }}>
                 {score.label}
             </div>
             
             <div style={{ fontSize: '1.1rem', color: score.color, marginBottom: '1.5rem', fontWeight: 'bold' }}>
                 {architecture}
             </div>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '90%', lineHeight: '1.6' }}>
                 {score.desc}
             </p>
          </Card>

          <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
             <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>// CAPABILITY MODULE</div>
                <div style={{ marginBottom: '0.5rem' }}>
                    <Badge variant={getOfflineVariant(offline.status)}>{offline.status}</Badge>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{offline.reason}</div>
             </div>

             {offline.evidence && offline.evidence.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                     {offline.evidence.slice(0, 3).map((ev, i) => (
                         <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--neon-primary)', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,157,0.1)', paddingBottom: '0.25rem' }}>
                             <span>{ev.signal.replace('Detected', '').trim()}</span>
                             <span style={{ opacity: 0.5 }}>{ev.category}</span>
                         </div>
                     ))}
                </div>
             )}
          </Card>
      </div>

      {/* Human Review Alert */}
      {score.label === 'Human Review Required' && (
        <Card style={{ marginBottom: '3rem', border: '1px solid var(--neon-warn)', background: 'rgba(255, 189, 46, 0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--neon-warn)', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠</span>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '1rem' }}>Ambiguity Detected</h3>
           </div>
           
           <div style={{ display: 'grid', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
              {evidence.filter(e => e.signal.includes('Generic Network')).map((item, i) => (
                 <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', gap: '1rem' }}>
                    <span style={{ color: 'var(--neon-warn)' }}>[Ln {item.line || '?'}]</span>
                    <span>{item.file ? item.file.split('/').pop() : 'Unknown'}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{item.reason}</span>
                 </div>
              ))}
           </div>
        </Card>
      )}

      {/* Data Grid */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}>EVIDENCE LOG</h3>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>RISK</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>SIGNAL</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>SOURCE</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {evidence.length === 0 ? (
                <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No centralization vectors detected. System clean.
                    </td>
                </tr>
            ) : (
                evidence.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                     <td style={{ padding: '1rem' }}>
                        <Badge variant={getVariant(item.risk)}>{item.risk}</Badge>
                     </td>
                     <td style={{ padding: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--neon-primary)' }}>&gt;</span> {item.signal}
                     </td>
                     <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {item.file ? item.file.split('/').pop() : item.source}
                        {item.line && <span style={{ opacity: 0.5, fontSize: '0.8rem', marginLeft: '0.5rem' }}>:{item.line}</span>}
                     </td>
                     <td style={{ padding: '1rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                        {item.failureMode}
                     </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Footer / Limitations */}
      <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          {limitations && limitations.map((lim, i) => (
              <div key={i} style={{ marginBottom: '0.25rem' }}>[DISCLAIMER] {lim}</div>
          ))}
          <div style={{ marginTop: '1rem', opacity: 0.5 }}>DECENTRALENS_ENGINE_V2 // END OF LINE</div>
      </div>

    </div>
  )
}
