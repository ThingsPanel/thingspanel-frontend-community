<template>
  <div class="panel-demo-page">
    <PanelV2
      :plugins="demoPlugins"
      :toolbarActions="toolbarActions"
      :draggableItems="draggableItems"
      :inspectorRegistry="inspectorRegistry"
      :enablePluginSystem="true"
      :initialState="initialState"
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
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import PanelV2 from '@/components/panelv2/PanelV2.vue'
import TextCard from '@/components/panelv2/cards/TextCard.vue'
import ImageCard from '@/components/panelv2/cards/ImageCard.vue'
import TableCard from '@/components/panelv2/cards/TableCard.vue'
import { ChartPlugin } from '@/components/panelv2/plugins'
import type { PanelState, ToolbarAction, DraggableItem } from '@/components/panelv2/types'

// 预装插件
const demoPlugins = [ChartPlugin]

// 初始状态
const initialState: PanelState = {
  cards: [
    {
      id: 'demo-text-1',
      type: 'text-card',
      layout: { x: 0, y: 0, w: 3, h: 2 },
      config: {
        title: { value: '欢迎使用 PanelV2', inspector: 'text-input', label: '标题' },
        content: { value: '这是一个功能强大的可视化面板系统，支持拖拽布局、插件扩展和丰富的组件类型。', inspector: 'textarea', label: '内容' },
        backgroundColor: { value: '#1890ff', inspector: 'color-picker', label: '背景色' },
        textColor: { value: '#ffffff', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: 16, inspector: 'slider', label: '字体大小' },
        showBorder: { value: false, inspector: 'switch', label: '显示边框' }
      }
    },
    {
      id: 'demo-image-1',
      type: 'image-card',
      layout: { x: 3, y: 0, w: 3, h: 2 },
      config: {
        title: { value: '演示图片', inspector: 'text-input', label: '标题' },
        imageUrl: { value: 'https://picsum.photos/600/400?random=demo', inspector: 'image-input', label: '图片URL' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        objectFit: { 
          value: 'cover', 
          inspector: 'select', 
          label: '适应方式',
          options: [
            { value: 'cover', label: '覆盖' },
            { value: 'contain', label: '包含' },
            { value: 'fill', label: '填充' }
          ]
        },
        allowFullscreen: { value: true, inspector: 'switch', label: '允许全屏' }
      }
    },
    {
      id: 'demo-table-1',
      type: 'table-card',
      layout: { x: 0, y: 2, w: 6, h: 3 },
      config: {
        title: { value: '用户数据表', inspector: 'text-input', label: '标题' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        showPagination: { value: true, inspector: 'switch', label: '显示分页' },
        pageSize: { value: 8, inspector: 'slider', label: '每页大小' },
        stripedRows: { value: true, inspector: 'switch', label: '斑马纹' },
        hoverEffect: { value: true, inspector: 'switch', label: '悬停效果' },
        dataSource: { 
          value: generateDemoTableData(), 
          inspector: 'textarea', 
          label: '数据源' 
        },
        columns: {
          value: [
            { key: 'name', title: '姓名', sortable: true },
            { key: 'department', title: '部门', sortable: true },
            { key: 'position', title: '职位' },
            { key: 'email', title: '邮箱' },
            { key: 'joinDate', title: '入职日期', format: 'date' },
            { key: 'salary', title: '薪资', format: 'currency', sortable: true }
          ],
          inspector: 'textarea',
          label: '列配置'
        }
      }
    }
  ],
  selectedItemId: null,
  config: {
    backgroundColor: { value: '#f0f2f5', inspector: 'color-picker', label: '背景色' },
    gridSize: { value: 20, inspector: 'slider', label: '网格大小' }
  }
}

// 工具栏动作
const toolbarActions: ToolbarAction[] = [
  {
    id: 'save-demo',
    icon: 'fa fa-save',
    tooltip: '保存配置',
    action: (store) => {
      const stateJson = JSON.stringify(store.$state, null, 2)
      console.log('Demo state saved:', stateJson)
      alert('配置已保存到控制台！')
    }
  },
  {
    id: 'load-sample',
    icon: 'fa fa-plus',
    tooltip: '加载示例',
    action: (store) => {
      const sampleCard = {
        id: `sample-${Date.now()}`,
        type: 'text-card',
        layout: { x: Math.floor(Math.random() * 4), y: Math.floor(Math.random() * 3), w: 2, h: 1 },
        config: {
          title: { value: '新示例卡片', inspector: 'text-input', label: '标题' },
          content: { value: '这是一个动态添加的示例卡片', inspector: 'textarea', label: '内容' },
          backgroundColor: { value: '#52c41a', inspector: 'color-picker', label: '背景色' },
          textColor: { value: '#ffffff', inspector: 'color-picker', label: '文字颜色' }
        }
      }
      store.addCard(sampleCard)
    }
  },
  {
    id: 'clear-demo',
    icon: 'fa fa-trash',
    tooltip: '清空所有',
    action: (store) => {
      if (confirm('确定要清空所有卡片吗？')) {
        store.clearCards()
      }
    }
  }
]

// 可拖拽项
const draggableItems: DraggableItem[] = [
  {
    type: 'text-card',
    label: '文本卡片',
    icon: 'fa fa-font',
    defaultData: {
      type: 'text-card',
      config: {
        title: { value: '新文本卡片', inspector: 'text-input', label: '标题' },
        content: { value: '请输入文本内容...', inspector: 'textarea', label: '内容' },
        backgroundColor: { value: '#ffffff', inspector: 'color-picker', label: '背景色' },
        textColor: { value: '#333333', inspector: 'color-picker', label: '文字颜色' },
        fontSize: { value: 14, inspector: 'slider', label: '字体大小' },
        showBorder: { value: true, inspector: 'switch', label: '显示边框' }
      }
    }
  },
  {
    type: 'image-card',
    label: '图片卡片',
    icon: 'fa fa-image',
    defaultData: {
      type: 'image-card',
      config: {
        title: { value: '新图片', inspector: 'text-input', label: '标题' },
        imageUrl: { value: 'https://picsum.photos/400/300', inspector: 'image-input', label: '图片URL' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        objectFit: { value: 'cover', inspector: 'select', label: '适应方式' },
        allowFullscreen: { value: true, inspector: 'switch', label: '允许全屏' }
      }
    }
  },
  {
    type: 'table-card',
    label: '数据表格',
    icon: 'fa fa-table',
    defaultData: {
      type: 'table-card',
      config: {
        title: { value: '新数据表', inspector: 'text-input', label: '标题' },
        showTitle: { value: true, inspector: 'switch', label: '显示标题' },
        showPagination: { value: true, inspector: 'switch', label: '显示分页' },
        pageSize: { value: 10, inspector: 'slider', label: '每页大小' },
        stripedRows: { value: true, inspector: 'switch', label: '斑马纹' },
        dataSource: { value: [], inspector: 'textarea', label: '数据源' },
        columns: { value: [], inspector: 'textarea', label: '列配置' }
      }
    }
  }
]

// 配置器注册表
const inspectorRegistry = {
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
            style="width: 50px; height: 32px; padding: 0;"
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
  'slider': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input 
            :value="modelValue" 
            @input="$emit('update:modelValue', Number($event.target.value))"
            class="form-control"
            type="range"
            min="8"
            max="32"
            style="flex: 1;"
          />
          <span style="min-width: 30px; text-align: center;">{{ modelValue }}</span>
        </div>
      </div>
    `
  },
  'switch': {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input 
            :checked="modelValue" 
            @input="$emit('update:modelValue', $event.target.checked)"
            type="checkbox"
          />
          <span v-if="label">{{ label }}</span>
        </label>
      </div>
    `
  },
  'select': {
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <label v-if="label">{{ label }}</label>
        <select 
          :value="modelValue" 
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-control"
        >
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    `
  },
  'image-input': {
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
          placeholder="输入图片URL"
        />
      </div>
    `
  }
}

// 方法
const getCardComponent = (type: string) => {
  const componentMap = {
    'text-card': TextCard,
    'image-card': ImageCard,
    'table-card': TableCard
  }
  return componentMap[type as keyof typeof componentMap]
}

const updateCardConfig = (cardId: string, config: any) => {
  console.log('Update card config:', cardId, config)
}

// 生成演示表格数据
function generateDemoTableData() {
  const departments = ['技术部', '市场部', '人事部', '财务部', '运营部']
  const positions = ['工程师', '经理', '专员', '主管', '总监']
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二']
  
  return names.map((name, index) => ({
    id: index + 1,
    name,
    department: departments[Math.floor(Math.random() * departments.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    email: `${name.toLowerCase()}@company.com`,
    joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    salary: Math.floor(Math.random() * 50000) + 50000
  }))
}
</script>

<style scoped>
.panel-demo-page {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* 未知卡片样式 */
.unknown-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff2e8;
  border: 2px dashed #ffbb96;
  border-radius: 8px;
  color: #d4380d;
  text-align: center;
  padding: 20px;
}

.unknown-card i {
  font-size: 32px;
  margin-bottom: 12px;
}

.unknown-card p {
  margin: 8px 0;
  font-weight: 500;
}

.unknown-card small {
  opacity: 0.7;
  font-size: 12px;
}

/* 全局样式 */
:global(.form-control) {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

:global(.form-control:focus) {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

:global(.inspector-item) {
  margin-bottom: 16px;
}

:global(.inspector-item label) {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}
</style>