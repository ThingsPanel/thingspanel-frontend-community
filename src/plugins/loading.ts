// @unocss-include
import { getRgbOfColor } from '@sa/utils'
import { localStg } from '@/utils/storage'
import systemLogo from '@/assets/svg-icon/logo.svg?raw'

export function setupLoading() {
  const app = document.getElementById('app')
  if (!app) return

  // If Vue has already mounted on #app, never overwrite its DOM.
  // Vue 3 attaches a private reference on the mount container.
  if ((app as any).__vue_app__) return

  const themeColor = localStg.get('themeColor') || '#646cff'
  const logoLoading = localStg.get('logoLoading') || ''

  const { r, g, b } = getRgbOfColor(themeColor)

  const primaryColor = `--primary-color: ${r} ${g} ${b}`

  const logoWithClass = logoLoading
    ? `<img src="${logoLoading}" alt="" style="display: block; max-width: 128px; max-height: 32px; width: auto; height: auto; object-fit: contain">`
    : systemLogo.replace('<svg', `<svg class="block w-128px h-auto"`)

  const loading = `
<div class="fixed-center flex items-center justify-center gap-20px" role="status" aria-label="正在加载" aria-busy="true" style="${primaryColor}">
  ${logoWithClass}
  <svg class="block size-18px animate-spin text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.18" stroke-width="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-linecap="round" stroke-width="2.5" />
  </svg>
</div>`

  app.innerHTML = loading
}
