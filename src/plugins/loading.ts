// @unocss-include
import { getRgbOfColor } from '@sa/utils'
import { $t } from '@/locales'
import { localStg } from '@/utils/storage'
import systemLogo from '@/assets/svg-icon/logo.svg?raw'

export function setupLoading() {
  const themeColor = localStg.get('themeColor') || '#646cff'
  const logoLoading = localStg.get('logoLoading') || ''

  const { r, g, b } = getRgbOfColor(themeColor)

  const primaryColor = `--primary-color: ${r} ${g} ${b}`

  const loadingClasses = [
    'left-0 top-0',
    'left-0 bottom-0 animate-delay-500',
    'right-0 top-0 animate-delay-1000',
    'right-0 bottom-0 animate-delay-1500'
  ]

  const logoWithClass = logoLoading
    ? `<img src="${logoLoading}" style="max-width: 88px; height: auto">`
    : systemLogo.replace('<svg', `<svg class="size-128px text-primary"`)

  const dot = loadingClasses
    .map(item => {
      return `<div class="absolute w-10px h-10px bg-primary rounded-8px animate-pulse ${item}"></div>`
    })
    .join('\n')

  const loading = `
<div class="fixed-center flex-col" style="${primaryColor}">
  ${logoWithClass}
  <div class="w-32px h-32px my-36px">
    <div class="relative h-full animate-spin">
      ${dot}
    </div>
  </div>
  <h2 class="text-28px text-center font-500 text-#646464">${'ThingsPanel'}</h2>
</div>`

  const app = document.getElementById('app')
  if (app) {
    app.innerHTML = loading
  }
}
