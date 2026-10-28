import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'default', size = 'md', block, loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  const classes = [
    'jp-btn',
    variant !== 'default' && `jp-btn--${variant}`,
    size === 'sm' && 'jp-btn--sm',
    block && 'jp-btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
