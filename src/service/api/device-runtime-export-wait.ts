import type { DeviceRuntimeNativeClient, ReadingExportResult } from './device-runtime-native-transport'

export interface WaitOptions {
  intervalMs?: number
  timeoutMs?: number
  sleep?: (ms: number) => Promise<void>
  onProgress?: (job: ReadingExportResult) => void
}

/**
 * Returns the finished export (with a download id) or throws. A job that is
 * already finished is returned without polling; a long one is polled until it
 * succeeds, fails or the timeout passes.
 */
export async function waitForReadingExport(
  client: Pick<DeviceRuntimeNativeClient, 'getReadingExport'>,
  first: ReadingExportResult,
  options: WaitOptions = {}
): Promise<ReadingExportResult & { downloadId: string }> {
  const interval = options.intervalMs ?? 2000
  const timeout = options.timeoutMs ?? 15 * 60 * 1000
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)))
  let job = first
  let waited = 0
  for (;;) {
    if (job.state === 'succeeded') {
      if (!job.downloadId) throw new Error('导出任务没有生成文件')
      return job as ReadingExportResult & { downloadId: string }
    }
    if (job.state === 'failed' || job.state === 'cancelled') {
      throw new Error(job.failure || (job.state === 'cancelled' ? '导出任务已取消' : '导出失败'))
    }
    if (waited >= timeout) throw new Error('导出仍在进行，请稍后在导出记录中重试下载')
    options.onProgress?.(job)
    await sleep(interval)
    waited += interval
    job = await client.getReadingExport(first.operationId)
  }
}
