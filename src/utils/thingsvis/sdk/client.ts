/**
 * ThingsVis Embed SDK Client
 *
 * 核心功能:
 * - Iframe 生命周期管理
 * - PostMessage 通信封装 (适配 ThingsVis Studio embed-mode 协议)
 * - 严格区分 Widget Mode 和 App Mode
 */

// ─── Message Type Constants (aligned with Guest MSG_TYPES) ───
const TV_MSG = {
  // Host → Guest
  INIT: 'tv:init',
  TRIGGER_SAVE: 'tv:trigger-save',
  REQUEST_SAVE: 'tv:request-save',
  EVENT: 'tv:event',
  // Guest → Host
  SAVE: 'tv:save',
  READY: 'tv:ready',
  REQUEST_INIT: 'tv:request-init',
  // SDK internal (Host-only event name)
  SAVE_CONFIG: 'tv:save-config',
} as const

export interface ThingsVisOptions {
  /** 挂载的容器 DOM */
  container: HTMLElement
  /**
   * 集成模式
   * - widget: 物模型/小组件模式 (Host-Managed Data, saveTarget='host')
   * - app: 完整编辑器模式 (Self-Managed Data, saveTarget='self')
   */
  mode: 'widget' | 'app'
  /** Iframe URL (例如 http://localhost:3000/#/embed 或 #/editor) */
  url: string
  /** 可选: Iframe 样式 */
  style?: Partial<CSSStyleDeclaration>
}

export type MessageHandler = (payload: any) => void

export class ThingsVisClient {
  private iframe: HTMLIFrameElement
  private container: HTMLElement
  private options: ThingsVisOptions
  public ready: boolean = false
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private pendingQueue: Array<() => void> = []

  constructor(options: ThingsVisOptions) {
    this.options = options
    this.container = options.container
    this.iframe = document.createElement('iframe')
    this.initIframe()
    this.setupMessageListener()
  }

  private initIframe() {
    // 自动追加 embedded=1 参数，确保 Guest 端进入嵌入模式
    const separator = this.options.url.includes('?') ? '&' : '?'
    const modeParam = 'mode=embedded&showTopLeft=0&showTopRight=0'
    const finalUrl = `${this.options.url}${separator}${modeParam}`

    this.iframe.src = finalUrl
    // 默认样式
    this.iframe.style.width = '100%'
    this.iframe.style.height = '100%'
    this.iframe.style.border = 'none'
    this.iframe.style.display = 'block'

    // 应用自定义样式
    if (this.options.style) {
      Object.assign(this.iframe.style, this.options.style)
    }

    this.container.appendChild(this.iframe)

    // 监听加载完成
    this.iframe.onload = () => {
      // Iframe onload doesn't guarantee React app is hydrated.
      // We rely on 'READY' message from Guest, but keep this as a basic check.
      console.log('[SDK] Iframe loaded, waiting for READY signal...');
    }
  }

  private setupMessageListener() {
    window.addEventListener('message', this.handleMessage)
  }

  private handleMessage = (event: MessageEvent) => {
    // 安全检查: 确保消息来自我们的 iframe
    // Note: 在某些跨域场景下 contentWindow 比较可能受限，但在 localhost 开发和标准 iframe 场景下通常可行
    if (event.source !== this.iframe.contentWindow) return

    const { type, payload } = event.data || {}
    if (!type) return

    // 协议适配: 仅仅接收我们关心的消息

    // 1. Host Save (Guest -> Host)
    if (type === TV_MSG.SAVE) {
      this.emit(TV_MSG.SAVE_CONFIG, payload) // 转发为 SDK 标准事件
    }

    // 2. Ready Signal (Guest -> Host)
    if (type === 'READY' || type === TV_MSG.READY) {
      console.log('[SDK] Received READY signal from Guest');
      if (!this.ready) {
        this.ready = true;
        this.flushPendingQueue();
        this.emit('ready', {});
      }
    }

    // 2. 其他可能的事件
    this.emit(type, payload)
  }

  /**
   * 触发内部事件处理
   */
  private emit(type: string, payload: any) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.forEach(handler => handler(payload))
    }
  }

  /**
   * 发送消息给 Iframe
   * 如果 Iframe 未就绪，会自动放入队列等待
   */
  private send(type: string, payload: any = {}) {
    // 包装成 Guest 端期望的 { type, ...payload } 格式?
    // 查看 embed-mode.ts:
    // type EmbedEventMessage =
    //   | { type: 'thingsvis:editor-init'; payload?: any }
    //   | { type: 'thingsvis:editor-trigger-save'; payload?: any }

    // 看起来 Guest 期望的是 { type: '...', payload: ... }
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

  // ===========================
  // Public API: Widget Mode
  // ===========================

  /**
   * [Widget Mode] 加载/更新组件配置 (JSON)
   * Host -> Guest
   * 对应协议: thingsvis:editor-init
   */
  /**
   * [Widget Mode] 加载/更新组件配置 (JSON)
   * Host -> Guest
   * 对应协议: thingsvis:editor-init
   */
  public loadWidgetConfig(config: any, platformFields?: any[]) {
    // 防御性处理: 如果 config 为空或损坏 (没有 canvas/nodes)，提供默认值
    // 这确保即使保存的配置是无效的，编辑器和预览都能正常加载
    const safeConfig = config || {};
    const safeCanvas = safeConfig.canvas || {
      mode: 'grid',
      width: 1920,
      height: 1080,
      gridCols: 24,
      gridRowHeight: 50,
      gridGap: 5,
    };
    const safeNodes = safeConfig.nodes || [];

    // 构造符合 EmbedInitPayload 的数据结构
    const payload = {
      data: {
        meta: safeConfig.meta || { id: 'widget', name: 'Widget' },
        canvas: safeCanvas,
        nodes: safeNodes,
        dataSources: safeConfig.dataSources,
        platformFields: platformFields // Pass fields in init
      },
      config: {
        // Widget 模式下，保存目标是 Host
        saveTarget: 'host'
      }
    }

    console.log('[SDK] Sending init payload:', payload)
    this.send(TV_MSG.INIT, payload)
  }

  /**
   * [Widget Mode] 更新平台字段定义 (用于选择数据源)
   * Host -> Guest
   *
   * 注意: Guest 端目前没有专门的 'update-schema' 监听器。
   * 我们通常只能通过 init 传递 platformFields。
   * 除非 Guest 端后续增加了支持。
   * 暂时通过 'thingsvis:editor-event' 尝试发送，看 Guest 是否扩展了支持。
   */
  public updateSchema(fields: any[]) {
    // 尝试发送通用事件 (需 Guest 端配合支持)
    this.send(TV_MSG.EVENT, { event: 'updateSchema', payload: fields })
  }

  /**
   * [Widget Mode] 推送实时数据
   * Host -> Guest
   * 对应协议: thingsvis:editor-event { event: 'updateData', payload: data }
   * 或者是 thingsvis:update-data (如果 Guest 支持)
   *
   * 查看 Guest 代码，embed-mode.ts 会转发 'thingsvis:editor-event' 给 listeners。
   * 如果 Guest 内部有组件监听 'updateData'，就能工作。
   */
  public pushData(data: Record<string, any>) {
    this.send(TV_MSG.EVENT, { event: 'updateData', payload: data })
  }

  /**
   * [Widget Mode] 触发保存 (如果 Host 想主动保存)
   * Host -> Guest -> Host(thingsvis:host-save)
   * 对应协议: thingsvis:editor-trigger-save
   */
  public triggerSave() {
    this.send(TV_MSG.TRIGGER_SAVE)
  }

  /**
   * [Widget Mode] 监听保存回调
   * Guest -> Host
   */
  public onWidgetSave(callback: (config: any) => void) {
    // 我们在 handleMessage 里把 'thingsvis:host-save' 转发为了 'thingsvis:save-config'
    this.on(TV_MSG.SAVE_CONFIG, (payload) => {
      // Payload 里的结构可能是 { canvas:..., nodes:..., dataBindings:... }
      callback(payload)
    })
  }


  // ===========================
  // Public API: App Mode
  // ===========================

  /**
   * [Widget Mode] 主动请求保存
   * 触发 Editor 的 saveNow()，随后会通过 onWidgetSave 回调返回数据
   */
  public requestSave() {
    console.log('[SDK] Client requesting save from Editor...');
    // Type casting because 'thingsvis:request-save' is not in standard EmbedMessage yet
    this.send(TV_MSG.REQUEST_SAVE);
  }



  /**
   * [App Mode] 注入 Token
   * Host -> Guest
   *
   * App Mode 主要靠 URL 参数传 token，但在 PostMessage 里也可以更新。
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
    this.ready = false
  }
}
