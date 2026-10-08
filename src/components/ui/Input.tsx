import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  style,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <div style={{ position: 'relative', width: '100%' }}>
        {icon && (
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--ink-muted)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          style={{
            paddingLeft: icon ? '40px' : undefined,
            borderColor: error ? 'var(--error-main)' : undefined,
            ...style
          }}
          {...props}
        />
      </div>
      {error && <div className="form-error">{error}</div>}
      {!error && helperText && <div className="form-hint">{helperText}</div>}
    </div>
  );
});

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  style,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <textarea
        ref={ref}
        id={inputId}
        style={{
          borderColor: error ? 'var(--error-main)' : undefined,
          ...style
        }}
        {...props}
      />
      {error && <div className="form-error">{error}</div>}
      {!error && helperText && <div className="form-hint">{helperText}</div>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  options,
  children,
  className = '',
  id,
  style,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <select
        ref={ref}
        id={inputId}
        style={{
          borderColor: error ? 'var(--error-main)' : undefined,
          ...style
        }}
        {...props}
      >
        {options ? options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        )) : children}
      </select>
      {error && <div className="form-error">{error}</div>}
      {!error && helperText && <div className="form-hint">{helperText}</div>}
    </div>
  );
});

Select.displayName = 'Select';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  id,
  className = '',
  ...props
}, ref) => {
  const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`checkbox-group ${className}`}>
      <input ref={ref} type="checkbox" id={inputId} {...props} />
      <label htmlFor={inputId}>{label}</label>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
