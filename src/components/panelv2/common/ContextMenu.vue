<template>
  <teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="context-menu"
      :style="menuStyle"
      @contextmenu.prevent
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        class="menu-item"
        :class="{
          'disabled': item.disabled,
          'divider': item.type === 'divider'
        }"
        @click="handleItemClick(item)"
      >
        <template v-if="item.type !== 'divider'">
          <i v-if="item.icon" :class="item.icon" class="menu-icon"></i>
          <span class="menu-label">{{ item.label }}</span>
          <span v-if="item.shortcut" class="menu-shortcut">{{ item.shortcut }}</span>
        </template>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';

export interface ContextMenuItem {
  label?: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  type?: 'item' | 'divider'
  action?: () => void
}

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'item-click': [item: ContextMenuItem]
}>()

const menuRef = ref<HTMLElement>()

const menuStyle = computed(() => {
  if (!props.visible) return {}
  
  return {
    left: `${props.x}px`,
    top: `${props.y}px`,
    zIndex: 9999
  }
})

const handleItemClick = (item: ContextMenuItem) => {
  if (item.disabled || item.type === 'divider') return
  
  emit('item-click', item)
  if (item.action) {
    item.action()
  }
  close()
}

const close = () => {
  emit('update:visible', false)
}

const handleClickOutside = (event: MouseEvent) => {
  if (props.visible && menuRef.value && !menuRef.value.contains(event.target as Node)) {
    close()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.visible) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
  
  // 调整菜单位置以防止超出视口
  nextTick(() => {
    if (menuRef.value && props.visible) {
      const rect = menuRef.value.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      let adjustedX = props.x
      let adjustedY = props.y
      
      // 检查右边界
      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }
      
      // 检查下边界
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10
      }
      
      // 检查左边界
      if (adjustedX < 0) {
        adjustedX = 10
      }
      
      // 检查上边界
      if (adjustedY < 0) {
        adjustedY = 10
      }
      
      if (adjustedX !== props.x || adjustedY !== props.y) {
        menuRef.value.style.left = `${adjustedX}px`
        menuRef.value.style.top = `${adjustedY}px`
      }
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 160px;
  user-select: none;
  z-index: 9999;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s;
  position: relative;
}

.menu-item:hover:not(.disabled):not(.divider) {
  background-color: #f5f5f5;
}

.menu-item.disabled {
  color: #ccc;
  cursor: not-allowed;
}

.menu-item.divider {
  height: 1px;
  background-color: #e8e8e8;
  margin: 4px 0;
  padding: 0;
  cursor: default;
}

.menu-icon {
  width: 16px;
  margin-right: 12px;
  text-align: center;
  opacity: 0.7;
}

.menu-label {
  flex: 1;
}

.menu-shortcut {
  font-size: 12px;
  color: #999;
  margin-left: 12px;
}
</style>