import React from 'react';

export function Input({ value, onChange, placeholder, style = {} }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(0,0,0,0.3)',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
        ...style
      }}
    />
  );
}
