/** Community durable receipt states and legacy log states are different contracts. */
const labels: Record<string, string> = {
  '0': '已受理（结果待确认）',
  '1': '已发布到设备通道',
  '2': '发布失败',
  '3': '设备应答成功',
  '4': '设备应答失败',
  accepted: '已受理（结果待确认）',
  dispatching: '下发中',
  broker_acknowledged: '设备通道已接收',
  published: '已发布到设备通道',
  device_reported_success: '设备应答成功',
  device_succeeded: '设备应答成功',
  device_reported_failure: '设备应答失败',
  device_failed: '设备应答失败',
  publish_failed: '发布失败',
  failed: '下发失败',
  timeout: '超时未应答',
  expired: '已过期',
  fenced: '设备路由已失效',
  unknown: '结果未知',
  not_found: '暂无回执（结果待确认）'
}
export function communityCommandLabel(status: unknown): string {
  return labels[String(status ?? '')] ?? '结果未知'
}

// Do not expose arbitrary provider errors, payloads or credentials in a table cell.
export function communityCommandReason(reason: unknown): string {
  if (!reason) return ''
  if (reason === 'broker publication outcome unknown') return '设备通道未确认发布结果'
  return '未能确认命令执行结果，请结合回执状态排查'
}

type Row = Record<string, any>
type Response = { data?: any; error?: any; [key: string]: any }
/** The table asks for four rows. One bounded lookup per unique ID; never background polling. */
export function createCommunityCommandPageLoader(
  list: (params: any) => Promise<Response>,
  receipt: (id: string) => Promise<Response>
) {
  let generation = 0
  return {
    invalidate() {
      generation++
    },
    async load(params: any): Promise<Response> {
      const current = ++generation
      const result = await list(params)
      if (current !== generation) return { error: true }
      if (result.error) return result
      const data = result.data
      const rows: Row[] = data?.value || data?.list || (Array.isArray(data) ? data : [])
      const ids = [...new Set(rows.map(row => row.message_id).filter(id => typeof id === 'string' && id))].slice(0, 4)
      const receipts = new Map<string, any>()
      await Promise.all(
        ids.map(async id => {
          try {
            const answer = await receipt(id)
            if (!answer.error && answer.data?.status && answer.data.status !== 'not_found')
              receipts.set(id, answer.data)
          } catch {
            /* A receipt read failure must not turn a pending log into success. */
          }
        })
      )
      if (current !== generation) return { error: true }
      const enriched = rows.map(row => {
        const authoritative = receipts.get(row.message_id)
        return {
          ...row,
          status: authoritative?.status ?? row.status,
          error_message: communityCommandReason(authoritative ? authoritative.error_message : row.error_message)
        }
      })
      return {
        ...result,
        data: Array.isArray(data) ? enriched : { ...data, [Array.isArray(data?.value) ? 'value' : 'list']: enriched }
      }
    }
  }
}
