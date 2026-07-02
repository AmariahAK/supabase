import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

interface TableDetailSplitLinkButtonProps {
  primaryHref: string
  primaryLabel: string
  menuItemHref?: string
  menuItemLabel?: string
  menuAriaLabel?: string
}

/** Primary link + chevron menu for a secondary link (split button pattern). */
export function TableDetailSplitLinkButton({
  primaryHref,
  primaryLabel,
  menuItemHref,
  menuItemLabel,
  menuAriaLabel = 'More table actions',
}: TableDetailSplitLinkButtonProps) {
  if (!menuItemHref || !menuItemLabel) {
    return (
      <Button variant="default" asChild>
        <Link href={primaryHref}>{primaryLabel}</Link>
      </Button>
    )
  }

  return (
    <div className="flex w-fit">
      <Button type="button" variant="default" className="rounded-r-none hover:z-10" asChild>
        <Link href={primaryHref}>{primaryLabel}</Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="default"
            icon={<ChevronDown />}
            className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px"
            aria-label={menuAriaLabel}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href={menuItemHref}>{menuItemLabel}</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
