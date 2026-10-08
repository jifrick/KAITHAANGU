import React from 'react';
import { Link } from 'react-router-dom';

export interface BrandProps {
  variant?: 'wordmark' | 'full' | 'hero-tagline' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  clickable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Brand: React.FC<BrandProps> = ({
  variant = 'wordmark',
  size = 'md',
  showTagline = false,
  clickable = true,
  className = '',
  style
}) => {
  const getLogoHeight = () => {
    switch (size) {
      case 'sm': return '28px';
      case 'lg': return '48px';
      case 'md':
      default: return '36px';
    }
  };

  const logoContent = (
    <div 
      className={`brand-container ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: variant === 'hero-tagline' ? 'center' : 'flex-start',
        gap: '4px',
        ...style
      }}
    >
      {variant === 'icon-only' ? (
        <span 
          style={{
            fontWeight: 800,
            fontSize: size === 'lg' ? '1.75rem' : size === 'sm' ? '1.1rem' : '1.35rem',
            color: 'var(--primary-blue)',
            letterSpacing: '-0.02em'
          }}
        >
          KAITHAANGU
        </span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src="/brand/kaithaangu-logo-wordmark.png" 
            alt="KAITHAANGU — കൈത്താങ്ങ്" 
            style={{ 
              height: getLogoHeight(), 
              width: 'auto',
              objectFit: 'contain' 
            }} 
          />
        </div>
      )}

      {(showTagline || variant === 'hero-tagline') && (
        <span 
          className="brand-tagline"
          style={{
            fontSize: size === 'lg' ? '1.05rem' : size === 'sm' ? '0.75rem' : '0.875rem',
            fontFamily: 'var(--font-malayalam)',
            color: 'var(--secondary-rose)',
            fontWeight: 600
          }}
        >
          “എനിക്ക് വേണ്ട, നീ എടുത്തോ.”
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export const BrandIllustration: React.FC<{
  width?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', className = '', style }) => {
  return (
    <img 
      src="/brand/kaithaangu-illustration.png" 
      alt="KAITHAANGU Community Giving" 
      className={`brand-illustration ${className}`}
      style={{
        width: width,
        maxWidth: '540px',
        height: 'auto',
        objectFit: 'contain',
        ...style
      }}
    />
  );
};
