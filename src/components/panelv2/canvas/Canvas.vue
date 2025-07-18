<template>
  <div 
    class="canvas-wrapper" 
    :style="{ backgroundColor: canvasBackgroundColor }"
    @dragover.prevent 
    @drop="onDrop" 
    @click="onCanvasClick"
  >
    <div ref="gridstackContainer" class="grid-stack"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, nextTick, useSlots, h, render, computed } from 'vue';
import 'gridstack/dist/gridstack.min.css';
import { GridStack } from 'gridstack';
import type { GridStackElement, GridStackNode } from 'gridstack';
import { usePanelStore } from '../state/panelStore';
import type { PanelCard, DraggableItem } from '../types';

const panelStore = usePanelStore();
const gridstackContainer = ref<GridStackElement>();
let grid: GridStack | null = null;

const slots = useSlots();

// --- 计算属性：画布背景颜色 ---
const canvasBackgroundColor = computed(() => {
  const bgConfig = panelStore.config.backgroundColor;
  return bgConfig?.value || '#f5f5f5';
});

// --- 计算属性：网格列数 ---
const gridColumns = computed(() => {
  const gridConfig = panelStore.config.gridSize;
  return gridConfig?.value || 12;
});

// --- Gridstack 初始化 ---
onMounted(() => {
  grid = GridStack.init({
    float: true,
    cellHeight: '70px',
    minRow: 1,
    column: gridColumns.value,
  });

  loadCards(panelStore.cards);

  // 监听 Gridstack 上的布局变化
  grid.on('change', (event, items) => {
    items.forEach(item => {
      const id = item.el?.getAttribute('data-card-id');
      if (id) {
        panelStore.updateCardLayout(id, { x: item.x!, y: item.y!, w: item.w!, h: item.h! });
      }
    });
  });
});

// --- 监听 Pinia 中卡片数据的变化 ---
watch(() => panelStore.cards, (newCards, oldCards) => {
  // 这是一个简化的同步逻辑，实际应用中可能需要更复杂的 diffing
  if (grid) {
    grid.removeAll();
    loadCards(newCards);
  }
}, { deep: true });

// --- 监听网格列数变化 ---
watch(() => gridColumns.value, (newColumns) => {
  if (grid) {
    grid.column(newColumns);
  }
});

// --- 核心渲染逻辑 ---
const loadCards = (cards: PanelCard[]) => {
  if (!grid) return;

  cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.setAttribute('data-card-id', card.id);
    
    // 添加点击事件处理卡片选择
    cardEl.addEventListener('click', (e) => {
      e.stopPropagation();
      panelStore.selectItem(card.id);
    });

    // 使用插槽进行渲染
    if (slots.card) {
      const vnode = h('div', { class: 'card-content-wrapper' }, slots.card({ cardData: card }));
      const app = document.createElement('div');
      render(vnode, app);
      cardEl.appendChild(app);
    }

    grid.makeWidget(cardEl, {
      x: card.layout.x,
      y: card.layout.y,
      w: card.layout.w,
      h: card.layout.h,
      id: card.id,
    });
  });
};

// --- 拖放处理 ---
const onDrop = (event: DragEvent) => {
  event.preventDefault();
  if (!event.dataTransfer || !grid) return;

  const itemJson = event.dataTransfer.getData('application/json');
  if (!itemJson) return;

  const item: DraggableItem = JSON.parse(itemJson);

  // 计算放置位置
  const rect = gridstackContainer.value!.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const cellWidth = rect.width / gridColumns.value; // 使用动态列数
  const cellHeight = 70; // 与 Gridstack 配置匹配
  const gridX = Math.floor(x / cellWidth);
  const gridY = Math.floor(y / cellHeight);

  panelStore.addCard(item, { x: gridX, y: gridY });
};

// --- 画布点击处理（取消选择） ---
const onCanvasClick = (event: MouseEvent) => {
  // 只有点击空白区域时才取消选择
  if (event.target === event.currentTarget || (event.target as Element).classList.contains('grid-stack')) {
    panelStore.selectItem(null); // 选择看板本身
  }
};

</script>

<style>
.grid-stack-item-content {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden; /* 确保内容不会溢出 */
  display: flex;
  flex-direction: column;
}

.card-content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-content-wrapper > * {
  flex: 1;
  min-height: 0;
}

.canvas-wrapper {
  flex: 1;
  overflow: auto;
  padding: 16px;
  position: relative;
  background-color: #f5f5f5;
  min-height: 0; /* 关键：允许flex子项收缩 */
}
</style>