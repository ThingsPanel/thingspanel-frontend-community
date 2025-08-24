/**
 * 事件类型定义
 * 基于DataSourceConfigForm copy.vue中的事件处理分析
 */

import type { RawDataItem } from './raw-data'
import type { ProcessingExecutionResult } from './final-processing'

// 组件事件类型
export interface DataSourceConfigFormEvents {
  /** v-model更新事件 */
  'update:modelValue': (value: any) => void
  /** 数据变更通知 */
  dataChange: (dataSourceKey: string, data: any) => void
  /** 配置同步事件 */
  configSync: (config: any) => void
  /** 原始数据变更事件 */
  rawDataChange: (dataSourceKey: string, rawDataList: RawDataItem[]) => void
  /** 最终处理完成事件 */
  finalProcessingComplete: (dataSourceKey: string, result: ProcessingExecutionResult) => void
  /** 错误事件 */
  error: (error: { code: string; message: string; details?: any }) => void
}

// 原始数据项事件
export interface RawDataItemEvents {
  /** 数据项创建 */
  'item-created': (item: RawDataItem) => void
  /** 数据项更新 */
  'item-updated': (item: RawDataItem, oldItem: RawDataItem) => void
  /** 数据项删除 */
  'item-deleted': (itemId: string) => void
  /** 数据项激活状态变更 */
  'item-activated': (itemId: string, active: boolean) => void
}

// HTTP配置事件
export interface HttpConfigEvents {
  /** 连接测试开始 */
  'test-started': (config: any) => void
  /** 连接测试完成 */
  'test-completed': (result: any) => void
  /** 请求执行 */
  'request-executed': (request: any, response: any) => void
  /** 配置变更 */
  'config-changed': (config: any) => void
}

// 数据处理事件
export interface DataProcessingEvents {
  /** 处理开始 */
  'processing-started': (type: string, input: any) => void
  /** 处理完成 */
  'processing-completed': (result: ProcessingExecutionResult) => void
  /** 处理错误 */
  'processing-error': (error: any) => void
  /** 预览更新 */
  'preview-updated': (preview: any) => void
}

// 弹窗事件
export interface ModalEvents {
  /** 弹窗打开 */
  'modal-opened': (modalName: string) => void
  /** 弹窗关闭 */
  'modal-closed': (modalName: string) => void
  /** 弹窗确认 */
  'modal-confirmed': (modalName: string, data: any) => void
  /** 弹窗取消 */
  'modal-cancelled': (modalName: string) => void
}

// 所有事件的联合类型
export type AllEvents = DataSourceConfigFormEvents &
  RawDataItemEvents &
  HttpConfigEvents &
  DataProcessingEvents &
  ModalEvents

// 事件发射器接口
export interface EventEmitter {
  /** 发射事件 */
  emit: <K extends keyof AllEvents>(eventName: K, ...args: Parameters<AllEvents[K]>) => void
  /** 监听事件 */
  on: <K extends keyof AllEvents>(eventName: K, handler: AllEvents[K]) => void
  /** 移除事件监听 */
  off: <K extends keyof AllEvents>(eventName: K, handler: AllEvents[K]) => void
  /** 一次性监听 */
  once: <K extends keyof AllEvents>(eventName: K, handler: AllEvents[K]) => void
}
