import { cn } from 'ui'

interface DotPingProps {
  animate?: boolean
  variant?: 'primary' | 'default' | 'warning'
  size?: 'default' | 'lg'
  className?: string
}

const dotSizeClassNames = {
  default: {
    container: 'w-2.5 h-2.5',
    core: 'w-2 h-2',
  },
  lg: {
    container: 'w-3 h-3',
    core: 'w-2.5 h-2.5',
  },
} as const

export const DotPing = ({
  animate = true,
  variant = 'primary',
  size = 'default',
  className,
}: DotPingProps) => {
  const sizes = dotSizeClassNames[size]

  return (
    <div className={cn('relative align-middle', sizes.container, className)}>
      <span
        className={cn(
          'absolute inset-0 rounded-full',
          animate && 'animate-ping',
          variant === 'primary' && (size === 'lg' ? 'bg-brand/30' : 'bg-brand/20'),
          variant === 'default' && 'bg-selection/20',
          variant === 'warning' && (size === 'lg' ? 'bg-warning/30' : 'bg-warning/20')
        )}
        style={{
          animationDelay: '1s',
          animationDuration: '1.5s',
        }}
      />
      <span
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 inline-block rounded-full',
          sizes.core,
          variant === 'primary' && 'bg-brand',
          variant === 'default' && 'bg-selection',
          variant === 'warning' && 'bg-warning'
        )}
      />
    </div>
  )
}
