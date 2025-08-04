<template>
  <div class="digit-indicator-config">
    <n-form label-placement="left" label-width="auto" size="small">
      <n-form-item :label="$t('device_template.table_header.unit')">
        <n-input
          v-model:value="localConfig.unit"
          :placeholder="$t('device_template.table_header.pleaseEnterTheUnit')"
          @update:value="emitUpdate"
        />
      </n-form-item>

      <n-form-item :label="$t('generate.color')">
        <n-color-picker v-model:value="localConfig.color" :show-alpha="false" @update:value="emitUpdate" />
      </n-form-item>

      <n-form-item label="图标">
        <div class="icon-selector">
          <n-input v-model:value="localConfig.iconName" placeholder="选择图标" readonly>
            <template #suffix>
              <n-button text @click="showIconSelector = true">
                <n-icon><component :is="getIconComponent(localConfig.iconName)" /></n-icon>
              </n-button>
            </template>
          </n-input>
        </div>
      </n-form-item>
    </n-form>

    <!-- 图标选择器模态框 -->
    <n-modal v-model:show="showIconSelector" preset="card" title="选择图标" style="width: 600px">
      <IconSelector default-icon="Water" @icon-selected="handleIconSelect" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { NForm, NFormItem, NInput, NColorPicker, NButton, NIcon, NModal } from 'naive-ui'
import { $t } from '@/locales'
import IconSelector from '@/components/common/icon-selector.vue'
import { icons as iconOptions } from '@/components/common/icons'

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
  unit: '',
  color: 'blue',
  iconName: 'Water',
  ...props.config
})

const showIconSelector = ref(false)

// 监听 props.config 变化
watch(
  () => props.config,
  newConfig => {
    Object.assign(localConfig, newConfig)
  },
  { deep: true, immediate: true }
)

// 获取图标组件
const getIconComponent = (iconName: string) => {
  return iconOptions[iconName] || iconOptions.Water
}

// 处理图标选择
const handleIconSelect = (iconName: string) => {
  localConfig.iconName = iconName
  showIconSelector.value = false
  emitUpdate()
}

// 发出更新事件
const emitUpdate = () => {
  emit('update:config', { ...localConfig })
}

// 初始化默认值
if (!localConfig.iconName) {
  localConfig.iconName = 'Water'
  emitUpdate()
}
</script>

<style scoped>
.digit-indicator-config {
  padding: 8px 0;
}

.icon-selector {
  width: 100%;
}
</style>
