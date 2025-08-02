# 视频播放器组件 (Video Player)

## 概述

视频播放器组件是一个功能强大的媒体播放组件，基于 Video.js 构建，支持多种视频格式和流媒体协议。该组件专门用于在仪表板中展示视频内容，支持设备视频流、本地视频文件、网络视频等多种数据源。

## 主要特性

### 📹 视频播放
- **多格式支持**：支持 MP4、WebM、OGG、HLS(m3u8) 等主流视频格式
- **流媒体支持**：完整的 HLS 流媒体播放支持，适用于实时视频流
- **自适应播放**：根据网络状况自动调整播放质量
- **播放控制**：完整的播放、暂停、快进、音量、全屏等控制功能

### 🎛️ 播放器配置
- **自动播放**：支持自动播放配置（需配合静音使用）
- **播放速度**：支持 0.25x 到 2x 的播放速度调节
- **音量控制**：精确的音量控制和静音功能
- **循环播放**：支持视频循环播放
- **预加载策略**：可配置的预加载策略优化性能

### 🎨 样式定制
- **容器样式**：支持背景色、边框、内边距等容器样式设置
- **播放器样式**：支持宽高、对象适应等播放器样式配置
- **响应式设计**：完美适配不同屏幕尺寸
- **主题集成**：与系统主题完美集成

### 🔧 高级功能
- **错误处理**：智能的错误重试机制和用户友好的错误提示
- **性能优化**：懒加载、缓冲优化等性能提升功能
- **实时数据**：支持 WebSocket 实时视频流更新
- **设备集成**：与 IoT 设备视频流无缝集成

## 配置选项

### 基础设置
- `title`: 组件标题

### 播放器设置
- `autoplay`: 是否自动播放
- `muted`: 是否静音（自动播放需要）
- `controls`: 是否显示控制条
- `preload`: 预加载策略 (none/metadata/auto)
- `loop`: 是否循环播放
- `playbackRate`: 播放速度 (0.25-2.0)
- `volume`: 音量 (0-1)
- `fullscreen`: 是否支持全屏

### 视频源设置
- `defaultUrl`: 默认视频URL
- `supportedFormats`: 支持的视频格式
- `hls`: HLS配置
  - `enabled`: 是否启用HLS
  - `maxRetries`: 最大重试次数
  - `retryDelay`: 重试间隔

### 样式设置
#### 容器样式
- `backgroundColor`: 背景色
- `border`: 边框设置（显示、宽度、颜色、圆角）
- `padding`: 内边距设置

#### 播放器样式
- `width`: 播放器宽度
- `height`: 播放器高度
- `objectFit`: 对象适应方式 (fill/contain/cover/none/scale-down)

### 错误处理
- `retry`: 重试配置
  - `enabled`: 是否启用重试
  - `maxRetries`: 最大重试次数
  - `retryInterval`: 重试间隔
- `display`: 错误显示配置
  - `showMessage`: 是否显示错误信息
  - `customMessage`: 自定义错误信息

### 性能优化
- `lazyLoad`: 是否启用懒加载
- `preloadThreshold`: 预加载阈值
- `bufferSize`: 缓冲大小

## 数据格式

### 输入数据格式
```typescript
interface VideoData {
  url: string      // 视频URL
  error?: string   // 错误信息（可选）
}
```

### 设备属性数据格式
```json
{
  "value": "https://example.com/video.mp4"
}
```

### HLS流媒体数据格式
```json
{
  "value": "https://example.com/stream.m3u8"
}
```

## 使用示例

### 基础用法
```vue
<template>
  <VideoPlayerComponent 
    :config="videoConfig"
    :data-source="dataSource"
  />
</template>

<script setup>
import { ref } from 'vue'
import VideoPlayerComponent from './component.vue'

const videoConfig = ref({
  basic: {
    title: '监控视频'
  },
  player: {
    autoplay: true,
    muted: true,
    controls: true
  },
  source: {
    defaultUrl: 'https://example.com/default.mp4'
  }
})

const dataSource = ref({
  type: 'device',
  deviceSource: [{
    deviceId: 'camera_001',
    metricsType: 'attributes',
    metricsId: 'video_stream_url',
    metricsName: '视频流地址'
  }]
})
</script>
```

### HLS流媒体配置
```vue
<template>
  <VideoPlayerComponent 
    :config="hlsConfig"
    :data-source="dataSource"
    @video-ready="handleVideoReady"
    @error="handleError"
  />
</template>

<script setup>
const hlsConfig = ref({
  basic: {
    title: 'HLS直播流'
  },
  player: {
    autoplay: true,
    muted: true,
    controls: true,
    preload: 'auto'
  },
  source: {
    supportedFormats: ['m3u8', 'mp4'],
    hls: {
      enabled: true,
      maxRetries: 5,
      retryDelay: 2000
    }
  },
  style: {
    container: {
      backgroundColor: '#000000',
      border: {
        show: true,
        width: 2,
        color: '#1890ff',
        radius: 8
      }
    },
    player: {
      objectFit: 'cover'
    }
  },
  error: {
    retry: {
      enabled: true,
      maxRetries: 3,
      retryInterval: 3000
    },
    display: {
      showMessage: true,
      customMessage: '视频流连接失败，正在重试...'
    }
  }
})

const handleVideoReady = (player) => {
  console.log('视频播放器准备就绪:', player)
  // 可以通过 player 对象控制播放器
}

const handleError = (error) => {
  console.error('视频播放错误:', error)
}
</script>
```

### 高级配置示例
```vue
<template>
  <VideoPlayerComponent 
    ref="videoPlayerRef"
    :config="advancedConfig"
    :data-source="dataSource"
    @video-play="handlePlay"
    @video-pause="handlePause"
    @video-ended="handleEnded"
  />
</template>

<script setup>
const videoPlayerRef = ref()

const advancedConfig = ref({
  basic: {
    title: '高级视频播放器'
  },
  player: {
    autoplay: false,
    muted: false,
    controls: true,
    preload: 'metadata',
    loop: false,
    playbackRate: 1,
    volume: 0.8,
    fullscreen: true
  },
  source: {
    defaultUrl: 'https://example.com/fallback.mp4',
    supportedFormats: ['mp4', 'webm', 'ogg', 'm3u8'],
    hls: {
      enabled: true,
      maxRetries: 3,
      retryDelay: 1500
    }
  },
  style: {
    container: {
      backgroundColor: '#1a1a1a',
      border: {
        show: true,
        width: 1,
        color: '#333333',
        radius: 12
      },
      padding: {
        top: 8,
        right: 8,
        bottom: 8,
        left: 8
      }
    },
    player: {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    }
  },
  error: {
    retry: {
      enabled: true,
      maxRetries: 5,
      retryInterval: 2000
    },
    display: {
      showMessage: true,
      customMessage: '视频加载失败，请检查网络连接或联系管理员'
    }
  },
  performance: {
    lazyLoad: true,
    preloadThreshold: 0.3,
    bufferSize: 2048
  }
})

// 播放控制方法
const playVideo = () => {
  videoPlayerRef.value?.play()
}

const pauseVideo = () => {
  videoPlayerRef.value?.pause()
}

const stopVideo = () => {
  videoPlayerRef.value?.stop()
}

const setVolume = (volume) => {
  videoPlayerRef.value?.setVolume(volume)
}

const toggleFullscreen = () => {
  videoPlayerRef.value?.toggleFullscreen()
}

// 事件处理
const handlePlay = () => {
  console.log('视频开始播放')
}

const handlePause = () => {
  console.log('视频暂停')
}

const handleEnded = () => {
  console.log('视频播放结束')
}
</script>
```

## 事件

- `data-change`: 数据变化事件，参数：`{ url, error }`
- `error`: 错误事件，参数：`Error`
- `video-ready`: 播放器准备就绪事件，参数：`VideoJsPlayer`
- `video-play`: 视频开始播放事件
- `video-pause`: 视频暂停事件
- `video-ended`: 视频播放结束事件

## 方法

- `updateData(deviceId, metricsId, data)`: 更新视频数据
- `refreshData()`: 刷新视频数据
- `play()`: 播放视频
- `pause()`: 暂停视频
- `stop()`: 停止视频
- `setVolume(volume)`: 设置音量 (0-1)
- `toggleFullscreen()`: 切换全屏模式
- `player()`: 获取 Video.js 播放器实例

## 样式类名

- `.video-player-container`: 主容器
- `.loading-state`: 加载状态
- `.error-state`: 错误状态
- `.video-wrapper`: 视频包装器
- `.video-info-overlay`: 视频信息覆盖层

## 技术特性

### Video.js 集成
- 基于 Video.js 7.x 构建
- 支持丰富的插件生态
- 完整的 API 支持
- 自定义主题和样式

### HLS 支持
- 原生 HLS 协议支持
- 自适应码率流
- 低延迟流媒体
- 错误恢复机制

### 性能优化
- 懒加载减少初始加载时间
- 智能缓冲策略
- 内存管理和资源清理
- 响应式设计优化

## 注意事项

1. **自动播放限制**：现代浏览器要求自动播放必须静音，建议启用 `muted` 选项
2. **HTTPS要求**：某些浏览器要求视频流使用 HTTPS 协议
3. **CORS配置**：跨域视频资源需要正确配置 CORS 头
4. **格式兼容性**：不同浏览器对视频格式的支持程度不同
5. **性能考虑**：大量视频组件可能影响页面性能，建议使用懒加载
6. **移动端适配**：移动设备上的视频播放行为可能与桌面端不同

## 兼容性

- 支持 Vue 3.x
- 兼容现代浏览器 (Chrome 80+, Firefox 78+, Safari 14+)
- 支持移动端浏览器
- 需要 Video.js 7.x 或更高版本
- 支持 HLS.js（用于 HLS 流媒体）

## 故障排除

### 常见问题

1. **视频无法播放**
   - 检查视频URL是否有效
   - 确认视频格式是否支持
   - 检查网络连接
   - 验证CORS配置

2. **自动播放失败**
   - 启用静音选项
   - 检查浏览器自动播放策略
   - 确认用户已与页面交互

3. **HLS流无法播放**
   - 检查HLS流URL格式
   - 确认服务器支持HLS协议
   - 验证网络连接稳定性

4. **性能问题**
   - 启用懒加载
   - 调整缓冲大小
   - 减少同时播放的视频数量

## 迁移指南

### 从旧版组件迁移

旧版配置会自动映射到新版配置：

```javascript
// 旧版配置
{
  dataSource: {
    deviceSource: [{
      deviceId: 'camera_001',
      metricsId: 'video_url'
    }]
  }
}

// 自动映射为新版配置
{
  player: {
    autoplay: true,
    muted: true,
    controls: true
  },
  source: {
    hls: {
      enabled: true,
      maxRetries: 3
    }
  },
  error: {
    retry: {
      enabled: true
    }
  }
}
```

## 更新日志

### v2.0.0
- 🎉 全新的 Card 2.0 架构
- ✨ 新增 HLS 流媒体支持
- ✨ 新增错误重试机制
- ✨ 新增性能优化选项
- ✨ 新增响应式设计
- 🎨 优化播放器样式和主题
- 🐛 修复自动播放问题
- 📈 提升播放性能和稳定性
- 🔧 完善的配置选项和API