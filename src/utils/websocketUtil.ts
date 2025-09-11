import type { Ref } from 'vue'
import { useWebSocket } from '@vueuse/core'
import { getWebsocketServerUrl } from '@/utils/common/tool'

const wsUrl = `${getWebsocketServerUrl()}/telemetry/datas/current/keys/ws`

export interface ICardView {
  // 定义 ICardView 接口
  data?: {
    dataSource?: {
      deviceSource?: {
        deviceId?: string
        metricsId?: string
        metricsType?: string
      }[]
    }
    type?: string
  }
}

export interface ICardRender {
  getCardComponent: (cardView: ICardView) => {
    getComponent: () => {
      updateData?: (deviceId: string, metricsId: string, data: any) => void
    }
  }
}

export function useWebsocketUtil(cr: Ref<ICardRender | undefined>, token: string | string[]) {
  const socketMap = new Map<string, WebSocket>() // from device id to socket

  /* eslint-disable max-params */
  const setComponentsValue = (
    layout: Ref<ICardView[] | undefined>,
    deviceId: string | undefined,
    metricsId: string | undefined,
    data: any
  ) => {
    if (!deviceId || !metricsId) {
      console.warn('setComponentsValue: deviceId or metricsId is undefined')
      return
    }
    if (!layout || !layout.value) return

    const cardViews = layout.value.filter(
      item =>
        item.data?.dataSource?.deviceSource &&
        Array.isArray(item.data.dataSource.deviceSource) &&
        item.data.dataSource.deviceSource.some(source => source.deviceId === deviceId && source.metricsId === metricsId)
    )

    for (const cardView of cardViews) {
      const cardComponent = cr.value?.getCardComponent(cardView)?.getComponent()
      // Pass data as is if it's an object, otherwise pass an empty object.
      // The component itself should handle missing keys within the data object.
      const payload = data && typeof data === 'object' ? data : {}
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      cardComponent?.updateData && cardComponent.updateData(deviceId, metricsId, payload)
    }
  }
  /* eslint-enable max-params */

  const updateComponentsData = async (layout: Ref<ICardView[] | undefined>) => {
    if (!layout || !layout.value) {
      socketMap.forEach(socket => socket.close())
      socketMap.clear()
      return
    }
    const deviceMetricsIds = layout.value
      .filter(
        item =>
          item.data?.dataSource?.deviceSource &&
          Array.isArray(item.data.dataSource.deviceSource) &&
          item.data.dataSource.deviceSource.length > 0 &&
          item.data?.type === 'chart'
      )
      .flatMap(item =>
        // Assuming filter above ensures these are defined, use non-null assertion cautiously
        item
          .data!.dataSource!.deviceSource!.filter(
            source => source.deviceId && source.metricsId && source.metricsType === 'telemetry'
          )
          .map(source => `${source.deviceId}|${source.metricsId}`)
      )
    const set = new Set(deviceMetricsIds)
    const uniqueDeviceMetricsIds = [...set]

    for (const [deviceMetricsId, socket] of socketMap.entries()) {
      if (!uniqueDeviceMetricsIds.includes(deviceMetricsId)) {
        if (process.env.NODE_ENV === 'development') {
        }
        socket.close()
        socketMap.delete(deviceMetricsId)
      }
    }

    for (const deviceMetricsId of uniqueDeviceMetricsIds) {
      const [deviceId, metricsId] = deviceMetricsId.split('|')
      if (!deviceId || !metricsId) {
        console.warn(`Invalid deviceMetricsId format: ${deviceMetricsId}, skipping socket creation.`)
        continue
      }

      if (!socketMap.has(deviceMetricsId)) {
        if (process.env.NODE_ENV === 'development') {
        }
        const { ws, send, close, status } = useWebSocket(wsUrl, {
          autoReconnect: {
            retries: 3,
            delay: 1000,
            onFailed() {
              console.error(`Failed to reconnect for ${deviceMetricsId} after 3 retries.`)
            }
          },
          heartbeat: {
            message: 'ping',
            interval: 8000,
            pongTimeout: 3000
          },
          onMessage(_websocket: WebSocket, event: MessageEvent) {
            if (event.data && event.data !== 'pong') {
              try {
                const parsedData = JSON.parse(event.data as string)
                if (parsedData && typeof parsedData === 'object') {
                  setComponentsValue(layout, deviceId, metricsId, parsedData)
                } else {
                  console.warn('Received data is not a valid object:', parsedData, `for ${deviceMetricsId}`)
                }
              } catch (error) {
                console.error('Failed to parse WebSocket message:', event.data, `for ${deviceMetricsId}`, error)
              }
            }
          },
          onConnected(wsInstance: WebSocket) {
            if (process.env.NODE_ENV === 'development') {
            }
            if (!deviceId || !metricsId) {
              console.error('onConnected: deviceId or metricsId is undefined before send for', deviceMetricsId)
              close() // Close the connection if vital info is missing
              return
            }
            const dataw = {
              device_id: deviceId,
              keys: [metricsId],
              token
            }
            send(JSON.stringify(dataw))
            // Store the active WebSocket instance after successful connection and send
            socketMap.set(deviceMetricsId, wsInstance)
          },
          onError(wsInstance: WebSocket, event: Event) {
            console.error('WebSocket error:', event, `for ${deviceMetricsId}, status: ${status.value}`)
            socketMap.delete(deviceMetricsId) // Remove on error to allow autoReconnection or next update cycle to try again
          }
          // Removed onClosed as it's not a standard option
        })
        // ws.value from useWebSocket might be null initially or if connection fails immediately.
        // The socketMap is now updated in onConnected to ensure we only store active connections.
      }
    }
  }

  const closeAllSockets = () => {
    if (process.env.NODE_ENV === 'development') {
    }
    socketMap.forEach((socket, key) => {
      socket.close()
      socketMap.delete(key)
    })
  }

  return {
    updateComponentsData,
    closeAllSockets
  }
}
