<template>
  <div class="comprehensive-demo">
    <!-- 顶部控制栏 -->
    <div class="demo-controls">
      <div class="control-group">
        <label>主题:</label>
        <select v-model="selectedTheme" class="theme-select" @change="changeTheme">
          <option v-for="theme in availableThemes" :key="theme.id" :value="theme.id">
            {{ theme.name }}
          </option>
        </select>
      </div>
      
      <div class="control-group">
        <label>布局:</label>
        <select v-model="selectedLayout" class="layout-select" @change="changeLayout">
          <option v-for="preset in layoutPresets" :key="preset.id" :value="preset.id">
            {{ preset.name }}
          </option>
        </select>
      </div>

      <div class="control-group">
        <button class="demo-btn" @click="addSampleData">
          <i class="fa fa-plus"></i>
          添加示例数据
        </button>
        <button class="demo-btn danger" @click="clearAll">
          <i class="fa fa-trash"></i>
          清空画布
        </button>
        <button class="demo-btn" @click="exportDemo">
          <i class="fa fa-download"></i>
          导出配置
        </button>
        <input
          ref="importFileInput"
          type="file"
          accept=".json"
          style="display: none;"
          @change="handleImportConfig"
        />
        <button class="demo-btn" @click="importConfigFile">
          <i class="fa fa-upload"></i>
          导入配置
        </button>
        <button class="demo-btn" @click="generateRandomData">
          <i class="fa fa-random"></i>
          随机数据
        </button>
      </div>
    </div>

    <!-- 主面板区域 -->
    <div class="panel-container">
      <PanelV2
        ref="panelRef"
        :plugins="demoPlugins"
        :toolbarActions="demoToolbarActions"
        :draggableItems="demoDraggableItems"
        :inspectorRegistry="demoInspectorRegistry"
        :enablePluginSystem="true"
      >
      <template #card="{ cardData }">
        <component 
          :is="getCardComponent(cardData.type)" 
          v-if="getCardComponent(cardData.type)"
          :config="cardData.config"
          @update:config="updateCardConfig(cardData.id, $event)"
        />
        <div v-else class="unknown-card">
          <i class="fa fa-question-circle"></i>
          <p>未知卡片类型: {{ cardData.type }}</p>
          <small>{{ cardData.id }}</small>
        </div>
      </template>
      </PanelV2>
    </div>

    <!-- 遮罩层 -->
    <div v-if="showHelp" class="help-overlay" @click="showHelp = false"></div>
    
    <!-- 快捷帮助面板 -->
    <div class="help-panel" :class="{ 'open': showHelp }">
      <div class="help-header">
        <h3>快捷帮助</h3>
        <button class="close-btn" @click.stop="showHelp = false">
          <i class="fa fa-times"></i>
        </button>
      </div>
      <div class="help-content">
        <div class="help-section">
          <h4>快捷键</h4>
          <div class="shortcut-list">
            <div v-for="shortcut in keyboardShortcuts" :key="shortcut.key" class="shortcut-item">
              <span class="shortcut-key">{{ shortcut.display }}</span>
              <span class="shortcut-desc">{{ shortcut.description }}</span>
            </div>
          </div>
        </div>
        
        <div class="help-section">
          <h4>操作指南</h4>
          <ul class="guide-list">
            <li>从左侧栏拖拽组件到画布</li>
            <li>点击卡片进行选择和配置</li>
            <li>右键点击显示上下文菜单</li>
            <li>使用工具栏进行撤销/重做</li>
            <li>通过右侧面板调整属性</li>
            <li>使用 Ctrl+S 保存配置</li>
            <li>拖拽卡片进行重新布局</li>
          </ul>
        </div>
        
        <div class="help-section">
          <h4>高级功能</h4>
          <ul class="guide-list">
            <li>支持插件系统扩展</li>
            <li>多主题切换支持</li>
            <li>实时数据绑定</li>
            <li>配置导入导出</li>
            <li>响应式布局适配</li>
            <li>性能监控和优化</li>
          </ul>
        </div>

        <div class="help-section">
          <h4>示例数据</h4>
          <div class="sample-buttons">
            <button class="sample-btn" @click="loadDashboardTemplate">
              <i class="fa fa-tachometer-alt"></i>
              <div class="sample-info">
                <span class="sample-title">仪表盘模板</span>
                <small class="sample-desc">包含系统概览、设备状态和架构图</small>
              </div>
            </button>
            <button class="sample-btn" @click="loadReportTemplate">
              <i class="fa fa-chart-bar"></i>
              <div class="sample-info">
                <span class="sample-title">报表模板</span>
                <small class="sample-desc">月度运营数据和收入统计</small>
              </div>
            </button>
            <button class="sample-btn" @click="loadMonitorTemplate">
              <i class="fa fa-desktop"></i>
              <div class="sample-info">
                <span class="sample-title">监控模板</span>
                <small class="sample-desc">实时系统监控和日志显示</small>
              </div>
            </button>
          </div>
          
          <div v-if="previewTemplate" class="template-preview">
            <div class="preview-header">
              <h5>模板预览: {{ previewTemplate.name }}</h5>
              <div class="preview-badge">{{ previewTemplate.cards.length }} 个卡片</div>
            </div>
            <p>{{ previewTemplate.description }}</p>
            
            <div class="preview-stats">
              <div class="stat-item">
                <i class="fa fa-layer-group"></i>
                <span>{{ previewTemplate.cards.length }} 卡片</span>
              </div>
              <div class="stat-item">
                <i class="fa fa-palette"></i>
                <span>{{ getUniqueColors(previewTemplate.cards).length }} 种颜色</span>
              </div>
              <div class="stat-item">
                <i class="fa fa-th"></i>
                <span>{{ getCardTypes(previewTemplate.cards).length }} 种类型</span>
              </div>
            </div>
            
            <div class="preview-cards">
              <div 
                v-for="card in previewTemplate.cards" 
                :key="card.id" 
                class="preview-card"
                :title="`${card.type} - ${card.config.title?.value || '无标题'}`"
              >
                <i :class="getCardIcon(card.type)"></i>
                <span>{{ card.config.title?.value || card.type }}</span>
                <div class="card-size">{{ card.layout?.w || 1 }}×{{ card.layout?.h || 1 }}</div>
              </div>
            </div>
            
            <div class="preview-actions">
              <button class="confirm-btn" @click="confirmLoadTemplate">
                <i class="fa fa-check"></i>
                确认加载
              </button>
              <button class="cancel-btn" @click="previewTemplate = null">
                <i class="fa fa-times"></i>
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 帮助按钮 -->
    <button 
      class="help-toggle-btn" 
      :title="showHelp ? '关闭帮助' : '打开帮助'"
      @click="showHelp = !showHelp"
    >
      <i class="fa fa-question-circle"></i>
    </button>
    
    <!-- 快速操作菜单 -->
    <div class="quick-menu" :class="{ 'open': showQuickMenu }">
      <button class="quick-menu-toggle" @click="showQuickMenu = !showQuickMenu">
        <i class="fa fa-cog"></i>
      </button>
      <div class="quick-menu-items">
        <button class="quick-item" title="添加示例数据" @click="addSampleData">
          <i class="fa fa-plus"></i>
        </button>
        <button class="quick-item" title="生成随机数据" @click="generateRandomData">
          <i class="fa fa-random"></i>
        </button>
        <button class="quick-item" title="导出配置" @click="exportDemo">
          <i class="fa fa-download"></i>
        </button>
        <button class="quick-item danger" title="清空所有" @click="clearAll">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </div>

    <!-- 键盘快捷键提示 -->
    <div v-if="showShortcutHint" class="shortcut-hint">
      <div class="hint-content">
        <i class="fa fa-keyboard"></i>
        <span>{{ currentShortcutHint }}</span>
      </div>
    </div>

    <!-- 性能监控 -->
    <div v-if="showPerformance" class="performance-monitor">
      <div class="perf-header">
        <i class="fa fa-chart-line"></i>
        <span>性能监控</span>
        <button class="perf-close" @click="showPerformance = false">
          <i class="fa fa-times"></i>
        </button>
      </div>
      <div class="perf-metrics">
        <div class="perf-item">
          <div class="perf-label">FPS</div>
          <div class="perf-value" :class="{ 'warning': fps < 30, 'error': fps < 15 }">{{ fps }}</div>
        </div>
        <div class="perf-item">
          <div class="perf-label">内存</div>
          <div class="perf-value">{{ memoryUsage }}MB</div>
        </div>
        <div class="perf-item">
          <div class="perf-label">卡片</div>
          <div class="perf-value">{{ cardCount }}</div>
        </div>
        <div class="perf-item">
          <div class="perf-label">运行时间</div>
          <div class="perf-value">{{ formatUptime(uptime) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PanelV2 from '../PanelV2.vue'
import TextCard from '../cards/TextCard.vue'
import ImageCard from '../cards/ImageCard.vue'
import TableCard from '../cards/TableCard.vue'
import { ChartPlugin } from '../plugins'
// 移除有问题的依赖
// import { ThemeManager } from '../themes/ThemeManager'
// import { LayoutManager } from '../layouts/LayoutManager'
// import { ImportExportManager } from '../utils/ImportExport'
import type { ToolbarAction, DraggableItem } from '../types'

// 引用
const panelRef = ref<InstanceType<typeof PanelV2>>()
const importFileInput = ref<HTMLInputElement>()

// 状态
const showHelp = ref(false)
const showPerformance = ref(true)
const selectedTheme = ref('light')  
const selectedLayout = ref('default')
const previewTemplate = ref<any>(null)
const showQuickMenu = ref(false)
const showShortcutHint = ref(false)
const currentShortcutHint = ref('')

// 性能监控
const fps = ref(60)
const memoryUsage = ref(0)
const cardCount = ref(0)
const uptime = ref(0)
const startTime = Date.now()

// 主题和布局选项
const availableThemes = [
  { id: 'light', name: '浅色主题' },
  { id: 'dark', name: '深色主题' },
  { id: 'blue', name: '蓝色主题' }
]

const layoutPresets = [
  { id: 'default', name: '默认布局' },
  { id: 'compact', name: '紧凑布局' }, 
  { id: 'wide', name: '宽屏布局' }
]

// 预装插件
const demoPlugins = [ChartPlugin]

// 自定义工具栏动作
const demoToolbarActions: ToolbarAction[] = [
  {
    id: 'toggle-performance',
    icon: 'fa fa-chart-line',
    tooltip: '性能监控',
    action: () => {
      showPerformance.value = !showPerformance.value
    }
  },
  {
    id: 'toggle-help',
    icon: 'fa fa-question-circle',
    tooltip: '帮助',
    action: () => {
      showHelp.value = !showHelp.value
    }
  }
]

// 可拖拽项
const demoDraggableItems: DraggableItem[] = [
  {
    type: 'text-card',
    label: '文本卡片',
    icon: 'fa fa-font',
    defaultData: {
      type: 'text-card',
      config: {
        title: { value: '文本标题', inspector: 'text-input', label: '标题' },
        content: { value: '这是一个文本卡片的内容示例', inspector: 'textarea', label: '内容' },
        backgroundColor: { value: '#ffffff', inspector: 'color-picker', label: '背景色' },
        textColor: { value: '#333333', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: 14, inspector: 'slider', label: '字体大小' },
        showBorder: { value: true, inspector: 'switch', label: '显示边框' }
      }
    }
  },
  {
    type: 'image-card',
    label: '图片卡片',
    icon: 'fa fa-image',
    defaultData: {
      type: 'image-card',
      config: {
        title: { value: '图片展示', inspector: 'text-input', label: '标题' },
        imageUrl: { value: 'https://picsum.photos/400/300', inspector: 'image-input', label: '图片URL' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        objectFit: { 
          value: 'cover', 
          inspector: 'select', 
          label: '适应方式',
          options: [
            { value: 'cover', label: '覆盖' },
            { value: 'contain', label: '包含' },
            { value: 'fill', label: '填充' }
          ]
        },
        allowFullscreen: { value: true, inspector: 'switch', label: '允许全屏' }
      }
    }
  },
  {
    type: 'table-card',
    label: '数据表格',
    icon: 'fa fa-table',
    defaultData: {
      type: 'table-card',
      config: {
        title: { value: '数据表格', inspector: 'text-input', label: '标题' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        showPagination: { value: true, inspector: 'switch', label: '显示分页' },
        pageSize: { value: 10, inspector: 'slider', label: '每页大小' },
        stripedRows: { value: true, inspector: 'switch', label: '斑马纹' },
        hoverEffect: { value: true, inspector: 'switch', label: '悬停效果' },
        dataSource: { 
          value: generateSampleTableData(), 
          inspector: 'textarea', 
          label: '数据源' 
        },
        columns: {
          value: [
            { key: 'name', title: '姓名', sortable: true },
            { key: 'age', title: '年龄', sortable: true, format: 'number' },
            { key: 'email', title: '邮箱' },
            { key: 'createTime', title: '创建时间', format: 'datetime' }
          ],
          inspector: 'textarea',
          label: '列配置'
        }
      }
    }
  }
]

// 配置器注册表
const demoInspectorRegistry = {
  'text-input': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <input 
          :value="modelValue" 
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-control"
          type="text"
        />
      </div>
    `
  },
  'textarea': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <textarea 
          :value="modelValue" 
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-control"
          rows="3"
        ></textarea>
      </div>
    `
  },
  'color-picker': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input 
            :value="modelValue" 
            @input="$emit('update:modelValue', $event.target.value)"
            class="form-control"
            type="color"
            style="width: 50px; height: 32px; padding: 0;"
          />
          <input 
            :value="modelValue" 
            @input="$emit('update:modelValue', $event.target.value)"
            class="form-control"
            type="text"
            style="flex: 1;"
          />
        </div>
      </div>
    `
  },
  'slider': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input 
            :value="modelValue" 
            @input="$emit('update:modelValue', Number($event.target.value))"
            class="form-control"
            type="range"
            min="8"
            max="32"
            style="flex: 1;"
          />
          <span style="min-width: 30px; text-align: center;">{{ modelValue }}</span>
        </div>
      </div>
    `
  },
  'switch': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input 
            :checked="modelValue" 
            @input="$emit('update:modelValue', $event.target.checked)"
            type="checkbox"
          />
          <span v-if="label">{{ label }}</span>
        </label>
      </div>
    `
  },
  'select': {
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <select 
          :value="modelValue" 
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-control"
        >
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    `
  },
  'image-input': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <input 
          :value="modelValue" 
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-control"
          type="text"
          placeholder="输入图片URL"
        />
      </div>
    `
  }
}

// 计算属性已在上面定义，这里移除重复声明

const keyboardShortcuts = [
  { key: 'ctrl+z', display: 'Ctrl+Z', description: '撤销' },
  { key: 'ctrl+y', display: 'Ctrl+Y', description: '重做' },
  { key: 'ctrl+s', display: 'Ctrl+S', description: '保存' },
  { key: 'ctrl+c', display: 'Ctrl+C', description: '复制' },
  { key: 'ctrl+v', display: 'Ctrl+V', description: '粘贴' },
  { key: 'delete', display: 'Delete', description: '删除选中项' }
]

// 方法
const getCardComponent = (type: string) => {
  const componentMap = {
    'text-card': TextCard,
    'image-card': ImageCard,
    'table-card': TableCard
  }
  
  // 检查插件提供的组件
  if (panelRef.value?.pluginManager) {
    const registry = panelRef.value.pluginManager.getCardRegistry()
    return registry[type] || componentMap[type as keyof typeof componentMap]
  }
  
  return componentMap[type as keyof typeof componentMap]
}

// 获取卡片类型图标
const getCardIcon = (type: string) => {
  const iconMap = {
    'text-card': 'fa fa-font',
    'image-card': 'fa fa-image',
    'table-card': 'fa fa-table',
    'chart-card': 'fa fa-chart-line'
  }
  return iconMap[type as keyof typeof iconMap] || 'fa fa-cube'
}

const updateCardConfig = (cardId: string, config: any) => {
  console.log('Update card config:', cardId, config)
}

const changeTheme = () => {
  console.log('Changing theme to:', selectedTheme.value)
  if (panelRef.value) {
    try {
      const store = panelRef.value.panelStore
      if (store && store.config && store.config.theme) {
        store.config.theme.value = selectedTheme.value
        
        // 应用主题样式
        const panelContainer = document.querySelector('.panel-container')
        if (panelContainer) {
          panelContainer.setAttribute('data-theme', selectedTheme.value)
          
          // 根据主题更新CSS变量
          const themes = {
            light: {
              '--panel-bg': '#f0f2f5',
              '--panel-card-bg': '#ffffff',
              '--panel-text': '#333333',
              '--panel-border': '#e8e8e8'
            },
            dark: {
              '--panel-bg': '#1f1f1f',
              '--panel-card-bg': '#2d2d2d',
              '--panel-text': '#ffffff',
              '--panel-border': '#404040'
            },
            blue: {
              '--panel-bg': '#e6f7ff',
              '--panel-card-bg': '#ffffff',
              '--panel-text': '#1890ff',
              '--panel-border': '#40a9ff'
            }
          }
          
          const themeVars = themes[selectedTheme.value] || themes.light
          Object.entries(themeVars).forEach(([key, value]) => {
            panelContainer.style.setProperty(key, value)
          })
        }
        
        store.saveToStorage()
        console.log('Theme changed successfully')
        alert('主题已切换到: ' + selectedTheme.value)
      }
    } catch (error) {
      console.error('Failed to change theme:', error)
      alert('主题切换失败: ' + error.message)
    }
  }
}

const changeLayout = () => {
  console.log('Change layout to:', selectedLayout.value)
  if (panelRef.value) {
    try {
      const store = panelRef.value.panelStore
      if (store && store.config) {
        // 更新网格配置
        const layoutConfigs = {
          default: { gridSize: 12, cardSpacing: 16 },
          compact: { gridSize: 16, cardSpacing: 8 },
          wide: { gridSize: 8, cardSpacing: 24 }
        }
        
        const config = layoutConfigs[selectedLayout.value] || layoutConfigs.default
        
        if (store.config.gridSize) {
          store.config.gridSize.value = config.gridSize
        }
        
        // 应用布局样式
        const panelContainer = document.querySelector('.panel-container')
        if (panelContainer) {
          panelContainer.setAttribute('data-layout', selectedLayout.value)
          
          // 根据布局调整容器样式
          const layoutStyles = {
            default: { padding: '16px' },
            compact: { padding: '8px' },
            wide: { padding: '24px' }
          }
          
          const styles = layoutStyles[selectedLayout.value] || layoutStyles.default
          Object.entries(styles).forEach(([key, value]) => {
            panelContainer.style[key] = value
          })
        }
        
        store.saveToStorage()
        console.log('Layout changed successfully')
        alert('布局已切换到: ' + selectedLayout.value)
      }
    } catch (error) {
      console.error('Failed to change layout:', error)
      alert('布局切换失败: ' + error.message)
    }
  }
}

const addSampleData = () => {
  const sampleCards = [
    {
      id: 'sample-text-1',
      type: 'text-card',
      layout: { x: 0, y: 0, w: 2, h: 1 },
      config: {
        title: { value: '欢迎使用 PanelV2', inspector: 'text-input', label: '标题' },
        content: { value: '这是一个功能强大的可视化面板系统', inspector: 'textarea', label: '内容' },
        backgroundColor: { value: '#722ed1', inspector: 'color-picker', label: '背景色' },
        textColor: { value: '#ffffff', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: 16, inspector: 'slider', label: '字体大小' },
        showBorder: { value: true, inspector: 'switch', label: '显示边框' }
      }
    },
    {
      id: 'sample-image-1',
      type: 'image-card',
      layout: { x: 2, y: 0, w: 2, h: 2 },
      config: {
        title: { value: '示例图片', inspector: 'text-input', label: '标题' },
        imageUrl: { value: 'https://picsum.photos/400/300?random=' + Date.now(), inspector: 'image-input', label: '图片URL' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        objectFit: { 
          value: 'cover', 
          inspector: 'select', 
          label: '适应方式',
          options: [
            { value: 'cover', label: '覆盖' },
            { value: 'contain', label: '包含' },
            { value: 'fill', label: '填充' }
          ]
        },
        allowFullscreen: { value: true, inspector: 'switch', label: '允许全屏' }
      }
    },
    {
      id: 'sample-table-1',
      type: 'table-card',
      layout: { x: 0, y: 1, w: 4, h: 2 },
      config: {
        title: { value: '示例数据表格', inspector: 'text-input', label: '标题' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        showPagination: { value: true, inspector: 'switch', label: '显示分页' },
        pageSize: { value: 5, inspector: 'slider', label: '每页大小' },
        stripedRows: { value: true, inspector: 'switch', label: '斑马纹' },
        hoverEffect: { value: true, inspector: 'switch', label: '悬停效果' },
        dataSource: { 
          value: generateSampleTableData(), 
          inspector: 'textarea', 
          label: '数据源' 
        },
        columns: {
          value: [
            { key: 'name', title: '姓名', sortable: true },
            { key: 'age', title: '年龄', sortable: true, format: 'number' },
            { key: 'email', title: '邮箱' },
            { key: 'createTime', title: '创建时间', format: 'datetime' }
          ],
          inspector: 'textarea',
          label: '列配置'
        }
      }
    }
  ]
  
  loadTemplate(sampleCards, '示例数据')
}

const clearAll = () => {
  if (confirm('确定要清空所有卡片吗？')) {
    if (panelRef.value) {
      try {
        const store = panelRef.value.panelStore
        
        console.log('Clearing cards, store:', store)
        
        if (store && store.clearCards) {
          store.clearCards()
          console.log('已清空所有卡片')
          alert('已清空所有卡片')
        } else {
          console.error('Panel store not available or missing clearCards method')
          console.error('Store details:', {
            store: !!store,
            clearCards: store ? typeof store.clearCards : 'undefined'
          })
          alert('面板存储不可用，无法清空卡片')
        }
      } catch (error) {
        console.error('Error clearing cards:', error)
        alert(`清空失败: ${error.message}`)
      }
    } else {
      alert('面板引用不可用，请刷新页面重试')
    }
  }
}

const exportDemo = () => {
  if (panelRef.value) {
    try {
      const store = panelRef.value.panelStore
      
      console.log('Exporting, store:', store)
      
      if (store && (store.$state || store.cards !== undefined)) {
        // 构造面板状态
        const panelState = store.$state || {
          cards: store.cards,
          selectedItemId: store.selectedItemId,
          config: store.config
        }
        
        // 简化导出功能，不依赖外部类
        const config = {
          ...panelState,
          exportTime: new Date().toISOString(),
          metadata: {
            name: 'PanelV2 演示配置',
            description: '由 PanelV2 演示系统导出的配置',
            author: 'PanelV2 Demo',
            tags: ['demo', 'example', 'template']
          }
        }
        
        // 创建下载链接
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `panelv2-demo-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        console.log('配置导出成功')
        alert('配置导出成功')
      } else {
        console.error('Panel state not available')
        console.error('Store details:', {
          store: !!store,
          $state: store ? !!store.$state : 'undefined',
          cards: store ? typeof store.cards : 'undefined'
        })
        alert('面板状态不可用，无法导出配置')
      }
    } catch (error) {
      console.error('导出失败:', error)
      alert(`导出失败: ${error.message}`)
    }
  } else {
    alert('面板引用不可用，请刷新页面重试')
  }
}

// 导入配置文件
const importConfigFile = () => {
  if (importFileInput.value) {
    importFileInput.value.click()
  }
}

// 处理导入配置
const handleImportConfig = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  try {
    const importManager = new ImportExportManager()
    const importData = await importManager.importPanel(file, { validateData: true })
    
    if (panelRef.value && importData.panelState) {
      const store = panelRef.value.panelStore
      
      console.log('Importing, store:', store)
      
      if (store && store.clearCards && store.addCard) {
        // 清空现有卡片
        store.clearCards()
        
        // 加载导入的卡片
        importData.panelState.cards.forEach(card => {
          console.log('Importing card:', card)
          store.addCard(card)
        })
        
        // 更新配置
        if (importData.panelState.config && store.config) {
          Object.assign(store.config, importData.panelState.config)
        }
        
        console.log('配置导入成功:', importData.metadata)
        alert(`配置导入成功！\n名称: ${importData.metadata?.name || '未知'}\n卡片数量: ${importData.panelState.cards.length}`)
      } else {
        console.error('Panel store not available or missing methods')
        console.error('Store details:', {
          store: !!store,
          clearCards: store ? typeof store.clearCards : 'undefined',
          addCard: store ? typeof store.addCard : 'undefined'
        })
        alert('面板存储不可用，无法导入配置')
      }
    }
  } catch (error) {
    console.error('导入失败:', error)
    alert(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
  
  // 清空文件选择
  target.value = ''
}

const loadDashboardTemplate = () => {
  const dashboardCards = [
    {
      id: 'dash-text-1',
      type: 'text-card',
      layout: { x: 0, y: 0, w: 2, h: 1 },
      config: {
        title: { value: '系统概览', inspector: 'text-input', label: '标题' },
        content: { value: '当前系统运行正常，所有服务状态良好', inspector: 'textarea', label: '内容' },
        backgroundColor: { value: '#1890ff', inspector: 'color-picker', label: '背景色' },
        textColor: { value: '#ffffff', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: 16, inspector: 'slider', label: '字体大小' },
        showBorder: { value: false, inspector: 'switch', label: '显示边框' }
      }
    },
    {
      id: 'dash-table-1',
      type: 'table-card',
      layout: { x: 2, y: 0, w: 4, h: 3 },
      config: {
        title: { value: '设备状态', inspector: 'text-input', label: '标题' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        showPagination: { value: true, inspector: 'switch', label: '显示分页' },
        pageSize: { value: 5, inspector: 'slider', label: '每页大小' },
        stripedRows: { value: true, inspector: 'switch', label: '斑马纹' },
        hoverEffect: { value: true, inspector: 'switch', label: '悬停效果' },
        dataSource: { 
          value: generateDeviceStatusData(), 
          inspector: 'textarea', 
          label: '数据源' 
        },
        columns: {
          value: [
            { key: 'name', title: '设备名称', sortable: true },
            { key: 'status', title: '状态', sortable: true },
            { key: 'cpu', title: 'CPU使用率', sortable: true, format: 'number' },
            { key: 'memory', title: '内存使用率', sortable: true, format: 'number' },
            { key: 'lastUpdate', title: '最后更新', format: 'datetime' }
          ],
          inspector: 'textarea',
          label: '列配置'
        }
      }
    },
    {
      id: 'dash-image-1',
      type: 'image-card',
      layout: { x: 0, y: 1, w: 2, h: 2 },
      config: {
        title: { value: '系统架构图', inspector: 'text-input', label: '标题' },
        imageUrl: { value: 'https://picsum.photos/400/300?random=dashboard', inspector: 'image-input', label: '图片URL' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        objectFit: { 
          value: 'cover', 
          inspector: 'select', 
          label: '适应方式',
          options: [
            { value: 'cover', label: '覆盖' },
            { value: 'contain', label: '包含' },
            { value: 'fill', label: '填充' }
          ]
        },
        allowFullscreen: { value: true, inspector: 'switch', label: '允许全屏' }
      }
    }
  ]
  
  previewTemplate.value = {
    name: '仪表盘模板',
    description: '包含系统概览、设备状态监控和系统架构图的综合仪表盘',
    cards: dashboardCards,
    loadFunction: () => loadTemplate(dashboardCards, '仪表盘模板')
  }
}

const loadReportTemplate = () => {
  const reportCards = [
    {
      id: 'report-title',
      type: 'text-card',
      layout: { x: 0, y: 0, w: 6, h: 1 },
      config: {
        title: { value: '月度运营报告', inspector: 'text-input', label: '标题' },
        content: { value: '2024年1月系统运营数据统计报告', inspector: 'textarea', label: '内容' },
        backgroundColor: { value: '#52c41a', inspector: 'color-picker', label: '背景色' },
        textColor: { value: '#ffffff', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: 20, inspector: 'slider', label: '字体大小' },
        showBorder: { value: false, inspector: 'switch', label: '显示边框' }
      }
    },
    {
      id: 'report-data-1',
      type: 'table-card',
      layout: { x: 0, y: 1, w: 3, h: 3 },
      config: {
        title: { value: '用户活跃度统计', inspector: 'text-input', label: '标题' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        showPagination: { value: false, inspector: 'switch', label: '显示分页' },
        stripedRows: { value: true, inspector: 'switch', label: '斑马纹' },
        hoverEffect: { value: false, inspector: 'switch', label: '悬停效果' },
        dataSource: { 
          value: generateUserActivityData(), 
          inspector: 'textarea', 
          label: '数据源' 
        },
        columns: {
          value: [
            { key: 'date', title: '日期' },
            { key: 'activeUsers', title: '活跃用户', format: 'number' },
            { key: 'newUsers', title: '新增用户', format: 'number' },
            { key: 'retention', title: '留存率', format: 'number' }
          ],
          inspector: 'textarea',
          label: '列配置'
        }
      }
    },
    {
      id: 'report-data-2',
      type: 'table-card',
      layout: { x: 3, y: 1, w: 3, h: 3 },
      config: {
        title: { value: '收入统计', inspector: 'text-input', label: '标题' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        showPagination: { value: false, inspector: 'switch', label: '显示分页' },
        stripedRows: { value: true, inspector: 'switch', label: '斑马纹' },
        hoverEffect: { value: false, inspector: 'switch', label: '悬停效果' },
        dataSource: { 
          value: generateRevenueData(), 
          inspector: 'textarea', 
          label: '数据源' 
        },
        columns: {
          value: [
            { key: 'category', title: '类别' },
            { key: 'amount', title: '金额', format: 'currency' },
            { key: 'growth', title: '增长率', format: 'number' },
            { key: 'target', title: '目标完成度', format: 'number' }
          ],
          inspector: 'textarea',
          label: '列配置'
        }
      }
    }
  ]
  
  previewTemplate.value = {
    name: '报表模板',
    description: '月度运营数据统计，包含用户活跃度和收入分析报表',
    cards: reportCards,
    loadFunction: () => loadTemplate(reportCards, '报表模板')
  }
}

const loadMonitorTemplate = () => {
  const monitorCards = [
    {
      id: 'monitor-title',
      type: 'text-card',
      layout: { x: 0, y: 0, w: 6, h: 1 },
      config: {
        title: { value: '系统监控中心', inspector: 'text-input', label: '标题' },
        content: { value: '实时监控系统运行状态和性能指标', inspector: 'textarea', label: '内容' },
        backgroundColor: { value: '#f5222d', inspector: 'color-picker', label: '背景色' },
        textColor: { value: '#ffffff', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: 18, inspector: 'slider', label: '字体大小' },
        showBorder: { value: false, inspector: 'switch', label: '显示边框' }
      }
    },
    {
      id: 'monitor-status-1',
      type: 'text-card',
      layout: { x: 0, y: 1, w: 2, h: 1 },
      config: {
        title: { value: 'CPU使用率', inspector: 'text-input', label: '标题' },
        content: { value: '85%', inspector: 'textarea', label: '内容' },
        backgroundColor: { value: '#fa8c16', inspector: 'color-picker', label: '背景色' },
        textColor: { value: '#ffffff', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: 24, inspector: 'slider', label: '字体大小' },
        showBorder: { value: true, inspector: 'switch', label: '显示边框' }
      }
    },
    {
      id: 'monitor-status-2',
      type: 'text-card',
      layout: { x: 2, y: 1, w: 2, h: 1 },
      config: {
        title: { value: '内存使用率', inspector: 'text-input', label: '标题' },
        content: { value: '67%', inspector: 'textarea', label: '内容' },
        backgroundColor: { value: '#52c41a', inspector: 'color-picker', label: '背景色' },
        textColor: { value: '#ffffff', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: 24, inspector: 'slider', label: '字体大小' },
        showBorder: { value: true, inspector: 'switch', label: '显示边框' }
      }
    },
    {
      id: 'monitor-status-3',
      type: 'text-card',
      layout: { x: 4, y: 1, w: 2, h: 1 },
      config: {
        title: { value: '磁盘使用率', inspector: 'text-input', label: '标题' },
        content: { value: '45%', inspector: 'textarea', label: '内容' },
        backgroundColor: { value: '#1890ff', inspector: 'color-picker', label: '背景色' },
        textColor: { value: '#ffffff', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: 24, inspector: 'slider', label: '字体大小' },
        showBorder: { value: true, inspector: 'switch', label: '显示边框' }
      }
    },
    {
      id: 'monitor-log',
      type: 'table-card',
      layout: { x: 0, y: 2, w: 6, h: 2 },
      config: {
        title: { value: '系统日志', inspector: 'text-input', label: '标题' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        showPagination: { value: true, inspector: 'switch', label: '显示分页' },
        pageSize: { value: 8, inspector: 'slider', label: '每页大小' },
        stripedRows: { value: true, inspector: 'switch', label: '斑马纹' },
        hoverEffect: { value: true, inspector: 'switch', label: '悬停效果' },
        dataSource: { 
          value: generateSystemLogData(), 
          inspector: 'textarea', 
          label: '数据源' 
        },
        columns: {
          value: [
            { key: 'timestamp', title: '时间', format: 'datetime' },
            { key: 'level', title: '级别' },
            { key: 'service', title: '服务' },
            { key: 'message', title: '消息' },
            { key: 'source', title: '来源' }
          ],
          inspector: 'textarea',
          label: '列配置'
        }
      }
    }
  ]
  
  previewTemplate.value = {
    name: '监控模板',
    description: '实时系统监控面板，包含性能指标和系统日志',
    cards: monitorCards,
    loadFunction: () => loadTemplate(monitorCards, '监控模板')
  }
}

// 确认加载模板
const confirmLoadTemplate = () => {
  if (previewTemplate.value && previewTemplate.value.loadFunction) {
    previewTemplate.value.loadFunction()
    previewTemplate.value = null
  }
}

// 获取模板中的唯一颜色
const getUniqueColors = (cards: any[]) => {
  const colors = new Set<string>()
  cards.forEach(card => {
    if (card.config.backgroundColor?.value) {
      colors.add(card.config.backgroundColor.value)
    }
    if (card.config.textColor?.value) {
      colors.add(card.config.textColor.value)
    }
  })
  return Array.from(colors)
}

// 获取模板中的卡片类型
const getCardTypes = (cards: any[]) => {
  const types = new Set<string>()
  cards.forEach(card => {
    types.add(card.type)
  })
  return Array.from(types)
}

// 格式化运行时间
const formatUptime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

// 生成随机演示数据
const generateRandomData = () => {
  const randomCards = []
  const cardTypes = ['text-card', 'image-card', 'table-card']
  const colors = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2']
  
  for (let i = 0; i < 6; i++) {
    const type = cardTypes[Math.floor(Math.random() * cardTypes.length)]
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    let config: any = {
      title: { value: `随机卡片 ${i + 1}`, inspector: 'text-input', label: '标题' },
      backgroundColor: { value: color, inspector: 'color-picker', label: '背景色' }
    }
    
    if (type === 'text-card') {
      config = {
        ...config,
        content: { value: `这是第 ${i + 1} 个随机生成的文本卡片`, inspector: 'textarea', label: '内容' },
        textColor: { value: '#ffffff', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: Math.floor(Math.random() * 8) + 12, inspector: 'slider', label: '字体大小' },
        showBorder: { value: Math.random() > 0.5, inspector: 'switch', label: '显示边框' }
      }
    } else if (type === 'image-card') {
      config = {
        ...config,
        imageUrl: { value: `https://picsum.photos/400/300?random=${i}`, inspector: 'image-input', label: '图片URL' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        objectFit: { value: 'cover', inspector: 'select', label: '适应方式' },
        allowFullscreen: { value: true, inspector: 'switch', label: '允许全屏' }
      }
    } else if (type === 'table-card') {
      config = {
        ...config,
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        showPagination: { value: true, inspector: 'switch', label: '显示分页' },
        pageSize: { value: 5, inspector: 'slider', label: '每页大小' },
        stripedRows: { value: true, inspector: 'switch', label: '斑马纹' },
        dataSource: { value: generateSampleTableData().slice(0, 5), inspector: 'textarea', label: '数据源' },
        columns: {
          value: [
            { key: 'name', title: '姓名', sortable: true },
            { key: 'age', title: '年龄', sortable: true, format: 'number' },
            { key: 'email', title: '邮箱' }
          ],
          inspector: 'textarea',
          label: '列配置'
        }
      }
    }
    
    randomCards.push({
      id: `random-${i}`,
      type,
      layout: { 
        x: (i % 3) * 2, 
        y: Math.floor(i / 3) * 2, 
        w: 2, 
        h: type === 'table-card' ? 2 : 1 
      },
      config
    })
  }
  
  loadTemplate(randomCards, '随机演示数据')
}

// 加载模板的通用方法
const loadTemplate = (cards: any[], templateName: string) => {
  console.log('Loading template:', templateName, 'with cards:', cards)
  
  if (panelRef.value) {
    try {
      // 直接访问暴露的panelStore
      const store = panelRef.value.panelStore
      
      console.log('Panel store:', store)
      console.log('Available methods:', store ? Object.getOwnPropertyNames(Object.getPrototypeOf(store)) : 'none')
      
      if (store && store.clearCards && store.addCard) {
        // 清空现有卡片
        store.clearCards()
        
        // 添加新卡片
        cards.forEach(card => {
          console.log('Adding card:', card)
          store.addCard(card)
        })
        
        console.log(`${templateName}加载成功，共加载 ${cards.length} 个卡片`)
        alert(`${templateName}加载成功，共加载 ${cards.length} 个卡片`)
      } else {
        console.error('Panel store not available or missing methods')
        console.error('Store details:', {
          store: !!store,
          clearCards: store ? typeof store.clearCards : 'undefined',
          addCard: store ? typeof store.addCard : 'undefined'
        })
        alert('面板存储不可用，请检查面板是否正确初始化')
      }
    } catch (error) {
      console.error('Error loading template:', error)
      alert(`加载${templateName}失败: ${error.message}`)
    }
  } else {
    console.error('Panel reference not available')
    alert('面板引用不可用，请刷新页面重试')
  }
}

// 生成示例表格数据
function generateSampleTableData() {
  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十']
  const data = []
  
  for (let i = 0; i < 20; i++) {
    data.push({
      id: i + 1,
      name: names[Math.floor(Math.random() * names.length)],
      age: Math.floor(Math.random() * 40) + 20,
      email: `user${i + 1}@example.com`,
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  
  return data
}

// 生成设备状态数据
function generateDeviceStatusData() {
  const devices = ['Web服务器', '数据库服务器', '缓存服务器', '负载均衡器', '监控服务器']
  const data = []
  
  devices.forEach((device, index) => {
    data.push({
      id: index + 1,
      name: device,
      status: index === 2 ? '故障' : (index === 1 ? '维护中' : '运行中'),
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      lastUpdate: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString()
    })
  })
  
  return data
}

// 生成用户活跃度数据
function generateUserActivityData() {
  const data = []
  const now = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    data.push({
      date: date.toISOString().split('T')[0],
      activeUsers: Math.floor(Math.random() * 5000) + 3000,
      newUsers: Math.floor(Math.random() * 500) + 100,
      retention: (Math.random() * 20 + 70).toFixed(1) + '%'
    })
  }
  
  return data
}

// 生成收入数据
function generateRevenueData() {
  const categories = ['订阅服务', '广告收入', '手续费', '增值服务']
  return categories.map(category => ({
    category,
    amount: Math.floor(Math.random() * 100000) + 50000,
    growth: (Math.random() * 40 - 10).toFixed(1) + '%',
    target: (Math.random() * 50 + 50).toFixed(1) + '%'
  }))
}

// 生成系统日志数据
function generateSystemLogData() {
  const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG']
  const services = ['web-server', 'database', 'cache', 'auth-service', 'api-gateway']
  const messages = [
    '服务启动成功',
    '连接池已满',
    '数据库连接超时',
    '用户登录成功',
    '缓存更新完成',
    'API请求处理异常',
    '定时任务执行完成',
    '内存使用率告警'
  ]
  
  const data = []
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
    data.push({
      id: i + 1,
      timestamp: timestamp.toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      service: services[Math.floor(Math.random() * services.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      source: `node-${Math.floor(Math.random() * 5) + 1}`
    })
  }
  
  return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// 显示快捷键提示
const showShortcutTooltip = (hint: string, duration = 2000) => {
  currentShortcutHint.value = hint
  showShortcutHint.value = true
  
  setTimeout(() => {
    showShortcutHint.value = false
  }, duration)
}

// 监听键盘事件显示提示
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 's':
        event.preventDefault()
        showShortcutTooltip('Ctrl+S - 保存配置')
        exportDemo()
        break
      case 'z':
        if (!event.shiftKey) {
          showShortcutTooltip('Ctrl+Z - 撤销操作')
        }
        break
      case 'y':
        showShortcutTooltip('Ctrl+Y - 重做操作')
        break
      case 'c':
        showShortcutTooltip('Ctrl+C - 复制选中项')
        break
      case 'v':
        showShortcutTooltip('Ctrl+V - 粘贴')
        break
    }
  } else if (event.key === 'Delete') {
    showShortcutTooltip('Delete - 删除选中项')
  } else if (event.key === 'F1') {
    event.preventDefault()
    showHelp.value = !showHelp.value
    showShortcutTooltip('F1 - 切换帮助面板')
  }
}

// 模拟实时数据更新
const simulateRealTimeData = () => {
  if (panelRef.value) {
    const store = panelRef.value.panelStore
    if (store && store.cards) {
      const cards = store.cards
      
      cards.forEach(card => {
        if (card.type === 'text-card' && card.config.title?.value?.includes('CPU')) {
          const newValue = Math.floor(Math.random() * 30) + 60 + '%'
          card.config.content.value = newValue
        } else if (card.type === 'text-card' && card.config.title?.value?.includes('内存')) {
          const newValue = Math.floor(Math.random() * 20) + 50 + '%'
          card.config.content.value = newValue
        } else if (card.type === 'text-card' && card.config.title?.value?.includes('磁盘')) {
          const newValue = Math.floor(Math.random() * 15) + 40 + '%'  
          card.config.content.value = newValue
        }
      })
    }
  }
}

// 启动实时数据模拟
let realTimeTimer: number
const startRealTimeSimulation = () => {
  realTimeTimer = setInterval(simulateRealTimeData, 3000)
}

const stopRealTimeSimulation = () => {
  if (realTimeTimer) {
    clearInterval(realTimeTimer)
  }
}

// 性能监控
let performanceTimer: number
const startPerformanceMonitoring = () => {
  performanceTimer = setInterval(() => {
    // 更新FPS（简化版）
    fps.value = Math.floor(Math.random() * 10) + 55
    
    // 更新内存使用（如果可用）
    if ('memory' in performance) {
      memoryUsage.value = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
    } else {
      // 模拟内存使用
      memoryUsage.value = Math.floor(Math.random() * 20) + 50
    }
    
    // 更新卡片数量
    if (panelRef.value?.panelStore) {
      cardCount.value = panelRef.value.panelStore.cards?.length || 0
    }
    
    // 更新运行时间
    uptime.value = Math.floor((Date.now() - startTime) / 1000)
  }, 1000)
}

const stopPerformanceMonitoring = () => {
  if (performanceTimer) {
    clearInterval(performanceTimer)
  }
}

// 生命周期
onMounted(() => {
  console.log('ComprehensiveDemo mounted')
  
  // 初始化主题管理器
  try {
    themeManager.initialize()
    console.log('Theme manager initialized')
  } catch (error) {
    console.error('Failed to initialize theme manager:', error)
  }
  
  // 启动性能监控
  startPerformanceMonitoring()
  
  // 启动实时数据模拟
  startRealTimeSimulation()
  
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
  
  // 等待面板组件挂载后再检查
  setTimeout(() => {
    if (panelRef.value) {
      console.log('Panel component is ready:', panelRef.value)
      console.log('Panel store available:', !!panelRef.value.panelStore)
      if (panelRef.value.panelStore) {
        console.log('Store methods:', {
          clearCards: typeof panelRef.value.panelStore.clearCards,
          addCard: typeof panelRef.value.panelStore.addCard,
          cards: Array.isArray(panelRef.value.panelStore.cards) ? panelRef.value.panelStore.cards.length : 'not array'
        })
      }
    } else {
      console.warn('Panel component not found')
    }
  }, 100)
})

onUnmounted(() => {
  stopPerformanceMonitoring()
  stopRealTimeSimulation()
  
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown)
  
  themeManager.destroy()
  layoutManager.destroy()
})
</script>

<style scoped>
.comprehensive-demo {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.demo-controls {
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
  min-height: 60px;
}

@media (max-width: 768px) {
  .demo-controls {
    padding: 8px 12px;
    gap: 8px;
    justify-content: flex-start;
  }
}

.panel-container {
  flex: 1;
  position: relative;
  min-height: 0;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: fit-content;
}

@media (max-width: 768px) {
  .control-group {
    flex-basis: 100%;
    margin-bottom: 4px;
  }
  
  .control-group:last-child {
    margin-bottom: 0;
  }
}

.control-group label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.theme-select,
.layout-select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
}

.demo-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

/* 主题样式支持 */
.panel-container[data-theme="light"] {
  --panel-bg: #f0f2f5;
  --panel-card-bg: #ffffff;
  --panel-text: #333333;
  --panel-border: #e8e8e8;
}

.panel-container[data-theme="dark"] {
  --panel-bg: #1f1f1f;
  --panel-card-bg: #2d2d2d;
  --panel-text: #ffffff;
  --panel-border: #404040;
}

.panel-container[data-theme="dark"] .grid-stack-item-content {
  background-color: var(--panel-card-bg);
  color: var(--panel-text);
  border-color: var(--panel-border);
}

.panel-container[data-theme="blue"] {
  --panel-bg: #e6f7ff;
  --panel-card-bg: #ffffff;
  --panel-text: #1890ff;
  --panel-border: #40a9ff;
}

.panel-container[data-theme="blue"] .canvas-wrapper {
  background-color: var(--panel-bg);
}

/* 布局样式支持 */
.panel-container[data-layout="compact"] .canvas-wrapper {
  padding: 8px;
}

.panel-container[data-layout="wide"] .canvas-wrapper {
  padding: 24px;
}

.panel-container[data-layout="compact"] .grid-stack {
  margin: -4px;
}

.panel-container[data-layout="wide"] .grid-stack {
  margin: 12px;
}

.demo-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.demo-btn.danger:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

@media (max-width: 768px) {
  .demo-btn {
    padding: 4px 8px;
    font-size: 12px;
    gap: 4px;
  }
  
  .theme-select,
  .layout-select {
    min-width: 100px;
    font-size: 12px;
  }
}

/* 遮罩层 */
.help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1999;
  cursor: pointer;
}

/* 帮助面板 */
.help-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  transition: right 0.3s ease;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.help-panel.open {
  right: 0;
}

.help-header {
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.help-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-btn:hover {
  color: #333;
  background: #e6f7ff;
}

.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.help-section {
  margin-bottom: 32px;
}

.help-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shortcut-key {
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  border: 1px solid #e8e8e8;
}

.shortcut-desc {
  color: #666;
  font-size: 14px;
}

.guide-list {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.guide-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.sample-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sample-btn {
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.sample-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.sample-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  margin-left: 8px;
}

.sample-title {
  font-weight: 500;
  font-size: 14px;
}

.sample-desc {
  color: #999;
  font-size: 12px;
  margin-top: 2px;
  line-height: 1.3;
}

/* 模板预览 */
.template-preview {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preview-badge {
  background: #1890ff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.preview-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.stat-item i {
  color: #1890ff;
  width: 12px;
}

.template-preview h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.template-preview p {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.preview-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.preview-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;
}

.preview-card:hover {
  border-color: #1890ff;
  background: #f0f8ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.preview-card .card-size {
  margin-left: auto;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  color: #999;
}

.preview-card i {
  color: #1890ff;
}

.preview-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.confirm-btn,
.cancel-btn {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s;
}

.confirm-btn {
  color: #52c41a;
  border-color: #52c41a;
}

.confirm-btn:hover {
  background: #f6ffed;
}

.cancel-btn {
  color: #666;
}

.cancel-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

/* 帮助按钮 */
.help-toggle-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  transition: all 0.3s ease;
  z-index: 999;
}

.help-toggle-btn:hover {
  background: #40a9ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.5);
}

/* 快速操作菜单 */
.quick-menu {
  position: fixed;
  bottom: 100px;
  right: 30px;
  z-index: 998;
}

.quick-menu-toggle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #52c41a;
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
  transition: all 0.3s ease;
}

.quick-menu-toggle:hover {
  background: #73d13d;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(82, 196, 26, 0.5);
}

.quick-menu.open .quick-menu-toggle {
  transform: rotate(45deg);
}

.quick-menu-items {
  position: absolute;
  bottom: 60px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
  transition: all 0.3s ease;
}

.quick-menu.open .quick-menu-items {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.quick-item {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  color: #666;
  border: 1px solid #d9d9d9;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.quick-item:hover {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
  transform: scale(1.1);
}

.quick-item.danger:hover {
  background: #ff4d4f;
  border-color: #ff4d4f;
}

/* 快捷键提示 */
.shortcut-hint {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 2500;
  backdrop-filter: blur(4px);
  animation: shortcutFadeIn 0.3s ease-out;
}

.hint-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint-content i {
  font-size: 16px;
  color: #1890ff;
}

@keyframes shortcutFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* 性能监控 */
.performance-monitor {
  position: fixed;
  top: 80px;
  left: 20px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  border-radius: 8px;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
  z-index: 1500;
  min-width: 160px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.perf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  font-weight: 500;
}

.perf-header i {
  color: #1890ff;
  margin-right: 6px;
}

.perf-close {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.perf-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.perf-metrics {
  padding: 8px 12px;
}

.perf-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.perf-item:last-child {
  border-bottom: none;
}

.perf-label {
  color: #ccc;
  font-size: 11px;
  opacity: 0.8;
}

.perf-value {
  font-weight: 500;
  color: #fff;
  font-size: 12px;
}

.perf-value.warning {
  color: #faad14;
}

.perf-value.error {
  color: #ff4d4f;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 未知卡片样式 */
.unknown-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff2e8;
  border: 2px dashed #ffbb96;
  border-radius: 8px;
  color: #d4380d;
  text-align: center;
  padding: 20px;
}

.unknown-card i {
  font-size: 32px;
  margin-bottom: 12px;
}

.unknown-card p {
  margin: 8px 0;
  font-weight: 500;
}

.unknown-card small {
  opacity: 0.7;
  font-size: 12px;
}

/* 全局样式 */
:global(.form-control) {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

:global(.form-control:focus) {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

:global(.inspector-item) {
  margin-bottom: 16px;
}

:global(.inspector-item label) {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}
</style>