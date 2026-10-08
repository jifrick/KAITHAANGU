import React from 'react';

export type StatusVariant = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'reserved'
  | 'matched'
  | 'completed'
  | 'suspended'
  | 'removed'
  | 'rose'
  | 'info';

export interface BadgeProps {
  status: StatusVariant | string;
  label?: string;
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  dot = true,
  className = '',
  style
}) => {
  const normStatus = status.toLowerCase();

  const getBadgeClass = () => {
    switch (normStatus) {
      case 'pending': return 'badge-pending';
      case 'approved': 
      case 'published': 
      case 'completed': return 'badge-approved';
      case 'rejected': 
      case 'suspended': 
      case 'removed': return 'badge-rejected';
      case 'reserved': 
      case 'matched': return 'badge-matched';
      case 'rose': return 'badge-rose';
      default: return 'badge-matched';
    }
  };

  const displayText = label || normStatus.charAt(0).toUpperCase() + normStatus.slice(1);

  return (
    <span className={`badge ${getBadgeClass()} ${className}`} style={style}>
      {dot && (
        <span 
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block'
          }} 
        />
      )}
      <span>{displayText}</span>
    </span>
  );
};
