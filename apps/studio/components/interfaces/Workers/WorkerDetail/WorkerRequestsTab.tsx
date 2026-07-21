import dayjs from 'dayjs'
import { cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import type { Worker } from '../Workers.types'
import { LOG_DESTINATION } from '@/lib/constants/workers'

const statusClass = (status?: number) => {
  if (status === undefined) return 'text-foreground-light'
  if (status >= 500) return 'text-destructive'
  if (status >= 400) return 'text-warning'
  return 'text-brand'
}

export const WorkerRequestsTab = ({ worker }: { worker: Worker }) => {
  const requests = worker.logs.filter((line) => line.kind === 'request')

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Requests</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <p className="mb-3 text-sm text-foreground-light">
            HTTP request logs from the API Gateway, streamed from {LOG_DESTINATION}.
          </p>
          <div className="overflow-hidden rounded-md border border-default">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Time</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-20">Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead className="w-24 text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <p className="text-sm text-foreground-light">No requests recorded yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono text-xs text-foreground-lighter">
                        {dayjs(line.timestamp).format('HH:mm:ss')}
                      </TableCell>
                      <TableCell
                        className={cn('font-mono text-xs font-medium', statusClass(line.status))}
                      >
                        {line.status}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground-light">
                        {line.method}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground">
                        {line.path}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground-lighter">
                        {line.durationMs}ms
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
