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
}

/**
 * 获取 ThingsVis Studio 基础 URL
 */
function getStudioBaseUrl(): string {
    // 从环境变量读取，如果没有则使用默认值
    return import.meta.env.VITE_THINGSVIS_STUDIO_URL || 'http://localhost:3000/main#/editor'
}

/**
 * Base64 URL 编码(安全的URL参数编码)
 */
function encodeBase64Url(str: string): string {
    try {
        // 先 URI 编码，再 Base64 编码
        const encoded = btoa(encodeURIComponent(str))
        // URL 安全化：替换 +/= 字符
        return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    } catch (error) {
        console.error('Base64 编码失败:', error)
        return ''
    }
}

/**
 * 构建 ThingsVis 编辑器 URL
 */
export function buildThingsVisUrl(options: ThingsVisUrlOptions): string {
    const baseUrl = getStudioBaseUrl()

    // 确定集成级别
    const integration = options.mode === 'editor' ? 'full' : 'minimal'

    // 基础参数
    const params = new URLSearchParams({
        mode: 'embedded',
        integration,
        saveTarget: options.saveTarget || 'host'
    })

    // 1. 添加认证 Token (关键修复)
    const token = localStg.get('token')
    if (token) {
        params.set('token', token)
    }

    // 显示选项(编辑模式默认显示，预览模式默认隐藏)
    const isEditor = options.mode === 'editor'
    params.set('showLibrary', options.showLibrary ?? isEditor ? '1' : '0')
    params.set('showProps', options.showProps ?? isEditor ? '1' : '0')
    params.set('showToolbar', options.showToolbar ?? isEditor ? '1' : '0')

    // 平台字段
    if (options.platformFields && options.platformFields.length > 0) {
        params.set('platformFields', JSON.stringify(options.platformFields))
    }

    // 默认项目配置
    if (options.config) {
        const encoded = encodeBase64Url(JSON.stringify(options.config))
        if (encoded) {
            params.set('defaultProject', encoded)
        }
    }

    // 拼接完整URL
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}${params.toString()}`
}
