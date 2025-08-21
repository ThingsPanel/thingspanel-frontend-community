<template>
  <div class="iot-device-status-config">
    <n-form :model="localConfig" :rules="formRules" label-placement="left" label-width="120px" size="small">
      <!-- 📱 设备基础信息 -->
      <n-card title="设备信息" size="small" class="config-section">
        <n-form-item label="设备名称" path="deviceName">
          <n-input
            v-model:value="localConfig.deviceName"
            placeholder="请输入设备名称"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="设备类型" path="deviceType">
          <n-select
            v-model:value="localConfig.deviceType"
            :options="deviceTypeOptions"
            placeholder="请选择设备类型"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="设备图标" path="deviceIcon">
          <n-select
            v-model:value="localConfig.deviceIcon"
            :options="deviceIconOptions"
            placeholder="请选择设备图标"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-card>

      <!-- 📊 显示设置 -->
      <n-card title="显示设置" size="small" class="config-section">
        <n-form-item label="显示位置信息">
          <n-switch v-model:value="localConfig.showLocation" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="显示信号强度">
          <n-switch v-model:value="localConfig.showSignalStrength" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="显示操作按钮">
          <n-switch v-model:value="localConfig.showActions" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="最大指标数量" path="maxMetricsDisplay">
          <n-input-number
            v-model:value="localConfig.maxMetricsDisplay"
            :min="1"
            :max="8"
            placeholder="最大显示指标数量"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-card>

      <!-- 🎨 样式配置 -->
      <n-card title="样式配置" size="small" class="config-section">
        <n-form-item label="背景色" path="backgroundColor">
          <n-color-picker
            v-model:value="localConfig.backgroundColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="文字色" path="textColor">
          <n-color-picker
            v-model:value="localConfig.textColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="边框色" path="borderColor">
          <n-color-picker
            v-model:value="localConfig.borderColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="圆角大小" path="borderRadius">
          <n-input-number
            v-model:value="localConfig.borderRadius"
            :min="0"
            :max="50"
            placeholder="边框圆角"
            @update:value="handleConfigChange"
          >
            <template #suffix>px</template>
          </n-input-number>
        </n-form-item>

        <n-form-item label="内边距" path="padding">
          <n-input-number
            v-model:value="localConfig.padding"
            :min="8"
            :max="50"
            placeholder="内边距"
            @update:value="handleConfigChange"
          >
            <template #suffix>px</template>
          </n-input-number>
        </n-form-item>

        <n-form-item label="最小高度" path="minHeight">
          <n-input-number
            v-model:value="localConfig.minHeight"
            :min="200"
            :max="600"
            placeholder="最小高度"
            @update:value="handleConfigChange"
          >
            <template #suffix>px</template>
          </n-input-number>
        </n-form-item>
      </n-card>

      <!-- 🔧 操作配置 -->
      <n-card v-if="localConfig.showActions" title="操作按钮配置" size="small" class="config-section">
        <n-form-item label="按钮尺寸" path="actionSize">
          <n-select
            v-model:value="localConfig.actionSize"
            :options="actionSizeOptions"
            placeholder="请选择按钮尺寸"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="操作按钮">
          <div class="actions-config">
            <div v-for="(action, index) in localConfig.actions" :key="index" class="action-item">
              <n-space align="center" :size="8">
                <n-input
                  v-model:value="action.label"
                  placeholder="按钮文字"
                  style="width: 80px"
                  @update:value="handleConfigChange"
                />
                <n-select
                  v-model:value="action.type"
                  :options="actionTypeOptions"
                  placeholder="类型"
                  style="width: 80px"
                  @update:value="handleConfigChange"
                />
                <n-select
                  v-model:value="action.icon"
                  :options="actionIconOptions"
                  placeholder="图标"
                  style="width: 80px"
                  @update:value="handleConfigChange"
                />
                <n-button size="small" type="error" quaternary @click="removeAction(index)">删除</n-button>
              </n-space>
            </div>
            <n-button size="small" type="dashed" style="width: 100%; margin-top: 8px" @click="addAction">
              添加操作
            </n-button>
          </div>
        </n-form-item>
      </n-card>

      <!-- 🎨 状态颜色配置 -->
      <n-card title="状态颜色配置" size="small" class="config-section">
        <n-form-item label="在线状态色">
          <n-color-picker
            v-model:value="localConfig.statusColors.online"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="离线状态色">
          <n-color-picker
            v-model:value="localConfig.statusColors.offline"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="警告状态色">
          <n-color-picker
            v-model:value="localConfig.statusColors.warning"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="错误状态色">
          <n-color-picker
            v-model:value="localConfig.statusColors.error"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-card>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * IoT设备状态卡片配置面板
 * 提供设备信息、显示设置、样式配置等选项
 */

import { ref, computed, watch } from 'vue'

interface DeviceAction {
  key: string
  label: string
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  icon?: string
  disabled?: boolean
}

interface Props {
  config: {
    deviceName?: string
    deviceType?: string
    deviceCategory?: string
    showLocation?: boolean
    showSignalStrength?: boolean
    showActions?: boolean
    iconSize?: number
    deviceIcon?: string
    maxMetricsDisplay?: number
    actions?: DeviceAction[]
    actionSize?: 'small' | 'medium' | 'large'
    backgroundColor?: string
    borderColor?: string
    borderRadius?: number
    textColor?: string
    headerColor?: string
    padding?: number
    minHeight?: number
    statusColors?: {
      online?: string
      offline?: string
      warning?: string
      error?: string
    }
  }
}

interface Emits {
  (e: 'update:config', config: any): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    deviceName: 'IoT设备',
    deviceType: '温湿度传感器',
    deviceCategory: 'sensor',
    showLocation: true,
    showSignalStrength: true,
    showActions: true,
    iconSize: 28,
    deviceIcon: 'sensor',
    maxMetricsDisplay: 4,
    actions: [
      { key: 'refresh', label: '刷新', type: 'default', icon: 'restart' },
      { key: 'configure', label: '配置', type: 'primary', icon: 'configure' }
    ],
    actionSize: 'small',
    backgroundColor: '#ffffff',
    borderColor: '#e6e6e6',
    borderRadius: 12,
    textColor: '#333333',
    headerColor: '#1a1a1a',
    padding: 16,
    minHeight: 280,
    statusColors: {
      online: '#52c41a',
      offline: '#ff4d4f',
      warning: '#faad14',
      error: '#ff4d4f'
    }
  })
})

const emit = defineEmits<Emits>()

// 本地配置副本
const localConfig = ref({ ...props.config })

// 监听属性变化，同步更新本地配置
watch(
  () => props.config,
  newConfig => {
    localConfig.value = { ...newConfig }
  },
  { deep: true }
)

// 选项数据
const deviceTypeOptions = [
  { label: '温湿度传感器', value: '温湿度传感器' },
  { label: 'GPS追踪器', value: 'GPS追踪器' },
  { label: 'LoRa网关', value: 'LoRa网关' },
  { label: '智能控制器', value: '智能控制器' },
  { label: '环境监测器', value: '环境监测器' },
  { label: '烟雾报警器', value: '烟雾报警器' },
  { label: '摄像头', value: '摄像头' },
  { label: '智能开关', value: '智能开关' }
]

const deviceIconOptions = [
  { label: '传感器', value: 'sensor' },
  { label: '网关', value: 'gateway' },
  { label: '控制器', value: 'controller' },
  { label: '显示器', value: 'display' },
  { label: '车辆', value: 'vehicle' },
  { label: '摄像头', value: 'camera' },
  { label: '温控器', value: 'thermostat' }
]

const actionSizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' }
]

const actionTypeOptions = [
  { label: '默认', value: 'default' },
  { label: '主要', value: 'primary' },
  { label: '信息', value: 'info' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' }
]

const actionIconOptions = [
  { label: '开始', value: 'start' },
  { label: '停止', value: 'stop' },
  { label: '重启', value: 'restart' },
  { label: '配置', value: 'configure' },
  { label: '信息', value: 'info' }
]

// 表单验证规则
const formRules = {
  deviceName: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 1, max: 50, message: '设备名称长度应为 1-50 个字符', trigger: 'blur' }
  ],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  maxMetricsDisplay: [{ type: 'number', min: 1, max: 8, message: '最大指标数量应为 1-8', trigger: 'blur' }],
  backgroundColor: [{ required: true, message: '请选择背景色', trigger: 'change' }],
  textColor: [{ required: true, message: '请选择文字色', trigger: 'change' }],
  borderColor: [{ required: true, message: '请选择边框色', trigger: 'change' }]
}

// 事件处理
const handleConfigChange = () => {
  emit('update:config', { ...localConfig.value })
}

const addAction = () => {
  if (!localConfig.value.actions) {
    localConfig.value.actions = []
  }
  localConfig.value.actions.push({
    key: `action_${Date.now()}`,
    label: '新操作',
    type: 'default',
    icon: 'configure'
  })
  handleConfigChange()
}

const removeAction = (index: number) => {
  if (localConfig.value.actions) {
    localConfig.value.actions.splice(index, 1)
    handleConfigChange()
  }
}
</script>

<style scoped>
.iot-device-status-config {
  padding: 0;
}

.config-section {
  margin-bottom: 16px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.actions-config {
  width: 100%;
}

.action-item {
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-color);
}

.action-item:last-child {
  margin-bottom: 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .action-item .n-space {
    flex-direction: column;
    align-items: stretch !important;
  }

  .action-item .n-input,
  .action-item .n-select {
    width: 100% !important;
  }
}
</style>
