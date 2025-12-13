import React from 'react';

export function Button({ onClick, children, variant = 'primary', disabled = false, style={} }) {
  const baseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    ...style
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--text-primary)',
      color: 'var(--bg-app)',
    },
    outline: {
      backgroundColor: 'transparent',
      border: '1px solid var(--border-subtle)',
      color: 'var(--text-primary)',
    }
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={{ ...baseStyle, ...variants[variant] }}
    >
      {children}
    </button>
  );
}
