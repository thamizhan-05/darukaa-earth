import clsx from 'clsx'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  leftIcon?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-green text-text-inverse hover:bg-accent-teal font-semibold shadow-sm hover:shadow-glow',
  secondary: 'bg-bg-elevated text-text-primary hover:bg-bg-overlay border border-border',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30',
  outline:
    'bg-transparent text-accent-green hover:bg-accent-emerald/10 border border-accent-green/40',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs rounded',
  md: 'h-9 px-4 text-sm rounded-md',
  lg: 'h-11 px-6 text-sm rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 transition-all duration-150 font-medium select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
