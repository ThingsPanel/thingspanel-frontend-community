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
        // SSO API 地址 (默认 localhost:3001)
        // 可以通过环境变量 VITE_THINGSVIS_API_URL 覆盖
        this.thingsvisApiUrl = import.meta.env.VITE_THINGSVIS_API_URL || 'http://localhost:3001'
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

            // 3. 调用 ThingsVis SSO API
            const response = await fetch(`${this.thingsvisApiUrl}/api/v1/auth/sso`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            })

            if (!response.ok) {
                const errorText = await response.text()
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
