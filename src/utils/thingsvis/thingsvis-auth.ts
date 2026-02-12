/**
 * ThingsVis SSO Authentication Service
 * 实现 ThingsPanel Token 与 ThingsVis JWT Token 的交换
 */

import { localStg } from '@/utils/storage'
import type { SSOExchangeRequest, SSOExchangeResponse } from './types'

/**
 * ThingsVis SSO 认证服务类
 */
export class ThingsVisAuthService {
    private cachedToken: string | null = null
    private tokenExpiry: number = 0
    private thingsvisApiUrl: string

    constructor() {
        // SSO API 地址
        // 使用代理路径 /thingsvis-api 避免 CORS 问题
        // 代理会将 /thingsvis-api 重写为 localhost:3001/api/v1
        // 注意：这里不需要 /api/v1 后缀，因为代理会自动添加
        this.thingsvisApiUrl = import.meta.env.VITE_THINGSVIS_API_URL || '/thingsvis-api'
    }

    /**
     * 交换 ThingsPanel Token -> ThingsVis Token
     */
    async exchangeToken(): Promise<string> {
        try {
            // 1. 获取当前 ThingsPanel 用户信息
            const tpToken = localStg.get('token')
            const userInfo = localStg.get('userInfo')

            if (!tpToken) {
                throw new Error('ThingsPanel token not found')
            }

            if (!userInfo) {
                throw new Error('User info not found')
            }

            // 2. 构建 SSO 请求
            const request: SSOExchangeRequest = {
                platform: 'thingspanel',
                platformToken: tpToken,
                userInfo: {
                    id: userInfo.userId || userInfo.id || '',
                    email: userInfo.email || `${userInfo.userName}@thingspanel.local`,
                    name: userInfo.userName || 'ThingsPanel User',
                    tenantId: userInfo.tenantId || 'default'
                }
            }

            // 3. 调用 ThingsVis SSO API (通过代理)
            // /thingsvis-api/auth/sso -> localhost:3001/api/v1/auth/sso
            const ssoUrl = `${this.thingsvisApiUrl}/auth/sso`
            console.log('[SSO] 📡 调用 SSO API:', ssoUrl)
            console.log('[SSO] 请求数据:', { platform: request.platform, userEmail: request.userInfo.email })
            
            const response = await fetch(ssoUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            })

            console.log('[SSO] 响应状态:', response.status)
            
            if (!response.ok) {
                const errorText = await response.text()
                console.error('[SSO] 响应错误:', errorText)
                throw new Error(`Token exchange failed: ${response.status} - ${errorText}`)
            }

            const data: SSOExchangeResponse = await response.json()

            // 4. 缓存 Token
            this.cachedToken = data.accessToken
            this.tokenExpiry = Date.now() + (data.expiresIn || 7200) * 1000 // 默认 2 小时

            console.log('✅ SSO Token exchange successful')

            return data.accessToken
        } catch (error) {
            console.error('❌ SSO Token exchange failed:', error)
            // 清除缓存的 token
            this.cachedToken = null
            this.tokenExpiry = 0
            throw error
        }
    }

    /**
     * 获取有效的 ThingsVis Token (自动刷新)
     */
    async getValidToken(): Promise<string> {
        // Token 未过期，直接返回
        if (this.cachedToken && Date.now() < this.tokenExpiry) {
            console.log('🔄 Using cached ThingsVis token')
            return this.cachedToken
        }

        // Token 过期或不存在，重新交换
        console.log('🔄 Token expired or not found, exchanging...')
        return await this.exchangeToken()
    }

    /**
     * 清除缓存的 Token
     */
    clearToken(): void {
        this.cachedToken = null
        this.tokenExpiry = 0
    }

    /**
     * 检查 Token 是否有效
     */
    isTokenValid(): boolean {
        return Boolean(this.cachedToken && Date.now() < this.tokenExpiry)
    }

    /**
     * 获取 Token 过期时间
     */
    getTokenExpiry(): Date | null {
        if (!this.tokenExpiry) return null
        return new Date(this.tokenExpiry)
    }
}

/**
 * 单例实例
 */
export const thingsvisAuthService = new ThingsVisAuthService()

/**
 * 便捷方法：获取有效的 ThingsVis Token
 */
export async function getThingsVisToken(): Promise<string> {
    return thingsvisAuthService.getValidToken()
}

/**
 * 便捷方法：清除 ThingsVis Token
 */
export function clearThingsVisToken(): void {
    thingsvisAuthService.clearToken()
}
