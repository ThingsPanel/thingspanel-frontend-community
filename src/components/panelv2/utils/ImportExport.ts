// src/components/panelv2/utils/ImportExport.ts

import type { PanelState } from '../types'
import type { Theme } from '../themes/ThemeManager'

export interface ExportData {
  version: string
  timestamp: number
  metadata: {
    name?: string
    description?: string
    author?: string
    tags?: string[]
  }
  panelState: PanelState
  themes?: Theme[]
  plugins?: string[] // 插件列表
}

export interface ImportOptions {
  overwrite?: boolean
  mergeThemes?: boolean
  mergePlugins?: boolean
  validateData?: boolean
}

export class ImportExportManager {
  private static VERSION = '1.0.0'

  // 导出面板配置
  static exportPanel(
    panelState: PanelState,
    options: {
      metadata?: ExportData['metadata']
      themes?: Theme[]
      plugins?: string[]
      format?: 'json' | 'compressed'
    } = {}
  ): string {
    const exportData: ExportData = {
      version: this.VERSION,
      timestamp: Date.now(),
      metadata: {
        name: '面板配置',
        description: '由 PanelV2 导出',
        author: 'PanelV2',
        ...options.metadata
      },
      panelState: this.cleanPanelState(panelState),
      themes: options.themes,
      plugins: options.plugins || []
    }

    let result = JSON.stringify(exportData, null, 2)

    if (options.format === 'compressed') {
      result = JSON.stringify(exportData)
    }

    return result
  }

  // 导入面板配置
  static async importPanel(data: string | File, options: ImportOptions = {}): Promise<ExportData> {
    let jsonData: string

    if (data instanceof File) {
      jsonData = await this.readFile(data)
    } else {
      jsonData = data
    }

    try {
      const importData: ExportData = JSON.parse(jsonData)

      if (options.validateData) {
        this.validateImportData(importData)
      }

      return importData
    } catch (error) {
      throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 下载配置文件
  static downloadConfig(
    panelState: PanelState,
    filename: string = `panel-config-${Date.now()}.json`,
    options: Parameters<typeof this.exportPanel>[1] = {}
  ) {
    const content = this.exportPanel(panelState, options)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // 导出为图片（简化版本，不依赖外部库）
  static async exportAsImage(
    canvasElement: HTMLElement,
    options: {
      format?: 'png' | 'jpeg' | 'webp'
      quality?: number
      scale?: number
      filename?: string
    } = {}
  ): Promise<void> {
    const { filename = `panel-${Date.now()}.png` } = options

    try {
      // 简化版本：直接提示用户使用浏览器截图功能
      alert(
        '图片导出功能需要安装 html2canvas 依赖包。\n请使用浏览器自带的截图功能，或者运行：\nnpm install html2canvas'
      )
      console.log('Export as image: element', canvasElement, 'filename:', filename)
    } catch (error) {
      console.error('Export as image failed:', error)
      throw new Error('导出图片失败')
    }
  }

  // 导出为PDF（简化版本，不依赖外部库）
  static async exportAsPDF(
    canvasElement: HTMLElement,
    options: {
      filename?: string
      orientation?: 'portrait' | 'landscape'
      format?: 'a4' | 'a3' | 'letter'
    } = {}
  ): Promise<void> {
    const { filename = `panel-${Date.now()}.pdf` } = options

    try {
      // 简化版本：提示用户使用浏览器打印功能
      alert(
        'PDF导出功能需要安装 jspdf 和 html2canvas 依赖包。\n请使用浏览器的打印功能 (Ctrl+P)，或者运行：\nnpm install jspdf html2canvas'
      )
      console.log('Export as PDF: element', canvasElement, 'filename:', filename)
    } catch (error) {
      console.error('Export as PDF failed:', error)
      throw new Error('导出PDF失败')
    }
  }

  // 批量导出
  static async batchExport(
    panels: Array<{ name: string; state: PanelState }>,
    options: {
      format?: 'json' | 'zip'
      filename?: string
    } = {}
  ): Promise<void> {
    const { format = 'zip', filename = `panels-${Date.now()}` } = options

    if (format === 'json') {
      const batchData = {
        version: this.VERSION,
        timestamp: Date.now(),
        panels: panels.map(panel => ({
          name: panel.name,
          data: this.exportPanel(panel.state)
        }))
      }

      const content = JSON.stringify(batchData, null, 2)
      const blob = new Blob([content], { type: 'application/json' })
      this.downloadBlob(blob, `${filename}.json`)
    } else {
      // 简化版本：提示用户安装 JSZip
      try {
        alert(
          'ZIP批量导出功能需要安装 jszip 依赖包。\n当前将使用JSON格式导出。\n如需ZIP格式，请运行：npm install jszip'
        )

        // 回退到JSON格式
        const batchData = {
          version: this.VERSION,
          timestamp: Date.now(),
          panels: panels.map(panel => ({
            name: panel.name,
            data: this.exportPanel(panel.state)
          }))
        }

        const content = JSON.stringify(batchData, null, 2)
        const blob = new Blob([content], { type: 'application/json' })
        this.downloadBlob(blob, `${filename}.json`)
      } catch (error) {
        console.error('Batch export failed:', error)
        throw new Error('批量导出失败')
      }
    }
  }

  // 导入模板
  static async importTemplate(url: string): Promise<ExportData> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.text()
      return this.importPanel(data, { validateData: true })
    } catch (error) {
      throw new Error(`导入模板失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 私有方法

  // 清理面板状态（移除不需要的属性）
  private static cleanPanelState(state: PanelState): PanelState {
    return {
      cards: state.cards.map(card => ({
        ...card
        // 可以在这里移除一些运行时属性
      })),
      config: state.config,
      selectedItemId: null // 导出时不保存选中状态
    }
  }

  // 验证导入数据
  private static validateImportData(data: ExportData): void {
    if (!data.version) {
      throw new Error('缺少版本信息')
    }

    if (!data.panelState) {
      throw new Error('缺少面板状态数据')
    }

    if (!Array.isArray(data.panelState.cards)) {
      throw new Error('面板卡片数据格式错误')
    }

    // 检查版本兼容性
    const [majorVersion] = data.version.split('.')
    const [currentMajorVersion] = this.VERSION.split('.')

    if (majorVersion !== currentMajorVersion) {
      console.warn(`版本不匹配: 导入版本 ${data.version}, 当前版本 ${this.VERSION}`)
    }
  }

  // 读取文件
  private static readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = e => {
        const result = e.target?.result
        if (typeof result === 'string') {
          resolve(result)
        } else {
          reject(new Error('文件读取失败'))
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取错误'))
      }

      reader.readAsText(file)
    })
  }

  // 下载Blob
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // 生成分享链接
  static generateShareLink(panelState: PanelState, baseUrl: string = window.location.origin): string {
    const data = this.exportPanel(panelState, { format: 'compressed' })
    const encoded = btoa(encodeURIComponent(data))
    return `${baseUrl}?panel=${encoded}`
  }

  // 从分享链接导入
  static importFromShareLink(shareLink: string): ExportData {
    try {
      const url = new URL(shareLink)
      const encoded = url.searchParams.get('panel')

      if (!encoded) {
        throw new Error('无效的分享链接')
      }

      const data = decodeURIComponent(atob(encoded))
      return this.importPanel(data, { validateData: true })
    } catch (error) {
      throw new Error(`分享链接解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}
