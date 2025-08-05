/**
 * ID 生成工具
 */

// 生成唯一ID
export function generateId(prefix = 'item'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}_${timestamp}_${random}`
}

// 生成UUID v4
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 生成短ID（8位）
export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 8)
}

// 检查ID是否有效
export function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && !/^\s*$/.test(id)
}
