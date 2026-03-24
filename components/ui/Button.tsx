/**
 * Button Component - Tesla-sleek minimal button
 */

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}: ButtonProps) {
  const baseStyles = 'rounded-full font-medium transition-transform touch-manipulation'
  
  const variantStyles = {
    primary: 'bg-[#0066ff] text-white hover:scale-105 active:scale-95',
    secondary: 'border border-white/20 text-white/80 hover:border-white/40 hover:text-white'
  }
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  )
}
