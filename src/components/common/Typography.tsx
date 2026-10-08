import React from 'react';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body-lg' | 'body' | 'body-sm' | 'label' | 'caption';
  malayalam?: boolean;
  color?: 'default' | 'primary' | 'secondary' | 'rose' | 'muted' | 'white';
}

export const Typography: React.FC<TypographyProps> = ({
  as,
  variant = 'body',
  malayalam = false,
  color = 'default',
  children,
  className = '',
  style,
  ...props
}) => {
  const Component = as || (variant.startsWith('h') ? (variant as any) : variant === 'display' ? 'h1' : 'p');

  const getColorStyle = (): string => {
    switch (color) {
      case 'primary': return 'var(--primary-blue)';
      case 'secondary': return 'var(--ink-secondary)';
      case 'rose': return 'var(--secondary-rose)';
      case 'muted': return 'var(--ink-muted)';
      case 'white': return '#ffffff';
      case 'default':
      default: return 'inherit';
    }
  };

  const getVariantStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'display':
        return { fontSize: 'var(--fs-display)', lineHeight: 'var(--lh-display)', fontWeight: 800 };
      case 'h1':
        return { fontSize: 'var(--fs-h1)', lineHeight: 'var(--lh-h1)', fontWeight: 700 };
      case 'h2':
        return { fontSize: 'var(--fs-h2)', lineHeight: 'var(--lh-h2)', fontWeight: 700 };
      case 'h3':
        return { fontSize: 'var(--fs-h3)', lineHeight: 'var(--lh-h3)', fontWeight: 600 };
      case 'h4':
        return { fontSize: 'var(--fs-h4)', lineHeight: 'var(--lh-h4)', fontWeight: 600 };
      case 'body-lg':
        return { fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-body-lg)', fontWeight: 400 };
      case 'body-sm':
        return { fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-body-sm)', fontWeight: 400 };
      case 'label':
        return { fontSize: 'var(--fs-label)', lineHeight: 'var(--lh-label)', fontWeight: 600 };
      case 'caption':
        return { fontSize: 'var(--fs-caption)', lineHeight: 'var(--lh-caption)', fontWeight: 400 };
      case 'body':
      default:
        return { fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)', fontWeight: 400 };
    }
  };

  return (
    <Component
      className={`${malayalam ? 'lang-ml' : ''} ${className}`}
      style={{
        ...getVariantStyle(),
        color: getColorStyle(),
        fontFamily: malayalam ? 'var(--font-malayalam)' : undefined,
        ...style
      }}
      {...props}
    >
      {children}
    </Component>
  );
};
