/**
 * ThingsVis Embed SDK Client
 *
 * 鏍稿績鍔熻兘:
 * - Iframe 鐢熷懡鍛ㄦ湡绠＄悊
 * - PostMessage 閫氫俊灏佽 (閫傞厤 ThingsVis Studio embed-mode 鍗忚)
 * - 涓ユ牸鍖哄垎 Widget Mode 鍜?App Mode
 */

// 鈹€鈹€鈹€ Message Type Constants (aligned with Guest MSG_TYPES) 鈹€鈹€鈹€
const TV_MSG = {
  // Host 鈫?Guest
  INIT: 'tv:init',
  TRIGGER_SAVE: 'tv:trigger-save',
  REQUEST_SAVE: 'tv:request-save',
  EVENT: 'tv:event',
  // Guest 鈫?Host
  SAVE: 'tv:save',
  READY: 'tv:ready',
  REQUEST_INIT: 'tv:request-init',
  // SDK internal (Host-only event name)
  SAVE_CONFIG: 'tv:save-config'
} as const

export interface ThingsVisOptions {
  /** 鎸傝浇鐨勫鍣?DOM */
  container: HTMLElement
  /**
   * 闆嗘垚妯″紡
   * - widget: 鐗╂ā鍨?灏忕粍浠舵ā寮?(Host-Managed Data, saveTarget='host')
   * - app: 瀹屾暣缂栬緫鍣ㄦā寮?(Self-Managed Data, saveTarget='self')
   */
  mode: 'widget' | 'app'
  /** Iframe URL (渚嬪 http://localhost:3000/#/embed 鎴?#/editor) */
  url: string
  /** 鍙€? Iframe 鏍峰紡 */
  style?: Partial<CSSStyleDeclaration>
}

export interface WidgetLoadOptions {
  platformBufferSize?: number;
  platformDevices?: any[];
  deviceId?: string;
  thingsvisApiBaseUrl?: string;
  platformApiBaseUrl?: string;
  platformToken?: string;
}

export type MessageHandler = (payload: any) => void

export class ThingsVisClient {
  private iframe: HTMLIFrameElement
  private container: HTMLElement
  private options: ThingsVisOptions
  public ready: boolean = false
  /**
   * Set to true when the guest sends LOADED (after registerAndLoad finishes).
   * platform-data messages must wait until this is true,
   * otherwise they arrive before PlatformFieldAdapter is connected and are dropped.
   */
  private loaded: boolean = false
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private pendingQueue: Array<() => void> = []
  /** Queue for tv:platform-data  鈥?flushed on LOADED. */
  private postLoadQueue: Array<() => void> = []
  /** Last real-time value payload by scope, replayed after guest re-init. */
  private latestPlatformDataByScope: Map<string, { fields: Record<string, unknown>; deviceId?: string }> = new Map()
  /** Last history payloads by scope/field, replayed after guest re-init. */
  private latestPlatformHistoryByScope: Map<string, { fieldId: string; history: Array<{ value: unknown; ts: number }>; deviceId?: string }> = new Map()
  private lastInitPayload: any = null
  private platformPushCount = 0

  constructor(options: ThingsVisOptions) {
    this.options = options
    this.container = options.container
    this.iframe = document.createElement('iframe')
    this.initIframe()
    this.setupMessageListener()
  }

  private initIframe() {
    // 鑷姩杩藉姞 embedded=1 鍙傛暟锛岀‘淇?Guest 绔繘鍏ュ祵鍏ユā寮?
    const separator = this.options.url.includes('?') ? '&' : '?'
    const modeParam = 'mode=embedded&showTopLeft=0&showTopRight=0'
    const finalUrl = `${this.options.url}${separator}${modeParam}`

    this.iframe.src = finalUrl
    // 榛樿鏍峰紡
    this.iframe.style.width = '100%'
    this.iframe.style.height = '100%'
    this.iframe.style.border = 'none'
    this.iframe.style.display = 'block'

    // 搴旂敤鑷畾涔夋牱寮?
    if (this.options.style) {
      Object.assign(this.iframe.style, this.options.style)
    }

    this.container.appendChild(this.iframe)

    // 鐩戝惉鍔犺浇瀹屾垚
    this.iframe.onload = () => {
      // Iframe onload doesn't guarantee React app is hydrated.
      // We rely on 'READY' message from Guest, but keep this hook for future use.
    }
  }

  private setupMessageListener() {
    window.addEventListener('message', this.handleMessage)
  }

  private handleMessage = (event: MessageEvent) => {
    // 瀹夊叏妫€鏌? 纭繚娑堟伅鏉ヨ嚜鎴戜滑鐨?iframe
    // Note: 鍦ㄦ煇浜涜法鍩熷満鏅笅 contentWindow 姣旇緝鍙兘鍙楅檺锛屼絾鍦?localhost 寮€鍙戝拰鏍囧噯 iframe 鍦烘櫙涓嬮€氬父鍙
    if (event.source !== this.iframe.contentWindow) return

    const { type, payload } = event.data || {}
    if (!type) return

    // 鍗忚閫傞厤: 浠呬粎鎺ユ敹鎴戜滑鍏冲績鐨勬秷鎭?

    // 1. Host Save (Guest -> Host)
    if (type === TV_MSG.SAVE) {
      this.emit(TV_MSG.SAVE_CONFIG, payload) // 杞彂涓?SDK 鏍囧噯浜嬩欢
    }

    // 2. Ready Signal (Guest -> Host)
    if (type === 'READY' || type === TV_MSG.READY) {
      if (!this.ready) {
        this.ready = true
        // Emit 'ready' FIRST so that the host's on('ready') handler can call
        // loadWidgetConfig() (tv:init) before we flush the pending queue.
        // This ensures the iframe receives tv:init before any queued
        // tv:platform-data messages, preventing the init handler from
        // clearing an already-buffered data payload.
        this.emit('ready', {})
        this.flushPendingQueue()
        // NOTE: do NOT flush postLoadQueue here 鈥?platform data must wait for LOADED.
      }
    }

    // LOADED: guest signals that registerAndLoad finished and adapters are connected.
    if (type === 'LOADED') {
      if (!this.loaded) {
        this.loaded = true
        this.flushPostLoadQueue()
        this.replayLatestPlatformData()
      }
      this.emit('loaded', payload)
    }

    // 3. Handle re-init request from Guest (e.g. after bootstrap re-run)
    if (type === TV_MSG.REQUEST_INIT) {
      if (this.lastInitPayload) {
        this.loaded = false
        this.send(TV_MSG.INIT, this.lastInitPayload)
      } else {
        this.emit('ready', {})
      }
    }

    // 4. 鍏朵粬鍙兘鐨勪簨浠?
    this.emit(type, payload)
  }

  /**
   * 瑙﹀彂鍐呴儴浜嬩欢澶勭悊
   */
  private emit(type: string, payload: any) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.forEach(handler => handler(payload))
    }
  }

  /**
   * 鍙戦€佹秷鎭粰 Iframe
   * 濡傛灉 Iframe 鏈氨缁紝浼氳嚜鍔ㄦ斁鍏ラ槦鍒楃瓑寰?
   */
  private send(type: string, payload: any = {}) {
    // 鍖呰鎴?Guest 绔湡鏈涚殑 { type, ...payload } 鏍煎紡?
    // 鏌ョ湅 embed-mode.ts:
    // type EmbedEventMessage =
    //   | { type: 'thingsvis:editor-init'; payload?: any }
    //   | { type: 'thingsvis:editor-trigger-save'; payload?: any }

    // 鐪嬭捣鏉?Guest 鏈熸湜鐨勬槸 { type: '...', payload: ... }
    const message = { type, payload }

    const action = () => {
      if (this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage(message, '*')
      }
    }

    if (this.ready) {
      action()
    } else {
      this.pendingQueue.push(action)
    }
  }

  private flushPendingQueue() {
    while (this.pendingQueue.length > 0) {
      const action = this.pendingQueue.shift()
      if (action) action()
    }
  }

  /**
   * Send a message that should only be delivered after the guest's adapters are
   * connected (i.e. after the LOADED signal). Any call before LOADED is buffered
   * in postLoadQueue and flushed automatically when LOADED arrives.
   */
  private sendWhenLoaded(type: string, payload: any = {}) {
    const message = { type, payload }
    const action = () => {
      if (this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage(message, '*')
      }
    }
    if (this.loaded) {
      action()
    } else {
      this.postLoadQueue.push(action)
    }
  }

  private flushPostLoadQueue() {
    while (this.postLoadQueue.length > 0) {
      const action = this.postLoadQueue.shift()
      if (action) action()
    }
  }

  private replayLatestPlatformData() {
    for (const { fields, deviceId } of this.latestPlatformDataByScope.values()) {
      this.sendWhenLoaded('tv:platform-data', { fields, deviceId })
    }

    for (const { fieldId, history, deviceId } of this.latestPlatformHistoryByScope.values()) {
      this.sendWhenLoaded('tv:platform-history', { fieldId, history, deviceId })
    }
  }

  // ===========================
  // Public API: Widget Mode
  // ===========================

  /**
   * [Widget Mode] 鍔犺浇/鏇存柊缁勪欢閰嶇疆 (JSON)
   * Host -> Guest
   * 瀵瑰簲鍗忚: thingsvis:editor-init
   */
  /**
   * [Widget Mode] 鍔犺浇/鏇存柊缁勪欢閰嶇疆 (JSON)
   * Host -> Guest
   * 瀵瑰簲鍗忚: thingsvis:editor-init
   */
  public loadWidgetConfig(config: any, platformFields?: any[], options?: WidgetLoadOptions) {
    this.loaded = false

    // Guard against empty or corrupt config (missing canvas/nodes) to ensure both
    // the editor and viewer can mount without crashing on a blank slate.
    const safeConfig = config || {}
    const safeCanvas = safeConfig.canvas || {
      mode: 'grid',
      width: 1920,
      height: 1080,
      gridCols: 24,
      gridRowHeight: 50,
      gridGap: 5
    }
    const safeNodes = safeConfig.nodes || []

    // Apply bufferSize to all platform data sources in the saved config.
    const existingDataSources: any[] = safeConfig.dataSources ?? []
    const mergedDataSources = existingDataSources.map((ds: any) => {
      const typeStr = typeof ds.type === 'string' ? ds.type.toUpperCase() : ''
      if (typeStr === 'PLATFORM_FIELD' || typeStr === 'PLATFORM') {
        const config = ds.config || {}
        return {
          ...ds,
          config: {
            ...config,
            bufferSize: Math.max(config.bufferSize ?? 0, options?.platformBufferSize ?? 0),
          }
        }
      }
      return ds
    })

    const payload = {
      // platformDevices at the top level so EmbedPage.tsx can read msg.platformDevices
      platformDevices: options?.platformDevices ?? [],
      data: {
        meta: safeConfig.meta || { id: 'widget', name: 'Widget' },
        canvas: safeCanvas,
        nodes: safeNodes,
        dataSources: mergedDataSources,
        platformFields: platformFields
      },
      config: {
        saveTarget: 'host',
        thingsvisApiBaseUrl: options?.thingsvisApiBaseUrl ?? `${window.location.origin}/thingsvis-api`,
        platformApiBaseUrl: options?.platformApiBaseUrl ?? window.location.origin,
        ...(options?.platformToken ? { platformToken: options.platformToken } : {}),
        ...(options?.deviceId ? { deviceId: options.deviceId } : {})
      }
    }

    this.lastInitPayload = payload
    this.send(TV_MSG.INIT, payload)
  }

  /**
   * [Widget Mode] 鏇存柊骞冲彴瀛楁瀹氫箟 (鐢ㄤ簬閫夋嫨鏁版嵁婧?
   * Host -> Guest
   *
   * 娉ㄦ剰: Guest 绔洰鍓嶆病鏈変笓闂ㄧ殑 'update-schema' 鐩戝惉鍣ㄣ€?
   * 鎴戜滑閫氬父鍙兘閫氳繃 init 浼犻€?platformFields銆?
   * 闄ら潪 Guest 绔悗缁鍔犱簡鏀寔銆?
   * 鏆傛椂閫氳繃 'thingsvis:editor-event' 灏濊瘯鍙戦€侊紝鐪?Guest 鏄惁鎵╁睍浜嗘敮鎸併€?
   */
  public updateSchema(fields: any[]) {
    // 灏濊瘯鍙戦€侀€氱敤浜嬩欢 (闇€ Guest 绔厤鍚堟敮鎸?
    this.send(TV_MSG.EVENT, { event: 'updateSchema', payload: fields })
  }

  /**
   * [Widget Mode] Push real-time platform field values into the embedded widget.
   * Sends a tv:platform-data bulk message that PlatformFieldAdapter handles directly.
   *
   * @param fields - Map of fieldId to current value, e.g. { temperature: 25.3 }
   */
  public pushPlatformFieldData(fields: Record<string, unknown>, deviceId?: string): void {
    this.platformPushCount += 1
    const scopeKey = deviceId ?? '__global__'
    this.latestPlatformDataByScope.set(scopeKey, {
      fields: { ...fields },
      ...(deviceId ? { deviceId } : {})
    })
    // Must wait until LOADED: PlatformFieldAdapter's messageListener isn't set up
    // until registerAndLoad finishes, which happens after tv:init is processed.
    this.sendWhenLoaded('tv:platform-data', { fields, deviceId })
  }

  public pushPlatformFieldHistory(
    fieldId: string,
    history: Array<{ value: unknown; ts: number }>,
    deviceId?: string
  ): void {
    if (!fieldId || !Array.isArray(history)) return

    const scopeKey = `${deviceId ?? '__global__'}:${fieldId}`
    this.latestPlatformHistoryByScope.set(scopeKey, {
      fieldId,
      history: history.map(item => ({ value: item.value, ts: item.ts })),
      ...(deviceId ? { deviceId } : {})
    })
    this.sendWhenLoaded('tv:platform-history', { fieldId, history, deviceId })
  }

  /**
   * @deprecated Use pushPlatformFieldData() instead.
   * This method sends a tv:event message which is NOT handled by PlatformFieldAdapter
   * and therefore never reaches the ring buffer.
   */
  public pushData(data: Record<string, unknown>): void {
    this.send(TV_MSG.EVENT, { event: 'updateData', payload: data })
  }

  /**
   * [Widget Mode] 瑙﹀彂淇濆瓨 (濡傛灉 Host 鎯充富鍔ㄤ繚瀛?
   * Host -> Guest -> Host(thingsvis:host-save)
   * 瀵瑰簲鍗忚: thingsvis:editor-trigger-save
   */
  public triggerSave() {
    this.send(TV_MSG.TRIGGER_SAVE)
  }

  /**
   * [Widget Mode] 鐩戝惉淇濆瓨鍥炶皟
   * Guest -> Host
   */
  public onWidgetSave(callback: (config: any) => void) {
    // 鎴戜滑鍦?handleMessage 閲屾妸 'thingsvis:host-save' 杞彂涓轰簡 'thingsvis:save-config'
    this.on(TV_MSG.SAVE_CONFIG, payload => {
      // Payload 閲岀殑缁撴瀯鍙兘鏄?{ canvas:..., nodes:..., dataBindings:... }
      callback(payload)
    })
  }

  // ===========================
  // Public API: App Mode
  // ===========================

  /**
   * [Widget Mode] 涓诲姩璇锋眰淇濆瓨
   * 瑙﹀彂 Editor 鐨?saveNow()锛岄殢鍚庝細閫氳繃 onWidgetSave 鍥炶皟杩斿洖鏁版嵁
   */
  public requestSave() {
    console.log('[SDK] Client requesting save from Editor...')
    // Type casting because 'thingsvis:request-save' is not in standard EmbedMessage yet
    this.send(TV_MSG.REQUEST_SAVE)
  }

  /**
   * [App Mode] 娉ㄥ叆 Token
   * Host -> Guest
   *
   * App Mode 涓昏闈?URL 鍙傛暟浼?token锛屼絾鍦?PostMessage 閲屼篃鍙互鏇存柊銆?
   */
  public updateToken(token: string) {
    this.send(TV_MSG.EVENT, { event: 'updateToken', payload: { token } })
  }

  // ===========================
  // Message Bus
  // ===========================

  public on(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type)?.push(handler)
  }

  public off(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  public destroy() {
    window.removeEventListener('message', this.handleMessage)
    if (this.iframe.parentNode && this.iframe) {
      this.iframe.parentNode.removeChild(this.iframe)
    }
    this.messageHandlers.clear()
    this.pendingQueue = []
    this.postLoadQueue = []
    this.latestPlatformDataByScope.clear()
    this.lastInitPayload = null
    this.ready = false
    this.loaded = false
  }
}
