/**
 * @file 引擎适配器管理器 - 优化版
 * @description 将现有的业务引擎（NodeRegistry、Data、Tool）适配到纯净基础设施层
 * 
 * 🎯 核心职责：
 * 1. 桥接模式 - 连接旧架构的引擎和新架构的基础设施
 * 2. 数据转换 - 将引擎数据格式转换为基础设施标准格式
 * 3. 事件适配 - 统一引擎事件到基础设施事件总线
 * 4. 生命周期管理 - 管理所有适配器的初始化和销毁
 * 
 * 🏗️ 架构分层：
 * - 第一层（基础设施）：PureInfrastructure - 纯净的"架子"
 * - 适配层（本文件）：EngineAdapter - 桥接新旧架构
 * - 第二层（业务引擎）：NodeRegistry、Data、Tool - 具体业务逻辑
 * 
 * 💡 给技术门外汉的解释：
 * 这就像是一个"翻译器"，把旧系统的"话"翻译成新系统能听懂的"语言"
 * 让新旧系统能够顺畅地配合工作，而不需要把旧系统全部重写
 */

import { globalPureInfrastructure } from '../core/PureInfrastructure'
import { globalNodeRegistryEngine } from './NodeRegistryEngine'
import { globalDataEngine } from './DataEngine'
import { globalToolEngine } from './ToolEngine'
import { globalCardLoader } from '../loaders/CardComponentLoader'
import type { 
  Renderer, 
  ToolProvider, 
  DataProcessor,
  ComponentTreeData,
  PanelStateData,
  ConfigPanelData
} from '../core/interfaces/PureInfrastructure'

// ==================== 📋 适配器职责分离 ====================

/**
 * 节点注册引擎适配器
 * 
 * 🎯 单一职责：将NodeRegistryEngine适配为ComponentList渲染器
 * 
 * 具体功能：
 * - 渲染组件列表UI（分类+搜索+拖拽）
 * - 数据加载和展示（真实Card组件 + Mock兜底）
 * - 拖拽数据传递（组件定义 → 画布）
 * - 搜索过滤功能
 * 
 * 💡 简单理解：这是"组件商店"的展示柜台
 */
class NodeRegistryEngineAdapter implements Renderer {
  readonly type = 'component-list'
  private initialized = false

  /**
   * 渲染组件列表界面
   * @param container 容器DOM元素
   * @param data 渲染数据（可选）
   */
  render(container: HTMLElement, data: any): void {
    console.log('🎨 NodeRegistryEngineAdapter: 开始渲染组件列表界面')
    
    try {
      // 创建基础UI结构
      this.createUIStructure(container)
      
      // 异步加载和渲染组件数据
      this.loadAndRenderComponents(container)
      
      // 设置交互功能
      this.setupInteractions(container)
      
      this.initialized = true
      console.log('✅ NodeRegistryEngineAdapter: 组件列表界面渲染完成')
      
    } catch (error) {
      console.error('❌ NodeRegistryEngineAdapter: 渲染失败', error)
      this.renderErrorState(container, error)
    }
  }

  /**
   * 更新组件列表
   * @param data 新的组件数据
   */
  update(data: any): void {
    console.log('🔄 NodeRegistryEngineAdapter: 更新组件列表数据')
    // 更新逻辑可以在这里实现
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    console.log('🗑️ NodeRegistryEngineAdapter: 销毁组件列表渲染器')
    this.initialized = false
  }

  // ==================== 🏗️ 私有方法：UI构建 ====================

  /**
   * 创建UI基础结构
   * 职责：只负责创建DOM结构，不包含业务逻辑
   */
  private createUIStructure(container: HTMLElement): void {
    container.innerHTML = `
      <div class="adapted-component-list">
        <!-- 搜索区域 -->
        <div class="component-search">
          <input type="text" placeholder="🔍 搜索组件..." class="search-input">
          <div class="search-stats">
            <span class="total-count">总计: 0</span>
            <span class="visible-count">显示: 0</span>
          </div>
        </div>
        
        <!-- 组件分类区域 -->
        <div class="component-categories" id="component-categories">
          <div class="loading-state">
            <div class="loading-spinner">⏳</div>
            <p>正在加载组件库...</p>
          </div>
        </div>
        
        <!-- 状态信息区域 -->
        <div class="component-status" id="component-status"></div>
      </div>
    `
  }

  /**
   * 渲染错误状态
   * 职责：当加载失败时显示友好的错误信息
   */
  private renderErrorState(container: HTMLElement, error: any): void {
    const categoriesContainer = container.querySelector('#component-categories')
    if (categoriesContainer) {
      categoriesContainer.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>组件加载失败</h3>
          <p>错误信息：${error.message || '未知错误'}</p>
          <button class="retry-button" onclick="location.reload()">重新加载</button>
        </div>
      `
    }
  }

  // ==================== 📊 私有方法：数据处理 ====================

  /**
   * 加载并渲染组件数据
   * 职责：数据获取 → 处理 → 渲染
   */
  private async loadAndRenderComponents(container: HTMLElement): Promise<void> {
    try {
      console.log('📊 NodeRegistryEngineAdapter: 开始加载组件数据')
      
      // 1. 确保有可用数据
      await this.ensureComponentData()
      
      // 2. 获取组件树数据
      const treeData = globalNodeRegistryEngine.categoryManager.getCategoryTree()
      console.log('📊 NodeRegistryEngineAdapter: 获取到', treeData.length, '个分类')
      
      // 3. 渲染组件列表
      this.renderComponentTree(container, treeData)
      
      // 4. 更新统计信息
      this.updateStatistics(container, treeData)
      
    } catch (error) {
      console.error('❌ NodeRegistryEngineAdapter: 加载组件数据失败', error)
      this.renderErrorState(container, error)
    }
  }

  /**
   * 确保有组件数据可用
   * 职责：优先加载真实组件，失败时使用Mock数据兜底
   */
  private async ensureComponentData(): Promise<void> {
    // 检查是否已有数据
    const existingData = globalNodeRegistryEngine.categoryManager.getCategoryTree()
    if (existingData.length > 0) {
      console.log('📊 NodeRegistryEngineAdapter: 发现已有数据，跳过加载')
      return
    }

    console.log('📊 NodeRegistryEngineAdapter: 开始加载组件数据')

    // 尝试加载真实Card组件
    let successCount = 0
    try {
      console.log('🔄 NodeRegistryEngineAdapter: 尝试加载真实Card组件')
      const realComponents = await globalCardLoader.loadAllCards()
      
      for (const component of realComponents) {
        try {
          await globalNodeRegistryEngine.manager.register(component)
          successCount++
        } catch (error) {
          console.warn(`⚠️ 注册组件 ${component.type} 失败:`, error)
        }
      }
      
      console.log(`✅ NodeRegistryEngineAdapter: 成功加载 ${successCount} 个真实组件`)
      
      if (successCount > 0) {
        return // 成功加载真实组件，直接返回
      }
    } catch (error) {
      console.warn('⚠️ NodeRegistryEngineAdapter: 加载真实组件失败，使用Mock数据:', error)
    }

    // 加载Mock数据作为兜底
    await this.loadMockComponents()
  }

  /**
   * 加载Mock组件数据
   * 职责：提供基础的演示组件，确保界面有内容可显示
   */
  private async loadMockComponents(): Promise<void> {
    console.log('🎭 NodeRegistryEngineAdapter: 加载Mock演示组件')
    
    const mockComponents = [
      {
        type: 'text-display',
        name: '📝 文本显示',
        category: 'basic',
        component: null,
        meta: {
          title: '文本显示',
          description: '显示文本内容的基础组件',
          icon: '📝',
          version: '1.0.0',
          author: 'ThingsPanel',
          keywords: ['文本', '显示', '标签']
        },
        configSchema: {
          content: {
            type: 'object',
            properties: {
              text: { type: 'string', title: '显示文本', default: '文本内容' },
              fontSize: { type: 'number', title: '字体大小', default: 14 },
              color: { type: 'string', title: '文字颜色', default: '#333333' }
            }
          }
        },
        defaults: {
          layout: { x: 0, y: 0, w: 4, h: 2 },
          config: {
            content: { text: '文本内容', fontSize: 14, color: '#333333' }
          }
        }
      },
      {
        type: 'button-control',
        name: '🔘 按钮控件',
        category: 'basic',
        component: null,
        meta: {
          title: '按钮控件',
          description: '可点击的交互按钮',
          icon: '🔘',
          version: '1.0.0',
          author: 'ThingsPanel',
          keywords: ['按钮', '控件', '交互']
        },
        configSchema: {
          content: {
            type: 'object',
            properties: {
              text: { type: 'string', title: '按钮文本', default: '点击我' },
              variant: { 
                type: 'string', 
                title: '按钮样式', 
                enum: ['primary', 'secondary', 'success', 'warning', 'danger'], 
                default: 'primary' 
              }
            }
          }
        },
        defaults: {
          layout: { x: 0, y: 0, w: 2, h: 1 },
          config: {
            content: { text: '点击我', variant: 'primary' }
          }
        }
      },
      {
        type: 'chart-line',
        name: '📈 折线图表',
        category: 'chart',
        component: null,
        meta: {
          title: '折线图表',
          description: '时间序列数据折线图',
          icon: '📈',
          version: '1.0.0',
          author: 'ThingsPanel',
          keywords: ['图表', '折线图', '可视化']
        },
        configSchema: {
          content: {
            type: 'object',
            properties: {
              title: { type: 'string', title: '图表标题', default: '数据趋势' },
              dataSource: { type: 'string', title: '数据源', default: 'demo' }
            }
          }
        },
        defaults: {
          layout: { x: 0, y: 0, w: 6, h: 4 },
          config: {
            content: { title: '数据趋势', dataSource: 'demo' }
          }
        }
      }
    ]

    // 注册Mock组件
    let mockSuccessCount = 0
    for (const component of mockComponents) {
      try {
        await globalNodeRegistryEngine.manager.register(component)
        mockSuccessCount++
      } catch (error) {
        console.error(`❌ 注册Mock组件 ${component.type} 失败:`, error)
      }
    }

    console.log(`✅ NodeRegistryEngineAdapter: 成功注册 ${mockSuccessCount} 个Mock组件`)
  }

  /**
   * 渲染组件树结构
   * 职责：将组件数据转换为DOM结构
   */
  private renderComponentTree(container: HTMLElement, treeData: any[]): void {
    const categoriesContainer = container.querySelector('#component-categories')
    if (!categoriesContainer) return

    if (treeData.length === 0) {
      categoriesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>暂无组件</h3>
          <p>组件库正在加载中，请稍候...</p>
        </div>
      `
      return
    }

    // 渲染分类和组件
    categoriesContainer.innerHTML = treeData.map(categoryNode => `
      <div class="category-section" data-category="${categoryNode.id}">
        <div class="category-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="category-icon">${categoryNode.icon || '📦'}</span>
          <h4 class="category-name">${categoryNode.name}</h4>
          <span class="component-count">(${categoryNode.children?.length || 0})</span>
          <span class="collapse-indicator">▼</span>
        </div>
        <div class="category-components">
          ${(categoryNode.children || []).map(component => `
            <div class="component-item" 
                 draggable="true" 
                 data-component-id="${component.id}"
                 data-component-type="${component.type}"
                 title="${component.description || component.name}">
              <div class="component-icon">${component.icon || '🧩'}</div>
              <div class="component-info">
                <div class="component-name">${component.name}</div>
                <div class="component-desc">${component.description || ''}</div>
              </div>
              <div class="component-actions">
                <button class="preview-btn" title="预览">👁️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')

    // 设置拖拽功能
    this.setupDragAndDrop(container)
  }

  /**
   * 更新统计信息
   * 职责：显示组件数量统计
   */
  private updateStatistics(container: HTMLElement, treeData: any[]): void {
    const totalComponents = treeData.reduce((sum, cat) => sum + (cat.children?.length || 0), 0)
    const totalCount = container.querySelector('.total-count')
    const visibleCount = container.querySelector('.visible-count')
    
    if (totalCount) totalCount.textContent = `总计: ${totalComponents}`
    if (visibleCount) visibleCount.textContent = `显示: ${totalComponents}`
  }

  // ==================== 🎮 私有方法：交互功能 ====================

  /**
   * 设置所有交互功能
   * 职责：搜索、拖拽、点击等用户交互
   */
  private setupInteractions(container: HTMLElement): void {
    this.setupSearch(container)
    // 拖拽功能在渲染时设置
  }

  /**
   * 设置搜索功能
   * 职责：实时搜索组件，显示/隐藏匹配项
   */
  private setupSearch(container: HTMLElement): void {
    const searchInput = container.querySelector('.search-input') as HTMLInputElement
    if (!searchInput) return

    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase()
      const componentItems = container.querySelectorAll('.component-item')
      let visibleCount = 0

      // 过滤组件
      componentItems.forEach(item => {
        const name = item.querySelector('.component-name')?.textContent?.toLowerCase() || ''
        const desc = item.querySelector('.component-desc')?.textContent?.toLowerCase() || ''
        const matches = query === '' || name.includes(query) || desc.includes(query)
        
        ;(item as HTMLElement).style.display = matches ? '' : 'none'
        if (matches) visibleCount++
      })

      // 隐藏空分类
      const categories = container.querySelectorAll('.category-section')
      categories.forEach(category => {
        const visibleComponents = category.querySelectorAll('.component-item:not([style*="display: none"])')
        ;(category as HTMLElement).style.display = visibleComponents.length > 0 ? '' : 'none'
      })

      // 更新显示计数
      const visibleCountElement = container.querySelector('.visible-count')
      if (visibleCountElement) {
        visibleCountElement.textContent = `显示: ${visibleCount}`
      }
    })
  }

  /**
   * 设置拖拽功能
   * 职责：让组件可以拖拽到画布上
   */
  private setupDragAndDrop(container: HTMLElement): void {
    const componentItems = container.querySelectorAll('.component-item')
    
    componentItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        const dragEvent = e as DragEvent
        const componentId = item.getAttribute('data-component-id')
        const componentType = item.getAttribute('data-component-type')
        
        if (dragEvent.dataTransfer && componentId) {
          // 获取完整组件定义
          const componentDef = globalNodeRegistryEngine.manager.getComponent(componentId)
          
          // 设置拖拽数据
          dragEvent.dataTransfer.setData('application/json', JSON.stringify({
            id: componentId,
            type: componentType,
            definition: componentDef
          }))
          
          // 发送拖拽开始事件
          globalPureInfrastructure.eventBus.emit('component-drag-start', {
            componentId,
            componentType,
            definition: componentDef
          })
          
          console.log('🎯 NodeRegistryEngineAdapter: 组件拖拽开始', componentType)
        }
      })

      // 添加拖拽视觉反馈
      item.addEventListener('dragstart', () => {
        item.classList.add('dragging')
      })
      
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging')
      })
    })
  }
}

// ==================== 📊 数据引擎适配器 ====================

/**
 * 数据引擎适配器
 * 
 * 🎯 单一职责：将DataEngine适配为数据处理器
 * 
 * 具体功能：
 * - 数据格式转换（业务数据 → 标准数据）
 * - 数据验证（检查数据完整性和正确性）
 * - 数据准备（为渲染器准备所需数据）
 * 
 * 💡 简单理解：这是"数据翻译器"，让不同系统的数据能互相理解
 */
class DataEngineAdapter implements DataProcessor {
  
  /**
   * 处理数据
   * @param data 原始数据
   * @returns 处理后的标准数据
   */
  process(data: any): any {
    console.log('🔄 DataEngineAdapter: 开始处理数据', data?.type)
    
    try {
      // 根据数据类型进行不同处理
      switch (data?.type) {
        case 'component-list':
          return this.processComponentListData(data)
        case 'panel-state':
          return this.processPanelStateData(data)
        default:
          console.log('🔄 DataEngineAdapter: 未知数据类型，返回原数据')
          return data
      }
    } catch (error) {
      console.error('❌ DataEngineAdapter: 数据处理失败', error)
      return data // 失败时返回原数据
    }
  }

  /**
   * 验证数据
   * @param data 待验证数据
   * @returns 验证结果
   */
  validate(data: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    console.log('✅ DataEngineAdapter: 开始验证数据')
    
    const errors: string[] = []
    const warnings: string[] = []

    // 基础验证
    if (!data) {
      errors.push('数据不能为空')
    } else {
      // 类型特定验证
      switch (data.type) {
        case 'component-list':
          if (!data.categories) {
            errors.push('组件列表数据缺少分类信息')
          }
          break
        case 'panel-state':
          if (!data.nodes) {
            warnings.push('面板状态数据中没有节点')
          }
          break
      }
    }

    const isValid = errors.length === 0
    console.log(`✅ DataEngineAdapter: 验证完成 - ${isValid ? '通过' : '失败'}`)
    
    return { isValid, errors, warnings }
  }

  /**
   * 处理组件列表数据
   * 职责：将引擎的组件数据转换为标准格式
   */
  private async processComponentListData(data: any): Promise<ComponentTreeData> {
    console.log('📊 DataEngineAdapter: 处理组件列表数据')
    
    try {
      // 使用DataEngine准备数据
      const preparedData = await globalDataEngine.preparation.prepareComponentListData()
      
      return {
        categories: preparedData.categories || [],
        searchState: {
          keyword: '',
          activeCategory: null,
          filteredComponents: []
        },
        expandState: {}
      }
    } catch (error) {
      console.error('❌ DataEngineAdapter: 处理组件列表数据失败', error)
      return {
        categories: [],
        searchState: { keyword: '', activeCategory: null, filteredComponents: [] },
        expandState: {}
      }
    }
  }

  /**
   * 处理面板状态数据
   * 职责：将引擎的面板数据转换为标准格式
   */
  private async processPanelStateData(data: any): Promise<PanelStateData> {
    console.log('📊 DataEngineAdapter: 处理面板状态数据')
    
    try {
      // 使用DataEngine准备数据
      const preparedData = await globalDataEngine.preparation.preparePanelData()
      return preparedData
    } catch (error) {
      console.error('❌ DataEngineAdapter: 处理面板状态数据失败', error)
      // 返回默认的面板状态
      return {
        info: {
          id: 'default-panel',
          name: '默认面板',
          version: '1.0.0',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        nodes: [],
        selection: {
          selectedIds: [],
          lastSelectedId: null,
          multiSelectMode: false
        },
        viewport: {
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
          gridVisible: true,
          snapToGrid: true
        },
        operationState: {
          isDragging: false,
          isResizing: false,
          dragOverNodeId: null
        }
      }
    }
  }
}

// ==================== 🔧 工具引擎适配器 ====================

/**
 * 工具引擎适配器
 * 
 * 🎯 单一职责：将ToolEngine适配为工具提供者
 * 
 * 具体功能：
 * - 工具定义管理（保存、撤销、导入、导出等）
 * - 工具动作处理（响应用户点击）
 * - 操作状态管理（防重复执行、权限控制）
 * - 文件操作（真实的导入导出功能）
 * 
 * 💡 简单理解：这是"工具箱管理员"，负责管理和执行各种操作工具
 */
class ToolEngineAdapter implements ToolProvider {
  private actionInProgress = new Set<string>() // 防重复执行锁

  /**
   * 获取工具列表
   * @returns 可用的工具定义数组
   */
  getTools(): any[] {
    console.log('🔧 ToolEngineAdapter: 获取工具列表')
    
    try {
      // 获取当前操作状态（简化版本）
      const operationState = {
        canSave: true,
        canUndo: true,
        canRedo: true,
        canClear: true,
        canExport: true,
        canImport: true
      }
      
      // 定义可用工具
      const tools = [
        {
          id: 'save',
          name: '保存',
          icon: '💾',
          type: 'button',
          action: 'file.save',
          enabled: operationState.canSave,
          shortcut: 'Ctrl+S',
          category: 'file',
          description: '保存当前面板配置'
        },
        {
          id: 'undo',
          name: '撤销',
          icon: '↶',
          type: 'button',
          action: 'edit.undo',
          enabled: operationState.canUndo,
          shortcut: 'Ctrl+Z',
          category: 'edit',
          description: '撤销上一步操作'
        },
        {
          id: 'redo',
          name: '重做',
          icon: '↷',
          type: 'button',
          action: 'edit.redo',
          enabled: operationState.canRedo,
          shortcut: 'Ctrl+Y',
          category: 'edit',
          description: '重做已撤销的操作'
        },
        {
          id: 'clear',
          name: '清空',
          icon: '🗑️',
          type: 'button',
          action: 'edit.clear',
          enabled: operationState.canClear,
          category: 'edit',
          description: '清空画布上的所有组件'
        },
        {
          id: 'export',
          name: '导出',
          icon: '📤',
          type: 'button',
          action: 'file.export',
          enabled: operationState.canExport,
          category: 'file',
          description: '导出面板配置到JSON文件'
        },
        {
          id: 'import',
          name: '导入',
          icon: '📥',
          type: 'button',
          action: 'file.import',
          enabled: operationState.canImport,
          category: 'file',
          description: '从JSON文件导入面板配置'
        }
      ]
      
      console.log(`🔧 ToolEngineAdapter: 返回 ${tools.length} 个工具`)
      return tools
      
    } catch (error) {
      console.error('❌ ToolEngineAdapter: 获取工具失败', error)
      return []
    }
  }

  /**
   * 处理工具动作
   * @param action 动作标识
   * @param context 执行上下文
   */
  async handleAction(action: string, context: any): Promise<void> {
    console.log('🎬 ToolEngineAdapter: 处理工具动作', action)
    
    // 防重复执行检查
    if (this.actionInProgress.has(action)) {
      console.log(`⏳ ToolEngineAdapter: 动作 ${action} 正在执行中，跳过重复请求`)
      return
    }
    
    // 加锁
    this.actionInProgress.add(action)
    
    try {
      // 根据动作类型分发处理
      switch (action) {
        case 'file.save':
          await this.handleSave(context)
          break
        case 'edit.undo':
          await this.handleUndo(context)
          break
        case 'edit.redo':
          await this.handleRedo(context)
          break
        case 'edit.clear':
          await this.handleClear(context)
          break
        case 'file.export':
          await this.handleExport(context)
          break
        case 'file.import':
          await this.handleImport(context)
          break
        default:
          console.warn(`⚠️ ToolEngineAdapter: 未知动作 ${action}`)
      }
    } catch (error) {
      console.error(`❌ ToolEngineAdapter: 执行动作 ${action} 失败`, error)
      // 发送错误事件
      this.emitToolEvent('error', { action, error: error.message })
    } finally {
      // 延迟解锁，防止快速重复点击
      setTimeout(() => {
        this.actionInProgress.delete(action)
      }, 500)
    }
  }

  // ==================== 🎯 工具动作处理方法 ====================

  /**
   * 处理保存动作
   */
  private async handleSave(context: any): Promise<void> {
    console.log('💾 ToolEngineAdapter: 执行保存操作')
    this.emitToolEvent('save-request')
  }

  /**
   * 处理撤销动作
   */
  private async handleUndo(context: any): Promise<void> {
    console.log('↶ ToolEngineAdapter: 执行撤销操作')
    this.emitToolEvent('undo-request')
  }

  /**
   * 处理重做动作
   */
  private async handleRedo(context: any): Promise<void> {
    console.log('↷ ToolEngineAdapter: 执行重做操作')
    this.emitToolEvent('redo-request')
  }

  /**
   * 处理清空动作
   */
  private async handleClear(context: any): Promise<void> {
    console.log('🗑️ ToolEngineAdapter: 执行清空操作')
    this.emitToolEvent('clear-request')
  }

  /**
   * 处理导出动作
   * 职责：将当前面板数据导出为JSON文件
   */
  private async handleExport(context: any): Promise<void> {
    try {
      console.log('📤 ToolEngineAdapter: 开始导出操作')
      
      // 使用基础设施的导入导出门户
      const jsonString = await globalPureInfrastructure.porter.export('json', {
        includeMetadata: true,
        compress: false
      })
      
      // 创建下载文件
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const filename = `thingspanel_export_${timestamp}.json`
      
      this.downloadFile(jsonString, filename, 'application/json')
      
      console.log('✅ ToolEngineAdapter: 导出成功')
      this.emitToolEvent('export-success', { message: '导出成功！', filename })
      
    } catch (error) {
      console.error('❌ ToolEngineAdapter: 导出失败', error)
      this.emitToolEvent('export-error', { message: `导出失败: ${error.message}` })
    }
  }

  /**
   * 处理导入动作
   * 职责：从JSON文件导入面板数据
   */
  private async handleImport(context: any): Promise<void> {
    try {
      console.log('📥 ToolEngineAdapter: 开始导入操作')
      
      // 打开文件选择对话框
      const file = await this.selectFile('.json')
      if (!file) {
        console.log('📥 ToolEngineAdapter: 用户取消文件选择')
        return
      }
      
      // 读取文件内容
      const jsonContent = await this.readFileAsText(file)
      
      // 使用基础设施的导入导出门户
      const importResult = await globalPureInfrastructure.porter.import('json', jsonContent, {
        validate: true,
        overwrite: true
      })
      
      if (importResult.success) {
        console.log('✅ ToolEngineAdapter: 导入成功')
        
        // 通知页面重新渲染
        this.emitToolEvent('data-imported', { 
          success: true, 
          data: importResult.data 
        })
        
        this.emitToolEvent('import-success', { 
          message: '导入成功！数据已更新', 
          filename: file.name 
        })
      } else {
        throw new Error(`导入失败: ${importResult.errors?.join(', ') || '未知错误'}`)
      }
      
    } catch (error) {
      console.error('❌ ToolEngineAdapter: 导入失败', error)
      this.emitToolEvent('import-error', { message: `导入失败: ${error.message}` })
    }
  }

  // ==================== 🛠️ 工具方法 ====================

  /**
   * 发送工具事件
   * 职责：统一的事件发送方法
   */
  private emitToolEvent(eventType: string, detail?: any): void {
    const eventName = `tool-${eventType}`
    const event = new CustomEvent(eventName, { detail })
    window.dispatchEvent(event)
    
    // 同时通过基础设施事件总线发送
    globalPureInfrastructure.eventBus.emit(eventName, detail)
  }

  /**
   * 下载文件
   * 职责：创建下载链接并触发下载
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
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

  /**
   * 选择文件
   * 职责：打开文件选择对话框
   */
  private selectFile(accept: string): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.style.display = 'none'
      
      input.onchange = (event: any) => {
        const file = event.target.files[0] || null
        document.body.removeChild(input)
        resolve(file)
      }
      
      input.oncancel = () => {
        document.body.removeChild(input)
        resolve(null)
      }
      
      document.body.appendChild(input)
      input.click()
    })
  }

  /**
   * 读取文件内容
   * 职责：将文件读取为文本
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsText(file)
    })
  }
}

// ==================== 🎛️ 引擎适配器管理器 ====================

/**
 * 引擎适配器管理器
 * 
 * 🎯 核心职责：统一管理所有引擎适配器的生命周期
 * 
 * 主要功能：
 * 1. 初始化管理 - 统一初始化所有适配器
 * 2. 注册管理 - 将适配器注册到基础设施
 * 3. 数据流管理 - 设置适配器间的数据流
 * 4. 事件管理 - 设置跨适配器的事件监听
 * 5. 生命周期管理 - 初始化和销毁管理
 * 
 * 💡 简单理解：这是"总调度员"，负责协调所有适配器的工作
 */
export class EngineAdapterManager {
  private nodeAdapter: NodeRegistryEngineAdapter
  private dataAdapter: DataEngineAdapter
  private toolAdapter: ToolEngineAdapter
  private initialized = false

  constructor() {
    console.log('🏗️ EngineAdapterManager: 创建适配器管理器')
    
    this.nodeAdapter = new NodeRegistryEngineAdapter()
    this.dataAdapter = new DataEngineAdapter()
    this.toolAdapter = new ToolEngineAdapter()
  }

  /**
   * 初始化所有适配器
   * 职责：统一初始化流程，确保所有适配器正确配置
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('⚠️ EngineAdapterManager: 已经初始化过了，跳过重复初始化')
      return
    }

    try {
      console.log('🚀 EngineAdapterManager: 开始初始化所有引擎适配器')

      // 1. 注册适配器到基础设施扩展点
      await this.registerAdapters()

      // 2. 设置数据流管道
      await this.setupDataFlows()

      // 3. 设置事件监听
      this.setupEventListeners()

      // 4. 验证初始化结果
      this.validateInitialization()

      this.initialized = true
      console.log('✅ EngineAdapterManager: 所有引擎适配器初始化完成')

    } catch (error) {
      console.error('❌ EngineAdapterManager: 初始化失败', error)
      throw error
    }
  }

  /**
   * 注册适配器到基础设施
   * 职责：将各个适配器注册到对应的扩展点
   */
  private async registerAdapters(): Promise<void> {
    console.log('📝 EngineAdapterManager: 注册适配器到基础设施扩展点')

    try {
      // 注册组件列表渲染器
      globalPureInfrastructure.extensions.registerRenderer(
        'adapted-component-list', 
        this.nodeAdapter
      )
      console.log('✅ 已注册: 组件列表渲染器')

      // 注册数据处理器
      globalPureInfrastructure.extensions.registerDataProcessor(
        'engine-data', 
        this.dataAdapter
      )
      console.log('✅ 已注册: 数据处理器')

      // 注册工具提供者
      globalPureInfrastructure.extensions.registerToolProvider(
        'adapted-tools', 
        this.toolAdapter
      )
      console.log('✅ 已注册: 工具提供者')

    } catch (error) {
      console.error('❌ EngineAdapterManager: 注册适配器失败', error)
      throw error
    }
  }

  /**
   * 设置数据流管道
   * 职责：建立适配器之间的数据传递通道
   */
  private async setupDataFlows(): Promise<void> {
    console.log('🔄 EngineAdapterManager: 设置数据流管道')

    try {
      // 注册组件数据源
      globalPureInfrastructure.pipeline.registerSource('adapted-components', {
        getData: async () => {
          console.log('📊 获取适配后的组件数据')
          const treeData = globalNodeRegistryEngine.query.getComponentTree()
          return this.dataAdapter.process({
            type: 'component-list',
            categories: treeData
          })
        }
      })

      // 注册面板数据源
      globalPureInfrastructure.pipeline.registerSource('adapted-panel', {
        getData: async () => {
          console.log('📊 获取适配后的面板数据')
          return this.dataAdapter.process({
            type: 'panel-state'
          })
        }
      })

      console.log('✅ EngineAdapterManager: 数据流管道设置完成')

    } catch (error) {
      console.error('❌ EngineAdapterManager: 设置数据流失败', error)
      throw error
    }
  }

  /**
   * 设置事件监听
   * 职责：建立适配器间的事件通信机制
   */
  private setupEventListeners(): void {
    console.log('👂 EngineAdapterManager: 设置事件监听')

    try {
      // 监听组件拖拽事件
      globalPureInfrastructure.eventBus.on('component-drag-start', (event) => {
        console.log('🎯 EngineAdapterManager: 检测到组件拖拽开始', event.componentType)
      })

      // 监听工具动作事件
      globalPureInfrastructure.eventBus.on('tool-action', async (event) => {
        console.log('🔧 EngineAdapterManager: 检测到工具动作', event.action)
        await this.toolAdapter.handleAction(event.action, event.context)
      })

      // 监听数据变更事件
      globalPureInfrastructure.pipeline.onDataChange((event) => {
        console.log('📊 EngineAdapterManager: 检测到数据变更', event.sourceId)
      })

      console.log('✅ EngineAdapterManager: 事件监听设置完成')

    } catch (error) {
      console.error('❌ EngineAdapterManager: 设置事件监听失败', error)
    }
  }

  /**
   * 验证初始化结果
   * 职责：检查所有适配器是否正确初始化
   */
  private validateInitialization(): void {
    console.log('🔍 EngineAdapterManager: 验证初始化结果')

    const stats = {
      renderers: globalPureInfrastructure.extensions.getExtensions('renderer').length,
      processors: globalPureInfrastructure.extensions.getExtensions('processor').length,
      tools: globalPureInfrastructure.extensions.getExtensions('tool').length
    }

    console.log('📊 EngineAdapterManager: 初始化统计', stats)

    if (stats.renderers === 0 || stats.processors === 0 || stats.tools === 0) {
      throw new Error('部分适配器注册失败，初始化不完整')
    }
  }

  /**
   * 获取适配器实例
   * 职责：对外提供适配器访问接口
   */
  getAdapters() {
    return {
      node: this.nodeAdapter,
      data: this.dataAdapter,
      tool: this.toolAdapter
    }
  }

  /**
   * 获取初始化状态
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 销毁所有适配器
   * 职责：清理资源，卸载注册的扩展
   */
  destroy(): void {
    if (!this.initialized) {
      console.log('⚠️ EngineAdapterManager: 尚未初始化，跳过销毁')
      return
    }

    console.log('🗑️ EngineAdapterManager: 开始销毁所有适配器')
    
    try {
      // 卸载注册的扩展
      globalPureInfrastructure.extensions.unregisterExtension('renderer', 'adapted-component-list')
      globalPureInfrastructure.extensions.unregisterExtension('processor', 'engine-data')
      globalPureInfrastructure.extensions.unregisterExtension('tool', 'adapted-tools')

      // 销毁适配器
      this.nodeAdapter.destroy()

      this.initialized = false
      console.log('✅ EngineAdapterManager: 所有适配器已销毁')

    } catch (error) {
      console.error('❌ EngineAdapterManager: 销毁过程中出现错误', error)
    }
  }
}

// ==================== 🌐 导出接口 ====================

/**
 * 创建引擎适配器管理器实例
 */
export const createEngineAdapterManager = (): EngineAdapterManager => {
  return new EngineAdapterManager()
}

/**
 * 全局引擎适配器管理器实例
 */
export const globalEngineAdapterManager = createEngineAdapterManager()

/**
 * 快速初始化适配器的便捷函数
 */
export const initializeEngineAdapters = async (): Promise<void> => {
  console.log('🚀 开始快速初始化引擎适配器')
  await globalEngineAdapterManager.initialize()
  console.log('✅ 引擎适配器快速初始化完成')
}