import { forwardRef } from 'react'
import { Alert, cn } from 'ui'

import { TYPE_LABEL, TYPE_TO_VARIANT } from './Admonition.constants'
import type { AdmonitionLayout, AdmonitionProps, AdmonitionType } from './Admonition.types'
import { AdmonitionTypeIcon } from './AdmonitionIcons'

export type { AdmonitionLayout, AdmonitionProps, AdmonitionType }

export const Admonition = forwardRef<
  React.ComponentRef<typeof Alert>,
  Omit<React.ComponentPropsWithoutRef<typeof Alert>, keyof AdmonitionProps | 'children'> &
    AdmonitionProps
>(
  (
    {
      type = 'note',
      showIcon = true,
      title,
      description,
      children,
      layout = 'vertical',
      actions,
      childProps,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    const label = TYPE_LABEL[type]

    return (
      <Alert
        ref={ref}
        {...props}
        role="note"
        variant={TYPE_TO_VARIANT[type]}
        className={cn(
          // Isolate from parent MDX `.prose` (docs applies `text-base leading-7` to `p`)
          'not-prose overflow-hidden',
          layout === 'responsive' && '@container',
          type === 'success' &&
            'bg-brand-400/15 dark:bg-brand/10 border-brand-400 dark:border-brand-500',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {showIcon && (icon ?? <AdmonitionTypeIcon type={type} />)}
          <div
            className={cn(
              'min-w-0 flex-1',
              layout === 'vertical' && 'flex flex-col',
              layout === 'horizontal' &&
                'flex flex-row items-center justify-between gap-x-6 lg:gap-x-8',
              layout === 'responsive' &&
                'flex flex-col @md:flex-row @md:items-center @md:justify-between @md:gap-x-6 @lg:gap-x-8'
            )}
          >
            <div
              {...childProps?.description}
              className={cn(
                'text-sm leading-5 text-foreground-light [&_p]:!mt-0 [&_p]:!mb-1.5 [&_p:last-child]:!mb-0 [&_p:only-child]:!mb-0 [&_ul]:!my-1.5 [&_ol]:!my-1.5 [&_li]:!my-0.5',
                !title && '[&>p:first-of-type]:inline',
                childProps?.description?.className
              )}
            >
              {title ? (
                <div
                  {...childProps?.title}
                  className={cn(
                    'mb-0.5 text-sm leading-5 font-medium text-foreground',
                    childProps?.title?.className
                  )}
                >
                  <strong>{label}:</strong> {title}
                </div>
              ) : (
                <strong>{label}:</strong>
              )}{' '}
              {description}
              {children}
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
