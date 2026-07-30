import { ref } from 'vue'

const MARKET_TOKEN_STORAGE_KEY = 'market_token'
const TOKEN_EXPIRY_SKEW_SECONDS = 30

const marketToken = ref<string | null>(sessionStorage.getItem(MARKET_TOKEN_STORAGE_KEY))

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
  const setToken = (token: string) => {
    marketToken.value = token
    sessionStorage.setItem(MARKET_TOKEN_STORAGE_KEY, token)
  }

  const clearToken = () => {
    marketToken.value = null
    sessionStorage.removeItem(MARKET_TOKEN_STORAGE_KEY)
  }

  const getToken = () => {
    const token = marketToken.value
    if (!token) return null

    const expiresAt = decodeTokenExpiry(token)
    const now = Math.floor(Date.now() / 1000)
    if (expiresAt === null || expiresAt <= now + TOKEN_EXPIRY_SKEW_SECONDS) {
      clearToken()
      return null
    }

    return token
  }

  const isLoggedIn = () => Boolean(getToken())

  return { isLoggedIn, setToken, clearToken, getToken }
}
