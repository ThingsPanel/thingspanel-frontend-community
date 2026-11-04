export const mainTabs = [
  { label: '首页', path: '/pages/dashboard/index', icon: 'dashboard' },
  { label: '看板', path: '/pages/dashboard/boards', icon: 'boards' },
  { label: '设备', path: '/pages/devices/index', icon: 'devices-selected' },
  { label: '自动化', path: '/pages/automation/index', icon: 'automation' },
  { label: '我的', path: '/pages/account/index', icon: 'account' }
]
const allowedPages = new Set(['/pages/automation/rule', '/pages/alarm-rules/editor', '/pages/devices/mp-export'])
let sdkPromise
export function miniProgramSdk() {
  if (window.wx?.miniProgram) return Promise.resolve(window.wx.miniProgram)
  if (!sdkPromise)
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
      const timer = setTimeout(() => reject(new Error('微信导航加载超时，请重试')), 12000)
      script.onload = () => {
        clearTimeout(timer)
        window.wx?.miniProgram ? resolve(window.wx.miniProgram) : reject(new Error('请在微信小程序内打开'))
      }
      script.onerror = () => {
        clearTimeout(timer)
        reject(new Error('微信导航加载失败，请重试'))
      }
      document.head.append(script)
    }).catch((error) => {
      sdkPromise = null
      throw error
    })
  return sdkPromise
}
export async function navigateMini(path, tab = false) {
  const pathname = path.split('?')[0]
  if (!(tab ? mainTabs.some((item) => item.path === pathname) : allowedPages.has(pathname)))
    throw new Error('页面地址无效')
  const sdk = await miniProgramSdk()
  const env = await new Promise((resolve) => sdk.getEnv(resolve))
  if (!env?.miniprogram) throw new Error('此操作请在微信小程序内使用')
  return new Promise((resolve, reject) =>
    sdk[tab ? 'switchTab' : 'navigateTo']({
      url: path,
      success: resolve,
      fail: () => reject(new Error('无法打开页面，请重试'))
    })
  )
}
