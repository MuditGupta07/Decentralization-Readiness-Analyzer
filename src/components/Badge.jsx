import React from 'react';

export function Badge({ children, color = 'var(--text-secondary)' }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.85rem',
      fontWeight: '600',
      backgroundColor: `${color}20`, // 20 hex alpha ~ 12% opacity
      color: color,
      border: `1px solid ${color}40`
    }}>
      {children}
    </span>
  );
}
