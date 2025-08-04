<template>
  <div class="bar-config">
    <n-flex align="center" class="mb-2">
      <div>{{ $t('generate.color-theme') }}</div>
      <n-select
        v-model:value="localConfig.selectedTheme"
        class="flex-1"
        :options="themeOptions"
        :placeholder="$t('generate.select-theme')"
        @update:value="handleThemeUpdate"
      />
      <n-button text @click="resetTheme">{{ $t('common.reset') }}</n-button>
    </n-flex>
    
    <div v-if="localConfig.selectedTheme" class="color-groups">
      <n-grid x-gap="6" y-gap="6" :cols="2">
        <n-gi
          v-for="(group, index) in colorGroups[localConfig.selectedTheme]"
          :key="group.name"
        >
          <div class="color-group">
            <div>{{ index + 1 }}.</div>
            <!-- Top Color Picker -->
            <n-color-picker
              v-model:value="group.top"
              class="w-28px"
              size="small"
              @update:value="value => updateColor(value, index, 'top')"
            />
            <div class="gradient-preview" :style="gradientStyle(group)"></div>
            <!-- Bottom Color Picker -->
            <n-color-picker
              v-model:value="group.bottom"
              class="w-28px"
              size="small"
              @update:value="value => updateColor(value, index, 'bottom')"
            />
          </div>
        </n-gi>
        <n-gi class="text-12px text-#999">{{ $t('generate.max-9') }}</n-gi>
      </n-grid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { NSelect, NFlex, NGrid, NGi, NColorPicker, NButton } from 'naive-ui'
import { $t } from '@/locales'
import { colorGroups as originalColorGroups } from './components/theme'

interface Props {
  config?: Record<string, any>
  widget?: any
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({})
})

const emit = defineEmits<{
  'update:config': [config: Record<string, any>]
}>()

// 本地配置状态
const localConfig = reactive({
  selectedTheme: 'colorGroups',
  colorGroups: {
    colorGroup: []
  },
  ...props.config
})

// 颜色组数据（深拷贝避免修改原始数据）
const colorGroups = ref(JSON.parse(JSON.stringify(originalColorGroups)))

// 主题选项
const themeOptions = [
  { label: $t('generate.color-theme1'), value: 'colorGroups' },
  { label: $t('generate.color-theme2'), value: 'colorGroups2' }
]

// 监听 props.config 变化
watch(() => props.config, (newConfig) => {
  Object.assign(localConfig, newConfig)
}, { deep: true, immediate: true })

// 处理主题更新
const handleThemeUpdate = () => {
  const selectedTheme = localConfig.selectedTheme
  localConfig.colorGroups = {
    colorGroup: colorGroups.value[selectedTheme]
  }
  emitUpdate()
}

// 更新颜色
const updateColor = (newColor: string, index: number, position: 'top' | 'bottom') => {
  const selectedTheme = localConfig.selectedTheme
  colorGroups.value[selectedTheme][index][position] = newColor
  localConfig.colorGroups = {
    colorGroup: colorGroups.value[selectedTheme]
  }
  emitUpdate()
}

// 渐变样式
const gradientStyle = (group: any) => {
  return `background: linear-gradient(to right, ${group.top}, ${group.bottom});`
}

// 重置主题
const resetTheme = () => {
  const selectedTheme = localConfig.selectedTheme
  colorGroups.value = JSON.parse(JSON.stringify(originalColorGroups))
  localConfig.colorGroups = {
    colorGroup: colorGroups.value[selectedTheme]
  }
  emitUpdate()
}

// 发出更新事件
const emitUpdate = () => {
  emit('update:config', { ...localConfig })
}

// 初始化
if (!localConfig.selectedTheme) {
  localConfig.selectedTheme = 'colorGroups'
  handleThemeUpdate()
}
</script>

<style scoped>
.bar-config {
  padding: 8px 0;
}

.color-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.color-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gradient-preview {
  height: 20px;
  flex: 1;
  border-radius: 4px;
}

.mb-2 {
  margin-bottom: 8px;
}

.flex-1 {
  flex: 1;
}

.w-28px {
  width: 28px;
}

.text-12px {
  font-size: 12px;
}

.text-#999 {
  color: #999;
}
</style>