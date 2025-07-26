<template>
  <div class="redesigned-inspector">
    <!-- 渲染器配置（无选择时显示） -->
    <div v-if="!hasSelection" class="renderer-config">
      <div class="config-header">
        <h3>
          <i class="fa fa-cogs"></i>
          {{ currentEngineConfig.name || '渲染器' }} 配置
        </h3>
        <small>当前渲染器: {{ currentEngineConfig.id || 'none' }}</small>
      </div>
      
      <!-- GridStack渲染器配置 -->
      <div v-if="currentEngineConfig.id === 'gridstack'" class="config-section">
        <h4>网格布局设置</h4>
        <div class="config-items">
          <div class="config-item">
            <label>网格列数</label>
            <input 
              :value="currentEngineConfig.config?.columns || 12"
              type="number"
              min="6" 
              max="24" 
              class="number-input"
              @input="updateEngineConfig('columns', Number($event.target.value))"
            />
            <span class="current-value">当前: {{ currentEngineConfig.config?.columns || 12 }} 列</span>
          </div>
          
          <div class="config-item">
            <label>卡片间距</label>
            <input 
              :value="currentEngineConfig.config?.margin || 10"
              type="number"
              min="0" 
              max="30" 
              class="number-input"
              @input="updateEngineConfig('margin', Number($event.target.value))"
            />
            <span class="current-value">当前: {{ currentEngineConfig.config?.margin || 10 }}px</span>
          </div>
          
          <div class="config-item">
            <label>
              <input 
                :checked="currentEngineConfig.config?.animate !== false"
                type="checkbox"
                @change="updateEngineConfig('animate', $event.target.checked)"
              />
              启用动画
            </label>
            <span class="current-value">{{ currentEngineConfig.config?.animate !== false ? '开启' : '关闭' }}</span>
          </div>
          
          <div class="config-item">
            <label>
              <input 
                :checked="currentEngineConfig.config?.float === true"
                type="checkbox"
                @change="updateEngineConfig('float', $event.target.checked)"
              />
              浮动布局
            </label>
            <span class="current-value">{{ currentEngineConfig.config?.float ? '启用' : '禁用' }}</span>
          </div>
        </div>
      </div>
      
      <!-- Canvas渲染器配置 -->
      <div v-if="currentEngineConfig.id === 'canvas'" class="config-section">
        <h4>画布设置</h4>
        <div class="config-items">
          <div class="config-item">
            <label>画布宽度</label>
            <input 
              :value="currentEngineConfig.config?.width || 1200"
              type="number"
              min="800" 
              max="2000" 
              class="number-input"
              @input="updateEngineConfig('width', Number($event.target.value))"
            />
            <span class="current-value">当前: {{ currentEngineConfig.config?.width || 1200 }}px</span>
          </div>
          
          <div class="config-item">
            <label>画布高度</label>
            <input 
              :value="currentEngineConfig.config?.height || 800"
              type="number"
              min="600" 
              max="1200" 
              class="number-input"
              @input="updateEngineConfig('height', Number($event.target.value))"
            />
            <span class="current-value">当前: {{ currentEngineConfig.config?.height || 800 }}px</span>
          </div>
          
          <div class="config-item">
            <label>缩放比例</label>
            <input 
              :value="currentEngineConfig.config?.zoom || 1"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              @input="updateEngineConfig('zoom', Number($event.target.value))"
            />
            <span class="current-value">当前: {{ Math.round((currentEngineConfig.config?.zoom || 1) * 100) }}%</span>
          </div>
          
          <div class="config-item">
            <label>背景颜色</label>
            <input 
              :value="currentEngineConfig.config?.backgroundColor || '#fafafa'"
              type="color"
              @input="updateEngineConfig('backgroundColor', $event.target.value)"
            />
            <span class="current-value">{{ currentEngineConfig.config?.backgroundColor || '#fafafa' }}</span>
          </div>
          
          <div class="config-item">
            <label>
              <input 
                :checked="currentEngineConfig.config?.gridVisible !== false"
                type="checkbox"
                @change="updateEngineConfig('gridVisible', $event.target.checked)"
              />
              显示网格
            </label>
            <span class="current-value">{{ currentEngineConfig.config?.gridVisible !== false ? '显示' : '隐藏' }}</span>
          </div>
          
          <div class="config-item">
            <label>网格大小</label>
            <input 
              :value="currentEngineConfig.config?.gridSize || 20"
              type="number"
              min="10" 
              max="50" 
              class="number-input"
              @input="updateEngineConfig('gridSize', Number($event.target.value))"
            />
            <span class="current-value">{{ currentEngineConfig.config?.gridSize || 20 }}px</span>
          </div>
          
          <div class="config-item">
            <label>
              <input 
                :checked="currentEngineConfig.config?.snapToGrid === true"
                type="checkbox"
                @change="updateEngineConfig('snapToGrid', $event.target.checked)"
              />
              网格对齐
            </label>
            <span class="current-value">{{ currentEngineConfig.config?.snapToGrid ? '启用' : '禁用' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 节点配置（选择节点时显示） -->
    <div v-else class="node-config">
      <div class="config-header">
        <h3>
          <i class="fa fa-cube"></i>
          节点配置 
          <small>({{ selectedNode?.type || 'unknown' }})</small>
        </h3>
      </div>

      <div class="config-section">
        <h4>节点数据</h4>
        <div class="config-items">
          <div class="config-item">
            <label>节点ID</label>
            <input 
              :value="selectedNode?.id || ''"
              type="text"
              readonly
              class="text-input readonly"
            />
            <span class="current-value">唯一标识符</span>
          </div>
          
          <div class="config-item">
            <label>节点类型</label>
            <input 
              :value="selectedNode?.type || ''"
              type="text"
              readonly
              class="text-input readonly"
            />
            <span class="current-value">组件类型</span>
          </div>
          
          <div class="config-item">
            <label>数据内容</label>
            <textarea 
              :value="JSON.stringify(selectedNode?.data || {}, null, 2)"
              rows="6"
              readonly
              class="textarea-input readonly"
            ></textarea>
            <span class="current-value">节点携带的数据</span>
          </div>

          <div class="config-item">
            <label>布局信息</label>
            <textarea 
              :value="JSON.stringify(selectedNode?.layout || {}, null, 2)"
              rows="3"
              readonly
              class="textarea-input readonly"
            ></textarea>
            <span class="current-value">位置和尺寸信息</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { NodeData } from '../engines/RenderEngine'

interface Props {
  selectedNode?: NodeData | null
  currentEngineConfig?: {
    id: string
    name: string
    config: any
  }
}

const props = withDefaults(defineProps<Props>(), {
  selectedNode: null,
  currentEngineConfig: () => ({ id: '', name: '', config: {} })
})

const emit = defineEmits<{
  updateEngineConfig: [key: string, value: any]
}>()

// 计算属性
const hasSelection = computed(() => !!props.selectedNode)

// 更新渲染器配置
const updateEngineConfig = (key: string, value: any) => {
  emit('updateEngineConfig', key, value)
}
</script>

<style scoped>
.redesigned-inspector {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  overflow-y: auto;
}

.config-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  background-color: #fafafa;
}

.config-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-header small {
  color: #666;
  font-weight: normal;
  font-size: 12px;
}

.config-section {
  padding: 20px;
}

.config-section h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.config-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-item label {
  font-size: 12px;
  font-weight: 500;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-item input[type="checkbox"] {
  margin: 0;
}

.current-value {
  font-size: 11px;
  color: #999;
  font-style: italic;
}

.number-input, .text-input, .select-input, .textarea-input {
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  transition: border-color 0.3s;
  font-family: monospace;
}

.number-input:focus, .text-input:focus, .select-input:focus, .textarea-input:focus {
  border-color: #40a9ff;
  outline: none;
}

.readonly {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

input[type="range"] {
  width: 100%;
}

input[type="color"] {
  width: 40px;
  height: 32px;
  padding: 2px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}
</style>