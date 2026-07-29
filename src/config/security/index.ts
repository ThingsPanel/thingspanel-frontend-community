/**
 * 安全配置统一导出
 * Security Configuration Unified Exports
 */

// 导出 RSA 配置
export { rsaPublicKey, rsaConfig, getRSAPublicKey, validateRSAPublicKey } from './rsa'

// 导出类型定义
export type {
  RSASecurityConfig,
  SecurityConfig,
  RSAEncryptionOptions,
  RSADecryptionOptions,
  RSAKeyPair,
  SecurityConfigConstants
} from './types'

/**
 * 安全配置对象
 * Security Configuration Object
 */
export const securityConfig = {
  rsa: {
    publicKey: '',
    keySize: 2048,
    algorithm: 'RSA-OAEP',
    hashAlgorithm: 'SHA-256',
    enableEnvOverride: true
  }
} as const

/**
 * 获取完整的安全配置
 * Get Complete Security Configuration
 * @returns 完整的安全配置对象
 */
export function getSecurityConfig() {
  return {
    rsa: {
      publicKey: getRSAPublicKey(),
      keySize: rsaConfig.keySize,
      algorithm: rsaConfig.algorithm,
      hashAlgorithm: rsaConfig.hashAlgorithm,
      enableEnvOverride: rsaConfig.enableEnvOverride
    }
  }
}
