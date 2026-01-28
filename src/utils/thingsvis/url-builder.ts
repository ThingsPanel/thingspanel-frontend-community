/**
 * ThingsVis URL 构建工具
 * 用于生成嵌入式编辑器的URL
 */

import type { PlatformField } from './types'
import { localStg } from '@/utils/storage'

/** URL 构建选项 */
export interface ThingsVisUrlOptions {
    /** 模式: editor=编辑模式, viewer=预览模式 */
    mode: 'editor' | 'viewer'
    /** 初始配置(会被Base64编码) */
    config?: any
    /** 平台字段列表 */
    platformFields?: PlatformField[]
    /** 保存目标: self=编辑器自己, host=宿主平台 */
    saveTarget?: 'self' | 'host'
    /** 是否显示组件库 */
    showLibrary?: boolean
    /** 是否显示属性面板 */
    showProps?: boolean
    /** 是否显示工具栏 */
    showToolbar?: boolean
    /** 是否显示左上角区域 */
    showTopLeft?: boolean
    /** 是否显示右上角区域 */
    showTopRight?: boolean
}

/**
 * 获取 ThingsVis Studio 基础 URL
 */
function getStudioBaseUrl(): string {
    // 从环境变量读取，如果没有则使用默认值
    return import.meta.env.VITE_THINGSVIS_STUDIO_URL || 'http://localhost:3000/main'
}



/**
 * 构建 ThingsVis 编辑器 URL (支持 SSO)
 */
export async function buildThingsVisUrl(options: ThingsVisUrlOptions): Promise<string> {
    const baseUrl = getStudioBaseUrl()

    // 确定集成级别
    const integration = options.mode === 'editor' ? 'full' : 'minimal'

    // 基础参数
    const params = new URLSearchParams({
        mode: 'embedded',
        integration,
        saveTarget: options.saveTarget || 'host'
    })

    // 1. SSO Token 交换 (关键实现)
    try {
        // 动态导入以避免循环依赖
        const { getThingsVisToken } = await import('./thingsvis-auth')
        const thingsvisToken = await getThingsVisToken()

        if (thingsvisToken) {
            params.set('token', thingsvisToken)
            console.log('✅ Using ThingsVis SSO token')
        } else {
            // 降级：使用 ThingsPanel token
            const tpToken = localStg.get('token')
            if (tpToken) {
                params.set('token', tpToken)
                console.warn('⚠️ Using ThingsPanel token as fallback')
            }
        }
    } catch (error) {
        console.error('❌ SSO token exchange failed, using fallback:', error)
        // 降级：使用 ThingsPanel token
        const tpToken = localStg.get('token')
        if (tpToken) {
            params.set('token', tpToken)
        }
    }

    // 显示选项(编辑模式默认显示，预览模式默认隐藏)
    const isEditor = options.mode === 'editor'

    // viewer 模式：明确隐藏所有 UI
    if (options.mode === 'viewer') {
        params.set('showLibrary', '0')
        params.set('showProps', '0')
        params.set('showToolbar', '0')
        params.set('showTopLeft', '0')
        params.set('showTopRight', '0')
    } else if (integration === 'full') {
        // editor 模式：只设置需要隐藏的 UI
        const shouldShowLibrary = options.showLibrary ?? isEditor
        const shouldShowProps = options.showProps ?? isEditor
        const shouldShowToolbar = options.showToolbar ?? isEditor
        const shouldShowTopLeft = options.showTopLeft ?? false
        const shouldShowTopRight = options.showTopRight ?? false

        if (!shouldShowLibrary) params.set('showLibrary', '0')
        if (!shouldShowProps) params.set('showProps', '0')
        if (!shouldShowToolbar) params.set('showToolbar', '0')
        if (!shouldShowTopLeft) params.set('showTopLeft', '0')
        if (!shouldShowTopRight) params.set('showTopRight', '0')
    }

    // 平台字段
    if (options.platformFields && options.platformFields.length > 0) {
        params.set('platformFields', JSON.stringify(options.platformFields))
    }

    // 注意: 初始配置(defaultProject)改用 postMessage 发送
    // 通过 thingsvis:editor-init 消息发送配置，避免 URL 过长

    // 拼接完整URL - 参数必须在 hash 后面！
    // viewer 模式: /embed 路由（纯预览）
    // editor 模式: /editor 路由（编辑器）
    const route = options.mode === 'viewer' ? '/embed' : '/editor'

    return `${baseUrl}#${route}?${params.toString()}`
}
