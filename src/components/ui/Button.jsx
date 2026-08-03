import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white',
  ghost: 'text-gray-500 hover:text-gray-700',
}

const SIZES = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
}

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const isNativeButton = Component === 'button'

  return (
    <Component
      {...(isNativeButton ? { type: props.type || 'button', disabled: disabled || loading } : {})}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Component>
  )
}
