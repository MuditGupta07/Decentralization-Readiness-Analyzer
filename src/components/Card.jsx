export const Card = ({ children, style = {}, className = '' }) => {
  return (
    <div 
      className={`glass-card ${className}`}
      style={{
        padding: '2rem',
        ...style
      }}
    >
      {children}
    </div>
  );
};
