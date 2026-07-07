let bridgeReady: Promise<void> | null = null

export function ensureUniWebviewBridge(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  const win = window as Window & {
    uni?: { navigateTo?: (options: { url: string }) => void }
    __uniWebviewLoaded?: boolean
  }

  if (win.uni?.navigateTo || win.__uniWebviewLoaded) {
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

/** App 内打开独立 WebView 子页，使用原生返回栏（同设备详情） */
export async function openAppWebViewPage(
  pageUrl: string,
  title?: string,
  fallback?: () => void
): Promise<boolean> {
  await ensureUniWebviewBridge()

  const uniBridge = (window as Window & { uni?: { navigateTo?: (options: { url: string }) => void } }).uni
  if (!uniBridge?.navigateTo) {
    fallback?.()
    return false
  }

  const query = [`url=${encodeURIComponent(pageUrl)}`]
  if (title) {
    query.push(`title=${encodeURIComponent(title)}`)
  }

  uniBridge.navigateTo({
    url: `/pages/webViewPage/webViewPage?${query.join('&')}`
  })

  return true
}
