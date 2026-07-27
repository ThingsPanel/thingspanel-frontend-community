<script setup>
import { defineEmits, defineProps, onMounted, ref } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { CaretDownOutline, CaretUpOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'
import { icons } from './icons'

const emit = defineEmits(['iconSelected'])
const props = defineProps({
  // optional default icon name
  defaultIcon: {
    type: String,
    default: null
  }
})

const selectedIcon = ref(null)
const selectedIconName = ref(null)
const isExpanded = ref(false)

const iconOptions = Object.keys(icons).map(key => ({
  name: key,
  component: icons[key]
}))

const selectIcon = option => {
  selectedIcon.value = option.component
  selectedIconName.value = option.name
  emit('iconSelected', option.name)
  // 选择后自动收起面板
  isExpanded.value = false
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// Set the default icon if provided
onMounted(() => {
  if (props.defaultIcon && icons[props.defaultIcon]) {
    const defaultOption = iconOptions.find(option => option.name === props.defaultIcon)
    if (defaultOption) {
      selectedIcon.value = defaultOption.component
      selectedIconName.value = defaultOption.name
      // 不需要emit，因为这是初始化设置
    }
  }
})
</script>

<template>
  <div>
    <div class="icon-display">
      <span>{{ $t('card.selectedIcon') }}：</span>
      <NIcon v-if="selectedIcon" size="30" :component="selectedIcon" />
      <span v-else>{{ $t('card.notSelected') }}</span>
      <NButton class="icon-picker-btn" @click="toggleExpand">
        {{ isExpanded ? $t('card.collapse') : $t('card.expand') }}
        <template #icon>
          <NIcon>
            <component :is="isExpanded ? CaretUpOutline : CaretDownOutline" />
          </NIcon>
        </template>
      </NButton>
    </div>
    <div v-if="isExpanded" class="icon-picker-dialog">
      <div class="icon-grid">
        <div
          v-for="(option, index) in iconOptions"
          :key="index"
          class="icon-cell"
          :class="{ selected: selectedIconName === option.name }"
          :title="option.name"
          @click="selectIcon(option)"
        >
          <NIcon size="24" :component="option.component" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-display {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.icon-display span {
  font-size: 14px;
  color: var(--text-color);
  white-space: nowrap;
}

.icon-picker-dialog {
  margin-top: 8px;
  padding: 12px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.icon-picker-btn {
  margin-left: auto;
  flex-shrink: 0;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 8px;
  justify-content: center;
}

.icon-cell {
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-color);
  transition: all 0.2s ease;
  position: relative;
}

.icon-cell:hover {
  background: var(--primary-color-hover);
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon-cell:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* 选中状态样式 */
.icon-cell.selected {
  background: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.icon-cell.selected :deep(.n-icon) {
  color: white;
}

/* 图标颜色适配 */
.icon-cell :deep(.n-icon) {
  color: var(--text-color);
  transition: color 0.2s ease;
}

.icon-cell:hover :deep(.n-icon) {
  color: var(--primary-color);
}

/* 当前选中的图标样式 */
.icon-display :deep(.n-icon) {
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  padding: 2px;
}

/* 滚动条美化 */
.icon-picker-dialog::-webkit-scrollbar {
  width: 6px;
}

.icon-picker-dialog::-webkit-scrollbar-track {
  background: var(--fill-color-1);
  border-radius: 3px;
}

.icon-picker-dialog::-webkit-scrollbar-thumb {
  background: var(--fill-color-3);
  border-radius: 3px;
  transition: background-color 0.2s;
}

.icon-picker-dialog::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .icon-grid {
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 6px;
  }

  .icon-cell {
    width: 40px;
    height: 40px;
  }

  .icon-picker-dialog {
    max-height: 200px;
    padding: 8px;
  }

  .icon-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .icon-picker-btn {
    margin-left: 0;
    width: 100%;
  }
}

/* 暗主题适配 */
[data-theme='dark'] .icon-cell {
  background: var(--input-color);
  border-color: var(--border-color);
}

[data-theme='dark'] .icon-cell:hover {
  background: var(--primary-color-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

[data-theme='dark'] .icon-picker-dialog {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
