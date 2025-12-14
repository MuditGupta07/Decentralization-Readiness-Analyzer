export const Input = ({ value, onChange, placeholder, style }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      spellCheck="false"
      style={{
        width: '100%',
        padding: '1rem 1.25rem',
        borderRadius: '8px',
        border: '1px solid var(--border-glass)',
        background: 'rgba(0,0,0,0.3)', 
        color: 'var(--text-primary)',
        fontSize: '1rem',
        fontFamily: 'var(--font-mono)', 
        outline: 'none',
        transition: 'all 0.3s ease',
        ...style
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--neon-primary)';
        e.target.style.boxShadow = '0 0 15px rgba(0, 255, 157, 0.1)';
        e.target.style.background = 'rgba(0,0,0,0.5)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--border-glass)';
        e.target.style.boxShadow = 'none';
        e.target.style.background = 'rgba(0,0,0,0.3)';
      }}
    />
  );
};
