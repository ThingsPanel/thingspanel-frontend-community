import assert from 'node:assert/strict'
import test from 'node:test'
import { AxiosHeaders } from 'axios'
import type { AxiosRequestHeaders } from 'axios'
import { applyThingsPanelAuth, refreshThingsPanelAuth } from './auth-headers'

test('dashboard requests retain ThingsVis authorization and authenticate ThingsPanel with x-token', () => {
  const headers = new AxiosHeaders({ authorization: 'Bearer thingsvis-token' }) as AxiosRequestHeaders
  applyThingsPanelAuth(headers, 'thingspanel-token')
  assert.equal(headers.get('Authorization'), 'Bearer thingsvis-token')
  assert.equal(headers.get('x-token'), 'thingspanel-token')
})

test('ordinary requests receive ThingsPanel authentication', () => {
  const headers = new AxiosHeaders() as AxiosRequestHeaders
  applyThingsPanelAuth(headers, 'thingspanel-token')
  assert.equal(headers.get('Authorization'), 'Bearer thingspanel-token')
  assert.equal(headers.get('x-token'), 'thingspanel-token')
})

test('requests without a ThingsPanel session retain their supplied headers', () => {
  const headers = new AxiosHeaders({ Authorization: 'Bearer thingsvis-token' }) as AxiosRequestHeaders
  applyThingsPanelAuth(headers, null)
  assert.equal(headers.get('Authorization'), 'Bearer thingsvis-token')
  assert.equal(headers.has('x-token'), false)
})

test('refreshing ThingsPanel authentication preserves ThingsVis authorization on retry', () => {
  const headers = new AxiosHeaders({ Authorization: 'Bearer thingsvis-token', 'x-token': 'old-token' }) as AxiosRequestHeaders
  refreshThingsPanelAuth(headers, 'new-token')
  assert.equal(headers.get('Authorization'), 'Bearer thingsvis-token')
  assert.equal(headers.get('x-token'), 'new-token')
})

test('refreshing an ordinary request replaces both ThingsPanel headers', () => {
  const headers = new AxiosHeaders({ Authorization: 'Bearer old-token', 'x-token': 'old-token' }) as AxiosRequestHeaders
  refreshThingsPanelAuth(headers, 'new-token')
  assert.equal(headers.get('Authorization'), 'Bearer new-token')
  assert.equal(headers.get('x-token'), 'new-token')
})
