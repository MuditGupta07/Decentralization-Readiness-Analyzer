import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';

export function ReportView({ report, onReset }) {
  const { score, evidence, offline, repoInfo, architecture, limitations } = report;

  return (
    <div className="report-container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={onReset} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ← Analyze Another
        </button>
        <div style={{ textAlign: 'right' }}>
           <span style={{ display:'block', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>analyzed on</span>
           <span style={{ color: 'var(--text-primary)' }}>{new Date(report.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Hero Verdict */}
      <Card style={{ textAlign: 'center', marginBottom: '2rem', borderTop: `4px solid ${score.color}` }}>
        <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Decentralization Verdict
        </h2>
        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: score.color, marginBottom: '0.5rem' }}>
          {score.label}
        </div>
        <Badge color={score.color}>{score.verdict}</Badge>
        <p style={{ maxWidth: '600px', margin: '1.5rem auto 0', color: 'var(--text-primary)', lineHeight: '1.6' }}>
          {score.desc}
        </p>
      </Card>

      {/* Architecture & Offline Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card>
           <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Architecture</h3>
           <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{architecture}</div>
        </Card>
        <Card>
           <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Offline Capability</h3>
           <div style={{ fontSize: '1.2rem', fontWeight: '600', color: offline.status === 'Offline-Capable' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
             {offline.status}
           </div>
           <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
             {offline.reason}
           </p>
        </Card>
      </div>

      {/* Evidence Log (The Core Fix) */}
      <Card style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Evidence of Centralization</h3>
        {evidence.length === 0 ? (
          <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)' }}>
            <strong>No centralized candidates found.</strong> <br/>
            Analyzer could not find standard indicators of centralized cloud, auth, or server dependencies in config files.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                   <th style={{ padding: '0.5rem' }}>Risk Level</th>
                   <th style={{ padding: '0.5rem' }}>Category</th>
                   <th style={{ padding: '0.5rem' }}>Signal Found</th>
                   <th style={{ padding: '0.5rem' }}>Failure Mode Explanation</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                     <td style={{ padding: '0.75rem 0.5rem' }}>
                        <Badge color={item.risk === 'High' ? 'var(--accent-risk)' : 'var(--accent-warn)'}>
                          {item.risk}
                        </Badge>
                     </td>
                     <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-primary)' }}>{item.category}</td>
                     <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{item.signal}</td>
                     <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>{item.failureMode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Limitations for Transparency */}
      <Card style={{ border: '1px dashed var(--border-subtle)' }}>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Analysis Limitations & Disclosure</h3>
        <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {limitations && limitations.map((lim, i) => (
               <li key={i} style={{ marginBottom: '0.25rem' }}>{lim}</li>
            ))}
        </ul>
      </Card>

      {repoInfo && (
        <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem' }}>
          Analysis for <a href={repoInfo.html_url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)' }}>{repoInfo.full_name}</a>
        </div>
      )}
    </div>
  );
}
