/**
 * 安全配置类型定义
 * Security Configuration Type Definitions
 */

/**
 * RSA 安全配置接口
 * RSA Security Configuration Interface
 */
export interface RSASecurityConfig {
  /** RSA 公钥 */
  publicKey: string
  /** 密钥大小 */
  keySize: number
  /** 加密算法 */
  algorithm: string
  /** 哈希算法 */
  hashAlgorithm: string
  /** 是否启用环境变量覆盖 */
  enableEnvOverride: boolean
}

/**
 * 安全配置接口
 * Security Configuration Interface
 */
export interface SecurityConfig {
  /** RSA 配置 */
  rsa: RSASecurityConfig
}

/**
 * RSA 加密选项
 * RSA Encryption Options
 */
export interface RSAEncryptionOptions {
  /** 要加密的数据 */
  data: string
  /** 公钥（可选，默认使用配置中的公钥） */
  publicKey?: string
  /** 编码格式 */
  encoding?: 'base64' | 'hex'
}

/**
 * RSA 解密选项
 * RSA Decryption Options
 */
export interface RSADecryptionOptions {
  /** 要解密的数据 */
  encryptedData: string
  /** 私钥 */
  privateKey: string
  /** 编码格式 */
  encoding?: 'base64' | 'hex'
}

/**
 * RSA 密钥对
 * RSA Key Pair
 */
export interface RSAKeyPair {
  /** 公钥 */
  publicKey: string
  /** 私钥 */
  privateKey: string
}

/**
 * 安全配置常量类型
 * Security Configuration Constants Type
 */
export type SecurityConfigConstants = {
  readonly keySize: number
  readonly algorithm: string
  readonly hashAlgorithm: string
  readonly enableEnvOverride: boolean
}
