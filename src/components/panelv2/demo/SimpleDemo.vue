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
        <button class="demo-btn" @click="exportConfig">
          <i class="fa fa-download"></i>
          导出配置
        </button>
        <button class="demo-btn" @click="importConfig">
          <i class="fa fa-upload"></i>
          导入配置
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none;"
          @change="handleFileImport"
        />
      </div>
    </div>

    <!-- 主面板区域 -->
    <div class="panel-container">
      <PanelV2
        ref="panelRef"
        :draggableItems="simpleDraggableItems"
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
import type { DraggableItem } from '../types'

// 引用
const panelRef = ref<InstanceType<typeof PanelV2>>()
const fileInput = ref<HTMLInputElement>()

// 使用新的分层配置架构
const createNodeContentConfig = (type: string) => {
  const contentConfigs = {
    'text-card': {
      title: {
        value: '文本标题',
        type: 'text',
        label: '标题',
        required: true
      },
      content: {
        value: '这是一个文本卡片的内容示例',
        type: 'textarea',
        label: '内容',
        rows: 3
      },
      backgroundColor: {
        value: '#ffffff',
        type: 'color',
        label: '背景色'
      },
      textColor: {
        value: '#333333',
        type: 'color',
        label: '文字颜色'
      },
      fontSize: {
        value: 14,
        type: 'number',
        label: '字体大小',
        min: 12,
        max: 24
      }
    },
    'info-card': {
      title: {
        value: '信息标题',
        type: 'text',
        label: '标题'
      },
      value: {
        value: '100',
        type: 'text',
        label: '数值'
      },
      unit: {
        value: '个',
        type: 'text',
        label: '单位'
      },
      color: {
        value: '#1890ff',
        type: 'color',
        label: '主题色'
      }
    }
  }
  return contentConfigs[type] || {}
}

// 简化的可拖拽项（使用新的分层配置）
const simpleDraggableItems: DraggableItem[] = [
  {
    type: 'text-card',
    label: '文本卡片',
    icon: 'fa fa-font',
    defaultData: {
      type: 'text-card',
      config: {
        base: {}, // 将由store填充默认值
        interaction: {}, // 将由store填充默认值
        content: createNodeContentConfig('text-card')
      },
      layout: { x: 0, y: 0, w: 4, h: 2 }
    }
  },
  {
    type: 'info-card',
    label: '信息卡片',
    icon: 'fa fa-info-circle',
    defaultData: {
      type: 'info-card',
      config: {
        base: {},
        interaction: {},
        content: createNodeContentConfig('info-card')
      },
      layout: { x: 0, y: 0, w: 3, h: 2 }
    }
  }
]

// 简化的配置器注册表
const simpleInspectorRegistry = {
  'text-input': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <input 
          :value="modelValue" 
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-control"
          type="text"
        />
      </div>
    `
  },
  'textarea': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <textarea 
          :value="modelValue" 
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-control"
          rows="3"
        ></textarea>
      </div>
    `
  },
  'color-picker': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input 
            :value="modelValue" 
            @input="$emit('update:modelValue', $event.target.value)"
            class="form-control"
            type="color"
            style="width: 50px; height: 32px; padding: 2px;"
          />
          <input 
            :value="modelValue" 
            @input="$emit('update:modelValue', $event.target.value)"
            class="form-control"
            type="text"
            style="flex: 1;"
          />
        </div>
      </div>
    `
  },
  'number-input': {
    props: ['modelValue', 'label', 'min', 'max'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <input 
          :value="modelValue" 
          @input="$emit('update:modelValue', Number($event.target.value))"
          class="form-control"
          type="number"
          :min="min"
          :max="max"
        />
      </div>
    `
  }
}

// 卡片组件映射
const cardComponents = {
  'text-card': TextCard,
  'info-card': TextCard // 暂时复用TextCard
}

const getCardComponent = (type: string) => {
  return cardComponents[type] || null
}

const updateCardConfig = (cardId: string, config: any) => {
  console.log('Update card config:', cardId, config)
  // 这里可以添加更新逻辑
}

// 简化的操作函数
const addSampleData = () => {
  if (panelRef.value) {
    const store = panelRef.value.panelStore
    if (store) {
      // 添加一些示例卡片
      const sampleCards = [
        {
          id: 'sample-1',
          type: 'text-card',
          config: {
            title: { value: '欢迎使用', inspector: 'text-input', label: '标题' },
            content: { value: '这是一个示例文本卡片', inspector: 'textarea', label: '内容' },
            backgroundColor: { value: '#f0f9ff', inspector: 'color-picker', label: '背景色' },
            textColor: { value: '#1e40af', inspector: 'color-picker', label: '文字颜色' },
            fontSize: { value: 16, inspector: 'number-input', label: '字体大小', min: 12, max: 24 }
          },
          layout: { x: 0, y: 0, w: 4, h: 3 }
        },
        {
          id: 'sample-2',
          type: 'info-card',
          config: {
            title: { value: '用户数量', inspector: 'text-input', label: '标题' },
            value: { value: '1,234', inspector: 'text-input', label: '数值' },
            unit: { value: '人', inspector: 'text-input', label: '单位' },
            color: { value: '#10b981', inspector: 'color-picker', label: '主题色' }
          },
          layout: { x: 4, y: 0, w: 3, h: 2 }
        }
      ]
      
      sampleCards.forEach(card => store.addCard(card))
      console.log('示例数据已添加')
      alert('示例数据已添加')
    }
  }
}

const clearAll = () => {
  if (confirm('确定要清空整个画布吗？')) {
    if (panelRef.value) {
      const store = panelRef.value.panelStore
      if (store && store.clearCards) {
        store.clearCards()
        console.log('画布已清空')
        alert('画布已清空')
      }
    }
  }
}

// 导出配置
const exportConfig = () => {
  if (panelRef.value) {
    try {
      const store = panelRef.value.panelStore
      if (store) {
        const config = {
          version: '1.0.0',
          exportTime: new Date().toISOString(),
          cards: store.cards || [],
          config: store.config || {},
          metadata: {
            name: '看板配置',
            description: '由PanelV2导出的看板配置',
            cardCount: (store.cards || []).length
          }
        }
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { 
          type: 'application/json' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `panel-config-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        console.log('配置导出成功')
        alert(`配置导出成功，包含${config.metadata.cardCount}个卡片`)
      }
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败: ' + error.message)
    }
  }
}

// 导入配置
const importConfig = () => {
  fileInput.value?.click()
}

const handleFileImport = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target?.result as string)
      
      if (panelRef.value) {
        const store = panelRef.value.panelStore
        if (store) {
          // 清空现有内容
          store.clearCards()
          
          // 导入卡片
          if (config.cards && Array.isArray(config.cards)) {
            config.cards.forEach(card => {
              store.addCard(card)
            })
          }
          
          // 导入配置
          if (config.config) {
            Object.assign(store.config, config.config)
          }
          
          console.log('配置导入成功')
          alert(`配置导入成功，导入了${config.cards?.length || 0}个卡片`)
        }
      }
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入失败，请检查文件格式: ' + error.message)
    }
  }
  reader.readAsText(file)
  
  // 清空input，允许重复选择同一文件
  ;(event.target as HTMLInputElement).value = ''
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