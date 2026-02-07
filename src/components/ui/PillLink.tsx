import Link from 'next/link';
import type { ReactNode } from 'react';

const variantClasses = {
  neutral:
    'border-gray-200 bg-white text-indigo-600 hover:bg-indigo-50 hover:shadow-[0_10px_18px_-14px_rgba(79,70,229,0.55)] dark:border-gray-800 dark:bg-gray-900 dark:text-indigo-400 dark:hover:bg-gray-800',
  indigo:
    'border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:shadow-[0_10px_20px_-14px_rgba(79,70,229,0.6)] dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40',
  purple:
    'border-purple-100 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:shadow-[0_10px_20px_-14px_rgba(147,51,234,0.6)] dark:border-purple-900/40 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40',
} as const;

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  xs: 'px-3 py-1.5 text-xs',
} as const;

type PillLinkProps = {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  className?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  target?: string;
  rel?: string;
};

export default function PillLink({
  href,
  children,
  variant = 'neutral',
  size = 'sm',
  className,
  startIcon,
  endIcon,
  target,
  rel,
}: PillLinkProps) {
  const classes = [
    'inline-flex items-center gap-2 rounded-full border font-medium shadow-sm transition-all duration-200 hover:-translate-y-0.5',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link href={href} className={classes} target={target} rel={rel}>
      {startIcon}
      <span>{children}</span>
      {endIcon}
    </Link>
  );
}
