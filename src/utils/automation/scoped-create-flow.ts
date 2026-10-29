export type AutomationScope = { type: 'device' | 'device_config'; id: string }
export type ScopedCreatePhase =
  | 'ready'
  | 'create-failed'
  | 'create-unknown'
  | 'attach-failed'
  | 'attach-unknown'
  | 'enable-failed'
  | 'enable-unknown'
  | 'attached'

export interface ScopedCreateState {
  fingerprint: string
  createRequestId: string
  attachRequestId?: string
  scope?: AutomationScope
  desiredEnabled: boolean
  bindingConfirmed: boolean
  enabledConfirmed: boolean
  phase: ScopedCreatePhase
  ruleId?: string
  version?: number
}

export function createScopedCreateState(
  current: ScopedCreateState | null,
  input: { fingerprint: string; scope?: AutomationScope; desiredEnabled: boolean; createRequestId: () => string }
): ScopedCreateState {
  if (current?.ruleId) return current
  if (current?.phase === 'create-unknown' && current.fingerprint !== input.fingerprint) {
    throw new Error('创建结果尚未确认，必须先用原内容和原请求继续确认。')
  }
  if (current?.fingerprint === input.fingerprint) return current
  return {
    fingerprint: input.fingerprint,
    createRequestId: input.createRequestId(),
    ...(input.scope ? { attachRequestId: input.createRequestId(), scope: input.scope } : {}),
    desiredEnabled: input.desiredEnabled,
    bindingConfirmed: false,
    enabledConfirmed: false,
    phase: 'ready'
  }
}

export function restoreScopedCreateState(input: {
  ruleId: string
  version: number
  scope: AutomationScope
  attachRequestId: string
  desiredEnabled: boolean
  bindingConfirmed?: boolean
}): ScopedCreateState {
  return {
    fingerprint: `restored:${input.ruleId}`,
    createRequestId: '',
    attachRequestId: input.attachRequestId,
    scope: input.scope,
    desiredEnabled: input.desiredEnabled,
    bindingConfirmed: input.bindingConfirmed ?? false,
    enabledConfirmed: false,
    phase: 'attach-unknown',
    ruleId: input.ruleId,
    version: input.version
  }
}

export function resolveScopedEnableReadback(
  state: ScopedCreateState,
  actual: { version: number; enabled: boolean }
): { kind: 'confirmed' | 'retry' | 'changed'; state: ScopedCreateState } {
  if (actual.enabled) {
    return {
      kind: 'confirmed',
      state: { ...state, version: actual.version, enabledConfirmed: true, phase: 'attached' }
    }
  }
  if (actual.version !== state.version) return { kind: 'changed', state }
  return { kind: 'retry', state: { ...state, phase: 'enable-failed' } }
}

export async function runScopedCreateFlow(
  state: ScopedCreateState,
  operations: {
    create(requestId: string, enabled: boolean): Promise<{ id: string; version: number }>
    attach(ruleId: string, scope: AutomationScope, requestId: string): Promise<unknown>
    enable(ruleId: string, version: number): Promise<{ version: number; enabled: boolean }>
    isOutcomeUnknown(error: unknown): boolean
  }
): Promise<{ state: ScopedCreateState; error?: unknown }> {
  let next = state
  if (!next.ruleId) {
    try {
      const rule = await operations.create(next.createRequestId, next.scope ? false : next.desiredEnabled)
      next = {
        ...next,
        ruleId: rule.id,
        version: rule.version,
        phase: next.scope ? 'ready' : 'attached',
        bindingConfirmed: !next.scope,
        enabledConfirmed: !next.scope
      }
    } catch (error) {
      return {
        state: { ...next, phase: operations.isOutcomeUnknown(error) ? 'create-unknown' : 'create-failed' },
        error
      }
    }
  }

  if (next.phase === 'attached') return { state: next }
  if (next.scope && !next.bindingConfirmed) {
    try {
      await operations.attach(next.ruleId, next.scope, next.attachRequestId ?? '')
      next = { ...next, bindingConfirmed: true, phase: 'ready' }
    } catch (error) {
      return {
        state: { ...next, phase: operations.isOutcomeUnknown(error) ? 'attach-unknown' : 'attach-failed' },
        error
      }
    }
  }

  if (next.scope && next.desiredEnabled) {
    try {
      const enabled = await operations.enable(next.ruleId, next.version ?? 0)
      if (!enabled.enabled) throw new Error('规则仍处于禁用状态。')
      return { state: { ...next, version: enabled.version, enabledConfirmed: true, phase: 'attached' } }
    } catch (error) {
      return {
        state: { ...next, phase: operations.isOutcomeUnknown(error) ? 'enable-unknown' : 'enable-failed' },
        error
      }
    }
  }

  return { state: { ...next, enabledConfirmed: true, phase: 'attached' } }
}
