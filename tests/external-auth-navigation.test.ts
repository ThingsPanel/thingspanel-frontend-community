import assert from 'node:assert/strict'
import test from 'node:test'
import { safeReturnPath, rememberAuthReturn, consumeAuthReturn } from '../src/components/auth/navigation'
import { initializeExternalSession } from '../src/components/auth/session'

const storage = new Map<string, string>()
Object.assign(globalThis, {
  window: { location: { origin: 'https://panel.example' } },
  sessionStorage: {
    setItem: (k: string, v: string) => storage.set(k, v),
    getItem: (k: string) => storage.get(k) ?? null,
    removeItem: (k: string) => storage.delete(k)
  }
})

test('external authentication never restores an external or recursive login destination', () => {
  for (const path of [
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\n/evil',
    '/login',
    '/login/pwd-login',
    '/auth-callback?ticket=anything',
    '/a/../login',
    undefined,
    ['//evil']
  ]) {
    assert.equal(safeReturnPath(path), '/home')
  }
  assert.equal(safeReturnPath('/personal-center?tab=security#bindings'), '/personal-center?tab=security#bindings')
})

test('return destination survives provider navigation but is consumed once', () => {
  rememberAuthReturn('/personal-center')
  assert.equal(consumeAuthReturn(), '/personal-center')
  assert.equal(consumeAuthReturn(), '/home')
  rememberAuthReturn('//attacker.example')
  assert.equal(consumeAuthReturn(), '/home')
})

test('failed user detail initialization clears a partially stored login', async () => {
  for (const load of [
    async () => ({ loop: false }),
    async () => {
      throw new Error('AUTH_503')
    }
  ]) {
    let cleared = false
    await assert.rejects(
      initializeExternalSession(load, async () => {
        cleared = true
      })
    )
    assert.equal(cleared, true)
  }
})

test('successful user initialization retains the session', async () => {
  let cleared = false
  await initializeExternalSession(
    async () => ({ loop: true }),
    async () => {
      cleared = true
    }
  )
  assert.equal(cleared, false)
})
