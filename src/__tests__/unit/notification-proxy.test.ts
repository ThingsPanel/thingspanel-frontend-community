import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../env.config', () => ({
  createProxyPattern: () => '/proxy-default',
  createServiceConfig: () => ({
    baseURL: 'http://business.example.test/api/v1',
    otherBaseURL: {}
  })
}))

import { createViteProxy } from '../../../build/config/proxy'

function proxy(target?: string) {
  return createViteProxy({
    VITE_HTTP_PROXY: 'Y',
    VITE_NOTIFICATION_DEV_PROXY_TARGET: target
  } as Env.ImportMeta)?.['/notification-core']
}

describe('notification development gateway', () => {
  it('explicitly reuses the business origin without its v1 prefix', () => {
    const configured = proxy('business')
    expect(configured?.target).toBe('http://business.example.test')
    expect(configured?.rewrite?.('/notification-core/api/v2/notification-groups?page=1')).toBe(
      '/api/v2/notification-groups?page=1'
    )
  })

  it('does not configure a fallback when no target was selected', () => {
    expect(proxy()).toBeUndefined()
  })

  it.each(['https://notifications.example.test', 'http://127.0.0.1:4000', 'http://localhost:4000'])(
    'retains explicit split-service targets: %s',
    target => {
      expect(proxy(target)?.target).toBe(target)
    }
  )

  it.each([
    'http://business.example.test',
    'http://unrelated.example.test',
    'https://user:password@notifications.example.test',
    'https://notifications.example.test/other',
    'https://notifications.example.test?token=secret',
    'ftp://notifications.example.test'
  ])('rejects unsafe explicit origins: %s', target => {
    expect(() => proxy(target)).toThrow()
  })
})

describe('automation development gateway', () => {
  function automationProxy(target?: string) {
    return createViteProxy({
      VITE_HTTP_PROXY: 'Y',
      VITE_AUTOMATION_DEV_PROXY_TARGET: target
    } as Env.ImportMeta)?.['/automation-core']
  }

  it('keeps the automation mount when explicitly using the business gateway', () => {
    const configured = automationProxy('business')
    expect(configured?.target).toBe('http://business.example.test')
    expect(configured?.rewrite?.('/automation-core/v1/alarms?limit=10')).toBe('/automation-core/v1/alarms?limit=10')
  })

  it('strips the mount when connecting directly to an engine', () => {
    const configured = automationProxy('http://127.0.0.1:14000')
    expect(configured?.target).toBe('http://127.0.0.1:14000')
    expect(configured?.rewrite?.('/automation-core/v1/alarms?limit=10')).toBe('/v1/alarms?limit=10')
  })

  it('does not configure an implicit fallback', () => {
    expect(automationProxy()).toBeUndefined()
  })

  it.each([
    'http://business.example.test',
    'http://unrelated.example.test',
    'https://user:password@automation.example.test',
    'https://automation.example.test/path',
    'https://automation.example.test?token=secret',
    'ftp://automation.example.test'
  ])('rejects unsafe standalone origins: %s', target => {
    expect(() => automationProxy(target)).toThrow()
  })
})
