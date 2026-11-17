import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Router } from 'vue-router'
import { finishLoading, setupLoading, showLoadingError } from '@/plugins/loading'
import { createProgressGuard } from '@/router/guard/progress'
import { setupNProgress } from '@/plugins/nprogress'
import NProgress from 'nprogress'

vi.mock('@/utils/storage', () => ({ localStg: { get: () => null } }))

describe('startup and navigation loading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="app"></div>'
    window.NProgress = { start: vi.fn(), done: vi.fn() } as any
  })
  afterEach(() => {
    finishLoading()
    vi.useRealTimers()
  })

  it('uses central loading for startup and the progress bar for later navigation', () => {
    const hooks: Record<string, (...args: any[]) => void> = {}
    const router = Object.fromEntries(
      ['beforeEach', 'afterEach', 'onError'].map(name => [
        name,
        (callback: (...args: any[]) => void) => {
          hooks[name] = callback
        }
      ])
    ) as unknown as Router
    setupLoading()
    createProgressGuard(router)
    const next = vi.fn()
    hooks.beforeEach({}, {}, next)
    expect(next).toHaveBeenCalledOnce()
    expect(window.NProgress?.start).not.toHaveBeenCalled()
    finishLoading()
    hooks.beforeEach({}, {}, next)
    expect(window.NProgress?.start).toHaveBeenCalledOnce()
    hooks.onError(new Error('Failed to load route'))
    expect(window.NProgress?.done).toHaveBeenCalledOnce()
  })

  it('replaces stalled startup with a retry action after 20 seconds', () => {
    setupLoading()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
    vi.advanceTimersByTime(20000)
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
    expect(document.querySelector('[role="alert"] button')?.textContent).toBe('重新加载')
  })

  it('does not overwrite the mounted app on timeout or late failure', () => {
    setupLoading()
    const app = document.getElementById('app')!
    ;(app as any).__vue_app__ = {}
    app.textContent = 'Dashboard'
    finishLoading()
    vi.advanceTimersByTime(30000)
    showLoadingError()
    expect(app.textContent).toBe('Dashboard')
  })

  it('disables the redundant top-right spinner', () => {
    setupNProgress()
    expect(NProgress.settings.showSpinner).toBe(false)
  })
})
