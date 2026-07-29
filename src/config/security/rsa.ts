/**
 * RSA 安全配置
 * RSA Security Configuration
 */

/**
 * RSA 公钥配置
 * RSA Public Key Configuration
 */
export const rsaPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBCgKCAQEA35ATUHHwTvEHxaOKG/8xTETHq7+syHqEkDXSuKf2irYZefaKe4n2
GiM6uWFBgaXX/LxvxkbIQ0WK0R+mIziaF3mTa3gs7n5OiJgJDsqzZHzS9to6j9Mc
NG3v2R0wgjCs9FCR51ZEZIxxC5YYlHd2ZQoVZ8oLMdg9bhop5CsG9J1spkhx8cmY
r50hSenA7rxTQ7fSc8TmMgR6Env84rjUMgxBO7RgnbaURzde0UPOrEmc7FGCZJix
fSkMao0ZoWz5PNE7tNU9LYQJThy+T46HAu5V5zWOuo9AdBdJvQH43yhIptLB/Z1p
UsdVUZ0ESaoP326ag8R5EqBSa2+4gce14QIDAQAB
-----END PUBLIC KEY-----`

/**
 * RSA 配置选项
 * RSA Configuration Options
 */
export const rsaConfig = {
  /** 密钥大小 */
  keySize: 2048,
  /** 加密算法 */
  algorithm: 'RSA-OAEP',
  /** 哈希算法 */
  hashAlgorithm: 'SHA-256',
  /** 是否启用环境变量覆盖 */
  enableEnvOverride: true
} as const

/**
 * 获取 RSA 公钥
 * Get RSA Public Key
 * @returns RSA 公钥字符串
 */
export function getRSAPublicKey(): string {
  // 如果启用环境变量覆盖，优先使用环境变量
  if (rsaConfig.enableEnvOverride && import.meta.env.VITE_RSA_PUBLIC_KEY) {
    return import.meta.env.VITE_RSA_PUBLIC_KEY
  }

  return rsaPublicKey
}

/**
 * 验证 RSA 公钥格式
 * Validate RSA Public Key Format
 * @param key 公钥字符串
 * @returns 是否为有效的 RSA 公钥格式
 */
export function validateRSAPublicKey(key: string): boolean {
  return key.includes('-----BEGIN PUBLIC KEY-----') && key.includes('-----END PUBLIC KEY-----') && key.length > 100
}
