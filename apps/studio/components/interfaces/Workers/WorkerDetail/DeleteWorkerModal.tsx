import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import type { Worker } from '../Workers.types'
import { UNIT_NAME_LOWER } from '@/lib/constants/workers'

export const DeleteWorkerModal = ({
  worker,
  visible,
  onCancel,
  onConfirm,
}: {
  worker: Worker
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
}) => {
  return (
    <ConfirmationModal
      variant="destructive"
      visible={visible}
      title={`Delete ${UNIT_NAME_LOWER} "${worker.name}"`}
      confirmLabel="Delete"
      confirmLabelLoading="Deleting"
      onCancel={onCancel}
      onConfirm={onConfirm}
      alert={{
        title: 'This cannot be undone',
        description: `Deleting frees this project's ${worker.instances} instance${
          worker.instances === 1 ? '' : 's'
        }.`,
      }}
    >
      <ul className="list-disc space-y-1 pl-4 text-sm text-foreground-light">
        <li>The worker is killed immediately — there is no drain period.</li>
        {worker.access === 'public' && (
          <li>Its public endpoint stops responding right away. In-flight requests are dropped.</li>
        )}
        <li>To bring it back, redeploy it from the CLI.</li>
      </ul>
    </ConfirmationModal>
  )
}
