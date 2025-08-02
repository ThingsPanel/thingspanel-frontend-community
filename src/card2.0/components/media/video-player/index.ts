/**
 * Card 2.0 视频播放器组件定义
 * 基于原有 chart-videoplayer 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition, RendererType, DataSourceType } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * 视频播放器配置接口
 */
export interface VideoPlayerConfig {
  /** 基础设置 */
  basic?: {
    /** 组件标题 */
    title?: string
  }

  /** 播放器设置 */
  player?: {
    /** 是否自动播放 */
    autoplay?: boolean
    /** 是否静音 */
    muted?: boolean
    /** 是否显示控制条 */
    controls?: boolean
    /** 预加载策略 */
    preload?: 'none' | 'metadata' | 'auto'
    /** 是否循环播放 */
    loop?: boolean
    /** 播放速度 */
    playbackRate?: number
    /** 音量 */
    volume?: number
    /** 是否全屏 */
    fullscreen?: boolean
  }

  /** 视频源设置 */
  source?: {
    /** 默认视频URL */
    defaultUrl?: string
    /** 支持的视频格式 */
    supportedFormats?: string[]
    /** HLS配置 */
    hls?: {
      /** 是否启用HLS */
      enabled?: boolean
      /** 重试次数 */
      maxRetries?: number
      /** 重试间隔 */
      retryDelay?: number
    }
  }

  /** 样式设置 */
  style?: {
    /** 容器样式 */
    container?: {
      /** 背景色 */
      backgroundColor?: string
      /** 边框 */
      border?: {
        show?: boolean
        width?: number
        color?: string
        radius?: number
      }
      /** 内边距 */
      padding?: {
        top?: number
        right?: number
        bottom?: number
        left?: number
      }
    }
    /** 播放器样式 */
    player?: {
      /** 宽度 */
      width?: string
      /** 高度 */
      height?: string
      /** 对象适应 */
      objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
    }
  }

  /** 错误处理 */
  error?: {
    /** 错误重试 */
    retry?: {
      /** 是否启用重试 */
      enabled?: boolean
      /** 最大重试次数 */
      maxRetries?: number
      /** 重试间隔 */
      retryInterval?: number
    }
    /** 错误显示 */
    display?: {
      /** 显示错误信息 */
      showMessage?: boolean
      /** 自定义错误信息 */
      customMessage?: string
    }
  }

  /** 性能优化 */
  performance?: {
    /** 懒加载 */
    lazyLoad?: boolean
    /** 预加载阈值 */
    preloadThreshold?: number
    /** 缓冲大小 */
    bufferSize?: number
  }
}

/**
 * Card 2.0 视频播放器组件定义
 * 从 src/card/chart-card/video-player 迁移而来
 */
export const videoPlayerDefinition: IComponentDefinition<VideoPlayerConfig> = {
  // 组件元数据
  meta: {
    id: 'media-video-player-v2',
    name: 'dashboard_panel.cardName.videoPlayer',
    version: '2.0.0',
    description: '视频播放器组件，支持多种视频格式和HLS流媒体播放',
    category: 'media',
    tags: ['video', 'player', 'media', 'hls', 'streaming'],
    author: 'ThingsPanel',
    icon: 'mdi:video',
    thumbnail: '/assets/thumbnails/video-player.png'
  },

  // 渲染器支持
  renderers: ['vue'] as RendererType[],

  // 组件尺寸
  size: {
    width: 5,
    height: 3,
    minWidth: 2,
    minHeight: 1,
    maxWidth: 12,
    maxHeight: 8
  },

  // 兼容性配置
  compatibility: {
    // 旧版组件ID映射
    legacyIds: ['chart-videoplayer'],

    // 配置迁移函数
    migrateConfig: (oldConfig: any): VideoPlayerConfig => {
      const newConfig: VideoPlayerConfig = {
        basic: {
          title: oldConfig.title || $t('dashboard_panel.cardName.videoPlayer')
        },
        player: {
          autoplay: true,
          muted: true,
          controls: true,
          preload: 'auto',
          loop: false,
          playbackRate: 1,
          volume: 0.8,
          fullscreen: true
        },
        source: {
          supportedFormats: ['mp4', 'webm', 'ogg', 'm3u8'],
          hls: {
            enabled: true,
            maxRetries: 3,
            retryDelay: 1000
          }
        },
        style: {
          container: {
            backgroundColor: '#000000',
            border: {
              show: false,
              width: 1,
              color: '#d9d9d9',
              radius: 4
            },
            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
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
            maxRetries: 3,
            retryInterval: 2000
          },
          display: {
            showMessage: true,
            customMessage: '视频加载失败，请检查网络连接'
          }
        },
        performance: {
          lazyLoad: false,
          preloadThreshold: 0.5,
          bufferSize: 1024
        }
      }

      return newConfig
    },

    // 数据迁移函数
    migrateData: (oldData: any) => {
      // 视频播放器主要从设备属性获取视频URL
      return oldData
    }
  },

  // 数据处理
  dataProcessor: {
    // 处理设备属性数据
    processDeviceData: (data: any[], config: VideoPlayerConfig) => {
      if (!data || data.length === 0) {
        return {
          url: config.source?.defaultUrl || '',
          error: null
        }
      }

      const videoData = data[0]
      let url = ''

      if (videoData && videoData.value) {
        url = videoData.value
      }

      return {
        url,
        error: url ? null : '未获取到视频URL'
      }
    },

    // 处理API数据
    processApiData: (data: any, config: VideoPlayerConfig) => {
      if (!data) {
        return {
          url: config.source?.defaultUrl || '',
          error: '数据为空'
        }
      }

      let url = ''
      if (typeof data === 'string') {
        url = data
      } else if (data.url) {
        url = data.url
      } else if (data.value) {
        url = data.value
      }

      return {
        url,
        error: url ? null : '无效的视频数据格式'
      }
    }
  },

  // 生命周期钩子
  lifecycle: {
    onMount: (instance: any) => {
      console.log('Video player component mounted:', instance.config.meta?.id)
    },
    onUnmount: (instance: any) => {
      console.log('Video player component unmounted:', instance.config.meta?.id)
      // 清理视频播放器资源
      if (instance.player) {
        instance.player.dispose()
      }
    },
    onDataChange: (instance: any, newData: any) => {
      console.log('Video player data changed:', newData)
    }
  },

  // Vue组件路径
  component: {
    vue: defineAsyncComponent(() => import('./component.vue'))
  },

  // 配置组件路径
  configComponent: {
    vue: defineAsyncComponent(() => import('./config.vue'))
  },

  // 默认配置
  defaultConfig: {
    basic: {
      title: $t('dashboard_panel.cardName.videoPlayer')
    },
    player: {
      autoplay: true,
      muted: true,
      controls: true,
      preload: 'auto',
      loop: false,
      playbackRate: 1,
      volume: 0.8,
      fullscreen: true
    },
    source: {
      defaultUrl: '',
      supportedFormats: ['mp4', 'webm', 'ogg', 'm3u8'],
      hls: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000
      }
    },
    style: {
      container: {
        backgroundColor: '#000000',
        border: {
          show: false,
          width: 1,
          color: '#d9d9d9',
          radius: 4
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
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
        maxRetries: 3,
        retryInterval: 2000
      },
      display: {
        showMessage: true,
        customMessage: '视频加载失败，请检查网络连接'
      }
    },
    performance: {
      lazyLoad: false,
      preloadThreshold: 0.5,
      bufferSize: 1024
    }
  } as VideoPlayerConfig,

  // JSON Schema定义
  schema: {
    type: 'object',
    properties: {
      basic: {
        type: 'object',
        title: '基础设置',
        properties: {
          title: {
            type: 'string',
            title: '组件标题',
            default: $t('dashboard_panel.cardName.videoPlayer')
          }
        }
      },
      player: {
        type: 'object',
        title: '播放器设置',
        properties: {
          autoplay: {
            type: 'boolean',
            title: '自动播放',
            default: true
          },
          muted: {
            type: 'boolean',
            title: '静音',
            default: true
          },
          controls: {
            type: 'boolean',
            title: '显示控制条',
            default: true
          },
          preload: {
            type: 'string',
            title: '预加载策略',
            enum: ['none', 'metadata', 'auto'],
            default: 'auto'
          },
          loop: {
            type: 'boolean',
            title: '循环播放',
            default: false
          },
          volume: {
            type: 'number',
            title: '音量',
            minimum: 0,
            maximum: 1,
            default: 0.8
          }
        }
      },
      source: {
        type: 'object',
        title: '视频源设置',
        properties: {
          defaultUrl: {
            type: 'string',
            title: '默认视频URL',
            format: 'uri'
          },
          hls: {
            type: 'object',
            title: 'HLS配置',
            properties: {
              enabled: {
                type: 'boolean',
                title: '启用HLS',
                default: true
              },
              maxRetries: {
                type: 'number',
                title: '最大重试次数',
                minimum: 0,
                default: 3
              }
            }
          }
        }
      }
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['device', 'api'] as DataSourceType[],

  // 布局信息
  layout: {
    category: 'media',
    priority: 1,
    grid: {
      resizable: true,
      draggable: true
    }
  },

  // 依赖项
  dependencies: {
    external: ['video.js'],
    internal: ['@/service/api/device']
  },

  // 样式文件
  styles: {
    css: ['video.js/dist/video-js.css']
  }
}

// 导出组件定义
export default videoPlayerDefinition
