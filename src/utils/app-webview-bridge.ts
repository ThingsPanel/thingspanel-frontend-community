let bridgeReady: Promise<void> | null = null

export function ensureUniWebviewBridge(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  const win = window as Window & {
    uni?: { postMessage?: (options: { data: unknown }) => void; navigateTo?: (options: { url: string }) => void }
    __uniWebviewLoaded?: boolean
  }

  if (win.uni?.postMessage || win.__uniWebviewLoaded) {
    return Promise.resolve()
  }

  if (bridgeReady) return bridgeReady

  bridgeReady = new Promise(resolve => {
    const finish = () => resolve()

    if (document.querySelector('script[data-uni-webview-bridge]')) {
      document.addEventListener('UniAppJSBridgeReady', finish, { once: true })
      setTimeout(finish, 300)
      return
    }

    document.addEventListener('UniAppJSBridgeReady', finish, { once: true })

    const script = document.createElement('script')
    script.src = 'https://js.cdn.aliyun.dcloud.net.cn/dev/uni-app/uni.webview.1.5.4.js'
    script.dataset.uniWebviewBridge = 'true'
    script.onload = () => {
      win.__uniWebviewLoaded = true
      setTimeout(finish, 100)
    }
    script.onerror = finish
    document.head.appendChild(script)
  })

  return bridgeReady
}

export async function syncAppNativeNav(show: boolean) {
  await ensureUniWebviewBridge()

  const uniBridge = (window as Window & { uni?: { postMessage?: (options: { data: unknown }) => void } }).uni
  uniBridge?.postMessage?.({
    data: {
      type: 'nativeNav',
      show
    }
  })
}
