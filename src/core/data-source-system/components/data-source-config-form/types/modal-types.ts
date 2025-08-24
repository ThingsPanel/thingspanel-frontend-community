/**
 * 弹窗相关类型定义
 * 基于DataSourceConfigForm copy.vue中的弹窗功能分析
 */

import type { RawDataItem, RawDataItemType } from './raw-data'
import type { HttpDataSourceConfig } from './http-config'
import type { WebSocketDataSourceConfig } from './websocket-config'

// 弹窗基础状态
export interface BaseModalState {
  /** 是否显示 */
  visible: boolean
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error?: string
  /** 标题 */
  title?: string
  /** 确认按钮文字 */
  confirmText?: string
  /** 取消按钮文字 */
  cancelText?: string
}

// 添加/编辑原始数据弹窗状态
export interface AddRawDataModalState extends BaseModalState {
  /** 编辑模式（新增或编辑） */
  mode: 'add' | 'edit'
  /** 当前编辑的数据项（编辑模式时） */
  editingItem?: RawDataItem
  /** 当前数据源键 */
  currentDataSourceKey: string
  /** 表单数据 */
  formData: {
    /** 基本信息 */
    name: string
    description?: string
    type: RawDataItemType
    isActive: boolean

    /** 数据配置 */
    config: {
      /** JSON数据内容 */
      jsonContent?: string
      /** HTTP配置 */
      httpConfig?: Partial<HttpDataSourceConfig>
      /** WebSocket配置 */
      websocketConfig?: Partial<WebSocketDataSourceConfig>
    }

    /** 处理配置 */
    processing: {
      /** 过滤路径 */
      filterPath?: string
      /** 处理脚本 */
      processScript?: string
    }
  }
  /** 表单验证状态 */
  validation: {
    [key: string]: {
      valid: boolean
      message?: string
    }
  }
}

// 数据详情查看弹窗状态
export interface DataDetailModalState extends BaseModalState {
  /** 查看的数据项 */
  viewingItem?: RawDataItem
  /** 显示模式 */
  displayMode: 'json' | 'table' | 'tree'
  /** 显示原始数据还是处理后数据 */
  dataType: 'raw' | 'processed'
  /** 格式化选项 */
  formatting: {
    indent: number
    showTypes: boolean
    maxDepth: number
  }
}

// 最终数据预览弹窗状态
export interface FinalDataPreviewModalState extends BaseModalState {
  /** 最终处理后的数据 */
  finalData?: any
  /** 数据统计信息 */
  dataStats?: {
    size: number
    type: string
    itemCount?: number
    keyCount?: number
  }
  /** 处理信息 */
  processingInfo?: {
    type: string
    duration: number
    timestamp: number
    success: boolean
    error?: string
  }
}

// 系统API列表弹窗状态
export interface ApiListModalState extends BaseModalState {
  /** API列表数据 */
  apiList: Array<{
    id: string
    name: string
    method: string
    path: string
    description?: string
    category: string
    example?: any
  }>
  /** 搜索关键词 */
  searchKeyword: string
  /** 选中的分类 */
  selectedCategory?: string
  /** 分类列表 */
  categories: Array<{
    key: string
    label: string
    count: number
  }>
  /** 选中的API */
  selectedApi?: string
}

// 脚本编辑器弹窗状态
export interface ScriptEditorModalState extends BaseModalState {
  /** 脚本内容 */
  scriptContent: string
  /** 脚本类型 */
  scriptType: 'processing' | 'final' | 'filter' | 'transform'
  /** 编辑器配置 */
  editorConfig: {
    language: 'javascript' | 'typescript'
    theme: 'light' | 'dark'
    fontSize: number
    wordWrap: boolean
    showLineNumbers: boolean
  }
  /** 执行结果 */
  executionResult?: {
    success: boolean
    output?: any
    error?: string
    logs: string[]
    duration: number
  }
  /** 可用的代码模板 */
  templates: Array<{
    id: string
    name: string
    description: string
    code: string
    category: string
  }>
}

// 数据导入弹窗状态
export interface DataImportModalState extends BaseModalState {
  /** 导入文件 */
  file?: File
  /** 导入格式 */
  format: 'json' | 'csv' | 'xlsx'
  /** 导入配置 */
  importConfig: {
    overwriteExisting: boolean
    fieldMapping: Record<string, string>
    skipErrors: boolean
  }
  /** 预览数据 */
  previewData?: any[]
  /** 字段映射选项 */
  fieldOptions: Array<{
    source: string
    target: string
    type: string
  }>
  /** 导入结果 */
  importResult?: {
    success: number
    failed: number
    errors: Array<{
      row: number
      message: string
    }>
  }
}

// 数据导出弹窗状态
export interface DataExportModalState extends BaseModalState {
  /** 导出格式 */
  format: 'json' | 'csv' | 'xlsx' | 'xml'
  /** 导出配置 */
  exportConfig: {
    includeConfig: boolean
    includeHistory: boolean
    onlySelected: boolean
    compress: boolean
  }
  /** 选中的数据项ID */
  selectedItemIds: string[]
  /** 导出预览 */
  exportPreview?: {
    filename: string
    size: string
    itemCount: number
  }
}

// 确认对话框状态
export interface ConfirmDialogState extends BaseModalState {
  /** 确认类型 */
  type: 'info' | 'warning' | 'error' | 'success'
  /** 消息内容 */
  message: string
  /** 详细信息 */
  details?: string
  /** 确认回调 */
  onConfirm?: () => void | Promise<void>
  /** 取消回调 */
  onCancel?: () => void
}

// 所有弹窗状态的联合类型
export interface AllModalStates {
  addRawData: AddRawDataModalState
  dataDetail: DataDetailModalState
  finalDataPreview: FinalDataPreviewModalState
  apiList: ApiListModalState
  scriptEditor: ScriptEditorModalState
  dataImport: DataImportModalState
  dataExport: DataExportModalState
  confirmDialog: ConfirmDialogState
}

// 弹窗管理器接口
export interface ModalManager {
  /** 获取所有弹窗状态 */
  getStates: () => AllModalStates
  /** 打开指定弹窗 */
  openModal: <K extends keyof AllModalStates>(modalName: K, initialState?: Partial<AllModalStates[K]>) => void
  /** 关闭指定弹窗 */
  closeModal: <K extends keyof AllModalStates>(modalName: K) => void
  /** 关闭所有弹窗 */
  closeAllModals: () => void
  /** 检查是否有弹窗打开 */
  hasOpenModal: () => boolean
  /** 获取当前打开的弹窗列表 */
  getOpenModals: () => Array<keyof AllModalStates>
}
