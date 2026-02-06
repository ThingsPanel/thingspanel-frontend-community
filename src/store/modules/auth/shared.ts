import { localStg } from '@/utils/storage'
/** Get token */
export function getToken() {
  return localStg.get('token') || ''
}

/** Get user info */
export function getUserInfo() {
  const emptyInfo: Api.Auth.UserInfo = {
    authority: '',
    id: '',
    userId: '',
    userName: '',
    roles: []
  }
  const userInfo = localStg.get('userInfo') || emptyInfo

  return userInfo
}

/** Check if token is expired */
export function isTokenExpired() {
  const tokenExpiresIn = localStg.get('token_expires_in')
  if (!tokenExpiresIn) return true

  const expiresTime = parseInt(tokenExpiresIn)
  const currentTime = Date.now()

  // 提前5分钟检查过期，避免在请求过程中过期
  return currentTime >= expiresTime - 5 * 60 * 1000
}

/** Clear auth storage */
export function clearAuthStorage() {
  localStg.remove('token')
  localStg.remove('refreshToken')
  localStg.remove('userInfo')
  localStg.remove('token_expires_in')
}
