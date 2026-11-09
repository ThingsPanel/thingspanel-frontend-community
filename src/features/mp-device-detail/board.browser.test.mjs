import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const origin = process.env.MP_DEVICE_PREVIEW_URL || 'http://127.0.0.1:5189'
const calls = [], writes = [], errors = []
page.on('pageerror', error => errors.push(error.message))
const source = id => `__platform_${id}__`
const dashboard = { id: 'board-a', name: '测试看板', canvasConfig: { mode: 'grid', width: 390, height: 844 },
  nodes: [{ id: 'history', props: { value: '{{ ds.__platform_sensor__.data.pm25__history }}' } }],
  dataSources: ['sensor', 'switch'].map(id => ({ id: source(id), type: 'PLATFORM_FIELD', config: { deviceId: id } })) }
await page.addInitScript(() => {
  localStorage.setItem('token', 'existing-admin-token')
  window.__sockets = []
  window.WebSocket = class extends EventTarget {
    closed = false; sent = []
    constructor(url) { super(); this.url = url; window.__sockets.push(this); setTimeout(() => this.dispatchEvent(new Event('open')), 0) }
    send(data) { this.sent.push(data) }
    close() { this.closed = true }
  }
})
await page.route(origin + '/api/**', async route => {
  const req = route.request(), url = new URL(req.url()), path = url.pathname
  calls.push({ path, query: Object.fromEntries(url.searchParams), token: req.headers()['x-token'] })
  let data = []
  if (path.includes('/device/detail/')) data = { id: path.split('/').at(-1), name: '设备', is_online: 1, device_config: { device_template_id: path.split('/').at(-1) } }
  else if (path.includes('/device/model/telemetry')) data = { list: [{ key: url.searchParams.get('device_template_id') === 'sensor' ? 'pm25' : 'switch', data_type: 'number' }] }
  else if (path.includes('/telemetry/datas/current/')) data = path.endsWith('sensor') ? [{ key: 'pm25', value: 28 }] : [{ key: 'switch', value: 1 }]
  else if (path.includes('/telemetry/datas/statistic')) data = [{ ts: 1793760000000, value: 27 }]
  else if (path.endsWith('/datas/pub')) { writes.push(req.postDataJSON()); data = {} }
  await route.fulfill({ json: { code: 200, data } })
})
await page.route(origin + '/thingsvis-api/**', async route => {
  assert.equal(route.request().headers().authorization, 'Bearer vis-test')
  await route.fulfill({ json: dashboard })
})
await page.route(origin + '/main/**', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><body>看板<script>
window.messages=[];window.send=message=>parent.postMessage(message,location.origin);
addEventListener('message',e=>{messages.push(e.data);if(e.data.type==='tv:init'){window.config=e.data.payload.config;send({type:'LOADED'});send({type:'tv:render-ready'});send({type:'thingsvis:requestFieldData',payload:{deviceId:'sensor',dataSourceId:'__platform_sensor__',fieldIds:['pm25__history']}})}});
send({type:'READY',payload:{renderReadyModes:['grid']}});
</script></body></html>` }))
try {
  const launch = { kind: 'board', boardId: 'board-a', token: 'platform-test', visToken: 'vis-test' }
  await page.goto(origin + '/mp-device/index.html#launch=' + encodeURIComponent(JSON.stringify(launch)))
  await page.waitForFunction(() => document.querySelector('.mp-board-frame:not(.mp-board-hidden)'))
  assert.equal(await page.title(), '测试看板')
  assert.equal(new URL(page.url()).hash, '')
  assert.equal(await page.evaluate(() => localStorage.getItem('token')), 'existing-admin-token')
  const frame = page.frames()[1]
  const initial = await frame.evaluate(() => ({ config, messages }))
  assert.equal(initial.config.platformToken, 'platform-test')
  assert.equal(initial.config.platformApiBaseUrl, origin + '/api/v1')
  assert.ok(initial.messages.some(m => m.type === 'tv:platform-data' && m.payload.deviceId === 'sensor' && m.payload.fields.pm25 === 28))
  assert.ok(initial.messages.some(m => m.type === 'tv:platform-data' && m.payload.deviceId === 'switch' && m.payload.fields.switch === 1))
  await frame.waitForFunction(() => messages.some(m => m.type === 'tv:platform-history' && m.payload.history[0].value === 27))
  assert.ok(calls.every(c => c.token === 'platform-test'))
  assert.equal(calls.filter(c => c.path.includes('/statistic')).length, 1, 'initial and requested history coalesce')
  await page.evaluate(() => {
    const socket = __sockets.find(s => s.url.includes('/telemetry/') && s.sent.some(v => v.includes('sensor')))
    socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ pm25: 42 }) }))
  })
  await frame.waitForFunction(() => messages.some(m => m.type === 'tv:platform-data' && m.payload.fields.pm25 === 42))
  await frame.evaluate(() => {
    const valid = { type: 'tv:platform-write', requestId: 'write-1', payload: { dataSourceId: '__platform_switch__', deviceId: 'switch', data: { switch: 0 } } }
    send(valid); send(valid)
    send({ ...valid, requestId: 'wrong-device', payload: { ...valid.payload, deviceId: 'sensor' } })
    send({ ...valid, requestId: 'wrong-source', payload: { ...valid.payload, dataSourceId: 'unknown' } })
  })
  await frame.waitForFunction(() => messages.filter(m => m.type === 'tv:platform-write-result').length === 4)
  assert.equal(writes.length, 1, 'duplicate and misrouted writes never send extra device commands')
  assert.deepEqual(writes[0], { device_id: 'switch', value: '{"switch":0}' })
  const replies = await frame.evaluate(() => messages.filter(m => m.type === 'tv:platform-write-result'))
  assert.ok(replies.filter(m => m.requestId.startsWith('wrong')).every(m => !m.success))
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
  assert.equal(await page.evaluate(() => __sockets.filter(s => s.url.includes('/api/')).every(s => s.closed)), true)
  assert.equal(await page.locator('iframe').count(), 0)
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')) })
  await page.waitForFunction(() => document.querySelector('.mp-board-frame:not(.mp-board-hidden)') && __sockets.filter(s => s.url.includes('/api/')).length === 8)
  assert.equal(await page.evaluate(() => __sockets.filter(s => s.url.includes('/api/') && !s.closed).length), 4)
  assert.deepEqual(errors, [])
  console.log('PASS: board host credentials, realtime multi-device values, history, socket updates, write isolation/deduplication, tab storage, teardown and resume.')
} finally { await browser.close() }
