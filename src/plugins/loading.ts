// @unocss-include
import { getRgbOfColor } from '@sa/utils'
import { localStg } from '@/utils/storage'

let startupPending = true
let loadingTimer: ReturnType<typeof setTimeout> | undefined

export function isStartupPending() {
  return startupPending
}

export function finishLoading() {
  startupPending = false
  clearTimeout(loadingTimer)
}

/** Keep failures actionable without replacing an already mounted application. */
export function showLoadingError() {
  clearTimeout(loadingTimer)
  window.NProgress?.done?.()
  const app = document.getElementById('app')
  if (!app || (app as any).__vue_app__) return
  const english = localStg.get('lang') === 'en-US'
  const panel = document.createElement('div')
  panel.className = 'fixed-center flex flex-col items-center gap-16px'
  panel.setAttribute('role', 'alert')
  const message = document.createElement('p')
  message.textContent = english ? 'Unable to load. Please try again.' : '加载未完成，请重试。'
  const retry = document.createElement('button')
  retry.type = 'button'
  retry.className = 'rounded-4px px-16px py-8px bg-primary text-white cursor-pointer'
  retry.textContent = english ? 'Retry' : '重新加载'
  retry.addEventListener('click', () => window.location.reload())
  panel.append(message, retry)
  app.replaceChildren(panel)
}

export function setupLoading() {
  const app = document.getElementById('app')
  if (!app) return

  // If Vue has already mounted on #app, never overwrite its DOM.
  // Vue 3 attaches a private reference on the mount container.
  if ((app as any).__vue_app__) return

  startupPending = true
  clearTimeout(loadingTimer)
  loadingTimer = setTimeout(showLoadingError, 20000)

  const themeColor = localStg.get('themeColor') || '#646cff'

  const { r, g, b } = getRgbOfColor(themeColor)

  const primaryColor = `--primary-color: ${r} ${g} ${b}`

  const loading = `
<div class="fixed-center" role="status" aria-label="${localStg.get('lang') === 'en-US' ? 'Loading' : '正在加载'}" aria-busy="true" style="${primaryColor}">
  <svg class="block size-24px animate-spin text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.18" stroke-width="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-linecap="round" stroke-width="2.5" />
  </svg>
</div>`

  app.innerHTML = loading
}
