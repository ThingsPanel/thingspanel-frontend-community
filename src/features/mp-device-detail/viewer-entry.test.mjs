import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveViewerEntry } from './viewer-entry.js'

test('selects and shares the verified mini viewer probe without sending credentials', async () => {
  let calls = 0
  const fetchImpl = async (url, options) => {
    calls++
    assert.equal(url, 'https://new.example/main/miniViewer.html')
    assert.equal(options.credentials, 'omit')
    assert.equal(options.redirect, 'error')
    return new Response('<meta name="thingsvis-mini-viewer" content="1">')
  }
  const first = resolveViewerEntry('https://new.example/main/', { fetchImpl })
  const second = resolveViewerEntry('https://new.example/main/', { fetchImpl })
  assert.equal(first, second)
  assert.equal(await first, 'https://new.example/main/miniViewer.html')
  assert.equal(calls, 1)
})

test('old deployments, SPA fallbacks and network failures retain the original viewer', async () => {
  const cases = [
    () => new Response('Not found', { status: 404 }),
    () => new Response('<div id="root">Original studio entry</div>'),
    () => { throw new Error('network unavailable') }
  ]
  for (let i = 0; i < cases.length; i++) {
    const base = `https://legacy-${i}.example/main/`
    assert.equal(await resolveViewerEntry(base, { fetchImpl: cases[i] }), base)
  }
})

test('a stalled capability probe is aborted without blocking device navigation', async () => {
  let aborted = false
  const fetchImpl = (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')) })
  })
  const base = 'https://timeout.example/main/'
  assert.equal(await resolveViewerEntry(base, { fetchImpl, timeoutMs: 10 }), base)
  assert.equal(aborted, true)
})
