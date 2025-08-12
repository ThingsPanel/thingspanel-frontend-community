<!--
  ConfigWrapper 测试组件
  用于验证配置绑定和更新机制是否正常工作
-->

<script setup lang="ts">
import { ref, reactive, defineAsyncComponent, computed } from 'vue'
import { useMessage } from 'naive-ui'
import ConfigWrapper from './ConfigWrapper.vue'
import type { IComponentDefinition } from '@/card2.1/core/types'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ConfigWrapperTest')
const message = useMessage()

// ====== 测试配置 ======

// 模拟一个 Card 2.1 组件定义
const testComponentDefinition: IComponentDefinition = {
  id: 'test-switch',
  component: null,
  meta: {
    name: 'test-switch',
    title: '测试开关',
    description: '用于测试配置绑定的开关组件',
    category: 'control',
    icon: 'mdi:toggle-switch',
    version: '1.0.0'
  },
  properties: {
    title: {
      type: 'string',
      label: '标题',
      default: '测试开关'
    },
    active0: {
      type: 'string',
      label: '开启值',
      default: '1'
    },
    active1: {
      type: 'string',
      label: '关闭值',
      default: '0'
    }
  }
}

// 模拟 Card 2.1 switch 配置组件
const TestSwitchConfig = defineAsyncComponent(() => import('@/card2.1/components/control/switch/switch-config.vue'))

// ====== 测试状态 ======

const currentConfig = ref({
  title: '我的开关',
  active0: '开启',
  active1: '关闭'
})

const configHistory = ref<Array<{ timestamp: number; config: any }>>([])

// ====== 事件处理 ======

function onConfigChange(newConfig: Record<string, any>) {
  logger.info('配置变更:', newConfig)
  message.info('配置已更新')

  // 记录配置历史
  configHistory.value.push({
    timestamp: Date.now(),
    config: { ...newConfig }
  })

  // 限制历史记录数量
  if (configHistory.value.length > 10) {
    configHistory.value.shift()
  }
}

function onValidationChange(isValid: boolean, errors: string[]) {
  logger.info('验证状态变更:', { isValid, errors })
  if (!isValid) {
    message.error(`配置验证失败: ${errors.join(', ')}`)
  }
}

function onComponentLoaded(component: any) {
  logger.info('配置组件已加载:', component)
  message.success('配置组件加载成功')
}

function onComponentError(error: string) {
  logger.error('配置组件加载错误:', error)
  message.error(`配置组件加载失败: ${error}`)
}

function onConfigReset(newConfig: Record<string, any>) {
  logger.info('配置已重置:', newConfig)
  message.info('配置已重置到默认值')
}

// ====== 测试方法 ======

function resetConfig() {
  currentConfig.value = {
    title: '重置开关',
    active0: '1',
    active1: '0'
  }
  message.success('配置已重置')
}

function updateConfigProgrammatically() {
  currentConfig.value = {
    ...currentConfig.value,
    title: `程序更新 ${Date.now()}`,
    active0: 'ON',
    active1: 'OFF'
  }
  message.success('已通过程序更新配置')
}

function clearHistory() {
  configHistory.value = []
  message.success('历史记录已清空')
}

// ====== 计算属性 ======

const configStr = computed(() => JSON.stringify(currentConfig.value, null, 2))
</script>

<template>
  <div class="config-wrapper-test p-6 space-y-6">
    <div class="test-header">
      <h2 class="text-2xl font-bold mb-4">ConfigWrapper 测试</h2>
      <div class="flex gap-2 mb-4">
        <n-button type="primary" @click="resetConfig">重置配置</n-button>
        <n-button type="info" @click="updateConfigProgrammatically">程序更新</n-button>
        <n-button type="warning" @click="clearHistory">清空历史</n-button>
      </div>
    </div>

    <div class="test-content grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 配置组件测试区域 -->
      <div class="config-area">
        <n-card title="配置组件" class="h-full">
          <ConfigWrapper
            v-model="currentConfig"
            :component-definition="testComponentDefinition"
            :config-component="TestSwitchConfig"
            :preview="false"
            :legacy-mode="true"
            @config-change="onConfigChange"
            @validation-change="onValidationChange"
            @component-loaded="onComponentLoaded"
            @component-error="onComponentError"
            @config-reset="onConfigReset"
          />
        </n-card>
      </div>

      <!-- 状态显示区域 -->
      <div class="state-area space-y-4">
        <!-- 当前配置 -->
        <n-card title="当前配置" size="small">
          <pre class="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">{{ configStr }}</pre>
        </n-card>

        <!-- 配置历史 -->
        <n-card title="配置历史" size="small">
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="(item, index) in configHistory.slice().reverse()"
              :key="index"
              class="text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
            >
              <div class="font-medium text-blue-600 dark:text-blue-400">
                {{ new Date(item.timestamp).toLocaleTimeString() }}
              </div>
              <pre class="mt-1 text-gray-600 dark:text-gray-400">{{ JSON.stringify(item.config, null, 2) }}</pre>
            </div>
            <div v-if="configHistory.length === 0" class="text-gray-500 text-center py-4">暂无历史记录</div>
          </div>
        </n-card>

        <!-- 测试说明 -->
        <n-card title="测试说明" size="small">
          <div class="text-sm space-y-2">
            <p><strong>测试项目：</strong></p>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>配置组件内部修改是否能正确同步到外部</li>
              <li>外部程序修改配置是否能正确同步到组件内部</li>
              <li>配置变更事件是否正确触发</li>
              <li>配置验证机制是否正常工作</li>
              <li>历史记录是否正确记录配置变更</li>
            </ul>
            <p class="mt-3"><strong>操作方法：</strong></p>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>在左侧配置组件中修改值，观察右侧是否同步更新</li>
              <li>点击"程序更新"按钮，观察左侧组件是否同步更新</li>
              <li>点击"重置配置"按钮，观察整体同步情况</li>
            </ul>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-wrapper-test {
  min-height: 100vh;
  background: var(--n-color-body);
}

.test-content {
  min-height: 600px;
}

.config-area {
  min-height: 400px;
}

.state-area {
  min-height: 400px;
}

pre {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
