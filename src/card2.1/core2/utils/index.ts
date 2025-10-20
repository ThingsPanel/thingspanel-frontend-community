/**
 * 工具函数导出
 */

export * from './permission'
export * from './validation'
export * from './permission-watcher'

// 默认导出
export { permissionWatcher, triggerPermissionCheck, setupStorageListener } from './permission-watcher'
