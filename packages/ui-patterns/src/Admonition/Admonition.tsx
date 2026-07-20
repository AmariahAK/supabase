import { forwardRef } from 'react'
import { Alert, cn } from 'ui'

import {
  CONTENT_CLASS,
  getSurfaceClass,
  INLINE_FIRST_P,
  LAYOUT_CLASS,
  TITLE_CLASS,
  TYPE_LABEL,
  TYPE_TO_VARIANT,
} from './Admonition.constants'
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
          'overflow-hidden',
          layout === 'responsive' && '@container',
          getSurfaceClass(type),
          className
        )}
      >
        <div className="flex items-start gap-3">
          {showIcon && (icon ?? <AdmonitionTypeIcon type={type} />)}
          <div className={cn('min-w-0 flex-1', LAYOUT_CLASS[layout])}>
            <div
              {...childProps?.description}
              className={cn(
                CONTENT_CLASS,
                !title && INLINE_FIRST_P,
                childProps?.description?.className
              )}
            >
              {title ? (
                <div
                  {...childProps?.title}
                  className={cn(TITLE_CLASS, childProps?.title?.className)}
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
