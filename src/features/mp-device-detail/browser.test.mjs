// Run with MP_DEVICE_PREVIEW_TARGET and the standalone Vite server already running.
// PLAYWRIGHT_MODULE may point to an external local Playwright installation.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel:'chrome', headless:true })
const page = await browser.newPage({ viewport:{width:375,height:812} })
const errors=[], writes=[], historyQueries=[], invalidHistoryQueries=[]
const alarmQueries=[]
page.on('pageerror',error=>errors.push(error.message))
const origin=process.env.MP_DEVICE_PREVIEW_URL || 'http://127.0.0.1:5188'
await page.route('https://res.wx.qq.com/**',route=>route.fulfill({contentType:'text/javascript',body:'window.wx={miniProgram:{getEnv:f=>f({miniprogram:true}),switchTab:o=>{window.__lastNavigation=o.url;o.success()},navigateTo:o=>{window.__lastNavigation=o.url;o.success()}}}'}))
await page.route(origin+'/api/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname
  if(request.method()!=='GET') writes.push({path,body:request.postDataJSON()})
  let data
  if(path.includes('/device/detail/')) data={id:path.split('/').at(-1),name:'测试设备',is_online:0,device_config:{device_template_id:path.endsWith('visual')?'visual':'empty',device_type:1}}
  else if(path.includes('/device/template/detail/')) data={app_chart_config:path.endsWith('visual')?{canvas:{width:375,height:250},nodes:[{id:'gauge',type:'chart/echarts-gauge',props:{}}],dataSources:[]}:'[]'}
  else if(path.includes('/device/model/')) data={list:[{key:'temperature',name:'温度',data_type:'Number',unit:'℃'}]}
  else if(path.includes('/telemetry/datas/current/')) data=[{key:'temperature',value:26,ts:'2026-11-04T04:00:00Z'}]
  else if(path.includes('/telemetry/datas/statistic') || path.includes('/telemetry/datas/history/')) {
    const query=Object.fromEntries(url.searchParams)
    historyQueries.push(query)
    if(path.includes('/statistic') && query.aggregate_window==='no_aggregate' && Number(query.end_time)-Number(query.start_time)>86400000) {
      invalidHistoryQueries.push(query)
      return route.fulfill({json:{code:207001,message:'非聚合查询起始时间和结束时间的差值不能大于一天'}})
    }
    data={list:[{ts:1793760000000,value:25},{ts:1793760600000,value:26}],total:2}
  }
  else if(path==='/api/v1/alarm/info/history') {
    const query=Object.fromEntries(url.searchParams)
    alarmQueries.push(query)
    if(query.alarm_status==='H') await new Promise(resolve=>setTimeout(resolve,600))
    data=query.alarm_status?{list:[{id:'alarm-'+query.alarm_status+'-'+query.page,name:query.alarm_status+'-result',alarm_status:query.alarm_status}],total:2}:{list:[],total:0}
  }
  else if(path==='/api/v1/user/detail') data={id:'fixture-user',userName:'Fixture',tenantId:'fixture-tenant'}
  else if(path==='/api/v1/device') data={}
  else data={list:[],total:0}
  await route.fulfill({json:{code:200,data}})
})
await page.route(origin+'/thingsvis-api/auth/sso',route=>route.fulfill({json:{accessToken:'fixture-sso'}}))
await page.route(origin+'/main/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><body>可视化协议测试画布<script>window.addEventListener('message',e=>{if(e.data?.type==='tv:init'){parent.postMessage({type:'LOADED'},location.origin);parent.postMessage({type:'tv:render-ready'},location.origin);parent.postMessage({type:'tv:content-height',payload:{height:320}},location.origin)}});parent.postMessage({type:'READY'},location.origin)</script></body></html>`}))
// Fixture sockets must never connect to a real backend.
await page.addInitScript(()=>{window.WebSocket=class{readyState=0;send(){}close(){}addEventListener(){}removeEventListener(){}}})
try {
  const launch=id=>origin+'/mp-device/index.html#launch='+encodeURIComponent(JSON.stringify({token:'fixture-token',deviceId:id}))
  await page.goto(launch('fixture-device'))
  await page.getByRole('heading',{name:'测试设备'}).waitFor()
  assert.equal(new URL(page.url()).hash,'')
  await page.getByRole('button',{name:'趋势',exact:true}).click()
  await page.locator('.mp-history-chart canvas').waitFor()
  await page.getByRole('button',{name:/最近1小时/}).click()
  await page.getByRole('button',{name:'最近24小时',exact:true}).click()
  await page.getByRole('button',{name:'取消',exact:true}).click()
  assert.match(await page.locator('.mp-history-filters').innerText(),/最近1小时/)
  await page.getByRole('button',{name:/最近1小时/}).click()
  for(const width of [320,375,844]) {
    await page.setViewportSize({width,height:width===844?390:812})
    for(const label of ['取消','确定']) { const box=await page.getByRole('button',{name:label,exact:true}).boundingBox();assert.ok(box.x>=0 && box.x+box.width<=width && box.height>=44) }
  }
  await page.getByRole('button',{name:'最近24小时',exact:true}).click()
  await page.getByRole('button',{name:'确定',exact:true}).click()
  assert.match(await page.locator('.mp-history-filters').innerText(),/最近24小时/)
  const selectRange=async (current,next)=>{
    await page.locator('.mp-history-filters').getByRole('button',{name:new RegExp(current)}).click()
    await page.getByRole('button',{name:next,exact:true}).click()
    await page.getByRole('button',{name:'确定',exact:true}).click()
  }
  for(const [current,next,expected] of [['最近24小时','最近7天','30m'],['最近7天','最近60天','6h']]) {
    const count=historyQueries.length
    const response=page.waitForResponse(r=>r.url().includes('/telemetry/datas/statistic'))
    await selectRange(current,next)
    await response
    await page.locator('.mp-history-chart canvas').waitFor({state:'visible'})
    assert.equal(historyQueries.at(-1).aggregate_window,expected)
    assert.equal(historyQueries.at(-1).aggregate_function,'avg')
    assert.equal(historyQueries.length,count+1,'range adjustment sends only one valid request')
  }
  await page.locator('.mp-history-filters').getByRole('button',{name:/6小时/}).click()
  assert.equal(await page.getByRole('button',{name:'不聚合',exact:true}).isDisabled(),true)
  assert.equal(await page.getByRole('button',{name:'1分钟',exact:true}).isDisabled(),true)
  await page.getByRole('button',{name:'取消',exact:true}).click()
  await selectRange('最近60天','自定义时间')
  await page.getByLabel('开始时间',{exact:true}).fill('2026-10-01T00:00')
  await page.getByLabel('结束时间',{exact:true}).fill('2026-10-08T00:00')
  await page.waitForFunction(()=>document.querySelector('.mp-history-filters')?.innerText.includes('30分钟'))
  await page.locator('.mp-history-chart canvas').waitFor({state:'visible'})
  assert.equal(historyQueries.at(-1).aggregate_window,'30m')
  assert.deepEqual(invalidHistoryQueries,[],'never issue long raw-data requests')
  await page.getByRole('button',{name:'关闭',exact:true}).click()
  await page.setViewportSize({width:375,height:812})
  await page.getByRole('tab',{name:'自动化',exact:true}).click()
  await page.getByRole('button',{name:'新增',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.__lastNavigation),'/pages/automation/rule')
  await page.getByRole('tab',{name:'告警',exact:true}).click()
  await page.getByText('暂无告警历史',{exact:true}).waitFor()
  let alarmCount=alarmQueries.length
  let alarmResponse=page.waitForResponse(r=>r.url().includes('/alarm/info/history'))
  await page.getByLabel('开始日期',{exact:true}).fill('2026-10-01')
  await page.getByLabel('结束日期',{exact:true}).fill('2026-10-30')
  await alarmResponse
  assert.equal(alarmQueries.length,alarmCount+1,'consecutive date changes are merged')
  assert.match(alarmQueries.at(-1).start_time,/^2026-10-01T00:00:00/)
  assert.match(alarmQueries.at(-1).end_time,/^2026-10-30T23:59:59/)
  const delayedAlarm=page.waitForResponse(r=>r.url().includes('/alarm/info/history') && new URL(r.url()).searchParams.get('alarm_status')==='H')
  const highRequest=page.waitForRequest(r=>r.url().includes('/alarm/info/history') && new URL(r.url()).searchParams.get('alarm_status')==='H')
  await page.locator('.mp-date-filters select').selectOption('H')
  await highRequest
  await page.locator('.mp-date-filters select').selectOption('N')
  await page.getByText('N-result',{exact:true}).waitFor()
  await delayedAlarm
  assert.equal(await page.getByText('H-result',{exact:true}).count(),0,'stale responses cannot overwrite changed filters')
  await page.getByRole('button',{name:'加载更多',exact:true}).click()
  await page.waitForFunction(()=>document.querySelectorAll('.mp-alarm-row').length===2)
  assert.equal(alarmQueries.at(-1).page,'2')
  alarmResponse=page.waitForResponse(r=>r.url().includes('/alarm/info/history'))
  await page.getByRole('button',{name:'查询',exact:true}).click()
  await alarmResponse
  assert.equal(alarmQueries.at(-1).page,'1','manual query is retained and resets pagination')
  for(const name of ['最近24小时','最近7天','重置']) {
    alarmCount=alarmQueries.length
    alarmResponse=page.waitForResponse(r=>r.url().includes('/alarm/info/history'))
    await page.getByRole('button',{name,exact:true}).click()
    await alarmResponse
    await page.waitForTimeout(250)
    assert.equal(alarmQueries.length,alarmCount+1,'preset/reset sends exactly one request')
    assert.equal(alarmQueries.at(-1).page,'1')
  }
  alarmCount=alarmQueries.length
  await page.getByLabel('开始日期',{exact:true}).fill('')
  await page.getByRole('alert').filter({hasText:'请选择开始日期和结束日期'}).waitFor()
  assert.equal(alarmQueries.length,alarmCount,'incomplete dates do not send invalid queries')
  await page.getByLabel('开始日期',{exact:true}).fill('2026-10-01')
  await page.getByRole('tab',{name:'信息',exact:true}).click()
  await page.waitForTimeout(250)
  assert.equal(alarmQueries.length,alarmCount,'leaving the tab cancels the pending auto query')
  await page.getByRole('button',{name:'编辑',exact:true}).click()
  await page.getByRole('button',{name:'取消',exact:true}).click()
  assert.equal(writes.length,0,'cancel must not save')
  await page.getByRole('button',{name:'编辑设备名称'}).click()
  await page.getByRole('textbox',{name:'设备名称',exact:true}).fill('修改后的测试设备')
  await page.getByRole('button',{name:'保存',exact:true}).click()
  await page.getByRole('heading',{name:'修改后的测试设备'}).waitFor()
  assert.deepEqual(writes.at(-1).body,{id:'fixture-device',name:'修改后的测试设备'})
  await page.evaluate(url=>{location.href=url},launch('visual'))
  await page.waitForFunction(()=>!!document.querySelector('iframe') && !document.querySelector('.mp-frame-loading'))
  assert.equal(new URL(page.url()).hash,'')
  assert.equal(await page.locator('iframe').evaluate(el=>el.style.height),'320px')
  assert.equal(await page.locator('iframe').evaluate(el=>new URLSearchParams(el.src.split('?')[1]).get('embedSizing')),'content')
  await page.getByRole('navigation',{name:'主导航'}).getByRole('button',{name:'设备',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.__lastNavigation),'/pages/devices/index')
  assert.deepEqual(errors,[])
  assert.ok(historyQueries.length>=2)
  await mkdir('dist-mp-device-preview/qa',{recursive:true})
  await page.screenshot({path:'dist-mp-device-preview/qa/mobile-fixture.png'})
  console.log('PASS: launch scrub, telemetry/chart, filters, automatic alarm queries/debounce/stale responses/pagination/presets/manual query, 320/375/844px buttons, cancel/save, four tabs, iframe handshake/height, mini navigation; all writes mocked.')
} finally { await browser.close() }
