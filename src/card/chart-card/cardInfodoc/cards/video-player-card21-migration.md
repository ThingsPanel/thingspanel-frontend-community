# Video Player 组件 Card 2.1 迁移配置文档

## 组件概述

**组件ID**: `chart-videoplayer`  
**组件类型**: `chart`  
**组件名称**: 视频播放器  
**功能描述**: 支持多种视频格式播放的视频播放器组件，特别针对 M3U8 流媒体和常规视频文件进行了优化

## 当前实现分析

### 1. 组件结构
```
video-player/
├── index.ts              # 组件定义配置
├── component.vue         # 主组件实现
└── poster.png           # 组件预览图
```

### 2. 核心特性
- **多格式支持**: 支持 M3U8 流媒体和常规视频格式
- **单数据源**: 支持 1 个设备数据源，从设备获取视频URL
- **自动播放**: 支持自动播放和静音播放
- **Video.js 集成**: 使用 Video.js 作为播放器核心
- **响应式布局**: 自适应容器大小
- **数据类型支持**: 支持遥测数据和属性数据作为视频源

### 3. 技术实现
- **播放器**: Video.js 播放器库
- **流媒体**: 支持 HLS (M3U8) 协议
- **数据获取**: 支持遥测和属性两种数据类型
- **错误处理**: 集成播放器错误处理机制

## Card 2.1 迁移配置

### 1. 组件定义 (ComponentDefinition)

```typescript
import { ComponentDefinition } from '@/card2.1/types'

export const videoPlayerDefinition: ComponentDefinition = {
  // 基础信息
  id: 'chart-videoplayer',
  name: 'dashboard_panel.cardName.videoPlayer',
  type: 'chart',
  category: 'media',
  
  // 组件配置
  component: () => import('./component.vue'),
  configComponent: () => import('./config.vue'),
  
  // 布局配置
  layout: {
    defaultSize: { width: 5, height: 3 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 12, height: 8 },
    resizable: true
  },
  
  // 数据源配置
  dataSource: {
    type: 'device',
    multiple: false,
    maxCount: 1,
    required: true,
    supportedTypes: ['telemetry', 'attribute'],
    features: {
      timeRange: false,
      aggregate: false,
      realtime: true
    }
  },
  
  // 配置模式
  configSchema: {
    type: 'object',
    properties: {
      // 播放器配置
      player: {
        type: 'object',
        properties: {
          autoplay: {
            type: 'boolean',
            default: true,
            title: '自动播放'
          },
          muted: {
            type: 'boolean',
            default: true,
            title: '静音播放',
            description: '启用静音以支持自动播放'
          },
          controls: {
            type: 'boolean',
            default: true,
            title: '显示控制栏'
          },
          preload: {
            type: 'string',
            enum: ['auto', 'metadata', 'none'],
            default: 'auto',
            title: '预加载策略'
          },
          loop: {
            type: 'boolean',
            default: false,
            title: '循环播放'
          },
          playbackRates: {
            type: 'array',
            items: { type: 'number' },
            default: [0.5, 1, 1.25, 1.5, 2],
            title: '播放速度选项'
          }
        }
      },
      
      // 视频源配置
      source: {
        type: 'object',
        properties: {
          fallbackUrl: {
            type: 'string',
            format: 'uri',
            title: '备用视频URL',
            description: '当设备数据源无效时使用的备用视频地址'
          },
          poster: {
            type: 'string',
            format: 'uri',
            title: '视频封面图',
            description: '视频加载前显示的封面图片'
          },
          crossOrigin: {
            type: 'string',
            enum: ['anonymous', 'use-credentials', ''],
            default: '',
            title: '跨域设置'
          }
        }
      },
      
      // 流媒体配置
      streaming: {
        type: 'object',
        properties: {
          hlsConfig: {
            type: 'object',
            properties: {
              enableWorker: {
                type: 'boolean',
                default: true,
                title: '启用 Web Worker'
              },
              lowLatencyMode: {
                type: 'boolean',
                default: false,
                title: '低延迟模式'
              },
              maxBufferLength: {
                type: 'number',
                minimum: 10,
                maximum: 300,
                default: 30,
                title: '最大缓冲长度(秒)'
              },
              maxMaxBufferLength: {
                type: 'number',
                minimum: 30,
                maximum: 600,
                default: 600,
                title: '最大缓冲上限(秒)'
              }
            }
          },
          retryConfig: {
            type: 'object',
            properties: {
              maxRetries: {
                type: 'number',
                minimum: 0,
                maximum: 10,
                default: 3,
                title: '最大重试次数'
              },
              retryDelay: {
                type: 'number',
                minimum: 1000,
                maximum: 10000,
                default: 3000,
                title: '重试延迟(毫秒)'
              }
            }
          }
        }
      },
      
      // 显示配置
      display: {
        type: 'object',
        properties: {
          showTitle: {
            type: 'boolean',
            default: false,
            title: '显示标题'
          },
          title: {
            type: 'string',
            title: '视频标题'
          },
          showLoadingIndicator: {
            type: 'boolean',
            default: true,
            title: '显示加载指示器'
          },
          showErrorMessage: {
            type: 'boolean',
            default: true,
            title: '显示错误消息'
          },
          aspectRatio: {
            type: 'string',
            enum: ['16:9', '4:3', '1:1', 'auto'],
            default: 'auto',
            title: '宽高比'
          }
        }
      },
      
      // 交互配置
      interaction: {
        type: 'object',
        properties: {
          allowFullscreen: {
            type: 'boolean',
            default: true,
            title: '允许全屏'
          },
          allowPictureInPicture: {
            type: 'boolean',
            default: true,
            title: '允许画中画'
          },
          enableKeyboardShortcuts: {
            type: 'boolean',
            default: true,
            title: '启用键盘快捷键'
          },
          enableDoubleClickFullscreen: {
            type: 'boolean',
            default: true,
            title: '双击全屏'
          }
        }
      }
    }
  }
}
```

### 2. 数据源映射

```typescript
// 原始数据源结构 -> Card 2.1 数据源结构
const dataSourceMapping = {
  // 设备数据源
  deviceSource: {
    type: 'device',
    config: {
      deviceId: 'string',      // 设备ID
      metricsId: 'string',     // 指标ID（视频URL字段）
      metricsType: 'string',   // 指标类型: 'telemetry' | 'attribute'
      deviceName: 'string'     // 设备名称
    }
  }
}
```

### 3. 实现要点

#### 视频播放器初始化
```typescript
// Video.js 播放器配置
const createPlayer = (element: HTMLVideoElement, config: PlayerConfig) => {
  const options = {
    autoplay: config.autoplay,
    muted: config.muted,
    controls: config.controls,
    preload: config.preload,
    loop: config.loop,
    playbackRates: config.playbackRates,
    poster: config.source.poster,
    crossOrigin: config.source.crossOrigin,
    
    // HLS 配置
    html5: {
      hls: {
        enableWorker: config.streaming.hlsConfig.enableWorker,
        lowLatencyMode: config.streaming.hlsConfig.lowLatencyMode,
        maxBufferLength: config.streaming.hlsConfig.maxBufferLength,
        maxMaxBufferLength: config.streaming.hlsConfig.maxMaxBufferLength
      }
    },
    
    // 错误处理
    errorDisplay: config.display.showErrorMessage
  }
  
  const player = videojs(element, options, () => {
    console.log('Video player is ready')
    
    // 绑定事件监听器
    setupPlayerEvents(player, config)
  })
  
  return player
}

// 播放器事件处理
const setupPlayerEvents = (player: VideoJsPlayer, config: PlayerConfig) => {
  // 错误处理
  player.on('error', () => {
    const error = player.error()
    console.error('Video player error:', error)
    
    if (config.display.showErrorMessage) {
      showErrorMessage(`视频播放错误: ${error?.message || '未知错误'}`)
    }
    
    // 尝试使用备用URL
    if (config.source.fallbackUrl) {
      retryWithFallback(player, config.source.fallbackUrl)
    }
  })
  
  // 加载开始
  player.on('loadstart', () => {
    if (config.display.showLoadingIndicator) {
      showLoadingIndicator()
    }
  })
  
  // 可以播放
  player.on('canplay', () => {
    hideLoadingIndicator()
  })
  
  // 播放结束
  player.on('ended', () => {
    emit('videoEnded')
  })
}
```

#### 数据源处理
```typescript
// 获取视频URL
const fetchVideoUrl = async (dataSource: DataSourceConfig) => {
  const { deviceId, metricsId, metricsType } = dataSource
  
  if (!deviceId || !metricsId) {
    throw new Error('设备ID和指标ID不能为空')
  }
  
  try {
    let response
    
    if (metricsType === 'telemetry') {
      // 获取遥测数据
      response = await telemetryDataCurrentKeys({
        device_id: deviceId,
        keys: metricsId
      })
      
      if (response?.data?.[0]?.value) {
        return response.data[0].value
      }
    } else if (metricsType === 'attribute') {
      // 获取属性数据
      response = await getAttributeDatasKey({
        device_id: deviceId,
        key: metricsId
      })
      
      if (response?.data?.value) {
        return response.data.value
      }
    }
    
    throw new Error('未获取到有效的视频URL')
  } catch (error) {
    console.error('Failed to fetch video URL:', error)
    throw error
  }
}

// 视频URL变化处理
const handleVideoUrlChange = async (newUrl: string, oldUrl: string) => {
  if (!newUrl || newUrl === oldUrl) return
  
  try {
    // 验证URL格式
    const url = new URL(newUrl)
    
    // 检测视频类型
    const isHLS = newUrl.includes('.m3u8')
    const videoType = isHLS ? 'application/x-mpegURL' : 'video/mp4'
    
    // 更新播放器源
    if (player.value) {
      player.value.src({
        src: newUrl,
        type: videoType
      })
      
      // HLS 流需要特殊处理
      if (isHLS) {
        setupHLSPlayer(player.value, newUrl)
      }
    } else {
      // 创建新播放器
      await createPlayer()
    }
  } catch (error) {
    console.error('Invalid video URL:', error)
    
    // 使用备用URL
    if (props.card.config.source.fallbackUrl) {
      handleVideoUrlChange(props.card.config.source.fallbackUrl, '')
    }
  }
}
```

#### HLS 流媒体处理
```typescript
// HLS 播放器设置
const setupHLSPlayer = (player: VideoJsPlayer, hlsUrl: string) => {
  // 检查是否支持 HLS
  if (player.tech().hls) {
    const hls = player.tech().hls
    
    // 配置 HLS 选项
    hls.xhr.beforeRequest = (options) => {
      // 添加自定义请求头
      if (props.card.config.streaming.customHeaders) {
        Object.assign(options.headers, props.card.config.streaming.customHeaders)
      }
      return options
    }
    
    // 错误重试机制
    hls.on('hlsError', (event, data) => {
      console.error('HLS Error:', data)
      
      if (data.fatal) {
        switch (data.type) {
          case 'networkError':
            // 网络错误重试
            retryHLSConnection(player, hlsUrl)
            break
          case 'mediaError':
            // 媒体错误恢复
            hls.recoverMediaError()
            break
          default:
            // 其他致命错误
            showErrorMessage('HLS 播放器遇到致命错误')
            break
        }
      }
    })
  }
}

// HLS 连接重试
const retryHLSConnection = async (player: VideoJsPlayer, url: string) => {
  const { maxRetries, retryDelay } = props.card.config.streaming.retryConfig
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      
      player.src({
        src: url,
        type: 'application/x-mpegURL'
      })
      
      // 等待加载
      await new Promise((resolve, reject) => {
        const onCanPlay = () => {
          player.off('canplay', onCanPlay)
          player.off('error', onError)
          resolve(true)
        }
        
        const onError = () => {
          player.off('canplay', onCanPlay)
          player.off('error', onError)
          reject(new Error('Retry failed'))
        }
        
        player.on('canplay', onCanPlay)
        player.on('error', onError)
      })
      
      console.log(`HLS connection retry ${i + 1} succeeded`)
      return
    } catch (error) {
      console.error(`HLS connection retry ${i + 1} failed:`, error)
    }
  }
  
  showErrorMessage('HLS 连接重试失败，请检查网络或视频源')
}
```

#### 响应式布局
```typescript
// 宽高比计算
const calculateAspectRatio = (aspectRatio: string, containerWidth: number, containerHeight: number) => {
  if (aspectRatio === 'auto') {
    return { width: '100%', height: '100%' }
  }
  
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
  const targetRatio = widthRatio / heightRatio
  const containerRatio = containerWidth / containerHeight
  
  if (containerRatio > targetRatio) {
    // 容器更宽，以高度为准
    const width = containerHeight * targetRatio
    return {
      width: `${width}px`,
      height: `${containerHeight}px`
    }
  } else {
    // 容器更高，以宽度为准
    const height = containerWidth / targetRatio
    return {
      width: `${containerWidth}px`,
      height: `${height}px`
    }
  }
}

// 容器尺寸监听
const setupResizeObserver = () => {
  if (!containerRef.value) return
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      const aspectRatio = props.card.config.display.aspectRatio
      
      const dimensions = calculateAspectRatio(aspectRatio, width, height)
      
      // 更新播放器尺寸
      if (player.value) {
        player.value.dimensions(dimensions.width, dimensions.height)
      }
    }
  })
  
  resizeObserver.observe(containerRef.value)
}
```

## 迁移检查清单

### 功能迁移
- [ ] Video.js 播放器集成
- [ ] HLS 流媒体支持
- [ ] 常规视频格式支持
- [ ] 自动播放功能
- [ ] 播放控制功能
- [ ] 错误处理机制

### 配置迁移
- [ ] 播放器基础配置
- [ ] 流媒体配置
- [ ] 显示选项配置
- [ ] 交互功能配置
- [ ] 数据源配置

### 性能优化
- [ ] 播放器资源管理
- [ ] 内存泄漏防护
- [ ] 网络重试机制
- [ ] 缓冲优化

## 迁移步骤

### 1. 创建组件定义
```bash
# 创建组件目录
mkdir -p src/card2.1/components/media/video-player

# 创建必要文件
touch src/card2.1/components/media/video-player/definition.ts
touch src/card2.1/components/media/video-player/component.vue
touch src/card2.1/components/media/video-player/config.vue
```

### 2. 实现核心组件
- 迁移 Video.js 播放器逻辑
- 适配 Card 2.1 数据源接口
- 实现 HLS 流媒体支持
- 实现配置表单组件

### 3. 配置验证
- 测试各种视频格式播放
- 验证 HLS 流媒体功能
- 测试响应式布局
- 检查错误处理机制

### 4. 性能测试
- 播放器性能测试
- 内存使用监控
- 网络连接稳定性测试

## 配置示例

### 基础配置
```json
{
  "player": {
    "autoplay": true,
    "muted": true,
    "controls": true,
    "preload": "auto",
    "loop": false
  },
  "source": {
    "fallbackUrl": "https://example.com/fallback.mp4",
    "poster": "https://example.com/poster.jpg"
  },
  "display": {
    "showTitle": false,
    "showLoadingIndicator": true,
    "showErrorMessage": true,
    "aspectRatio": "16:9"
  },
  "interaction": {
    "allowFullscreen": true,
    "allowPictureInPicture": true,
    "enableKeyboardShortcuts": true
  }
}
```

### 流媒体配置
```json
{
  "player": {
    "autoplay": true,
    "muted": true,
    "controls": true
  },
  "streaming": {
    "hlsConfig": {
      "enableWorker": true,
      "lowLatencyMode": true,
      "maxBufferLength": 10,
      "maxMaxBufferLength": 60
    },
    "retryConfig": {
      "maxRetries": 5,
      "retryDelay": 2000
    }
  },
  "display": {
    "aspectRatio": "auto",
    "showLoadingIndicator": true
  }
}
```

## 使用场景

### 1. 监控视频
- 实时监控画面
- 录像回放
- 多路视频切换

### 2. 设备状态视频
- 设备运行状态视频
- 操作指导视频
- 故障诊断视频

### 3. 直播流媒体
- 实时直播流
- 会议视频
- 教学视频

## 相关文档

- [Card 2.1 架构文档](../architecture.md)
- [数据源配置指南](../data-source-guide.md)
- [组件开发规范](../component-development.md)
- [Video.js 官方文档](https://videojs.com/)
- [HLS 协议文档](../hls-protocol.md)