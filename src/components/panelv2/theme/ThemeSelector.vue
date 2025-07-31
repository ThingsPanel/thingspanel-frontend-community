<!--
  主题选择器组件
  支持切换多个预定义主题和自定义主题
-->
<template>
  <div class="theme-selector">
    <!-- 主题选择下拉框 -->
    <NSelect
      v-model:value="currentThemeName"
      :options="themeOptions"
      placeholder="选择主题"
      size="small"
      style="width: 120px"
      @update:value="handleThemeChange"
    >
      <template #option="{ node, option }">
        <div class="flex items-center gap-2">
          <!-- 主题颜色预览 -->
          <div 
            class="w-4 h-4 rounded-full border border-gray-300"
            :style="{ backgroundColor: option.primaryColor }"
          ></div>
          <span>{{ option.label }}</span>
        </div>
      </template>
    </NSelect>
    
    <!-- 主题预览面板 -->
    <div v-if="showPreview" class="theme-preview mt-4 p-4 border rounded-lg">
      <h4 class="text-sm font-medium mb-3">主题预览</h4>
      <div class="grid grid-cols-2 gap-3">
        <!-- 工具栏预览 -->
        <div class="preview-item">
          <div class="text-xs text-gray-600 mb-1">工具栏</div>
          <div 
            class="h-8 rounded border flex items-center px-2 text-xs"
            :style="{
              backgroundColor: currentTheme?.colors.toolbar,
              borderColor: currentTheme?.colors.border,
              color: currentTheme?.colors.onSurface
            }"
          >
            工具栏样式
          </div>
        </div>
        
        <!-- 面板预览 -->
        <div class="preview-item">
          <div class="text-xs text-gray-600 mb-1">面板</div>
          <div 
            class="h-8 rounded border flex items-center px-2 text-xs"
            :style="{
              backgroundColor: currentTheme?.colors.panel,
              borderColor: currentTheme?.colors.border,
              color: currentTheme?.colors.onSurface
            }"
          >
            面板样式
          </div>
        </div>
        
        <!-- 按钮预览 -->
        <div class="preview-item">
          <div class="text-xs text-gray-600 mb-1">主要按钮</div>
          <div 
            class="h-8 rounded flex items-center px-3 text-xs font-medium"
            :style="{
              backgroundColor: currentTheme?.colors.primary,
              color: currentTheme?.colors.onPrimary
            }"
          >
            按钮样式
          </div>
        </div>
        
        <!-- 次要按钮预览 -->
        <div class="preview-item">
          <div class="text-xs text-gray-600 mb-1">次要按钮</div>
          <div 
            class="h-8 rounded border flex items-center px-3 text-xs"
            :style="{
              backgroundColor: currentTheme?.colors.surface,
              borderColor: currentTheme?.colors.border,
              color: currentTheme?.colors.onSurface
            }"
          >
            按钮样式
          </div>
        </div>
      </div>
    </div>
    
    <!-- 自定义主题按钮 -->
    <div class="mt-3">
      <NButton 
        size="small" 
        type="tertiary" 
        @click="showCustomThemeDialog = true"
      >
        自定义主题
      </NButton>
    </div>
    
    <!-- 自定义主题对话框 -->
    <NModal v-model:show="showCustomThemeDialog" preset="dialog">
      <template #header>
        <div>创建自定义主题</div>
      </template>
      <div class="custom-theme-form">
        <div class="grid grid-cols-2 gap-4">
          <!-- 主题名称 -->
          <div class="col-span-2">
            <label class="block text-sm font-medium mb-1">主题名称</label>
            <NInput 
              v-model:value="customTheme.displayName" 
              placeholder="输入主题名称"
              size="small"
            />
          </div>
          
          <!-- 颜色配置 -->
          <div>
            <label class="block text-sm font-medium mb-1">主色调</label>
            <input 
              v-model="customTheme.colors.primary" 
              type="color" 
              class="w-full h-8 rounded border"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">次要色</label>
            <input 
              v-model="customTheme.colors.secondary" 
              type="color" 
              class="w-full h-8 rounded border"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">背景色</label>
            <input 
              v-model="customTheme.colors.background" 
              type="color" 
              class="w-full h-8 rounded border"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">表面色</label>
            <input 
              v-model="customTheme.colors.surface" 
              type="color" 
              class="w-full h-8 rounded border"
            />
          </div>
        </div>
      </div>
      
      <template #action>
        <div class="flex gap-2">
          <NButton size="small" @click="showCustomThemeDialog = false">
            取消
          </NButton>
          <NButton size="small" type="primary" @click="saveCustomTheme">
            保存主题
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NSelect, NButton, NModal, NInput } from 'naive-ui'
import { 
  themes, 
  getAvailableThemes, 
  getThemeByName, 
  applyTheme, 
  registerTheme,
  type CustomTheme 
} from './ThemeExtension'

interface Props {
  // 是否显示主题预览
  showPreview?: boolean
  // 默认主题
  defaultTheme?: string
}

interface Emits {
  // 主题变更事件
  (e: 'theme-change', themeName: string, theme: CustomTheme): void
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: false,
  defaultTheme: 'light'
})

const emit = defineEmits<Emits>()

// 当前选中的主题名称
const currentThemeName = ref(props.defaultTheme)

// 自定义主题对话框显示状态
const showCustomThemeDialog = ref(false)

// 自定义主题表单数据
const customTheme = ref<Partial<CustomTheme>>({
  displayName: '',
  colors: {
    primary: '#646cff',
    secondary: '#2080f0',
    accent: '#52c41a',
    background: '#f8fafc',
    surface: '#ffffff',
    toolbar: '#f8fafc',
    panel: '#f8fafc',
    onBackground: '#1f2937',
    onSurface: '#374151',
    onPrimary: '#ffffff',
    border: '#e5e7eb',
    divider: '#d1d5db',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#2080f0'
  },
  shadows: {
    toolbar: 'rgba(0, 0, 0, 0.1)',
    panel: 'rgba(0, 0, 0, 0.1)',
    modal: 'rgba(0, 0, 0, 0.15)'
  }
})

// 主题选项
const themeOptions = computed(() => {
  return getAvailableThemes().map(theme => ({
    label: theme.displayName,
    value: theme.name,
    primaryColor: theme.colors.primary
  }))
})

// 当前主题对象
const currentTheme = computed(() => {
  return getThemeByName(currentThemeName.value)
})

// 处理主题变更
const handleThemeChange = (themeName: string) => {
  const theme = getThemeByName(themeName)
  if (theme) {
    // 应用主题
    applyTheme(themeName)
    
    // 触发事件
    emit('theme-change', themeName, theme)
    
    // 保存到本地存储
    localStorage.setItem('selected-theme', themeName)
  }
}

// 保存自定义主题
const saveCustomTheme = () => {
  if (!customTheme.value.displayName) {
    alert('请输入主题名称')
    return
  }
  
  // 生成主题名称（基于显示名称）
  const themeName = `custom-${Date.now()}`
  
  // 创建完整的主题对象
  const newTheme: CustomTheme = {
    name: themeName,
    displayName: customTheme.value.displayName,
    colors: { ...customTheme.value.colors! },
    shadows: { ...customTheme.value.shadows! }
  }
  
  // 注册主题
  registerTheme(newTheme)
  
  // 应用新主题
  currentThemeName.value = themeName
  handleThemeChange(themeName)
  
  // 关闭对话框
  showCustomThemeDialog.value = false
  
  // 保存自定义主题到本地存储
  const customThemes = JSON.parse(localStorage.getItem('custom-themes') || '[]')
  customThemes.push(newTheme)
  localStorage.setItem('custom-themes', JSON.stringify(customThemes))
}

// 初始化时从本地存储加载自定义主题
const loadCustomThemes = () => {
  try {
    const customThemes = JSON.parse(localStorage.getItem('custom-themes') || '[]')
    customThemes.forEach((theme: CustomTheme) => {
      registerTheme(theme)
    })
  } catch (error) {
    console.warn('加载自定义主题失败:', error)
  }
}

// 初始化时从本地存储恢复选中的主题
const restoreSelectedTheme = () => {
  const savedTheme = localStorage.getItem('selected-theme')
  if (savedTheme && getThemeByName(savedTheme)) {
    currentThemeName.value = savedTheme
    applyTheme(savedTheme)
  }
}

// 组件挂载时初始化
loadCustomThemes()
restoreSelectedTheme()

// 监听主题变更，自动应用
watch(currentThemeName, (newTheme) => {
  if (newTheme) {
    handleThemeChange(newTheme)
  }
}, { immediate: true })
</script>

<style scoped>
.theme-selector {
  /* 组件样式 */
}

.theme-preview {
  background-color: var(--theme-surface, #ffffff);
  border-color: var(--theme-border, #e5e7eb);
}

.preview-item {
  /* 预览项样式 */
}

.custom-theme-form {
  /* 自定义主题表单样式 */
}
</style>