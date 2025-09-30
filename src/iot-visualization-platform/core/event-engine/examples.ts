/**
 * Event Engine 使用示例集合
 * 
 * 本文件包含了 Event Engine 的各种使用场景和最佳实践示例
 * 可以作为开发参考和学习材料
 */

import { eventEngine } from './index'
import type { ExtendedEventPayload } from './index'

// ==================== 基础使用示例 ====================

/**
 * 示例1: 基础事件监听和发送
 */
export function basicEventExample() {
  
  // 监听设备状态变更事件
  const unsubscribe = eventEngine.on('device:status:change', (payload) => {
  })
  
  // 模拟发送设备状态变更事件
  setTimeout(async () => {
    await eventEngine.emit('device:status:change', {
      deviceId: 'sensor_001',
      status: 'online',
      previousStatus: 'offline',
      timestamp: Date.now(),
      source: 'device-monitor'
    })
    
    // 5秒后清理监听器
    setTimeout(() => {
      unsubscribe()
    }, 5000)
  }, 1000)
}

/**
 * 示例2: 配置事件兼容性演示
 */
export function configCompatibilityExample() {
  
  // 使用原有的 ConfigEventBus 方式（完全兼容）
  eventEngine.onConfigChange('themeMode', (newValue, oldValue) => {
  })
  
  // 使用新的统一事件方式
  eventEngine.on('config:change', (payload) => {
    if (payload.key === 'themeMode') {
    }
  })
  
  // 模拟配置变更
  setTimeout(async () => {
    await eventEngine.emit('config:change', {
      key: 'themeMode',
      newValue: 'dark',
      oldValue: 'light',
      timestamp: Date.now(),
      source: 'user-settings'
    })
  }, 2000)
}

// ==================== 高级使用示例 ====================

/**
 * 示例3: 数据流处理链
 */
export function dataFlowChainExample() {
  
  // 第一步: 监听原始数据接收
  eventEngine.on('data:received', async (payload) => {
    
    try {
      // 模拟数据处理
      await new Promise(resolve => setTimeout(resolve, 100))
      const processedData = {
        ...payload.rawData,
        processed: true,
        processTime: Date.now()
      }
      
      // 发送数据处理完成事件
      await eventEngine.emit('data:processed', {
        originalData: payload.rawData,
        processedData,
        deviceId: payload.deviceId,
        timestamp: Date.now(),
        source: 'data-processor'
      })
      
    } catch (error) {
      // 发送数据处理错误事件
      await eventEngine.emit('data:error', {
        error: error.message,
        originalData: payload.rawData,
        deviceId: payload.deviceId,
        timestamp: Date.now(),
        source: 'data-processor'
      })
    }
  })
  
  // 第二步: 监听处理完成的数据
  eventEngine.on('data:processed', (payload) => {
  })
  
  // 第三步: 监听数据处理错误
  eventEngine.on('data:error', (payload) => {
    console.error('数据处理失败:', {
      设备ID: payload.deviceId,
      错误信息: payload.error,
      原始数据: payload.originalData
    })
  })
  
  // 模拟发送原始数据
  setTimeout(async () => {
    await eventEngine.emit('data:received', {
      deviceId: 'temp_sensor_001',
      rawData: {
        temperature: 25.6,
        humidity: 60.2,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      source: 'mqtt-broker'
    })
  }, 1000)
}

/**
 * 示例4: 用户交互事件处理
 */
export function userInteractionExample() {
  
  // 监听用户点击事件
  eventEngine.on('user:action:click', (payload) => {
    
    // 根据不同组件执行不同操作
    if (payload.componentId.startsWith('device_')) {
      // 设备组件点击，获取设备详情
      eventEngine.emit('device:detail:request', {
        deviceId: payload.componentId.replace('device_', ''),
        timestamp: Date.now(),
        source: 'user-interaction'
      })
    }
  })
  
  // 监听用户拖拽事件
  eventEngine.on('user:action:drag', (payload) => {
  })
  
  // 模拟用户交互
  setTimeout(async () => {
    // 模拟点击事件
    await eventEngine.emit('user:action:click', {
      componentId: 'device_sensor_001',
      position: { x: 100, y: 200 },
      timestamp: Date.now(),
      source: 'mouse-click'
    })
    
    // 模拟拖拽事件
    setTimeout(async () => {
      await eventEngine.emit('user:action:drag', {
        componentId: 'widget_chart_001',
        startPosition: { x: 50, y: 100 },
        endPosition: { x: 150, y: 200 },
        timestamp: Date.now(),
        source: 'mouse-drag'
      })
    }, 1000)
  }, 500)
}

/**
 * 示例5: 系统监控和错误处理
 */
export function systemMonitoringExample() {
  
  // 监听系统就绪事件
  eventEngine.on('system:ready', (payload) => {
  })
  
  // 监听系统警告
  eventEngine.on('system:warning', (payload) => {
    console.warn('系统警告:', {
      模块: payload.module,
      警告信息: payload.message,
      严重程度: payload.severity
    })
  })
  
  // 监听系统错误
  eventEngine.on('system:error', (payload) => {
    console.error('系统错误:', {
      模块: payload.module,
      错误信息: payload.error.message,
      错误堆栈: payload.error.stack,
      上下文: payload.context
    })
    
    // 自动发送用户通知
    eventEngine.emit('user:notification:error', {
      title: '系统错误',
      message: `模块 ${payload.module} 发生错误: ${payload.error.message}`,
      severity: 'high',
      timestamp: Date.now(),
      source: 'error-handler'
    })
  })
  
  // 模拟系统事件
  setTimeout(async () => {
    // 系统就绪
    await eventEngine.emit('system:ready', {
      module: 'visual-editor',
      startupTime: 1250,
      version: '2.1.0',
      timestamp: Date.now(),
      source: 'system-init'
    })
    
    // 系统警告
    setTimeout(async () => {
      await eventEngine.emit('system:warning', {
        module: 'data-processor',
        message: '数据队列长度超过阈值',
        severity: 'medium',
        timestamp: Date.now(),
        source: 'performance-monitor'
      })
    }, 2000)
    
    // 系统错误
    setTimeout(async () => {
      await eventEngine.emit('system:error', {
        module: 'device-connector',
        error: new Error('连接超时'),
        context: { deviceId: 'sensor_001', timeout: 5000 },
        timestamp: Date.now(),
        source: 'connection-manager'
      })
    }, 4000)
  }, 1000)
}

// ==================== 批量操作示例 ====================

/**
 * 示例6: 批量事件处理
 */
export function batchEventExample() {
  
  const deviceEvents = [
    'device:status:change',
    'device:data:update',
    'device:connection:lost',
    'device:connection:restored'
  ] as const
  
  // 批量监听设备相关事件
  const unsubscribers = deviceEvents.map(eventType => 
    eventEngine.on(eventType, (payload) => {
    })
  )
  
  // 模拟批量发送事件
  setTimeout(async () => {
    const deviceId = 'multi_sensor_001'
    
    // 设备上线
    await eventEngine.emit('device:status:change', {
      deviceId,
      status: 'online',
      timestamp: Date.now(),
      source: 'device-manager'
    })
    
    // 设备数据更新
    await eventEngine.emit('device:data:update', {
      deviceId,
      data: { temperature: 26.8, humidity: 58.3 },
      timestamp: Date.now(),
      source: 'data-collector'
    })
    
    // 模拟连接丢失和恢复
    setTimeout(async () => {
      await eventEngine.emit('device:connection:lost', {
        deviceId,
        reason: '网络不稳定',
        timestamp: Date.now(),
        source: 'connection-monitor'
      })
      
      setTimeout(async () => {
        await eventEngine.emit('device:connection:restored', {
          deviceId,
          reconnectTime: 2500,
          timestamp: Date.now(),
          source: 'connection-monitor'
        })
      }, 3000)
    }, 5000)
    
    // 10秒后清理所有监听器
    setTimeout(() => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }, 12000)
  }, 1000)
}

// ==================== 性能监控示例 ====================

/**
 * 示例7: 性能监控和统计
 */
export function performanceMonitoringExample() {
  
  // 定期输出事件统计
  const statsInterval = setInterval(() => {
    const stats = eventEngine.getStatistics()
  }, 5000)
  
  // 监听所有事件进行性能分析
  let eventStartTimes = new Map<string, number>()
  
  // 事件性能追踪
  const performanceTracker = eventEngine.on('*', (payload, eventType) => {
    const eventId = `${eventType}_${Date.now()}_${Math.random()}`
    eventStartTimes.set(eventId, performance.now())
    
    // 清理旧的追踪记录（避免内存泄漏）
    if (eventStartTimes.size > 100) {
      const oldestKey = eventStartTimes.keys().next().value
      eventStartTimes.delete(oldestKey)
    }
  })
  
  // 模拟高频事件生成
  let eventCount = 0
  const highFrequencyInterval = setInterval(async () => {
    await eventEngine.emit('performance:test:event', {
      eventNumber: ++eventCount,
      data: `测试数据 ${eventCount}`,
      timestamp: Date.now(),
      source: 'performance-test'
    })
    
    if (eventCount >= 50) {
      clearInterval(highFrequencyInterval)
      setTimeout(() => {
        clearInterval(statsInterval)
        performanceTracker()
      }, 2000)
    }
  }, 100) // 每100ms发送一个事件
}

// ==================== Vue 组合式函数示例 ====================

/**
 * 示例8: Vue 组合式函数中的事件处理
 */
export function vueComposableExample() {
  
  /**
   * 设备状态监控组合式函数
   */
  function useDeviceStatus(deviceId: string) {
    const status = ref('unknown')
    const lastUpdate = ref<Date | null>(null)
    const connectionLost = ref(false)
    
    // 监听设备状态变更
    const statusUnsubscribe = eventEngine.on('device:status:change', (payload) => {
      if (payload.deviceId === deviceId) {
        status.value = payload.status
        lastUpdate.value = new Date(payload.timestamp)
      }
    })
    
    // 监听连接状态
    const connectionLostUnsubscribe = eventEngine.on('device:connection:lost', (payload) => {
      if (payload.deviceId === deviceId) {
        connectionLost.value = true
      }
    })
    
    const connectionRestoredUnsubscribe = eventEngine.on('device:connection:restored', (payload) => {
      if (payload.deviceId === deviceId) {
        connectionLost.value = false
      }
    })
    
    // 清理函数
    const cleanup = () => {
      statusUnsubscribe()
      connectionLostUnsubscribe()
      connectionRestoredUnsubscribe()
    }
    
    return {
      status: readonly(status),
      lastUpdate: readonly(lastUpdate),
      connectionLost: readonly(connectionLost),
      cleanup
    }
  }
  
  // 模拟在 Vue 组件中使用
  const deviceMonitor = useDeviceStatus('vue_test_device')
  
  // 模拟设备状态变化
  setTimeout(async () => {
    await eventEngine.emit('device:status:change', {
      deviceId: 'vue_test_device',
      status: 'online',
      timestamp: Date.now(),
      source: 'vue-example'
    })
    
    setTimeout(async () => {
      await eventEngine.emit('device:connection:lost', {
        deviceId: 'vue_test_device',
        reason: '网络中断',
        timestamp: Date.now(),
        source: 'vue-example'
      })
      
      setTimeout(async () => {
        await eventEngine.emit('device:connection:restored', {
          deviceId: 'vue_test_device',
          reconnectTime: 1500,
          timestamp: Date.now(),
          source: 'vue-example'
        })
        
        // 清理
        setTimeout(() => {
          deviceMonitor.cleanup()
        }, 2000)
      }, 3000)
    }, 2000)
  }, 1000)
}

// ==================== 运行所有示例 ====================

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  
  // 基础示例
  basicEventExample()
  
  setTimeout(() => {
    configCompatibilityExample()
  }, 1000)
  
  setTimeout(() => {
    dataFlowChainExample()
  }, 2000)
  
  setTimeout(() => {
    userInteractionExample()
  }, 3000)
  
  setTimeout(() => {
    systemMonitoringExample()
  }, 4000)
  
  setTimeout(() => {
    batchEventExample()
  }, 5000)
  
  setTimeout(() => {
    performanceMonitoringExample()
  }, 6000)
  
  setTimeout(() => {
    vueComposableExample()
  }, 7000)
  
  // 30秒后结束所有示例
  setTimeout(() => {
    
    // 输出最终统计
    const finalStats = eventEngine.getStatistics()
  }, 30000)
}

// 注意: 这些示例中使用了 ref, readonly 等 Vue 3 API
// 在实际使用时需要确保已导入这些函数
// import { ref, readonly, onUnmounted } from 'vue'