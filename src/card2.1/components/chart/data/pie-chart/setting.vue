<template>
  <n-space vertical :size="16">
    <n-card title="基础配置" size="small">
      <n-space vertical :size="12">
        <n-form-item label="图表标题">
          <n-input
            v-model:value="localConfig.title"
            placeholder="数据分布"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="显示图例">
          <n-switch
            v-model:value="localConfig.showLegend"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <n-card title="饼图配置" size="small">
      <n-space vertical :size="12">
        <n-form-item label="环形图模式">
          <n-switch
            v-model:value="localConfig.isDonut"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="外半径">
          <n-input
            v-model:value="localConfig.radius"
            placeholder="70%"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item v-if="localConfig.isDonut" label="内半径">
          <n-input
            v-model:value="localConfig.innerRadius"
            placeholder="40%"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <n-card title="标签配置" size="small">
      <n-space vertical :size="12">
        <n-form-item label="显示标签">
          <n-switch
            v-model:value="localConfig.showLabel"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item v-if="localConfig.showLabel" label="标签位置">
          <n-radio-group
            v-model:value="localConfig.labelPosition"
            @update:value="handleConfigChange"
          >
            <n-radio value="outside">外部</n-radio>
            <n-radio value="inside">内部</n-radio>
            <n-radio value="center">中心</n-radio>
          </n-radio-group>
        </n-form-item>
      </n-space>
    </n-card>

    <n-card title="动画配置" size="small">
      <n-form-item label="动画时长 (ms)">
        <n-input-number
          v-model:value="localConfig.animationDuration"
          :min="0"
          :max="5000"
          :step="100"
          @update:value="handleConfigChange"
        />
      </n-form-item>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NSpace, NCard, NFormItem, NInput, NInputNumber, NSwitch, NRadioGroup, NRadio } from 'naive-ui'
import type { PieChartCustomize } from './settingConfig'

const props = defineProps<{
  config: PieChartCustomize
}>()

const emit = defineEmits<{
  (e: 'update:config', config: PieChartCustomize): void
}>()

const localConfig = ref<PieChartCustomize>({ ...props.config })

const handleConfigChange = () => {
  emit('update:config', { ...localConfig.value })
}

watch(
  () => props.config,
  (newConfig) => {
    localConfig.value = { ...newConfig }
  },
  { deep: true }
)
</script>
