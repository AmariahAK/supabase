import { useParams } from 'common'
import { useState } from 'react'

import { disableWarehouseProject, useWarehouseProjectState } from './warehouseDemoStore'

export function useWarehouseDestinationDelete(onDeleted?: () => void) {
  const { ref: projectRef } = useParams()
  const state = useWarehouseProjectState(projectRef)
  const [showDeleteDestinationForm, setShowDeleteDestinationForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const destinationName =
    state.enabled && state.pipelineId
      ? `DuckLake (Pipeline ID: ${state.pipelineId})`
      : 'Warehouse destination'

  const onDeleteDestination = async () => {
    if (!projectRef) return
    setIsDeleting(true)
    disableWarehouseProject(projectRef)
    setIsDeleting(false)
    setShowDeleteDestinationForm(false)
    onDeleted?.()
  }

  return {
    destinationName,
    showDeleteDestinationForm,
    setShowDeleteDestinationForm,
    isDeleting,
    onDeleteDestination,
  }
}
