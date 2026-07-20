import { cva } from 'class-variance-authority'
import { ComponentProps, forwardRef, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle, cn } from 'ui'

import { InfoIcon, SuccessIcon, WarningIcon } from './AdmonitionIcons'

export type AdmonitionType =
  | 'note'
  | 'tip'
  | 'caution'
  | 'danger'
  | 'deprecation'
  | 'default'
  | 'destructive'
  | 'success'
  | 'warning'

export interface AdmonitionProps {
  type?: AdmonitionType
  title?: string
  description?: ReactNode
  children?: ReactNode
  showIcon?: boolean
  childProps?: {
    title?: ComponentProps<typeof AlertTitle>
    description?: ComponentProps<typeof AlertDescription>
  }
  layout?: 'horizontal' | 'vertical' | 'responsive'
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}

const admonitionToAlertMapping: Record<AdmonitionType, 'default' | 'destructive' | 'warning'> = {
  note: 'default',
  tip: 'default',
  caution: 'warning',
  danger: 'destructive',
  deprecation: 'warning',
  default: 'default',
  warning: 'warning',
  destructive: 'destructive',
  success: 'default',
}

const admonitionTypeLabel: Record<AdmonitionType, string> = {
  note: 'Note',
  tip: 'Tip',
  caution: 'Caution',
  danger: 'Danger',
  deprecation: 'Deprecated',
  default: 'Note',
  warning: 'Warning',
  destructive: 'Danger',
  success: 'Success',
}

const admonitionSurface = cva('', {
  variants: {
    type: {
      default: '',
      success: 'bg-brand-400/15 dark:bg-brand/10 border-brand-400 dark:border-brand-500',
      warning: '',
      destructive: '',
    },
  },
})

const admonitionIcon = cva(
  'inline-flex shrink-0 items-center justify-center size-[23px] p-1 rounded-sm [&>svg]:size-full',
  {
    variants: {
      type: {
        default: 'text-background bg-foreground-muted',
        success: 'text-white dark:text-brand-link bg-brand dark:bg-brand-500/50',
        warning: 'text-warning-200 bg-warning-600',
        destructive: 'text-destructive-200 bg-destructive-600',
      },
    },
  }
)

const admonitionBodyClassName =
  '[&_p]:!mt-0 [&_p]:!mb-1.5 [&_p:last-child]:!mb-0 [&_p:only-child]:!mb-0 [&_ul]:!my-1.5 [&_ol]:!my-1.5 [&_li]:!my-0.5'

export const Admonition = forwardRef<
  React.ComponentRef<typeof Alert>,
  Omit<React.ComponentPropsWithoutRef<typeof Alert>, keyof AdmonitionProps | 'children'> &
    AdmonitionProps
>(
  (
    {
      type = 'note',
      variant,
      showIcon = true,
      title,
      description,
      children,
      layout = 'vertical',
      actions,
      childProps = {},
      icon,
      ...props
    },
    ref
  ) => {
    const typeMapped = variant ? admonitionToAlertMapping[variant] : admonitionToAlertMapping[type]
    const typeStyle = type === 'success' ? 'success' : typeMapped
    const typeLabel = admonitionTypeLabel[type]
    const heading = title

    const resolvedIcon = !!icon ? (
      icon
    ) : showIcon && typeStyle === 'success' ? (
      <SuccessIcon />
    ) : showIcon && (typeMapped === 'warning' || typeMapped === 'destructive') ? (
      <WarningIcon />
    ) : showIcon ? (
      <InfoIcon />
    ) : null

    return (
      <Alert
        ref={ref}
        variant={typeMapped}
        {...props}
        role="note"
        className={cn(
          // Handle occasional background elements
          'overflow-hidden',
          // Container query context for responsive layout
          layout === 'responsive' && '@container',
          admonitionSurface({ type: typeStyle }),
          props.className
        )}
      >
        <div className="flex items-start gap-3">
          {resolvedIcon && (
            <span className={admonitionIcon({ type: typeStyle })}>{resolvedIcon}</span>
          )}
          <div
            className={cn(
              'flex min-w-0 flex-1',
              layout === 'vertical' && 'flex-col',
              layout === 'horizontal' && 'flex-row items-center justify-between gap-x-6 lg:gap-x-8',
              layout === 'responsive' &&
                'flex-col @md:flex-row @md:items-center @md:justify-between @md:gap-x-6 @lg:gap-x-8'
            )}
          >
            <div>
              {heading && (
                <AlertTitle
                  {...childProps.title}
                  className={cn('text flex flex-col gap-3 text-sm', childProps.title?.className)}
                >
                  <strong>{typeLabel}:</strong> {heading}
                </AlertTitle>
              )}
              {description && (
                <AlertDescription
                  {...childProps.description}
                  className={cn(admonitionBodyClassName, childProps.description?.className)}
                >
                  {!heading && (
                    <>
                      <strong>{typeLabel}:</strong>{' '}
                    </>
                  )}
                  {description}
                </AlertDescription>
              )}
              {/* // children is to handle Docs and MDX issues with children and <p> elements */}
              {children && (
                <AlertDescription
                  {...childProps.description}
                  className={cn(
                    admonitionBodyClassName,
                    !heading && !description && '[&>p:first-of-type]:inline',
                    childProps?.description?.className
                  )}
                >
                  {!heading && !description && (
                    <>
                      <strong>{typeLabel}:</strong>{' '}
                    </>
                  )}
                  {children}
                </AlertDescription>
              )}
            </div>
            {actions && (
              <div
                className={cn(
                  'flex flex-row gap-3',
                  layout === 'vertical' && 'mt-3 items-start',
                  layout === 'horizontal' && 'items-center',
                  layout === 'responsive' && 'mt-3 items-start @md:mt-0 @md:items-center'
                )}
              >
                {actions}
              </div>
            )}
          </div>
        </div>
      </Alert>
    )
  }
)
