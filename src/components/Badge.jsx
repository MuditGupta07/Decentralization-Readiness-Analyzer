export const Badge = ({ children, variant = 'neutral' }) => {
  const colors = {
    safe: { border: 'var(--neon-primary)', text: 'var(--neon-primary)', glow: 'rgba(0, 255, 157, 0.2)' },
    risk: { border: 'var(--neon-risk)', text: 'var(--neon-risk)', glow: 'rgba(255, 62, 62, 0.2)' },
    warn: { border: 'var(--neon-warn)', text: 'var(--neon-warn)', glow: 'rgba(255, 189, 46, 0.2)' },
    info: { border: 'var(--neon-secondary)', text: 'var(--neon-secondary)', glow: 'rgba(0, 210, 255, 0.2)' },
    neutral: { border: 'var(--text-secondary)', text: 'var(--text-secondary)', glow: 'rgba(255, 255, 255, 0.05)' },
    review: { border: 'var(--neon-warn)', text: 'var(--neon-warn)', glow: 'rgba(255, 189, 46, 0.2)' }
  };

  const style = colors[variant] || colors.neutral;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.35rem 0.85rem',
      borderRadius: '4px',
      fontSize: '0.7rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: 'transparent',
      color: style.text,
      border: `1px solid ${style.border}`,
      boxShadow: `0 0 10px ${style.glow}`,
      whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  );
};
