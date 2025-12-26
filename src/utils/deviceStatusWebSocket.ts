import { ref, type Ref } from 'vue'
import { useWebSocket } from '@vueuse/core'
import { localStg } from '@/utils/storage'
import { getWebsocketServerUrl } from '@/utils/common/tool'

interface DeviceStatusMessage {
  device_id: string
  is_online: number // 1: 在线, 0: 离线
}

interface SubscriptionParams {
  device_ids: string[]
  token: string
}

/**
 * 设备状态 WebSocket 管理器
 * 用于订阅和接收设备在线/离线状态通知
 */
export class DeviceStatusWebSocket {
  private ws: any = null
  private wsStatus = ref<string>('CLOSED')
  private currentDeviceIds: string[] = []
  private reconnectAttempts = 0
  private readonly MAX_RECONNECT_ATTEMPTS = 5
  private wsUrl: string
  private onStatusChangeCallback?: (deviceId: string, isOnline: boolean) => void
  private isConnecting = false // 新增：标记正在连接中
  
  constructor() {
    // 动态获取 WebSocket 服务器地址
    this.wsUrl = `${getWebsocketServerUrl()}/device/online/status/ws/batch`
  }
  
  /**
   * 连接 WebSocket 并订阅设备状态
   * @param deviceIds 设备ID列表
   * @param onStatusChange 状态变化回调函数
   */
  connect(deviceIds: string[], onStatusChange?: (deviceId: string, isOnline: boolean) => void) {
    // 保存回调函数
    if (onStatusChange) {
      this.onStatusChangeCallback = onStatusChange
    }

    // 如果设备列表为空，不建立连接
    if (!deviceIds || deviceIds.length === 0) {
      this.disconnect()
      return
    }

    // 获取 token
    const token = localStg.get('token')
    if (!token) {
      return
    }

    // 如果正在连接中，不重复连接
    if (this.isConnecting) {
      return
    }

    // 如果已连接且设备列表未变化，不需要重新连接
    if (this.ws && this.wsStatus.value === 'OPEN' && 
        this.arraysEqual(this.currentDeviceIds, deviceIds)) {
      return
    }

    // 如果已连接但设备列表变化了（分页切换），关闭旧连接重新建立
    if (this.ws && this.wsStatus.value === 'OPEN' && 
        !this.arraysEqual(this.currentDeviceIds, deviceIds)) {
      this.disconnect()
    }

    // 标记为连接中
    this.isConnecting = true

    // 如果还有旧连接，先断开
    if (this.ws) {
      this.disconnect()
    }

    // 保存当前设备列表
    this.currentDeviceIds = [...deviceIds]

    // 建立新连接
    const { status, data, send, close } = useWebSocket(this.wsUrl, {
      immediate: true,
      autoReconnect: {
        retries: this.MAX_RECONNECT_ATTEMPTS,
        delay: 3000
      },
      heartbeat: {
        message: 'ping',
        interval: 30000,
        pongTimeout: 10000
      },
      onConnected: (ws: WebSocket) => {
        this.reconnectAttempts = 0
        this.isConnecting = false // 连接成功，清除连接中标记
        
        // 发送订阅消息
        const subscriptionMessage: SubscriptionParams = {
          device_ids: deviceIds,
          token
        }
        send(JSON.stringify(subscriptionMessage))
      },
      onMessage: (ws: WebSocket, event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          
          // 支持批量消息格式（数组）
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (item.device_id && typeof item.is_online === 'number') {
                if (this.onStatusChangeCallback) {
                  this.onStatusChangeCallback(item.device_id, item.is_online === 1)
                }
              }
            })
          } 
          // 支持单条消息格式（对象）
          else if (data.device_id && typeof data.is_online === 'number') {
            if (this.onStatusChangeCallback) {
              this.onStatusChangeCallback(data.device_id, data.is_online === 1)
            }
          }
          // 其他格式静默忽略，不报错
        } catch (error) {
          // 解析失败静默忽略
        }
      },
      onError: (ws: WebSocket, event: Event) => {
        this.reconnectAttempts++
        this.isConnecting = false // 连接错误，清除连接中标记
      },
      onDisconnected: (ws: WebSocket, event: CloseEvent) => {
        this.isConnecting = false // 断开连接，清除连接中标记
      }
    })

    this.ws = { status, data, send, close }
    this.wsStatus = status
  }

  /**
   * 更新订阅的设备列表
   * @param deviceIds 新的设备ID列表
   */
  updateSubscription(deviceIds: string[]) {
    if (!deviceIds || deviceIds.length === 0) {
      this.disconnect()
      return
    }

    const token = localStg.get('token')
    if (!token) {
      return
    }

    // 如果 WebSocket 已连接，直接发送新的订阅消息
    if (this.ws && this.wsStatus.value === 'OPEN') {
      this.currentDeviceIds = [...deviceIds]
      const subscriptionMessage: SubscriptionParams = {
        device_ids: deviceIds,
        token
      }
      this.ws.send(JSON.stringify(subscriptionMessage))
    } else {
      // 否则重新连接
      this.connect(deviceIds, this.onStatusChangeCallback)
    }
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect() {
    this.isConnecting = false // 清除连接中标记
    if (this.ws && this.ws.close) {
      this.ws.close()
      this.ws = null
    }
    this.currentDeviceIds = []
    this.reconnectAttempts = 0
  }

  /**
   * 获取当前连接状态
   */
  getStatus(): string {
    return this.wsStatus.value
  }

  /**
   * 比较两个数组是否相等
   */
  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false
    const sorted1 = [...arr1].sort()
    const sorted2 = [...arr2].sort()
    return sorted1.every((val, index) => val === sorted2[index])
  }
}

/**
 * 创建设备状态 WebSocket 实例的组合式函数
 * @returns WebSocket 管理器实例
 */
export function useDeviceStatusWebSocket() {
  const wsManager = new DeviceStatusWebSocket()
  
  return {
    connect: wsManager.connect.bind(wsManager),
    updateSubscription: wsManager.updateSubscription.bind(wsManager),
    disconnect: wsManager.disconnect.bind(wsManager),
    getStatus: wsManager.getStatus.bind(wsManager)
  }
}
