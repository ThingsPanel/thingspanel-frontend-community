<template>
  <div class="simple-test-config-panel">
    <n-form ref="formRef" :model="config" label-placement="left" label-width="auto" size="small" class="config-form">
      <!-- 基础显示配置 -->
      <div class="config-section">
        <h4 class="section-title">基础显示</h4>

        <n-form-item label="显示标题">
          <n-switch v-model:value="config.showTitle" @update:value="handleConfigUpdate" />
        </n-form-item>

        <n-form-item v-if="config.showTitle" label="标题文本">
          <n-input
            v-model:value="config.title"
            placeholder="输入卡片标题"
            clearable
            @update:value="handleConfigUpdate"
          />
        </n-form-item>

        <n-form-item label="描述文本">
          <n-input
            v-model:value="config.description"
            type="textarea"
            :rows="2"
            placeholder="输入描述文本"
            @update:value="handleConfigUpdate"
          />
        </n-form-item>

        <n-form-item label="显示详细信息">
          <n-switch v-model:value="config.showDetails" @update:value="handleConfigUpdate" />
        </n-form-item>

        <n-form-item v-if="config.showDetails" label="自定义消息">
          <n-input
            v-model:value="config.customMessage"
            placeholder="输入自定义消息"
            clearable
            @update:value="handleConfigUpdate"
          />
        </n-form-item>
      </div>

      <!-- 功能配置 -->
      <div class="config-section">
        <h4 class="section-title">功能配置</h4>

        <n-form-item label="显示计数器">
          <n-switch v-model:value="config.showCounter" @update:value="handleConfigUpdate" />
        </n-form-item>

        <n-form-item label="显示操作按钮">
          <n-switch v-model:value="config.showActions" @update:value="handleConfigUpdate" />
        </n-form-item>

        <n-form-item label="显示颜色演示">
          <n-switch v-model:value="config.showColorDemo" @update:value="handleConfigUpdate" />
        </n-form-item>

        <n-form-item v-if="config.showColorDemo" label="演示颜色">
          <n-color-picker v-model:value="config.demoColor" show-alpha @update:value="handleConfigUpdate" />
        </n-form-item>
      </div>

      <!-- 样式配置 -->
      <div class="config-section">
        <h4 class="section-title">样式配置</h4>

        <n-form-item label="背景颜色">
          <n-color-picker v-model:value="config.backgroundColor" show-alpha @update:value="handleConfigUpdate" />
        </n-form-item>

        <n-form-item label="标题颜色">
          <n-color-picker v-model:value="config.titleColor" @update:value="handleConfigUpdate" />
        </n-form-item>

        <n-form-item label="文本颜色">
          <n-color-picker v-model:value="config.textColor" @update:value="handleConfigUpdate" />
        </n-form-item>

        <n-form-item label="边框样式">
          <n-select
            v-model:value="config.borderStyle"
            :options="borderStyleOptions"
            @update:value="handleConfigUpdate"
          />
        </n-form-item>

        <n-form-item label="圆角大小">
          <n-slider
            v-model:value="config.borderRadius"
            :min="0"
            :max="20"
            :step="1"
            @update:value="handleConfigUpdate"
          />
        </n-form-item>

        <n-form-item label="内边距">
          <n-slider v-model:value="config.padding" :min="8" :max="32" :step="2" @update:value="handleConfigUpdate" />
        </n-form-item>
      </div>

      <!-- 预设配置 -->
      <div class="config-section">
        <h4 class="section-title">快速预设</h4>

        <n-space>
          <n-button size="small" @click="applyPreset('default')">默认样式</n-button>
          <n-button size="small" @click="applyPreset('colorful')">彩色主题</n-button>
          <n-button size="small" @click="applyPreset('minimal')">极简风格</n-button>
          <n-button size="small" @click="applyPreset('dashboard')">仪表板风格</n-button>
        </n-space>
      </div>

      <!-- 预览区域 -->
      <div class="config-section">
        <h4 class="section-title">配置预览</h4>
        <div class="preview-container">
          <SimpleTestCard v-bind="config" />
        </div>
      </div>

      <!-- 配置导入导出 -->
      <div class="config-section">
        <h4 class="section-title">配置管理</h4>

        <n-space vertical>
          <n-space>
            <n-button size="small" @click="exportConfig">导出配置</n-button>
            <n-button size="small" @click="showImportDialog = true">导入配置</n-button>
            <n-button size="small" type="warning" @click="resetConfig">重置配置</n-button>
          </n-space>

          <n-input
            v-if="exportedConfig"
            v-model:value="exportedConfig"
            type="textarea"
            :rows="4"
            readonly
            class="config-json"
          />
        </n-space>
      </div>
    </n-form>

    <!-- 导入配置对话框 -->
    <n-modal v-model:show="showImportDialog" title="导入配置">
      <n-card style="width: 600px" title="导入配置" :bordered="false" size="huge">
        <n-space vertical>
          <n-input
            v-model:value="importConfigJson"
            type="textarea"
            :rows="8"
            placeholder="请粘贴配置 JSON"
            class="config-json"
          />
          <n-space>
            <n-button type="primary" @click="importConfig">导入</n-button>
            <n-button @click="showImportDialog = false">取消</n-button>
          </n-space>
        </n-space>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * Simple Test 组件配置面板
 * 演示新配置系统的完整功能
 */

import { ref, reactive, watch } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  NSelect,
  NColorPicker,
  NSlider,
  NButton,
  NSpace,
  NModal,
  NCard,
  useMessage
} from 'naive-ui'
import SimpleTestCard from './SimpleTestCard.vue'

interface Props {
  modelValue?: any
  widget?: any
}

interface Emits {
  (event: 'update:modelValue', value: any): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
})

const emit = defineEmits<Emits>()

// 消息提示
const message = useMessage()

// 表单引用
const formRef = ref()

// 导入导出状态
const showImportDialog = ref(false)
const exportedConfig = ref('')
const importConfigJson = ref('')

// 配置数据
const config = reactive({
  // 基础显示
  showTitle: true,
  title: '简单测试组件',
  description: '这是一个用于测试新配置系统的组件，支持多种可配置属性。',
  showDetails: true,
  customMessage: '',

  // 功能配置
  showCounter: false,
  showActions: true,
  showColorDemo: false,
  demoColor: '#e6f7ff',

  // 样式配置
  backgroundColor: '#ffffff',
  titleColor: '#1890ff',
  textColor: '#333333',
  borderStyle: '1px solid #d9d9d9',
  borderRadius: 8,
  padding: 16,

  // 合并外部配置
  ...props.modelValue
})

// 边框样式选项
const borderStyleOptions = [
  { label: '实线', value: '1px solid #d9d9d9' },
  { label: '虚线', value: '1px dashed #d9d9d9' },
  { label: '点线', value: '1px dotted #d9d9d9' },
  { label: '粗实线', value: '2px solid #d9d9d9' },
  { label: '无边框', value: 'none' }
]

// 预设配置
const presets = {
  default: {
    backgroundColor: '#ffffff',
    titleColor: '#1890ff',
    textColor: '#333333',
    borderStyle: '1px solid #d9d9d9',
    borderRadius: 8,
    padding: 16,
    showTitle: true,
    showDetails: true,
    showCounter: false,
    showColorDemo: false
  },
  colorful: {
    backgroundColor: '#f0f9ff',
    titleColor: '#0066cc',
    textColor: '#1a1a1a',
    borderStyle: '2px solid #40a9ff',
    borderRadius: 12,
    padding: 20,
    showTitle: true,
    showDetails: true,
    showCounter: true,
    showColorDemo: true,
    demoColor: '#87ceeb'
  },
  minimal: {
    backgroundColor: '#fafafa',
    titleColor: '#595959',
    textColor: '#8c8c8c',
    borderStyle: 'none',
    borderRadius: 0,
    padding: 12,
    showTitle: true,
    showDetails: false,
    showCounter: false,
    showColorDemo: false
  },
  dashboard: {
    backgroundColor: '#001529',
    titleColor: '#ffffff',
    textColor: '#e6e6e6',
    borderStyle: '1px solid #303030',
    borderRadius: 6,
    padding: 18,
    showTitle: true,
    showDetails: true,
    showCounter: true,
    showColorDemo: false
  }
}

// 监听外部配置变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(config)) {
      Object.assign(config, newValue)
    }
  },
  { deep: true }
)

// 处理配置更新
const handleConfigUpdate = () => {
  emit('update:modelValue', { ...config })
}

// 应用预设
const applyPreset = (presetName: keyof typeof presets) => {
  const preset = presets[presetName]
  if (preset) {
    Object.assign(config, preset)
    handleConfigUpdate()
    message.success(`已应用 ${presetName} 预设`)
  }
}

// 导出配置
const exportConfig = () => {
  exportedConfig.value = JSON.stringify(config, null, 2)
  message.success('配置已导出到文本框')
}

// 导入配置
const importConfig = () => {
  try {
    const importedConfig = JSON.parse(importConfigJson.value)
    Object.assign(config, importedConfig)
    handleConfigUpdate()
    showImportDialog.value = false
    importConfigJson.value = ''
    message.success('配置导入成功')
  } catch (error) {
    message.error('配置格式错误，请检查 JSON 格式')
  }
}

// 重置配置
const resetConfig = () => {
  Object.assign(config, presets.default)
  handleConfigUpdate()
  message.success('配置已重置为默认值')
}
</script>

<style scoped>
.simple-test-config-panel {
  padding: 0;
  max-height: 600px;
  overflow-y: auto;
}

.config-form {
  width: 100%;
}

.config-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.preview-container {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
}

.config-json {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

/* 自定义滚动条 */
.simple-test-config-panel::-webkit-scrollbar {
  width: 6px;
}

.simple-test-config-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.simple-test-config-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.simple-test-config-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
