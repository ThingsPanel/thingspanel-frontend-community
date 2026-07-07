let bridgeReady: Promise<void> | null = null

function finishBridge(resolve: () => void) {
  resolve()
}

export function ensureUniWebviewBridge(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  const win = window as Window & {
    uni?: { postMessage?: (options: { data: unknown }) => void }
    __uniWebviewLoaded?: boolean
  }

  if (win.uni?.postMessage || win.__uniWebviewLoaded) {
    return Promise.resolve()
  }

  if (bridgeReady) return bridgeReady

  bridgeReady = new Promise(resolve => {
    if (document.querySelector('script[data-uni-webview-bridge]')) {
      document.addEventListener('UniAppJSBridgeReady', () => finishBridge(resolve), { once: true })
      setTimeout(() => finishBridge(resolve), 300)
      return
    }

    document.addEventListener('UniAppJSBridgeReady', () => finishBridge(resolve), { once: true })

    const script = document.createElement('script')
    script.src = 'https://js.cdn.aliyun.dcloud.net.cn/dev/uni-app/uni.webview.1.5.4.js'
    script.dataset.uniWebviewBridge = 'true'
    script.onload = () => {
      win.__uniWebviewLoaded = true
      setTimeout(() => finishBridge(resolve), 100)
    }
    script.onerror = () => finishBridge(resolve)
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
