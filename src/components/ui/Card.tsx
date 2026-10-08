import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  borderAccent?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  borderAccent,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`card ${interactive ? 'card-interactive' : ''} ${className}`}
      style={{
        borderTop: borderAccent ? `4px solid ${borderAccent}` : undefined,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  style,
  className = '',
  ...props
}) => (
  <div 
    className={`card-header ${className}`} 
    style={{ marginBottom: 'var(--space-4)', ...style }} 
    {...props}
  >
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  style,
  className = '',
  ...props
}) => (
  <div className={`card-content ${className}`} style={style} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  style,
  className = '',
  ...props
}) => (
  <div 
    className={`card-footer ${className}`} 
    style={{ 
      marginTop: 'var(--space-5)', 
      paddingTop: 'var(--space-4)', 
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      ...style 
    }} 
    {...props}
  >
    {children}
  </div>
);
