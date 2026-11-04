import { createApp } from 'vue'
import DeviceDetail from './DeviceDetail.vue'
import Board from './Board.vue'
import { readLaunch, createApi } from './session.js'
import './style.css'

let app, context
function launch(raw) {
  app?.unmount()
  context?.dispose()
  app = null
  context = null
  const host = document.getElementById('mp-device')
  host.className = ''
  host.removeAttribute('role')
  host.textContent = ''
  try {
    const session = readLaunch(raw)
    context = createApi(session)
    app = createApp(session.kind === 'board' ? Board : DeviceDetail, { session })
    app.provide('mp-device', context)
    app.mount(host)
  } catch (error) {
    host.className = 'mp-launch-error'
    host.setAttribute('role', 'alert')
    host.textContent = error.message || '设备页面加载失败，请返回后重试'
  }
}
launch(window.__mpDeviceLaunch)
delete window.__mpDeviceLaunch
window.addEventListener('hashchange', () => {
  const raw = location.hash.slice(1)
  history.replaceState(null, '', location.pathname + location.search)
  if (raw) launch(raw)
})
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) {
    app?.unmount()
    context?.dispose()
  }
})
