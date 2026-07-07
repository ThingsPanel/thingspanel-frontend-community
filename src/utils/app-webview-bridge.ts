let bridgeReady: Promise<void> | null = null

type UniWebViewBridge = {
  navigateTo?: (options: { url: string }) => void
  postMessage?: (options: { data: Record<string, unknown> }) => void
  webView?: {
    navigateTo?: (options: { url: string }) => void
    navigateBack?: (options?: { delta?: number }) => void
    getEnv?: (callback: (res: { plus?: boolean; h5?: boolean; nvue?: boolean }) => void) => void
  }
}

function getUniBridge(): UniWebViewBridge | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as Window & { uni?: UniWebViewBridge }).uni
}

export function ensureUniWebviewBridge(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  const win = window as Window & {
    uni?: UniWebViewBridge
    __uniWebviewLoaded?: boolean
  }

  if (win.uni?.webView?.navigateTo || win.uni?.navigateTo || win.__uniWebviewLoaded) {
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

function appendStandaloneFlag(pageUrl: string): string {
  try {
    const url = new URL(pageUrl, window.location.origin)
    url.searchParams.set('standalone', '1')
    return url.toString()
  } catch {
    const separator = pageUrl.includes('?') ? '&' : '?'
    return `${pageUrl}${separator}standalone=1`
  }
}

function buildNativeWebViewPagePath(pageUrl: string, title?: string): string {
  const query = [`url=${encodeURIComponent(pageUrl)}`]
  if (title) {
    query.push(`title=${encodeURIComponent(title)}`)
  }
  return `/pages/webViewPage/webViewPage?${query.join('&')}`
}

function navigateNativeWebViewPage(pageUrl: string, title?: string): boolean {
  const uniBridge = getUniBridge()
  const nativePath = buildNativeWebViewPagePath(pageUrl, title)

  if (uniBridge?.webView?.navigateTo) {
    uniBridge.webView.navigateTo({ url: nativePath })
    return true
  }

  if (uniBridge?.navigateTo) {
    uniBridge.navigateTo({ url: nativePath })
    return true
  }

  return false
}

function notifyParentWebViewPage(pageUrl: string, title?: string): boolean {
  if (typeof window === 'undefined' || window.parent === window) {
    return false
  }

  const payload = {
    type: 'tp:open-webview-page',
    url: pageUrl,
    title: title || ''
  }

  window.parent.postMessage(payload, '*')

  const uniBridge = getUniBridge()
  uniBridge?.postMessage?.({ data: payload })

  return true
}

/** 是否由 App webViewPage 独立打开（已有原生返回栏） */
export function isStandaloneEmbedPage(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('standalone') === '1'
}

/** App 内打开独立 WebView 子页，使用原生返回栏（同设备详情） */
export async function openAppWebViewPage(
  pageUrl: string,
  title?: string,
  fallback?: () => void
): Promise<boolean> {
  await ensureUniWebviewBridge()

  const finalPageUrl = appendStandaloneFlag(pageUrl)

  if (navigateNativeWebViewPage(finalPageUrl, title)) {
    return true
  }

  if (notifyParentWebViewPage(finalPageUrl, title)) {
    return true
  }

  fallback?.()
  return false
}

/** 嵌入页内返回：优先原生 navigateBack，否则 H5 router.back */
export function embedNavigateBack(fallback?: () => void): void {
  const uniBridge = getUniBridge()

  if (uniBridge?.webView?.navigateBack) {
    uniBridge.webView.navigateBack({ delta: 1 })
    return
  }

  fallback?.()
}
