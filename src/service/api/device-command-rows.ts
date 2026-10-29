import type { CommandReceipt } from './device-command-native-transport'
import type { CommandSubmitBody } from './device-command-native-transport'

/** Honest labels: "acknowledged" is the device's protocol answer, not proof of a physical effect. */
export const COMMAND_STATE_LABELS: Record<CommandReceipt['state'], string> = {
  pending: '提交中（结果待确认）',
  accepted: '运行时已接收',
  delivered: '已下发到设备通道',
  acknowledged: '设备已应答',
  failed: '失败',
  timed_out: '超时未应答',
  expired: '已过期',
  cancelled: '已取消',
  unknown: '结果未知'
}

export function commandStateLabel(state: string): string {
  return COMMAND_STATE_LABELS[state as CommandReceipt['state']] ?? '结果未知'
}

/** The two reasons the backend writes itself arrive in English; runtime-provided text is shown as received. */
const COMMAND_REASON_LABELS: Record<string, string> = {
  'the device runtime did not accept the command': '设备运行时明确拒绝了该命令',
  'the device runtime did not confirm whether it received the command': '设备运行时未确认是否收到该命令'
}

export function commandReasonText(reason: string | null | undefined): string {
  if (!reason) return ''
  return COMMAND_REASON_LABELS[reason] ?? reason
}

/** Rows in the shape the shared device table renders. */
export function commandRowsFromReceipts(receipts: CommandReceipt[]) {
  return receipts.map(receipt => ({
    id: receipt.id,
    identify: receipt.identifier,
    identify_name: receipt.label ?? '',
    created_at: receipt.acceptedAt,
    status: receipt.state,
    status_label: commandStateLabel(receipt.state),
    data: JSON.stringify(receipt.parameters ?? {}),
    error_message: commandReasonText(receipt.reason),
    cancellable: receipt.deliveryMode === 'when_online' && receipt.state === 'accepted'
  }))
}

export interface ParsedLegacySubmit {
  identifier: string
  parameters: Record<string, unknown>
  deliveryMode?: 'immediate' | 'when_online'
  expiresAt?: string | null
}

/** The shared table sends `{identify, value}` where value is a JSON text or null. */
export function parseTableSubmit(params: { identify?: unknown; value?: unknown }): ParsedLegacySubmit {
  const identifier = typeof params.identify === 'string' ? params.identify.trim() : ''
  if (!identifier) throw new Error('请选择或输入命令标识符')
  const raw = params.value
  if (raw === null || raw === undefined || raw === '') return { identifier, parameters: {} }
  if (typeof raw !== 'string') throw new Error('命令参数必须是 JSON 对象')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('命令参数必须是合法 JSON')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('命令参数必须是 JSON 对象')
  return { identifier, parameters: parsed as Record<string, unknown> }
}

export interface CommandSubmitter {
  submit(deviceId: string, snapshotId: string, parsed: ParsedLegacySubmit): Promise<CommandReceipt>
}

export interface CommandSubmitterDeps {
  send(deviceId: string, body: CommandSubmitBody, key: string): Promise<CommandReceipt>
  newKey(): string
}

/**
 * Re-sending identical content after an unknown outcome (no HTTP status) reuses the
 * original Idempotency-Key, so the server replays instead of issuing a second command.
 * Any HTTP answer, or a changed payload, starts a fresh key.
 */
export function createCommandSubmitter(deps: CommandSubmitterDeps): CommandSubmitter {
  let pending: { fingerprint: string; key: string } | null = null
  return {
    async submit(deviceId, snapshotId, parsed) {
      const body: CommandSubmitBody = {
        identifier: parsed.identifier,
        snapshotId,
        parameters: parsed.parameters,
        ...(parsed.deliveryMode ? { deliveryMode: parsed.deliveryMode } : {}),
        ...(parsed.expiresAt ? { expiresAt: parsed.expiresAt } : {})
      }
      const fingerprint = JSON.stringify([
        deviceId,
        snapshotId,
        parsed.identifier,
        parsed.parameters,
        parsed.deliveryMode ?? 'immediate',
        parsed.expiresAt ?? null
      ])
      const key = pending && pending.fingerprint === fingerprint ? pending.key : deps.newKey()
      pending = { fingerprint, key }
      try {
        const receipt = await deps.send(deviceId, body, key)
        pending = null
        return receipt
      } catch (error) {
        const status = (error as { status?: unknown } | null)?.status
        if (typeof status === 'number') pending = null
        throw error
      }
    }
  }
}

/** The shared table's "expected message" payload: `{identify, payload, expiry}` with expiry as a date text or null. */
export function parseTableExpected(params: {
  identify?: unknown
  payload?: unknown
  expiry?: unknown
}): ParsedLegacySubmit {
  const base = parseTableSubmit({ identify: params.identify, value: params.payload })
  let expiresAt: string | null = null
  if (params.expiry !== null && params.expiry !== undefined && params.expiry !== '') {
    const parsed = new Date(String(params.expiry))
    if (Number.isNaN(parsed.getTime())) throw new Error('过期时间格式无效')
    expiresAt = parsed.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }
  return { ...base, deliveryMode: 'when_online', expiresAt }
}
