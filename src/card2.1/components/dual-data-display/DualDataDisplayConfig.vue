<template>
  <div class="dual-data-display-config">
    <!-- 基础配置 -->
    <n-card title="基础配置" class="mb-4">
      <n-form :model="localConfig" label-placement="left" :label-width="120">
        <n-form-item label="组件标题">
          <n-input v-model:value="localConfig.title" placeholder="请输入组件标题" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="显示模式">
          <n-select
            v-model:value="localConfig.displayMode"
            :options="displayModeOptions"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="主题颜色">
          <n-color-picker v-model:value="localConfig.themeColor" @update:value="handleConfigChange" />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 数据源配置 -->
    <n-card title="数据源配置" class="mb-4">
      <n-space vertical>
        <n-divider>数据源1配置</n-divider>
        <n-form :model="localConfig.dataSource1Config" label-placement="left" :label-width="120">
          <n-form-item label="数据源1标题">
            <n-input
              v-model:value="localConfig.dataSource1Config.title"
              placeholder="如：温度传感器"
              @update:value="handleConfigChange"
            />
          </n-form-item>

          <n-form-item label="显示单位">
            <n-input
              v-model:value="localConfig.dataSource1Config.unit"
              placeholder="如：°C"
              @update:value="handleConfigChange"
            />
          </n-form-item>

          <n-form-item label="数值精度">
            <n-input-number
              v-model:value="localConfig.dataSource1Config.precision"
              :min="0"
              :max="5"
              @update:value="handleConfigChange"
            />
          </n-form-item>
        </n-form>

        <n-divider>数据源2配置</n-divider>
        <n-form :model="localConfig.dataSource2Config" label-placement="left" :label-width="120">
          <n-form-item label="数据源2标题">
            <n-input
              v-model:value="localConfig.dataSource2Config.title"
              placeholder="如：湿度传感器"
              @update:value="handleConfigChange"
            />
          </n-form-item>

          <n-form-item label="显示单位">
            <n-input
              v-model:value="localConfig.dataSource2Config.unit"
              placeholder="如：%"
              @update:value="handleConfigChange"
            />
          </n-form-item>

          <n-form-item label="数值精度">
            <n-input-number
              v-model:value="localConfig.dataSource2Config.precision"
              :min="0"
              :max="5"
              @update:value="handleConfigChange"
            />
          </n-form-item>
        </n-form>
      </n-space>
    </n-card>

    <!-- 交互配置 -->
    <n-card title="交互配置" class="mb-4">
      <!-- 标准交互配置系统 -->
      <div class="interaction-config-section">
        <div class="section-header">
          <n-text strong>标准交互设置</n-text>
          <n-text depth="3" style="font-size: 12px">使用统一的交互配置系统，支持点击、悬停、数据变化等事件</n-text>
        </div>

        <InteractionSettingsForm
          v-model="localInteractionConfigs"
          :component-id="props.widget?.id"
          :component-type="'dual-data-display'"
          :readonly="props.readonly"
          @change="handleInteractionConfigChange"
        />
      </div>

      <!-- 兼容性配置（旧版本支持） -->
      <n-collapse class="mt-4">
        <n-collapse-item title="兼容性交互设置（旧版）" name="legacy">
          <n-form :model="localConfig.interactions" label-placement="left" :label-width="120">
            <n-form-item label="启用点击事件">
              <n-switch v-model:value="localConfig.interactions.enableClick" @update:value="handleConfigChange" />
            </n-form-item>

            <n-form-item v-if="localConfig.interactions.enableClick" label="点击行为">
              <n-select
                v-model:value="localConfig.interactions.clickAction"
                :options="clickActionOptions"
                @update:value="handleConfigChange"
              />
            </n-form-item>

            <n-form-item label="数据刷新间隔">
              <n-input-number
                v-model:value="localConfig.interactions.refreshInterval"
                :min="1000"
                :max="300000"
                :step="1000"
                placeholder="毫秒"
                @update:value="handleConfigChange"
              />
              <template #suffix>毫秒</template>
            </n-form-item>

            <n-form-item label="启用数据缓存">
              <n-switch v-model:value="localConfig.interactions.enableCache" @update:value="handleConfigChange" />
            </n-form-item>
          </n-form>
        </n-collapse-item>
      </n-collapse>
    </n-card>

    <!-- 样式配置 -->
    <n-card title="样式配置">
      <n-form :model="localConfig.style" label-placement="left" :label-width="120">
        <n-form-item label="显示边框">
          <n-switch v-model:value="localConfig.style.showBorder" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="背景透明度">
          <n-slider
            v-model:value="localConfig.style.backgroundOpacity"
            :min="0"
            :max="1"
            :step="0.1"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="字体大小">
          <n-input-number
            v-model:value="localConfig.style.fontSize"
            :min="12"
            :max="48"
            @update:value="handleConfigChange"
          />
          <template #suffix>px</template>
        </n-form-item>

        <n-form-item label="内边距">
          <n-input-number
            v-model:value="localConfig.style.padding"
            :min="0"
            :max="50"
            @update:value="handleConfigChange"
          />
          <template #suffix>px</template>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 双数据源显示组件配置面板
 * 用于在可视化编辑器的属性面板中配置组件属性
 */

import { ref, reactive, watch } from 'vue'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NColorPicker,
  NSlider,
  NSpace,
  NDivider,
  NCollapse,
  NCollapseItem,
  NText
} from 'naive-ui'

// 导入标准交互配置系统
import { InteractionSettingsForm } from '@/core/interaction-system'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

// 配置接口定义
interface DualDataDisplayConfig {
  // 基础配置
  title: string
  displayMode: string
  themeColor: string

  // 数据源配置
  dataSource1Config: {
    title: string
    unit: string
    precision: number
  }
  dataSource2Config: {
    title: string
    unit: string
    precision: number
  }

  // 交互配置
  interactions: {
    enableClick: boolean
    clickAction: string
    refreshInterval: number
    enableCache: boolean
  }

  // 样式配置
  style: {
    showBorder: boolean
    backgroundOpacity: number
    fontSize: number
    padding: number
  }
}

// Props定义 - 遵循配置系统标准接口
interface Props {
  modelValue: DualDataDisplayConfig
  widget?: any
  readonly?: boolean
}

// Emits定义 - 遵循配置系统标准接口
interface Emits {
  (e: 'update:modelValue', config: DualDataDisplayConfig): void
  (e: 'change', value: DualDataDisplayConfig, oldValue: DualDataDisplayConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    title: '双数据源显示',
    displayMode: 'card',
    themeColor: '#18a058',
    dataSource1Config: {
      title: '数据源1',
      unit: '',
      precision: 2
    },
    dataSource2Config: {
      title: '数据源2',
      unit: '',
      precision: 2
    },
    interactions: {
      enableClick: false,
      clickAction: 'none',
      refreshInterval: 30000,
      enableCache: true
    },
    style: {
      showBorder: true,
      backgroundOpacity: 0.9,
      fontSize: 14,
      padding: 16
    }
  }),
  readonly: false
})

const emit = defineEmits<Emits>()

// 显示模式选项
const displayModeOptions = [
  { label: '卡片模式', value: 'card' },
  { label: '列表模式', value: 'list' },
  { label: '仪表板模式', value: 'dashboard' },
  { label: '紧凑模式', value: 'compact' }
]

// 点击行为选项
const clickActionOptions = [
  { label: '无操作', value: 'none' },
  { label: '刷新数据', value: 'refresh' },
  { label: '显示详情', value: 'details' },
  { label: '切换显示', value: 'toggle' }
]

// 本地配置状态
const localConfig = reactive<DualDataDisplayConfig>(props.modelValue)

// 标准交互配置状态
const localInteractionConfigs = ref<InteractionConfig[]>([])

// 监听props配置变化
watch(
  () => props.modelValue,
  newConfig => {
    if (newConfig) {
      // 深度合并配置
      Object.assign(localConfig, {
        title: newConfig.title || '双数据源显示',
        displayMode: newConfig.displayMode || 'card',
        themeColor: newConfig.themeColor || '#18a058',

        dataSource1Config: {
          title: '数据源1',
          unit: '',
          precision: 2,
          ...newConfig.dataSource1Config
        },
        dataSource2Config: {
          title: '数据源2',
          unit: '',
          precision: 2,
          ...newConfig.dataSource2Config
        },

        interactions: {
          enableClick: false,
          clickAction: 'none',
          refreshInterval: 30000,
          enableCache: true,
          ...newConfig.interactions
        },

        style: {
          showBorder: true,
          backgroundOpacity: 0.9,
          fontSize: 14,
          padding: 16,
          ...newConfig.style
        }
      })
    }
  },
  { deep: true, immediate: true }
)

// 配置变更处理
const handleConfigChange = () => {
  const oldValue = { ...props.modelValue }
  const newValue = { ...localConfig }

  // 发送更新事件
  emit('update:modelValue', newValue)
  emit('change', newValue, oldValue)
}

// 标准交互配置变更处理
const handleInteractionConfigChange = (configs: InteractionConfig[]) => {
  console.log('🔍 [DualDataDisplayConfig] 交互配置变更:', {
    configCount: configs.length,
    configs: configs.map(c => ({
      event: c.event,
      responsesCount: c.responses?.length || 0,
      enabled: c.enabled
    }))
  })

  localInteractionConfigs.value = configs

  // 同步到主配置（保持向后兼容）
  handleConfigChange()
}
</script>

<style scoped>
.dual-data-display-config {
  max-height: 600px;
  overflow-y: auto;
}

.interaction-config-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  padding: 12px 16px;
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:deep(.n-card) {
  margin-bottom: 12px;
}

:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-divider) {
  margin: 12px 0;
}

:deep(.n-collapse) {
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

:deep(.n-collapse-item) {
  border: none;
}

/* 交互配置组件样式调整 */
:deep(.interaction-settings-form) {
  border: none;
  box-shadow: none;
}
</style>
