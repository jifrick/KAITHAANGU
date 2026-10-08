import React from 'react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'danger' 
  | 'rose' 
  | 'google';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'btn-primary';
      case 'secondary': return 'btn-secondary';
      case 'outline': return 'btn-outline';
      case 'ghost': return 'btn-ghost';
      case 'danger': return 'btn-danger';
      case 'rose': return 'btn-rose';
      case 'google': return 'btn-google';
      default: return 'btn-primary';
    }
  };

  const getSizeStyle = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '0.4rem 0.85rem', fontSize: '0.8125rem', minHeight: '36px', borderRadius: '8px' };
      case 'lg':
        return { padding: '0.85rem 1.75rem', fontSize: '1rem', minHeight: '50px', borderRadius: '12px' };
      case 'md':
      default:
        return { padding: '0.65rem 1.25rem', fontSize: '0.9375rem', minHeight: '44px', borderRadius: '12px' };
    }
  };

  const combinedStyle: React.CSSProperties = {
    ...getSizeStyle(),
    width: fullWidth ? '100%' : undefined,
    ...style,
  };

  return (
    <button
      className={`btn ${getVariantClass()} ${className}`}
      disabled={disabled || loading}
      style={combinedStyle}
      {...props}
    >
      {loading ? (
        <>
          <span 
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite'
            }} 
          />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="btn-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
