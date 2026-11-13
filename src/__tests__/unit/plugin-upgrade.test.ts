import { describe, expect, it, vi } from 'vitest'
import type { CatalogItem, Installation } from '@/service/api/plugin-install'
import { createPluginUpgrader, isUpgradeBusy, upgradablePlugins } from '@/utils/plugin-upgrade'
import type { PluginUpgradeRowState } from '@/utils/plugin-upgrade'

const inst = (over: Partial<Installation>): Installation =>
  ({
    id: 'i1',
    plugin_id: 'p',
    state: 'installing',
    desired: 'enabled',
    generation: 1,
    version: '1.0.0',
    health: '',
    op_id: '',
    op_step: '',
    error_code: '',
    config: {},
    secrets_set: [],
    updated_at: '',
    ...over
  }) as Installation

const item = (over: Partial<CatalogItem>): CatalogItem =>
  ({
    id: 'p',
    display_name: 'P',
    version: '1.1.0',
    description: '',
    service_identifier: 's',
    fields: {},
    installation: inst({}),
    ...over
  }) as CatalogItem

describe('upgradablePlugins', () => {
  it('keeps only installed plugins with update_available', () => {
    const list = [
      item({ id: 'a', update_available: true }),
      item({ id: 'b', update_available: false }),
      item({ id: 'c' }),
      item({ id: 'd', update_available: true, installation: null })
    ]
    expect(upgradablePlugins(list).map(i => i.id)).toEqual(['a'])
    expect(upgradablePlugins(undefined)).toEqual([])
  })
  it('isUpgradeBusy', () => {
    expect(isUpgradeBusy('starting')).toBe(true)
    expect(isUpgradeBusy('installing')).toBe(true)
    expect(isUpgradeBusy('failed')).toBe(false)
    expect(isUpgradeBusy(undefined)).toBe(false)
  })
})

function setup(opts: { upgrade?: any; retry?: any; polls?: any[]; now?: () => number; maxMs?: number }) {
  const timers: Array<() => void> = []
  const states: PluginUpgradeRowState[] = []
  const polls = [...(opts.polls ?? [])]
  const getInstallation = vi.fn(async () => polls.shift() ?? { error: new Error('x') })
  const upgrade = vi.fn(opts.upgrade ?? (async () => ({ data: inst({ state: 'installing' }) })))
  const retry = vi.fn(opts.retry ?? (async () => ({ data: inst({ state: 'installing' }) })))
  const up = createPluginUpgrader({
    upgrade,
    retry,
    getInstallation,
    errorCode: (e: any) => e?.code ?? '',
    onChange: (_id, s) => states.push(s),
    setTimer: fn => timers.push(fn),
    clearTimer: () => {},
    now: opts.now,
    maxMs: opts.maxMs
  })
  const flush = () => new Promise(r => setTimeout(r, 0))
  return { up, states, timers, getInstallation, upgrade, retry, flush }
}

describe('createPluginUpgrader', () => {
  it('polls installing -> enabled and reports the new version', async () => {
    const t = setup({
      polls: [
        { data: inst({ state: 'installing', op_step: 'agent' }) },
        { data: inst({ state: 'enabled', version: '1.1.0', generation: 2 }) }
      ]
    })
    await t.up.start('i1')
    expect(t.states.map(s => s.phase)).toEqual(['starting', 'installing'])
    t.timers.shift()!()
    await t.flush()
    expect(t.states.at(-1)).toMatchObject({ phase: 'installing', opStep: 'agent' })
    t.timers.shift()!()
    await t.flush()
    expect(t.states.at(-1)).toEqual({ phase: 'success', version: '1.1.0' })
    expect(t.timers).toHaveLength(0)
    expect(t.up.isActive('i1')).toBe(false)
  })

  it('failed installation carries error_code and op_step, and stops polling', async () => {
    const t = setup({ polls: [{ data: inst({ state: 'failed', error_code: 'health_failed', op_step: 'health' }) }] })
    await t.up.start('i1')
    t.timers.shift()!()
    await t.flush()
    expect(t.states.at(-1)).toEqual({ phase: 'failed', errorCode: 'health_failed', opStep: 'health' })
    expect(t.timers).toHaveLength(0)
  })

  it('a refused request (409 UP_TO_DATE) is an apiError and never polls', async () => {
    const t = setup({ upgrade: async () => ({ error: { code: 'UP_TO_DATE' } }) })
    await t.up.start('i1')
    expect(t.states.at(-1)).toEqual({ phase: 'failed', errorCode: 'UP_TO_DATE', apiError: true })
    expect(t.timers).toHaveLength(0)
    expect(t.getInstallation).not.toHaveBeenCalled()
  })

  it('does not start a second run for the same installation while one is active', async () => {
    const t = setup({})
    expect(await t.up.start('i1')).toBe(true)
    expect(await t.up.start('i1')).toBe(false)
    expect(t.upgrade).toHaveBeenCalledOnce()
  })

  it('retry mode calls the retry endpoint, not upgrade', async () => {
    const t = setup({})
    await t.up.start('i1', 'retry')
    expect(t.retry).toHaveBeenCalledOnce()
    expect(t.upgrade).not.toHaveBeenCalled()
  })

  it('transient poll errors keep polling; maxMs gives "timeout"', async () => {
    let clock = 0
    const t = setup({ now: () => clock, maxMs: 1000, polls: [{ error: new Error('net') }] })
    await t.up.start('i1')
    t.timers.shift()!()
    await t.flush()
    expect(t.timers).toHaveLength(1) // still polling after the error
    clock = 5000
    t.timers.shift()!()
    await t.flush()
    expect(t.states.at(-1)).toEqual({ phase: 'timeout' })
    expect(t.up.isActive('i1')).toBe(false)
  })

  it('dispose stops all runs', async () => {
    const t = setup({})
    await t.up.start('i1')
    t.up.dispose()
    t.timers.shift()!()
    await t.flush()
    expect(t.getInstallation).not.toHaveBeenCalled()
  })
})
