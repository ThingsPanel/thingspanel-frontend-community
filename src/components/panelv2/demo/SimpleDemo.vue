<template>
  <div class="simple-demo">
    <!-- 简单的控制栏 -->
    <div class="demo-controls">
      <div class="control-group">
        <button class="demo-btn" @click="addSampleData">
          <i class="fa fa-plus"></i>
          添加示例数据
        </button>
        <button class="demo-btn danger" @click="clearAll">
          <i class="fa fa-trash"></i>
          清空画布
        </button>
        <button class="demo-btn" @click="showDebugInfo">
          <i class="fa fa-bug"></i>
          调试信息
        </button>
      </div>
      <div class="demo-info">
        <span>PanelV2 整合架构演示</span>
        <small>两层架构 + 成熟组件</small>
      </div>
    </div>

    <!-- 主面板区域 -->
    <div class="panel-container">
      <PanelV2
        ref="panelRef"
        :enablePluginSystem="false"
      >
        <template #card="{ cardData }">
          <component 
            :is="getCardComponent(cardData.type)" 
            v-if="getCardComponent(cardData.type)"
            :config="cardData.config"
            @update:config="updateCardConfig(cardData.id, $event)"
          />
          <div v-else class="unknown-card">
            <i class="fa fa-question-circle"></i>
            <p>未知卡片类型: {{ cardData.type }}</p>
            <small>{{ cardData.id }}</small>
          </div>
        </template>
      </PanelV2>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import PanelV2 from '../PanelV2.vue'
import TextCard from '../cards/TextCard.vue'

// 引用
const panelRef = ref<InstanceType<typeof PanelV2>>()

// 组件映射
const getCardComponent = (type: string) => {
  const componentMap: Record<string, any> = {
    'text-card': TextCard,
    'image-card': TextCard, // 暂时用TextCard代替
  }
  return componentMap[type]
}

// 更新卡片配置
const updateCardConfig = (cardId: string, newConfig: any) => {
  const panelStore = panelRef.value?.panelStore
  if (panelStore) {
    // 使用panelStore的更新方法
    panelStore.updateNodeConfig(cardId, 'content', 'title', newConfig.title?.value)
    panelStore.updateNodeConfig(cardId, 'content', 'content', newConfig.content?.value)
  }
}

// 添加示例数据
const addSampleData = () => {
  const panelStore = panelRef.value?.panelStore
  if (panelStore) {
    // 添加几个示例卡片
    const sampleCards = [
      {
        type: 'text-card',
        defaultData: {
          type: 'text-card',
          config: {
            base: {},
            interaction: {},
            content: {
              title: '欢迎使用 PanelV2',
              content: '这是一个整合了两层架构的演示'
            }
          },
          layout: { w: 6, h: 3 }
        }
      },
      {
        type: 'text-card',
        defaultData: {
          type: 'text-card',
          config: {
            base: {},
            interaction: {},
            content: {
              title: '架构特点',
              content: '✓ 成熟组件保留\n✓ 两层架构整合\n✓ 事件系统统一'
            }
          },
          layout: { w: 6, h: 4 }
        }
      }
    ]

    sampleCards.forEach((card, index) => {
      panelStore.addCard(card, { x: index * 6, y: 0 })
    })
  }
}

// 清空画布
const clearAll = () => {
  const panelStore = panelRef.value?.panelStore
  if (panelStore && confirm('确定要清空画布吗？')) {
    panelStore.clearCards()
  }
}

// 显示调试信息
const showDebugInfo = () => {
  const debugInfo = panelRef.value?.getDebugInfo?.()
  if (debugInfo) {
    console.log('PanelV2 调试信息:', debugInfo)
    alert(`调试信息已输出到控制台：
- 工具数量: ${debugInfo.tools}
- 组件数量: ${debugInfo.components}
- 插件数量: ${debugInfo.plugins.length}`)
  } else {
    alert('调试信息获取失败，请检查控制台')
  }
}
</script>

<style scoped>
.simple-demo {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.demo-controls {
  padding: 12px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-shrink: 0;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.demo-btn {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.demo-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.demo-btn.danger:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.panel-container {
  flex: 1;
  min-height: 0;
}

.unknown-card {
  padding: 20px;
  text-align: center;
  color: #999;
  border: 2px dashed #ddd;
  border-radius: 4px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.unknown-card i {
  font-size: 24px;
}

/* Inspector样式 */
:deep(.inspector-item) {
  margin-bottom: 16px;
}

:deep(.inspector-item label) {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

:deep(.form-control) {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

:deep(.form-control:focus) {
  border-color: #40a9ff;
  outline: none;
}
</style>