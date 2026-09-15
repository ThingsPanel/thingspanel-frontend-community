import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveBackendAbsoluteUrl } from './resolve-backend-url'

test('relative /tp/api/v1 without base throws (the white-screen footgun)', () => {
  assert.throws(() => new URL('/tp/api/v1'), /Invalid URL/)
})

test('resolves VITE_BASE_URL=/tp/ service url against the page origin', () => {
  const url = resolveBackendAbsoluteUrl('/tp/api/v1', 'https://yomitest.gwcz.online')
  assert.equal(url.href, 'https://yomitest.gwcz.online/tp/api/v1')
  assert.equal(url.origin, 'https://yomitest.gwcz.online')
})

test('falls back to origin /api/v1 when demo base is empty', () => {
  const url = resolveBackendAbsoluteUrl('', 'https://yomitest.gwcz.online')
  assert.equal(url.href, 'https://yomitest.gwcz.online/api/v1')
})
