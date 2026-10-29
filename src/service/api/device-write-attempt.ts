/**
 * A write attempt is frozen the first time it is sent: same path, body, If-Match and
 * Idempotency-Key. When the outcome is unknown (network failure) only that exact request
 * may be re-sent, so a replay can never apply a different payload under the same key.
 */
export interface FrozenWriteAttempt<TBody> {
  readonly scope: string
  readonly body: TBody
  readonly etag: string
  readonly key: string
}

export function newIdempotencyKey(random: () => string = () => globalThis.crypto.randomUUID()): string {
  return `dev-${random()}`
}

export function freezeAttempt<TBody>(scope: string, body: TBody, etag: string, key: string): FrozenWriteAttempt<TBody> {
  return Object.freeze({ scope, body, etag, key })
}

export type WriteFailureKind = 'unknown' | 'stale' | 'conflict' | 'rejected'

/** Only a failure with no HTTP status is "unknown"; every HTTP answer is final for that attempt. */
export function classifyWriteFailure(error: unknown): WriteFailureKind {
  const status = (error as { status?: unknown } | null)?.status
  if (typeof status !== 'number') return 'unknown'
  if (status === 412 || status === 428) return 'stale'
  if (status === 409) return 'conflict'
  return 'rejected'
}

export function describeAccepted(state: string): string {
  switch (state) {
    case 'succeeded':
      return '已完成'
    case 'failed':
      return '执行失败'
    case 'cancelled':
      return '已取消'
    default:
      return '已受理，等待运行时应用（尚未生效）'
  }
}
