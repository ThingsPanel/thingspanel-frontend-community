/**
 * 权限变更监听器
 * 在用户权限发生变化时通知组件系统重新加载
 */

type PermissionChangeCallback = (newAuthority: string, oldAuthority: string) => void

class PermissionWatcher {
  private callbacks: PermissionChangeCallback[] = []
  private currentAuthority: string | null = null
  private intervalId: number | null = null

  constructor() {
    this.startWatching()
  }

  /**
   * 开始监听权限变更
   */
  private startWatching() {
    // 检查当前权限
    this.updateCurrentAuthority()

    // 🔥 优化：减少轮询频率到每5秒检查一次
    this.intervalId = window.setInterval(() => {
      this.checkPermissionChange()
    }, 5000)
  }

  /**
   * 停止监听
   */
  stopWatching() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * 更新当前权限
   */
  private updateCurrentAuthority() {
    try {
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        const parsed = JSON.parse(userInfo)
        this.currentAuthority = parsed.authority || 'TENANT_USER'
      } else {
        this.currentAuthority = 'TENANT_USER'
      }
    } catch {
      this.currentAuthority = 'TENANT_USER'
    }
  }

  /**
   * 检查权限是否变更
   */
  private checkPermissionChange() {
    const oldAuthority = this.currentAuthority
    this.updateCurrentAuthority()

    if (oldAuthority !== this.currentAuthority) {
      console.log(`🔄 [PermissionWatcher] 权限变更: ${oldAuthority || '未知'} -> ${this.currentAuthority}`)
      console.log(`🔍 [PermissionWatcher] localStorage userInfo:`, localStorage.getItem('userInfo'))

      // 通知所有监听器
      this.callbacks.forEach(callback => {
        try {
          callback(this.currentAuthority!, oldAuthority || '未知')
        } catch (error) {
          console.error('[PermissionWatcher] 权限变更回调执行失败:', error)
        }
      })
    }
  }

  /**
   * 添加权限变更监听器
   */
  onPermissionChange(callback: PermissionChangeCallback) {
    this.callbacks.push(callback)

    // 返回取消监听的函数
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 获取当前权限
   */
  getCurrentAuthority(): string {
    return this.currentAuthority || 'TENANT_USER'
  }
}

// 全局单例
export const permissionWatcher = new PermissionWatcher()

/**
 * 手动触发权限检查（用于登录后立即更新）
 */
export function triggerPermissionCheck() {
  console.log('🔄 [PermissionWatcher] 手动触发权限检查')
  // 使用私有方法访问
  ;(permissionWatcher as any).checkPermissionChange()
}

/**
 * 优化：监听 localStorage 变化事件（更高效）
 */
export function setupStorageListener() {
  // 监听同一标签页内的 localStorage 变化
  const originalSetItem = localStorage.setItem
  localStorage.setItem = function(key: string, value: string) {
    const oldValue = localStorage.getItem(key)
    originalSetItem.call(this, key, value)

    // 如果是 userInfo 变化，立即触发权限检查
    if (key === 'userInfo' && oldValue !== value) {
      console.log('🔄 [PermissionWatcher] 检测到 userInfo 变化，立即检查权限')
      triggerPermissionCheck()
    }
  }
}