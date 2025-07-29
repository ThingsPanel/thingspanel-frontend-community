<script lang="ts" setup>
import { inject, reactive, ref } from 'vue'
import { NColorPicker, NInputNumber, NSelect } from 'naive-ui'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'
import CurveTheme from './theme'

const ctx = inject<IConfigCtx>('config-ctx')!

const originalColorGroups = reactive(CurveTheme)

const colorGroups = ref(JSON.parse(JSON.stringify(originalColorGroups))) // Deep copy to preserve original data

const themeOptions = [
  { label: $t('generate.color-theme1'), value: 'colorGroups' },
  { label: $t('generate.color-theme2'), value: 'colorGroups2' }
]

const themeUpdate = () => {
  const selectedTheme = ctx.config.selectedTheme
  ctx.config.colorGroups = {
    colorGroup: colorGroups.value[selectedTheme]
  }
}

const updateColor = (newColor, index, position) => {
  // This method updates the color and ensures reactivity
  const selectedTheme = ctx.config.selectedTheme
  colorGroups.value[selectedTheme][index][position] = newColor
  ctx.config.colorGroups = {
    colorGroup: colorGroups.value[selectedTheme]
  }
}

const gradientStyle = group => {
  return `background: linear-gradient(to right, ${group.top}, ${group.bottom});`
}

const resetTheme = () => {
  const selectedTheme = ctx.config.selectedTheme
  colorGroups.value = JSON.parse(JSON.stringify(originalColorGroups))
  ctx.config.colorGroups = {
    colorGroup: colorGroups.value[selectedTheme.value]
  }
}
</script>

<template>
  <div>
    <!-- Curve Width Configuration -->
    <n-flex align="center" class="mb-2">
      <div>{{ $t('generate.curveWidth') }}:</div>
      <NInputNumber v-model:value="ctx.config.curveWidth" :min="1" :max="10" :step="1" class="flex-1" />
    </n-flex>

    <n-flex align="center" class="mb-2">
      <div>{{ $t('generate.color-theme') }}</div>
      <NSelect
        v-model:value="ctx.config.selectedTheme"
        class="flex-1"
        :options="themeOptions"
        :placeholder="$t('generate.select-theme')"
        @update:value="themeUpdate"
      />
      <div @click="resetTheme">{{ $t('common.reset') }}</div>
    </n-flex>
    <div v-if="ctx.config.selectedTheme" class="color-groups">
      <n-grid x-gap="6" y-gap="6" :cols="1">
        <n-gi
          v-for="(group, index) in ctx.config.colorGroups?.colorGroup || colorGroups[ctx.config.selectedTheme]"
          :key="group.name"
        >
          <div class="color-group">
            <div>{{ index + 1 }}.</div>
            <!-- Top Color Picker Popover -->
            <NColorPicker
              v-model:value="group.line"
              class="w-28px"
              size="small"
              @update:value="value => updateColor(value, index, 'line')"
            >
              <template #label>
                <span />
              </template>
            </NColorPicker>
            <!-- Top Color Picker Popover -->
            <NColorPicker
              v-model:value="group.top"
              class="w-28px"
              size="small"
              @update:value="value => updateColor(value, index, 'top')"
            >
              <template #label>
                <span />
              </template>
            </NColorPicker>
            <div class="gradient-preview" :style="gradientStyle(group)"></div>
            <!-- Bottom Color Picker Popover -->
            <NColorPicker
              v-model:value="group.bottom"
              class="w-28px"
              size="small"
              @update:value="value => updateColor(value, index, 'bottom')"
            >
              <template #label>
                <span />
              </template>
            </NColorPicker>
          </div>
        </n-gi>
        <n-gi class="text-12px text-#999">{{ $t('generate.max-9') }}</n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
.color-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.color-picker {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  border: 1px solid #ccc;
  cursor: pointer;
}
</style>
