<template>
  <div 
    class="canvas-wrapper" 
    :style="{ backgroundColor: canvasBackgroundColor }"
    @dragover.prevent 
    @drop="onDrop" 
    @click="onCanvasClick"
    @contextmenu="onCanvasContextMenu"
  >
    <div ref="gridstackContainer" class="grid-stack"></div>
    
    <!-- 上下文菜单 -->
    <ContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
      @update:visible="updateContextMenuVisibility"
      @item-click="handleContextMenuClick"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, useSlots, h, render, computed } from 'vue';
import 'gridstack/dist/gridstack.min.css';
import { GridStack } from 'gridstack';
import type { GridStackElement } from 'gridstack';
import { usePanelStore } from '../state/panelStore';
import type { PanelCard, DraggableItem } from '../types';
import ContextMenu from '../common/ContextMenu.vue';
import { useContextMenu } from '../composables/useContextMenu';

const panelStore = usePanelStore();
const gridstackContainer = ref<GridStackElement>();
let grid: GridStack | null = null;

const slots = useSlots();
const { contextMenu, showContextMenu, updateContextMenuVisibility } = useContextMenu();

// --- 计算属性：画布背景颜色 ---
const canvasBackgroundColor = computed(() => {
  return panelStore.config.appearance?.backgroundColor || '#f5f5f5';
});

// --- 计算属性：网格列数 ---
const gridColumns = computed(() => {
  return panelStore.config.layout?.gridColumns || 12;
});

// --- Gridstack 初始化 ---
onMounted(() => {
  grid = GridStack.init({
    column: gridColumns.value,
    cellHeight: panelStore.config.layout?.cellHeight || 70,
    minRow: 1,
    maxRow: 0, // 0表示无限制，允许内容超出视口
    float: true,
    animate: true,
    resizable: {
      handles: 'e, se, s, sw, w'
    },
    draggable: {
      handle: '.grid-stack-item-content',
      scroll: true, // 允许拖拽时滚动
      appendTo: 'parent'
    },
    margin: panelStore.config.layout?.margin || 5,
    removable: false
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
watch(() => panelStore.cards, (newCards) => {
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

// --- 监听单元格高度变化 ---
watch(() => panelStore.config.layout?.cellHeight, (newCellHeight) => {
  if (grid && newCellHeight) {
    grid.cellHeight(newCellHeight);
  }
});

// --- 监听间距变化 ---
watch(() => panelStore.config.layout?.margin, (newMargin) => {
  if (grid && typeof newMargin === 'number') {
    grid.margin(newMargin);
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

    // 添加右键菜单
    cardEl.addEventListener('contextmenu', (e) => {
      onCardContextMenu(e as MouseEvent, card);
    });

    // 创建GridStack要求的内容结构
    const contentEl = document.createElement('div');
    contentEl.className = 'grid-stack-item-content';
    
    // 使用插槽进行渲染
    if (slots.card) {
      const vnode = h('div', { class: 'card-content-wrapper' }, slots.card({ cardData: card }));
      const app = document.createElement('div');
      render(vnode, app);
      contentEl.appendChild(app);
    }
    
    cardEl.appendChild(contentEl);

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
  const cellHeight = panelStore.config.layout?.cellHeight || 70; // 使用动态单元格高度
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

// --- 画布右键菜单 ---
const onCanvasContextMenu = (event: MouseEvent) => {
  // 只有点击空白区域时才显示画布菜单
  if (event.target === event.currentTarget || (event.target as Element).classList.contains('grid-stack')) {
    const menuItems = [
      {
        label: '粘贴',
        icon: 'fa fa-paste',
        shortcut: 'Ctrl+V',
        disabled: !hasClipboardContent(),
        action: () => pasteFromClipboard()
      },
      { type: 'divider' as const },
      {
        label: '清空画布',
        icon: 'fa fa-trash',
        action: () => clearCanvas()
      },
      {
        label: '网格设置',
        icon: 'fa fa-th',
        action: () => showGridSettings()
      }
    ];
    
    showContextMenu(event, menuItems);
  }
};

// --- 卡片右键菜单 ---
const onCardContextMenu = (event: MouseEvent, card: PanelCard) => {
  event.stopPropagation();
  
  const menuItems = [
    {
      label: '复制',
      icon: 'fa fa-copy',
      shortcut: 'Ctrl+C',
      action: () => copyCard(card)
    },
    {
      label: '剪切',
      icon: 'fa fa-cut',
      shortcut: 'Ctrl+X',
      action: () => cutCard(card)
    },
    {
      label: '复制样式',
      icon: 'fa fa-paint-brush',
      action: () => copyCardStyle(card)
    },
    { type: 'divider' as const },
    {
      label: '置顶',
      icon: 'fa fa-arrow-up',
      action: () => bringToFront(card)
    },
    {
      label: '置底',
      icon: 'fa fa-arrow-down',
      action: () => sendToBack(card)
    },
    { type: 'divider' as const },
    {
      label: '删除',
      icon: 'fa fa-trash',
      shortcut: 'Delete',
      action: () => deleteCard(card)
    }
  ];
  
  showContextMenu(event, menuItems);
};

// --- 上下文菜单处理函数 ---
const handleContextMenuClick = () => {
  // 已在 action 中处理
};

// --- 剪贴板和操作功能 ---
let clipboardContent: PanelCard | null = null;

const hasClipboardContent = () => !!clipboardContent;

const copyCard = (card: PanelCard) => {
  clipboardContent = JSON.parse(JSON.stringify(card));
  console.log('卡片已复制到剪贴板');
};

const cutCard = (card: PanelCard) => {
  copyCard(card);
  deleteCard(card);
};

const pasteFromClipboard = () => {
  if (clipboardContent) {
    // 在鼠标位置附近粘贴
    const newCard = {
      ...clipboardContent,
      id: Date.now().toString(), // 生成新ID
      layout: {
        ...clipboardContent.layout,
        x: clipboardContent.layout.x + 1,
        y: clipboardContent.layout.y + 1
      }
    };
    panelStore.cards.push(newCard);
  }
};

const copyCardStyle = (card: PanelCard) => {
  // 实现样式复制逻辑
  console.log('复制卡片样式:', card.config);
};

const deleteCard = (card: PanelCard) => {
  panelStore.deleteCard(card.id);
};

const bringToFront = (card: PanelCard) => {
  // 实现置顶逻辑
  console.log('置顶卡片:', card.id);
};

const sendToBack = (card: PanelCard) => {
  // 实现置底逻辑
  console.log('置底卡片:', card.id);
};

const clearCanvas = () => {
  if (confirm('确定要清空整个画布吗？此操作不可撤销。')) {
    panelStore.cards.length = 0;
  }
};

const showGridSettings = () => {
  // 实现网格设置逻辑
  console.log('显示网格设置');
};

</script>

<style>
.grid-stack-item-content {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;
}

.card-content-wrapper {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
}

.card-content-wrapper > * {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

/* 确保GridStack网格项有正确的尺寸 */
.grid-stack-item {
  position: absolute !important;
}

.grid-stack-item.grid-stack-item-content {
  position: relative !important;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  background-color: #f5f5f5;
  overflow: auto; /* 允许滚动 */
  padding: 16px;
  box-sizing: border-box;
}

.grid-stack {
  width: 100%;
  min-height: 100%; /* 最小高度为容器高度，内容可以更高 */
}
</style>