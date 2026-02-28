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
 * 返回不含 hash 部分的 URL，例如 http://localhost:3000/main.html
 * rsbuild 的 entry 配置会生成对应的 HTML 文件
 */
function getStudioBaseUrl(): string {
    // 从环境变量读取，如果没有则使用默认值
    let url = import.meta.env.VITE_THINGSVIS_STUDIO_URL || 'http://localhost:3000/main.html'

    // 移除 hash 部分（如 #/editor），确保只返回基础 URL
    const hashIndex = url.indexOf('#')
    if (hashIndex !== -1) {
        url = url.substring(0, hashIndex)
    }

    // 确保 URL 以 .html 结尾（rsbuild entry 输出格式）
    if (url.endsWith('/main') && !url.endsWith('.html')) {
        url = url + '.html'
    }

    return url
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

    // 注意: token、初始配置(defaultProject)和 apiUrl 现在改用 postMessage 发送
    // 通过 thingsvis:editor-init 消息发送配置，避免 URL 过长和敏感信息泄露

    // 拼接完整URL - 参数必须在 hash 后面！
    // viewer 模式: /embed 路由（纯预览）
    // editor 模式: /editor 路由（编辑器）
    const route = options.mode === 'viewer' ? '/embed' : '/editor'

    const finalUrl = `${baseUrl}#${route}?${params.toString()}`

    // 🔍 调试：打印最终 URL
    console.log('[url-builder] 🔗 构建 URL:', {
        mode: options.mode,
        route,
        baseUrl,
        finalUrl: finalUrl.substring(0, 300)
    })
    console.log('[url-builder] 最终 URL:', {
        hasToken: params.has('token'),
        tokenLength: params.get('token')?.length,
        urlPreview: finalUrl.substring(0, 200) + '...'
    })

    return finalUrl
}
