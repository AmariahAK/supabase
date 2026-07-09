import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { generateStrongPassword } from '@/lib/project'

interface WarehouseRotateCredentialsDialogProps {
  onRotated: (password: string) => void
}

export function WarehouseRotateCredentialsDialog({
  onRotated,
}: WarehouseRotateCredentialsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isRotating, setIsRotating] = useState(false)

  const onConfirm = async () => {
    setIsRotating(true)
    const password = generateStrongPassword()
    onRotated(password)
    setIsRotating(false)
    setOpen(false)
    toast.success('Warehouse credentials rotated')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="default">
          Rotate
        </Button>
      </DialogTrigger>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Rotate Warehouse credentials?</DialogTitle>
        </DialogHeader>
        <DialogSection>
          <p className="text-sm text-foreground-light mb-4">
            This generates a new password for the Warehouse endpoint. Existing connections using the
            current credentials will stop working.
          </p>
          <Admonition
            type="warning"
            title="Update connected tools"
            description="Copy the new credentials into any analytical tools, BI platforms, or scripts that connect to Warehouse."
          />
        </DialogSection>
        <DialogSectionSeparator />
        <DialogFooter>
          <Button variant="default" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={isRotating} onClick={onConfirm}>
            Rotate credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
