import { ref } from 'vue'

const marketToken = ref<string | null>(sessionStorage.getItem('market_token'))

export function useMarketAuth() {
  const isLoggedIn = () => {
    if (!marketToken.value) return false
    return true
  }

  const setToken = (token: string) => {
    marketToken.value = token
    sessionStorage.setItem('market_token', token)
  }

  const clearToken = () => {
    marketToken.value = null
    sessionStorage.removeItem('market_token')
  }

  const getToken = () => marketToken.value

  return { isLoggedIn, setToken, clearToken, getToken }
}
