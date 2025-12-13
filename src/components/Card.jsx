import React from 'react';

export function Card({ children, className = '', style = {} }) {
  return (
    <div 
      className={`glass-panel ${className}`} 
      style={{ 
        padding: '1.5rem', 
        borderRadius: '12px', 
        ...style 
      }}
    >
      {children}
    </div>
  );
}
