<template>
  <div class="state-display-config">
    <!-- 基础设置 -->
    <n-card title="基础设置" class="config-section">
      <n-form :model="localConfig.basic" label-placement="left" label-width="120">
        <n-form-item label="组件标题">
          <n-input 
            v-model:value="localConfig.basic.title" 
            placeholder="请输入组件标题"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item label="显示设备名称">
          <n-switch 
            v-model:value="localConfig.basic.showDeviceName"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item 
          v-if="localConfig.basic.showDeviceName" 
          label="自定义设备名称"
        >
          <n-input 
            v-model:value="localConfig.basic.customDeviceName" 
            placeholder="留空则使用默认设备名称"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item label="显示指标名称">
          <n-switch 
            v-model:value="localConfig.basic.showMetricName"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item 
          v-if="localConfig.basic.showMetricName" 
          label="自定义指标名称"
        >
          <n-input 
            v-model:value="localConfig.basic.customMetricName" 
            placeholder="留空则使用数据键名"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 状态设置 -->
    <n-card title="状态设置" class="config-section">
      <n-form :model="localConfig.state" label-placement="left" label-width="120">
        <n-form-item label="激活状态图标">
          <n-select 
            v-model:value="localConfig.state.activeIcon" 
            :options="iconOptions"
            @update:value="handleConfigChange"
          >
            <template #option="{ node, option }">
              <div class="icon-option">
                <component :is="getIconComponent(option.value)" class="icon-preview" />
                <span>{{ option.label }}</span>
              </div>
            </template>
          </n-select>
        </n-form-item>
        
        <n-form-item label="激活状态颜色">
          <n-color-picker 
            v-model:value="localConfig.state.activeColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item label="非激活状态图标">
          <n-select 
            v-model:value="localConfig.state.inactiveIcon" 
            :options="iconOptions"
            @update:value="handleConfigChange"
          >
            <template #option="{ node, option }">
              <div class="icon-option">
                <component :is="getIconComponent(option.value)" class="icon-preview" />
                <span>{{ option.label }}</span>
              </div>
            </template>
          </n-select>
        </n-form-item>
        
        <n-form-item label="非激活状态颜色">
          <n-color-picker 
            v-model:value="localConfig.state.inactiveColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item label="激活状态值">
          <n-input 
            v-model:value="localConfig.state.activeValue" 
            placeholder="例如：1、true、on"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item label="非激活状态值">
          <n-input 
            v-model:value="localConfig.state.inactiveValue" 
            placeholder="例如：0、false、off"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 数据设置 -->
    <n-card title="数据设置" class="config-section">
      <n-form :model="localConfig.data" label-placement="left" label-width="120">
        <n-form-item label="数据类型">
          <n-select 
            v-model:value="localConfig.data.type" 
            :options="dataTypeOptions"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item label="数据键名">
          <n-input 
            v-model:value="localConfig.data.key" 
            placeholder="例如：status、switch、power"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item label="数据格式">
          <n-select 
            v-model:value="localConfig.data.format" 
            :options="dataFormatOptions"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 样式设置 -->
    <n-card title="样式设置" class="config-section">
      <n-tabs type="line" animated>
        <!-- 容器样式 -->
        <n-tab-pane name="container" tab="容器">
          <n-form :model="localConfig.style.container" label-placement="left" label-width="120">
            <n-form-item label="背景颜色">
              <n-color-picker 
                v-model:value="localConfig.style.container.backgroundColor"
                :show-alpha="true"
                @update:value="handleConfigChange"
              />
            </n-form-item>
            
            <n-form-item label="显示边框">
              <n-switch 
                v-model:value="localConfig.style.container.border.show"
                @update:value="handleConfigChange"
              />
            </n-form-item>
            
            <template v-if="localConfig.style.container.border.show">
              <n-form-item label="边框宽度">
                <n-input-number 
                  v-model:value="localConfig.style.container.border.width"
                  :min="1"
                  :max="10"
                  @update:value="handleConfigChange"
                />
              </n-form-item>
              
              <n-form-item label="边框颜色">
                <n-color-picker 
                  v-model:value="localConfig.style.container.border.color"
                  :show-alpha="false"
                  @update:value="handleConfigChange"
                />
              </n-form-item>
              
              <n-form-item label="边框圆角">
                <n-input-number 
                  v-model:value="localConfig.style.container.border.radius"
                  :min="0"
                  :max="50"
                  @update:value="handleConfigChange"
                />
              </n-form-item>
            </template>
            
            <n-form-item label="对齐方式">
              <n-select 
                v-model:value="localConfig.style.container.align" 
                :options="alignOptions"
                @update:value="handleConfigChange"
              />
            </n-form-item>
            
            <n-form-item label="垂直对齐">
              <n-select 
                v-model:value="localConfig.style.container.verticalAlign" 
                :options="verticalAlignOptions"
                @update:value="handleConfigChange"
              />
            </n-form-item>
          </n-form>
        </n-tab-pane>
        
        <!-- 图标样式 -->
        <n-tab-pane name="icon" tab="图标">
          <n-form :model="localConfig.style.icon" label-placement="left" label-width="120">
            <n-form-item label="图标大小">
              <n-input-number 
                v-model:value="localConfig.style.icon.size"
                :min="16"
                :max="128"
                @update:value="handleConfigChange"
              />
            </n-form-item>
            
            <n-form-item label="图标边距">
              <n-input-number 
                v-model:value="localConfig.style.icon.margin"
                :min="0"
                :max="50"
                @update:value="handleConfigChange"
              />
            </n-form-item>
            
            <n-form-item label="显示阴影">
              <n-switch 
                v-model:value="localConfig.style.icon.shadow.show"
                @update:value="handleConfigChange"
              />
            </n-form-item>
            
            <template v-if="localConfig.style.icon.shadow.show">
              <n-form-item label="阴影模糊">
                <n-input-number 
                  v-model:value="localConfig.style.icon.shadow.blur"
                  :min="0"
                  :max="20"
                  @update:value="handleConfigChange"
                />
              </n-form-item>
              
              <n-form-item label="阴影颜色">
                <n-color-picker 
                  v-model:value="localConfig.style.icon.shadow.color"
                  :show-alpha="true"
                  @update:value="handleConfigChange"
                />
              </n-form-item>
            </template>
          </n-form>
        </n-tab-pane>
        
        <!-- 文本样式 -->
        <n-tab-pane name="text" tab="文本">
          <n-form :model="localConfig.style.text" label-placement="left" label-width="120">
            <n-form-item label="字体大小">
              <n-input-number 
                v-model:value="localConfig.style.text.fontSize"
                :min="10"
                :max="32"
                @update:value="handleConfigChange"
              />
            </n-form-item>
            
            <n-form-item label="字体颜色">
              <n-color-picker 
                v-model:value="localConfig.style.text.color"
                :show-alpha="false"
                @update:value="handleConfigChange"
              />
            </n-form-item>
            
            <n-form-item label="字体粗细">
              <n-select 
                v-model:value="localConfig.style.text.fontWeight" 
                :options="fontWeightOptions"
                @update:value="handleConfigChange"
              />
            </n-form-item>
            
            <n-form-item label="文本位置">
              <n-select 
                v-model:value="localConfig.style.text.position" 
                :options="textPositionOptions"
                @update:value="handleConfigChange"
              />
            </n-form-item>
            
            <n-form-item label="文本边距">
              <n-input-number 
                v-model:value="localConfig.style.text.margin"
                :min="0"
                :max="50"
                @update:value="handleConfigChange"
              />
            </n-form-item>
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- 交互设置 -->
    <n-card title="交互设置" class="config-section">
      <n-form label-placement="left" label-width="120">
        <n-form-item label="悬停效果">
          <n-switch 
            v-model:value="localConfig.interaction.hover.enabled"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <template v-if="localConfig.interaction.hover.enabled">
          <n-form-item label="悬停缩放">
            <n-input-number 
              v-model:value="localConfig.interaction.hover.scale"
              :min="1"
              :max="2"
              :step="0.1"
              @update:value="handleConfigChange"
            />
          </n-form-item>
          
          <n-form-item label="动画时长">
            <n-input-number 
              v-model:value="localConfig.interaction.hover.duration"
              :min="100"
              :max="1000"
              :step="50"
              @update:value="handleConfigChange"
            />
          </n-form-item>
        </template>
        
        <n-form-item label="点击效果">
          <n-switch 
            v-model:value="localConfig.interaction.click.enabled"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item 
          v-if="localConfig.interaction.click.enabled" 
          label="点击动画"
        >
          <n-select 
            v-model:value="localConfig.interaction.click.animation" 
            :options="animationOptions"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 高级设置 -->
    <n-card title="高级设置" class="config-section">
      <n-form label-placement="left" label-width="120">
        <n-form-item label="响应式布局">
          <n-switch 
            v-model:value="localConfig.advanced.responsive.enabled"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item label="自动刷新">
          <n-switch 
            v-model:value="localConfig.advanced.autoRefresh.enabled"
            @update:value="handleConfigChange"
          />
        </n-form-item>
        
        <n-form-item 
          v-if="localConfig.advanced.autoRefresh.enabled" 
          label="刷新间隔（秒）"
        >
          <n-input-number 
            v-model:value="localConfig.advanced.autoRefresh.interval"
            :min="5"
            :max="300"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { 
  NCard, NForm, NFormItem, NInput, NInputNumber, NSelect, NSwitch, 
  NColorPicker, NTabs, NTabPane
} from 'naive-ui'
import type { StateDisplayConfig } from './index'

// Ionicons 图标导入
import {
  Bulb,
  BulbOutline,
  Power,
  PowerOutline,
  CheckmarkCircle,
  CheckmarkCircleOutline,
  CloseCircle,
  CloseCircleOutline,
  Play,
  PlayOutline,
  Pause,
  PauseOutline,
  Stop,
  StopOutline
} from '@vicons/ionicons5'

// 定义 Props
interface Props {
  config: StateDisplayConfig
}

const props = defineProps<Props>()

// 定义 Emits
const emit = defineEmits<{
  'update:config': [config: StateDisplayConfig]
}>()

// 本地配置
const localConfig = ref<StateDisplayConfig>(JSON.parse(JSON.stringify(props.config)))

// 图标映射
const iconMap = {
  'Bulb': Bulb,
  'BulbOutline': BulbOutline,
  'Power': Power,
  'PowerOutline': PowerOutline,
  'CheckmarkCircle': CheckmarkCircle,
  'CheckmarkCircleOutline': CheckmarkCircleOutline,
  'CloseCircle': CloseCircle,
  'CloseCircleOutline': CloseCircleOutline,
  'Play': Play,
  'PlayOutline': PlayOutline,
  'Pause': Pause,
  'PauseOutline': PauseOutline,
  'Stop': Stop,
  'StopOutline': StopOutline
}

// 选项数据
const iconOptions = [
  { label: '灯泡（实心）', value: 'Bulb' },
  { label: '灯泡（空心）', value: 'BulbOutline' },
  { label: '电源（实心）', value: 'Power' },
  { label: '电源（空心）', value: 'PowerOutline' },
  { label: '勾选圆圈（实心）', value: 'CheckmarkCircle' },
  { label: '勾选圆圈（空心）', value: 'CheckmarkCircleOutline' },
  { label: '关闭圆圈（实心）', value: 'CloseCircle' },
  { label: '关闭圆圈（空心）', value: 'CloseCircleOutline' },
  { label: '播放（实心）', value: 'Play' },
  { label: '播放（空心）', value: 'PlayOutline' },
  { label: '暂停（实心）', value: 'Pause' },
  { label: '暂停（空心）', value: 'PauseOutline' },
  { label: '停止（实心）', value: 'Stop' },
  { label: '停止（空心）', value: 'StopOutline' }
]

const dataTypeOptions = [
  { label: '设备属性', value: 'attributes' },
  { label: '设备遥测', value: 'telemetry' }
]

const dataFormatOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔值', value: 'boolean' }
]

const alignOptions = [
  { label: '左对齐', value: 'start' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'end' }
]

const verticalAlignOptions = [
  { label: '顶部对齐', value: 'start' },
  { label: '垂直居中', value: 'center' },
  { label: '底部对齐', value: 'end' }
]

const fontWeightOptions = [
  { label: '正常', value: 'normal' },
  { label: '粗体', value: 'bold' },
  { label: '100', value: 100 },
  { label: '200', value: 200 },
  { label: '300', value: 300 },
  { label: '400', value: 400 },
  { label: '500', value: 500 },
  { label: '600', value: 600 },
  { label: '700', value: 700 },
  { label: '800', value: 800 },
  { label: '900', value: 900 }
]

const textPositionOptions = [
  { label: '顶部', value: 'top' },
  { label: '底部', value: 'bottom' },
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' }
]

const animationOptions = [
  { label: '脉冲', value: 'pulse' },
  { label: '弹跳', value: 'bounce' },
  { label: '摇摆', value: 'shake' }
]

// 获取图标组件
const getIconComponent = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || BulbOutline
}

// 处理配置变化
const handleConfigChange = () => {
  emit('update:config', JSON.parse(JSON.stringify(localConfig.value)))
}

// 监听外部配置变化
watch(
  () => props.config,
  (newConfig) => {
    localConfig.value = JSON.parse(JSON.stringify(newConfig))
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.state-display-config {
  .config-section {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .icon-option {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .icon-preview {
      font-size: 16px;
      color: #666;
    }
  }
}
</style>