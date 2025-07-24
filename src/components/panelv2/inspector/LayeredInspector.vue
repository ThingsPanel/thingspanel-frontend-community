<template>
  <div class="layered-inspector">
    <div class="inspector-content">
      <!-- 配置标签切换 -->
      <div class="config-tabs">
        <button 
          v-for="tab in configTabs" 
          :key="tab.key"
          :class="['tab-button', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- 看板配置 -->
      <div v-if="activeTab === 'panel' && isPanelSelected" class="config-section">
        <h4>看板配置</h4>
        
        <!-- 布局配置 -->
        <div class="config-group">
          <h5>布局设置</h5>
          <ConfigControl
            :modelValue="panelConfig?.layout?.gridColumns || 12"
            type="number-input"
            label="网格列数"
            :min="6"
            :max="24"
            @update:modelValue="updatePanelConfig('layout.gridColumns', $event)"
          />
          <ConfigControl
            :modelValue="panelConfig?.layout?.cellHeight || 70"
            type="number-input"
            label="单元格高度"
            :min="40"
            :max="120"
            @update:modelValue="updatePanelConfig('layout.cellHeight', $event)"
          />
          <ConfigControl
            :modelValue="panelConfig?.layout?.margin || 5"
            type="number-input"
            label="卡片间距"
            :min="0"
            :max="20"
            @update:modelValue="updatePanelConfig('layout.margin', $event)"
          />
        </div>

        <!-- 外观配置 -->
        <div class="config-group">
          <h5>外观设置</h5>
          <ConfigControl
            :modelValue="panelConfig?.appearance?.backgroundColor || '#f5f5f5'"
            type="color-picker"
            label="背景色"
            @update:modelValue="updatePanelConfig('appearance.backgroundColor', $event)"
          />
        </div>

        <!-- 交互配置 -->
        <div class="config-group">
          <h5>交互设置</h5>
          <ConfigControl
            :modelValue="panelConfig?.interaction?.allowDrag !== false"
            type="switch"
            label="允许拖拽"
            @update:modelValue="updatePanelConfig('interaction.allowDrag', $event)"
          />
          <ConfigControl
            :modelValue="panelConfig?.interaction?.allowResize !== false"
            type="switch"
            label="允许调整大小"
            @update:modelValue="updatePanelConfig('interaction.allowResize', $event)"
          />
        </div>
      </div>

      <!-- 节点基础配置 -->
      <div v-if="activeTab === 'base' && selectedNode" class="config-section">
        <h4>节点基础配置</h4>
        
        <!-- 布局配置 -->
        <div class="config-group">
          <h5>布局设置</h5>
          <div class="layout-grid">
            <ConfigControl
              :modelValue="selectedNode?.config?.base?.layout?.x || 0"
              type="number-input"
              label="X位置"
              :min="0"
              readonly
            />
            <ConfigControl
              :modelValue="selectedNode?.config?.base?.layout?.y || 0"
              type="number-input"
              label="Y位置"
              :min="0"
              readonly
            />
            <ConfigControl
              :modelValue="selectedNode?.config?.base?.layout?.w || 4"
              type="number-input"
              label="宽度"
              :min="1"
              :max="panelConfig?.layout?.gridColumns || 12"
              @update:modelValue="updateNodeConfig('base.layout.w', $event)"
            />
            <ConfigControl
              :modelValue="selectedNode?.config?.base?.layout?.h || 2"
              type="number-input"
              label="高度"
              :min="1"
              :max="20"
              @update:modelValue="updateNodeConfig('base.layout.h', $event)"
            />
          </div>
        </div>

        <!-- 状态配置 -->
        <div class="config-group">
          <h5>状态设置</h5>
          <ConfigControl
            :modelValue="selectedNode?.config?.base?.state?.locked || false"
            type="switch"
            label="锁定位置"
            @update:modelValue="updateNodeConfig('base.state.locked', $event)"
          />
          <ConfigControl
            :modelValue="selectedNode?.config?.base?.state?.hidden || false"
            type="switch"
            label="隐藏节点"
            @update:modelValue="updateNodeConfig('base.state.hidden', $event)"
          />
        </div>

        <!-- 外观配置 -->
        <div class="config-group">
          <h5>外观设置</h5>
          <ConfigControl
            :modelValue="selectedNode.config.base.appearance.border?.color || '#e8e8e8'"
            type="color-picker"
            label="边框颜色"
            @update:modelValue="updateNodeAppearance('border.color', $event)"
          />
          <ConfigControl
            :modelValue="selectedNode.config.base.appearance.border?.width || 1"
            type="number-input"
            label="边框宽度"
            :min="0"
            :max="10"
            @update:modelValue="updateNodeAppearance('border.width', $event)"
          />
        </div>
      </div>

      <!-- 节点交互配置 -->
      <div v-if="activeTab === 'interaction' && selectedNode" class="config-section">
        <h4>节点交互配置</h4>
        
        <!-- 点击行为 -->
        <div class="config-group">
          <h5>点击行为</h5>
          <ConfigControl
            :modelValue="selectedNode.config.interaction.onClick?.type || 'none'"
            type="select"
            label="点击类型"
            :options="[
              { value: 'none', label: '无动作' },
              { value: 'navigate', label: '页面跳转' },
              { value: 'popup', label: '弹窗' },
              { value: 'action', label: '自定义动作' }
            ]"
            @update:modelValue="updateNodeInteraction('onClick.type', $event)"
          />
          <ConfigControl
            v-if="selectedNode.config.interaction.onClick?.type === 'navigate'"
            :modelValue="selectedNode.config.interaction.onClick?.target || ''"
            type="text-input"
            label="跳转地址"
            @update:modelValue="updateNodeInteraction('onClick.target', $event)"
          />
        </div>

        <!-- 悬停行为 -->
        <div class="config-group">
          <h5>悬停行为</h5>
          <ConfigControl
            :modelValue="selectedNode.config.interaction.onHover?.tooltip || ''"
            type="text-input"
            label="提示内容"
            @update:modelValue="updateNodeInteraction('onHover.tooltip', $event)"
          />
          <ConfigControl
            :modelValue="selectedNode.config.interaction.onHover?.highlight || false"
            type="switch"
            label="悬停高亮"
            @update:modelValue="updateNodeInteraction('onHover.highlight', $event)"
          />
        </div>
      </div>

      <!-- 节点内容配置 -->
      <div v-if="activeTab === 'content' && selectedNode" class="config-section">
        <h4>节点内容配置</h4>
        
        <div class="config-group">
          <div v-for="(configItem, key) in selectedNode.config.content" :key="key">
            <ConfigControl
              :modelValue="configItem.value"
              :type="getControlType(configItem)"
              :label="configItem.label || key"
              :description="configItem.description"
              :options="configItem.options"
              :min="configItem.min"
              :max="configItem.max"
              @update:modelValue="updateNodeContent(key, $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { usePanelStore } from '../state/panelStore';
import ConfigControl from './components/ConfigControl.vue';
import type { PanelConfig, ConfigItem } from '../types';

const panelStore = usePanelStore();

// 当前激活的配置标签 - 根据选择状态自动设置
const activeTab = ref('panel');

// 监听选择状态变化，自动切换标签
watch(() => panelStore.selectedItemId, (newId) => {
  if (newId) {
    // 选择了节点，切换到内容标签
    activeTab.value = 'content';
  } else {
    // 没有选择，切换到看板标签
    activeTab.value = 'panel';
  }
}, { immediate: true });

// 配置标签定义
const configTabs = [
  { key: 'panel', label: '看板', icon: 'fa fa-dashboard' },
  { key: 'base', label: '基础', icon: 'fa fa-cog' },
  { key: 'interaction', label: '交互', icon: 'fa fa-mouse-pointer' },
  { key: 'content', label: '内容', icon: 'fa fa-edit' }
];

// 计算属性
const selectedItem = computed(() => panelStore.selectedItem);
const isPanelSelected = computed(() => !panelStore.selectedItemId);
const selectedNode = computed(() => 
  panelStore.selectedItemId ? 
  panelStore.cards.find(card => card.id === panelStore.selectedItemId) : 
  null
);
const panelConfig = computed(() => panelStore.config as PanelConfig);

// 根据配置项获取控件类型
const getControlType = (configItem: ConfigItem) => {
  const typeMapping = {
    'text': 'text-input',
    'textarea': 'textarea',
    'number': 'number-input',
    'color': 'color-picker',
    'select': 'select',
    'switch': 'switch',
    'checkbox': 'checkbox'
  };
  return typeMapping[configItem.type] || 'text-input';
};

// 更新看板配置
const updatePanelConfig = (path: string, value: any) => {
  const keys = path.split('.');
  let target = panelConfig.value as any;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }
  
  target[keys[keys.length - 1]] = value;
  panelStore.saveToStorage();
};

// 更新节点配置
const updateNodeConfig = (path: string, value: any) => {
  if (!selectedNode.value) return;
  
  // 确定配置类型
  let configType: 'base' | 'interaction' | 'content';
  if (path.startsWith('base.')) {
    configType = 'base';
    path = path.substring(5); // 移除 'base.' 前缀
  } else if (path.startsWith('interaction.')) {
    configType = 'interaction';
    path = path.substring(12); // 移除 'interaction.' 前缀
  } else {
    configType = 'content';
  }
  
  // 调用store的方法
  panelStore.updateNodeConfig(selectedNode.value.id, configType, path, value);
};

// 更新节点外观（使用统一的配置更新）
const updateNodeAppearance = (path: string, value: any) => {
  updateNodeConfig(`base.appearance.${path}`, value);
};

// 更新节点交互（使用统一的配置更新）
const updateNodeInteraction = (path: string, value: any) => {
  updateNodeConfig(`interaction.${path}`, value);
};

// 更新节点内容
const updateNodeContent = (key: string, value: any) => {
  if (!selectedNode.value) return;
  
  if (selectedNode.value.config.content[key]) {
    selectedNode.value.config.content[key].value = value;
    panelStore.saveToStorage();
  }
};
</script>

<style scoped>
.layered-inspector {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.config-tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.tab-button {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  font-size: 12px;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.tab-button:hover {
  background-color: #f5f5f5;
  color: #333;
}

.tab-button.active {
  background-color: #1890ff;
  color: white;
}

.inspector-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.config-section h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.config-group {
  margin-bottom: 24px;
}

.config-group h5 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  text-transform: uppercase;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.placeholder {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>