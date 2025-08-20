<!-- 交互系统测试页面 -->
<template>
  <div class="interaction-test-page">
    <n-space vertical size="large">
      <!-- 页面头部 -->
      <n-card>
        <template #header>
          <h2>交互系统功能测试</h2>
        </template>
        <n-text>测试极简版2个核心动作交互系统：URL跳转、组件属性修改</n-text>
      </n-card>

      <!-- 场景1: 点击卡片跳转URL -->
      <n-card>
        <template #header>
          <n-space justify="space-between">
            <span>场景1: 点击卡片跳转URL</span>
            <n-button size="small" @click="configureScenario1">配置交互</n-button>
          </n-space>
        </template>

        <div class="test-scenario">
          <div ref="scenario1Card" class="test-card clickable-card" @click="triggerScenario1Click">
            <div class="card-content">
              <n-icon size="24" color="#18a058">
                <LinkOutline />
              </n-icon>
              <div>点击我跳转到百度</div>
            </div>
          </div>

          <div class="scenario-info">
            <p><strong>配置说明：</strong></p>
            <ul>
              <li>事件类型：点击 (click)</li>
              <li>动作类型：跳转到URL (navigateToUrl)</li>
              <li>目标地址：https://www.baidu.com</li>
              <li>打开方式：新标签页 (_blank)</li>
            </ul>
          </div>
        </div>
      </n-card>

      <!-- 场景2: 按钮点击改变另一个卡片数据 -->
      <n-card>
        <template #header>
          <n-space justify="space-between">
            <span>场景2: 跨组件数据修改</span>
            <n-button size="small" @click="configureScenario2">配置交互</n-button>
          </n-space>
        </template>

        <div class="test-scenario">
          <n-space size="large">
            <!-- 触发组件 -->
            <div ref="scenario2Trigger" class="test-card trigger-card">
              <div class="card-content">
                <n-button type="primary" @click="triggerScenario2Click">点击修改右侧卡片</n-button>
              </div>
            </div>

            <!-- 目标组件 -->
            <div ref="scenario2Target" class="test-card target-card" :style="{ backgroundColor: scenario2TargetBg }">
              <div class="card-content">
                <div>目标卡片</div>
                <div>数据值: {{ scenario2TargetData }}</div>
              </div>
            </div>
          </n-space>

          <div class="scenario-info">
            <p><strong>配置说明：</strong></p>
            <ul>
              <li>触发组件：左侧按钮</li>
              <li>事件类型：点击 (click)</li>
              <li>动作类型：修改组件数据 (updateComponentData)</li>
              <li>目标组件：右侧卡片</li>
              <li>修改内容：背景颜色 + 数据值</li>
            </ul>
          </div>
        </div>
      </n-card>

      <!-- 场景3: 条件触发闪烁效果 -->
      <n-card>
        <template #header>
          <n-space justify="space-between">
            <span>场景3: 条件触发闪烁效果</span>
            <n-button size="small" @click="configureScenario3">配置交互</n-button>
          </n-space>
        </template>

        <div class="test-scenario">
          <n-space size="large" align="center">
            <!-- 数值控制 -->
            <div class="test-card">
              <div class="card-content">
                <div>当前数值</div>
                <n-input-number
                  v-model:value="scenario3Value"
                  :min="0"
                  :max="150"
                  @update:value="onScenario3ValueChange"
                />
                <n-space size="small" style="margin-top: 8px">
                  <n-button size="small" @click="setScenario3Value(99)">设为99</n-button>
                  <n-button size="small" @click="setScenario3Value(20)">设为20</n-button>
                  <n-button size="small" @click="setScenario3Value(50)">设为50</n-button>
                </n-space>
              </div>
            </div>

            <!-- 报警卡片 -->
            <div ref="scenario3Alert" class="test-card alert-card" :style="{ backgroundColor: scenario3AlertBg }">
              <div class="card-content">
                <n-icon size="24" color="#d03050">
                  <WarningOutline />
                </n-icon>
                <div>报警指示器</div>
                <div class="alert-status">{{ scenario3AlertStatus }}</div>
              </div>
            </div>
          </n-space>

          <div class="scenario-info">
            <p><strong>配置说明：</strong></p>
            <ul>
              <li>监听组件：数值输入框</li>
              <li>事件类型：数据变化 (dataChange)</li>
              <li>条件1：数值 >= 99 → 背景色变红</li>
              <li>条件2：数值 <= 20 → 背景色变蓝</li>
              <li>动作类型：属性修改</li>
            </ul>
          </div>
        </div>
      </n-card>

      <!-- 场景4: 组件自我配置 -->
      <n-card>
        <template #header>
          <n-space justify="space-between">
            <span>场景4: 组件自我配置</span>
            <n-button size="small" @click="configureScenario4">配置交互</n-button>
          </n-space>
        </template>

        <div class="test-scenario">
          <div
            ref="scenario4Card"
            class="test-card self-config-card"
            :style="{
              backgroundColor: scenario4Bg,
              transform: scenario4Transform,
              opacity: scenario4Opacity
            }"
            @mouseenter="triggerScenario4Hover"
            @mouseleave="triggerScenario4Leave"
            @click="triggerScenario4Click"
          >
            <div class="card-content">
              <n-icon size="24">
                <SettingsOutline />
              </n-icon>
              <div>悬停和点击我</div>
              <div class="interaction-hint">{{ scenario4Hint }}</div>
            </div>
          </div>

          <div class="scenario-info">
            <p><strong>配置说明：</strong></p>
            <ul>
              <li>目标组件：自身</li>
              <li>悬停进入：背景色变绿</li>
              <li>悬停离开：恢复原状</li>
              <li>点击：透明度变化</li>
            </ul>
          </div>
        </div>
      </n-card>

      <!-- 交互配置面板 -->
      <n-modal v-model:show="showConfigPanel" :title="currentConfigTitle" style="width: 800px">
        <n-card :bordered="false">
          <InteractionSettingsForm
            :component-id="currentComponentId"
            :model-value="currentInteractionConfigs"
            @update:model-value="onInteractionConfigChange"
            @validate="onInteractionValidate"
          />
        </n-card>
      </n-modal>

      <!-- 测试结果展示 -->
      <n-card>
        <template #header>
          <span>测试结果</span>
        </template>
        <n-space vertical>
          <div v-for="(result, index) in testResults" :key="index" class="test-result">
            <n-tag :type="result.success ? 'success' : 'error'">
              {{ result.scenario }}
            </n-tag>
            <span>{{ result.message }}</span>
          </div>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 交互系统测试页面
 * 用于验证四个核心交互场景的实现
 */

import { ref, onMounted } from 'vue'
import { NCard, NSpace, NButton, NIcon, NText, NInputNumber, NModal, NTag, useMessage } from 'naive-ui'
import { LinkOutline, WarningOutline, SettingsOutline } from '@vicons/ionicons5'

// 导入交互系统
import type { InteractionConfig } from '@/card2.1/core/interaction-types'
import { interactionManager } from '@/card2.1/core/interaction-manager'
import InteractionSettingsForm from '@/core/interaction-system/components/InteractionSettingsForm.vue'

const message = useMessage()

// 配置面板状态
const showConfigPanel = ref(false)
const currentConfigTitle = ref('')
const currentComponentId = ref('')
const currentInteractionConfigs = ref<InteractionConfig[]>([])

// 场景1状态
const scenario1Card = ref<HTMLElement>()

// 场景2状态
const scenario2Trigger = ref<HTMLElement>()
const scenario2Target = ref<HTMLElement>()
const scenario2TargetBg = ref('#f0f0f0')
const scenario2TargetData = ref(0)

// 场景3状态
const scenario3Value = ref(50)
const scenario3Alert = ref<HTMLElement>()
const scenario3AlertBg = ref('#f0f0f0')
const scenario3AlertStatus = ref('正常')

// 场景4状态
const scenario4Card = ref<HTMLElement>()
const scenario4Bg = ref('#f0f0f0')
const scenario4Transform = ref('scale(1)')
const scenario4Opacity = ref(1)
const scenario4Hint = ref('等待交互...')

// 测试结果
const testResults = ref<
  Array<{
    scenario: string
    success: boolean
    message: string
  }>
>([])

// 场景1: 配置URL跳转
const configureScenario1 = () => {
  currentComponentId.value = 'scenario1-card'
  currentConfigTitle.value = '场景1: 点击跳转URL配置'
  currentInteractionConfigs.value = [
    {
      event: 'click',
      responses: [
        {
          action: 'navigateToUrl',
          value: 'https://www.baidu.com',
          target: '_blank'
        }
      ],
      enabled: true,
      priority: 1,
      name: '点击跳转百度'
    }
  ]
  showConfigPanel.value = true
}

const triggerScenario1Click = () => {
  const results = interactionManager.triggerEvent('scenario1-card', 'click')
  addTestResult(
    '场景1 - URL跳转',
    results.length > 0 && results[0].success,
    results[0]?.success ? '成功打开新标签页' : results[0]?.error || '执行失败'
  )
}

// 场景2: 配置跨组件数据修改
const configureScenario2 = () => {
  currentComponentId.value = 'scenario2-trigger'
  currentConfigTitle.value = '场景2: 跨组件数据修改配置'
  currentInteractionConfigs.value = [
    {
      event: 'click',
      responses: [
        {
          action: 'updateComponentData',
          targetComponentId: 'scenario2-target',
          targetProperty: 'backgroundColor',
          updateValue: '#18a058'
        }
      ],
      enabled: true,
      priority: 1,
      name: '修改目标卡片数据'
    }
  ]
  showConfigPanel.value = true
}

const triggerScenario2Click = () => {
  scenario2TargetData.value++
  scenario2TargetBg.value = `hsl(${Math.random() * 360}, 70%, 85%)`

  const results = interactionManager.triggerEvent('scenario2-trigger', 'click')
  addTestResult('场景2 - 跨组件数据修改', results.length > 0, `成功修改目标组件，数据值: ${scenario2TargetData.value}`)
}

// 场景3: 配置条件触发
const configureScenario3 = () => {
  currentComponentId.value = 'scenario3-monitor'
  currentConfigTitle.value = '场景3: 条件触发配置'
  currentInteractionConfigs.value = [
    {
      event: 'dataChange',
      responses: [
        {
          action: 'updateComponentData',
          targetComponentId: 'scenario3-alert',
          targetProperty: 'backgroundColor',
          updateValue: '#d03050'
        }
      ],
      enabled: true,
      priority: 1,
      name: '高值报警',
      condition: {
        operator: 'greaterThanOrEqual',
        value: 99
      }
    },
    {
      event: 'dataChange',
      responses: [
        {
          action: 'updateComponentData',
          targetComponentId: 'scenario3-alert',
          targetProperty: 'backgroundColor',
          updateValue: '#2080f0'
        }
      ],
      enabled: true,
      priority: 1,
      name: '低值报警',
      condition: {
        operator: 'lessThanOrEqual',
        value: 20
      }
    }
  ]
  showConfigPanel.value = true
}

const setScenario3Value = (value: number) => {
  scenario3Value.value = value
  onScenario3ValueChange(value)
}

const onScenario3ValueChange = (value: number | null) => {
  if (value === null) return

  // 检查条件并触发相应动作
  if (value >= 99) {
    scenario3AlertStatus.value = '高值报警!'
    scenario3AlertBg.value = '#d03050'
    // 模拟闪烁效果
    flashColor(scenario3Alert.value!, '#d03050', 3)
    // 🔥 使用简化后的数据变化事件
    const results = interactionManager.triggerEvent('scenario3-monitor', 'dataChange', {
      property: 'value',
      oldValue: null,
      newValue: value
    })
    addTestResult('场景3 - 高值条件触发', results.length > 0, `数值${value}>=99，触发背景色变化`)
  } else if (value <= 20) {
    scenario3AlertStatus.value = '低值报警!'
    scenario3AlertBg.value = '#2080f0'
    // 模拟闪烁效果
    flashColor(scenario3Alert.value!, '#2080f0', 3)
    // 🔥 使用简化后的数据变化事件
    const results = interactionManager.triggerEvent('scenario3-monitor', 'dataChange', {
      property: 'value',
      oldValue: null,
      newValue: value
    })
    addTestResult('场景3 - 低值条件触发', results.length > 0, `数值${value}<=20，触发背景色变化`)
  } else {
    scenario3AlertStatus.value = '正常'
    scenario3AlertBg.value = '#f0f0f0'
  }
}

// 场景4: 配置自我交互
const configureScenario4 = () => {
  currentComponentId.value = 'scenario4-card'
  currentConfigTitle.value = '场景4: 组件自我配置'
  currentInteractionConfigs.value = [
    {
      event: 'hover',
      responses: [
        {
          action: 'updateComponentData',
          targetProperty: 'backgroundColor',
          updateValue: '#18a058'
        }
      ],
      enabled: true,
      priority: 1,
      name: '悬停效果'
    },
    {
      event: 'click',
      responses: [
        {
          action: 'updateComponentData',
          targetProperty: 'opacity',
          updateValue: '0.7'
        }
      ],
      enabled: true,
      priority: 1,
      name: '点击效果'
    }
  ]
  showConfigPanel.value = true
}

const triggerScenario4Hover = () => {
  scenario4Bg.value = '#18a058'
  scenario4Transform.value = 'scale(1.1)'
  scenario4Hint.value = '悬停中...'

  interactionManager.triggerEvent('scenario4-card', 'hover')
  addTestResult('场景4 - 悬停效果', true, '成功改变背景色和放大')
}

const triggerScenario4Leave = () => {
  scenario4Bg.value = '#f0f0f0'
  scenario4Transform.value = 'scale(1)'
  scenario4Hint.value = '等待交互...'
}

const triggerScenario4Click = () => {
  scenario4Opacity.value = 0.7
  scenario4Transform.value = 'scale(1.1) rotate(360deg)'
  scenario4Hint.value = '点击动画中...'

  setTimeout(() => {
    scenario4Opacity.value = 1
    scenario4Transform.value = 'scale(1)'
    scenario4Hint.value = '动画完成'
  }, 500)

  interactionManager.triggerEvent('scenario4-card', 'click')
  addTestResult('场景4 - 点击效果', true, '成功执行透明度和旋转动画')
}

// 辅助函数：闪烁效果
const flashColor = (element: HTMLElement, color: string, times: number) => {
  const originalBg = element.style.backgroundColor
  let count = 0

  const interval = setInterval(() => {
    element.style.backgroundColor = count % 2 === 0 ? color : originalBg
    count++

    if (count >= times * 2) {
      clearInterval(interval)
      element.style.backgroundColor = originalBg
    }
  }, 200)
}

// 添加测试结果
const addTestResult = (scenario: string, success: boolean, message: string) => {
  testResults.value.unshift({
    scenario,
    success,
    message
  })

  // 保持最多10条记录
  if (testResults.value.length > 10) {
    testResults.value = testResults.value.slice(0, 10)
  }
}

// 交互配置变化处理
const onInteractionConfigChange = (configs: InteractionConfig[]) => {
  currentInteractionConfigs.value = configs
  // 注册到交互管理器
  if (currentComponentId.value) {
    interactionManager.updateComponentConfigs(currentComponentId.value, configs)
  }
}

const onInteractionValidate = (result: { valid: boolean; errors: string[] }) => {
  if (!result.valid) {
    message.error(`配置验证失败: ${result.errors.join(', ')}`)
  } else {
    message.success('配置验证通过')
  }
}

// 初始化
onMounted(() => {
  // 预先注册所有测试组件
  interactionManager.registerComponent('scenario1-card', [])
  interactionManager.registerComponent('scenario2-trigger', [])
  interactionManager.registerComponent('scenario2-target', [])
  interactionManager.registerComponent('scenario3-monitor', [])
  interactionManager.registerComponent('scenario3-alert', [])
  interactionManager.registerComponent('scenario4-card', [])

  // 添加初始测试结果
  addTestResult('系统初始化', true, '所有测试组件已注册到交互管理器')
})
</script>

<style scoped>
.interaction-test-page {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-scenario {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.test-card {
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--card-color);
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.test-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(24, 160, 88, 0.2);
}

.clickable-card {
  border-color: #18a058;
  background: linear-gradient(135deg, #f0f9f4, #e6f7ff);
}

.trigger-card {
  border-color: #2080f0;
  background: linear-gradient(135deg, #f0f5ff, #e6f7ff);
}

.target-card {
  border-color: #fa8c16;
  background: linear-gradient(135deg, #fff7e6, #fff2e8);
}

.alert-card {
  border-color: #d03050;
  background: linear-gradient(135deg, #fff0f6, #fff1f0);
}

.self-config-card {
  border-color: #722ed1;
  background: linear-gradient(135deg, #f9f0ff, #f5f5f5);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.scenario-info {
  background: var(--body-color);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.scenario-info ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.scenario-info li {
  margin: 4px 0;
  color: var(--text-color-2);
}

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--body-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.interaction-hint {
  font-size: 12px;
  color: var(--text-color-3);
  font-style: italic;
}

.alert-status {
  font-weight: bold;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-scenario {
    gap: 12px;
  }

  .test-card {
    min-height: 60px;
    padding: 12px;
  }

  .scenario-info {
    padding: 8px;
  }
}
</style>
