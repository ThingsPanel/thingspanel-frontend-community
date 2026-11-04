import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const origin = process.env.MP_DEVICE_PREVIEW_URL || 'http://127.0.0.1:5188'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
const errors = []
page.on('pageerror', error => errors.push(error.message))
await page.route(origin + '/scroll-fixture*', route => route.fulfill({ contentType: 'text/html', body: `
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>body{margin:0}.page{height:100dvh;display:flex;flex-direction:column}.scroll{flex:1;min-height:0;overflow:auto}.header{height:100px}iframe{display:block;width:100%;height:250px;border:0}.footer{height:64px;flex-shrink:0}</style>
  <div class="page"><div class="scroll"><div class="header">设备详情</div><iframe></iframe></div><div class="footer">设备</div></div>
  <script type="module">
  import {attachFrameLayout} from '/src/features/mp-device-detail/frame-layout.js';
  const frame=document.querySelector('iframe');
  window.disposeLayout=attachFrameLayout(frame,document.querySelector('.scroll'),{contentSized:!location.search.includes('fixed=1')});
  frame.src='/scroll-canvas';
  </script>` }))
await page.route(origin + '/scroll-canvas', route => route.fulfill({ contentType: 'text/html', body: `
  <meta charset="utf-8"><style>body{margin:0}.thingsvis-embed-surface{height:100vh;overflow:auto}.fixed{height:1250px}.chart{height:1300px;touch-action:none;position:relative}canvas{width:100%;height:1200px;touch-action:none}button{position:absolute;top:15px;left:15px;height:44px;width:100px}.last{position:absolute;bottom:0}</style>
  <div id="root"><div class="thingsvis-embed-surface"><div class="fixed"><div class="chart"><canvas></canvas><button>图表操作</button><span class="last">最后一行</span></div></div></div></div>
  <script>
  window.taps=0;window.moves=0;
  document.querySelector('button').onclick=()=>window.taps++;
  document.querySelector('.chart').addEventListener('touchmove',e=>{window.moves++;e.preventDefault()},{passive:false});
  </script>` }))
try {
  await page.goto(origin + '/scroll-fixture')
  await page.waitForFunction(() => document.querySelector('iframe').clientHeight === 1300)
  const canvas = page.frames().find(frame => frame.url().endsWith('/scroll-canvas'))
  const nestedScrolls = () => canvas.evaluate(() => [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 1 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowY)).length)
  assert.equal(await nestedScrolls(), 0, 'no iframe scroll container')
  await canvas.getByRole('button', { name: '图表操作' }).tap()
  assert.equal(await canvas.evaluate(() => window.taps), 1, 'taps still work')
  const cdp = await page.context().newCDPSession(page)
  const swipe = async (from, to) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from[0], y: from[1] }] })
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from[0] + (to[0] - from[0]) * i / 8, y: from[1] + (to[1] - from[1]) * i / 8 }] })
      await page.waitForTimeout(20)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  await swipe([180, 600], [180, 240])
  await page.waitForFunction(() => document.querySelector('.scroll').scrollTop > 200)
  assert.equal(await canvas.evaluate(() => document.querySelector('.thingsvis-embed-surface').scrollTop), 0)
  await page.waitForTimeout(500)
  const down = await page.locator('.scroll').evaluate(el => el.scrollTop)
  await swipe([180, 250], [180, 600])
  await page.waitForFunction(before => document.querySelector('.scroll').scrollTop < before - 100, down)
  await page.waitForTimeout(500)
  await page.locator('.scroll').evaluate(el => { el.scrollTop = 0 })
  await swipe([100, 400], [260, 400])
  assert.ok(await canvas.evaluate(() => window.moves) > 0, 'horizontal chart gestures remain available')
  await page.mouse.move(180, 350)
  await page.mouse.wheel(0, 250)
  await page.waitForFunction(() => document.querySelector('.scroll').scrollTop >= 200)
  await canvas.evaluate(() => { const extra = document.createElement('div'); extra.style.height = '1500px'; document.querySelector('.thingsvis-embed-surface').append(extra) })
  await page.waitForFunction(() => document.querySelector('iframe').clientHeight >= 2750)
  assert.equal(await nestedScrolls(), 0)
  await page.goto(origin + '/scroll-fixture?fixed=1')
  await page.locator('iframe').waitFor()
  const fixed = page.frames().find(frame => frame.url().endsWith('/scroll-canvas'))
  await fixed.waitForSelector('.thingsvis-embed-surface')
  assert.equal(await page.locator('iframe').evaluate(el => el.clientHeight), 250, 'fixed canvases retain the host-computed viewport')
  assert.equal(await fixed.locator('.thingsvis-embed-surface').evaluate(el => el.clientHeight), 250, 'fixed canvas viewport must not collapse')
  assert.deepEqual(errors, [])
  console.log('PASS: full content height, one scroll owner, vertical swipes over chart in both directions, horizontal chart gestures, taps, wheel and dynamic content.')
} finally { await browser.close() }
