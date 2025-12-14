export const Button = ({ children, onClick, variant = 'primary', disabled, style }) => {
  const isPrimary = variant === 'primary';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.8rem 1.75rem',
        borderRadius: '8px', 
        border: isPrimary ? 'none' : '1px solid var(--border-glass)',
        background: isPrimary 
          ? 'var(--neon-primary)' 
          : 'rgba(255,255,255,0.02)',
        color: isPrimary ? '#000' : 'var(--text-primary)', 
        fontWeight: '700',
        fontSize: '0.9rem',
        letterSpacing: '0.02em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isPrimary ? '0 0 20px rgba(0, 255, 157, 0.3)' : 'none',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled && isPrimary) e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 157, 0.6)';
        if (!disabled && !isPrimary) {
           e.currentTarget.style.borderColor = 'var(--text-primary)';
           e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && isPrimary) e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 157, 0.3)';
        if (!disabled && !isPrimary) {
           e.currentTarget.style.borderColor = 'var(--border-glass)';
           e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        }
      }}
    >
      {children}
    </button>
  );
};
