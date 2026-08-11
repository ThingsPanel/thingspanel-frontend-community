import { ref } from 'vue'
import { marketRefresh } from '@/service/api/market'

const MARKET_TOKEN_STORAGE_KEY = 'market_token'
const MARKET_REFRESH_TOKEN_STORAGE_KEY = 'market_refresh_token'
const TOKEN_EXPIRY_SKEW_SECONDS = 30

// 市场登录需要跨页面、跨浏览器重启保持；旧版本的 sessionStorage token 兼容迁移一次。
const storedToken = localStorage.getItem(MARKET_TOKEN_STORAGE_KEY) || sessionStorage.getItem(MARKET_TOKEN_STORAGE_KEY)
if (storedToken && !localStorage.getItem(MARKET_TOKEN_STORAGE_KEY)) {
  localStorage.setItem(MARKET_TOKEN_STORAGE_KEY, storedToken)
  sessionStorage.removeItem(MARKET_TOKEN_STORAGE_KEY)
}
const marketToken = ref<string | null>(storedToken)
const refreshToken = ref<string | null>(localStorage.getItem(MARKET_REFRESH_TOKEN_STORAGE_KEY))

function decodeTokenExpiry(token: string): number | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(padded), char => char.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { exp?: unknown }

    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export function useMarketAuth() {
  const setToken = (token: string, nextRefreshToken?: string, expiresIn?: number, expiresAt?: number) => {
    marketToken.value = token
    localStorage.setItem(MARKET_TOKEN_STORAGE_KEY, token)
    if (nextRefreshToken) {
      refreshToken.value = nextRefreshToken
      localStorage.setItem(MARKET_REFRESH_TOKEN_STORAGE_KEY, nextRefreshToken)
    }
    if (expiresIn) localStorage.setItem(`${MARKET_TOKEN_STORAGE_KEY}_expires_at`, String(Date.now() + expiresIn * 1000))
    if (expiresAt) localStorage.setItem(`${MARKET_TOKEN_STORAGE_KEY}_expires_at`, String(expiresAt * 1000))
    sessionStorage.removeItem(MARKET_TOKEN_STORAGE_KEY)
  }

  const clearToken = () => {
    marketToken.value = null
    localStorage.removeItem(MARKET_TOKEN_STORAGE_KEY)
    localStorage.removeItem(MARKET_REFRESH_TOKEN_STORAGE_KEY)
    localStorage.removeItem(`${MARKET_TOKEN_STORAGE_KEY}_expires_at`)
    sessionStorage.removeItem(MARKET_TOKEN_STORAGE_KEY)
  }

  const getToken = () => {
    const token = marketToken.value
    if (!token) return null

    const expiresAt = decodeTokenExpiry(token)
    const now = Math.floor(Date.now() / 1000)
    if (expiresAt === null || expiresAt <= now + TOKEN_EXPIRY_SKEW_SECONDS) {
      if (refreshToken.value) {
        void refreshAccessToken()
      } else {
        clearToken()
      }
      return null
    }

    return token
  }

  const isLoggedIn = () => Boolean(getToken() || refreshToken.value)

  async function refreshAccessToken() {
    const currentRefreshToken = refreshToken.value
    if (!currentRefreshToken) return null
    try {
      const res: any = await marketRefresh(currentRefreshToken)
      const auth = res?.data || res
      if (!auth?.token) return null
      setToken(auth.token, auth.refresh_token || currentRefreshToken, auth.expires_in, auth.expires_at)
      return auth.token
    } catch {
      return null
    }
  }

  return { isLoggedIn, setToken, clearToken, getToken, refreshAccessToken }
}
