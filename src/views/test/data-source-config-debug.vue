<template>
  <div class="debug-container">
    <n-card title="🔧 数据源配置系统调试" size="small">
      <!-- 系统初始化状态 -->
      <div class="debug-section">
        <h3>Card2.1 系统状态</h3>
        <n-descriptions :column="2" size="small" bordered>
          <n-descriptions-item label="系统初始化">
            <n-tag :type="isCard2Initialized ? 'success' : 'error'">
              {{ isCard2Initialized ? '✅ 已初始化' : '❌ 未初始化' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="注册组件数量">
            <n-tag type="info">{{ registeredComponentsCount }} 个</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="测试组件数量">
            <n-tag type="primary">{{ testComponentsCount }} 个</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="数据需求注册">
            <n-tag :type="dataRequirementsCount > 0 ? 'success' : 'warning'">{{ dataRequirementsCount }} 个组件</n-tag>
          </n-descriptions-item>
        </n-descriptions>

        <n-space style="margin-top: 12px">
          <n-button size="small" type="primary" @click="initializeSystem">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            重新初始化
          </n-button>
          <n-button size="small" @click="refreshDebugInfo">
            <template #icon>
              <n-icon><SyncOutline /></n-icon>
            </template>
            刷新信息
          </n-button>
        </n-space>
      </div>

      <!-- 已注册的测试组件 -->
      <div class="debug-section">
        <h3>测试组件列表</h3>
        <div v-if="testComponents.length === 0" class="no-data">
          <n-empty description="没有找到测试组件" size="small">
            <template #extra>
              <n-text depth="3">请检查 Card2.1 系统初始化状态</n-text>
            </template>
          </n-empty>
        </div>
        <div v-else class="components-grid">
          <n-card
            v-for="component in testComponents"
            :key="component.type"
            size="small"
            hoverable
            class="component-card"
          >
            <template #header>
              <div class="component-header">
                <span class="component-name">{{ component.name }}</span>
                <n-tag size="tiny">{{ component.type }}</n-tag>
              </div>
            </template>

            <div class="component-info">
              <p>
                <strong>描述:</strong>
                {{ component.description }}
              </p>
              <p>
                <strong>分类:</strong>
                {{ component.category }}
              </p>
              <p>
                <strong>数据源:</strong>
                {{ component.supportedDataSources?.join(', ') || '无' }}
              </p>
            </div>

            <template #action>
              <n-space size="small">
                <n-button size="tiny" @click="goToVisualEditor">添加到编辑器</n-button>
                <n-button size="tiny" type="info" @click="showRequirements(component)">查看需求</n-button>
              </n-space>
            </template>
          </n-card>
        </div>
      </div>

      <!-- 快速访问 -->
      <div class="debug-section">
        <h3>快速访问</h3>
        <n-space>
          <n-button type="primary" @click="goToVisualEditor">
            <template #icon>
              <n-icon><DesktopOutline /></n-icon>
            </template>
            Visual Editor 测试页面
          </n-button>
          <n-button @click="goToDataBindingTest">
            <template #icon>
              <n-icon><LayersOutline /></n-icon>
            </template>
            数据绑定系统测试
          </n-button>
        </n-space>
      </div>

      <!-- 当前问题诊断 -->
      <div class="debug-section">
        <h3>问题诊断</h3>
        <n-alert v-if="!isCard2Initialized" type="warning" title="系统未初始化">
          Card2.1 系统尚未初始化，这可能导致组件无法加载。请点击"重新初始化"按钮。
        </n-alert>

        <n-alert v-else-if="testComponentsCount === 0" type="error" title="没有测试组件">
          虽然系统已初始化，但没有找到测试组件。可能的原因：
          <ul style="margin-top: 8px">
            <li>组件注册失败</li>
            <li>模块导入问题</li>
            <li>权限过滤问题</li>
          </ul>
        </n-alert>

        <n-alert v-else-if="dataRequirementsCount === 0" type="warning" title="数据需求未注册">
          测试组件已加载，但数据需求未注册，这可能影响数据源配置功能。
        </n-alert>

        <n-alert v-else type="success" title="系统状态正常">
          所有组件和数据需求都已正确加载，可以正常使用数据源配置功能。
        </n-alert>
      </div>
    </n-card>

    <!-- 数据需求详情弹窗 -->
    <n-modal v-model:show="showRequirementsModal" title="组件数据需求">
      <n-card style="width: 600px" :title="selectedComponent?.name">
        <div v-if="selectedComponentRequirements" class="modal-requirements">
          <n-descriptions :column="1" size="small" bordered>
            <n-descriptions-item label="组件ID">{{ selectedComponentRequirements.componentId }}</n-descriptions-item>
            <n-descriptions-item label="组件名称">
              {{ selectedComponentRequirements.componentName }}
            </n-descriptions-item>
            <n-descriptions-item label="数据源范围">
              {{ selectedComponentRequirements.minDataSources }} - {{ selectedComponentRequirements.maxDataSources }} 个
            </n-descriptions-item>
          </n-descriptions>

          <div style="margin-top: 16px">
            <h4>数据源需求详情:</h4>
            <n-collapse>
              <n-collapse-item
                v-for="(dataSource, index) in selectedComponentRequirements.dataSources"
                :key="index"
                :title="`${dataSource.name} (${dataSource.structureType})`"
              >
                <p>
                  <strong>ID:</strong>
                  {{ dataSource.id }}
                </p>
                <p>
                  <strong>必填:</strong>
                  {{ dataSource.required ? '是' : '否' }}
                </p>
                <p>
                  <strong>描述:</strong>
                  {{ dataSource.description }}
                </p>
                <p>
                  <strong>用途:</strong>
                  {{ dataSource.usage }}
                </p>

                <div v-if="dataSource.fields?.length > 0">
                  <h5>字段要求 ({{ dataSource.fields.length }} 个):</h5>
                  <div v-for="field in dataSource.fields" :key="field.name" class="field-item">
                    <strong>{{ field.name }}</strong>
                    ({{ field.type }})
                    <span v-if="field.required" style="color: var(--error-color)">*必填</span>
                    <br />
                    <small>{{ field.description }}</small>
                    <br />
                    <small v-if="field.example">
                      示例:
                      <code>{{ field.example }}</code>
                    </small>
                  </div>
                </div>
              </n-collapse-item>
            </n-collapse>
          </div>
        </div>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NSpace,
  NButton,
  NIcon,
  NEmpty,
  NText,
  NAlert,
  NCollapse,
  NCollapseItem,
  NModal,
  useMessage
} from 'naive-ui'
import { RefreshOutline, SyncOutline, DesktopOutline, LayersOutline } from '@vicons/ionicons5'

// Card2.1 相关导入
import { initializeCard2System, getComponentRegistry } from '@/card2.1'
import { getTestComponents } from '@/card2.1/components'
import {
  componentDataRequirementsRegistry,
  getComponentDataRequirements
} from '@/components/visual-editor/core/component-data-requirements'

const router = useRouter()
const message = useMessage()

// 响应式状态
const isCard2Initialized = ref(false)
const registeredComponentsCount = ref(0)
const testComponentsCount = ref(0)
const dataRequirementsCount = ref(0)
const testComponents = ref<any[]>([])
const showRequirementsModal = ref(false)
const selectedComponent = ref<any>(null)
const selectedComponentRequirements = ref<any>(null)

/**
 * 初始化系统
 */
const initializeSystem = async () => {
  try {
    message.loading('正在初始化系统...')
    await initializeCard2System()
    isCard2Initialized.value = true
    refreshDebugInfo()
    message.success('系统初始化成功')
  } catch (error) {
    console.error('系统初始化失败:', error)
    message.error(`系统初始化失败: ${error}`)
  }
}

/**
 * 刷新调试信息
 */
const refreshDebugInfo = () => {
  try {
    // 获取注册表信息
    const registry = getComponentRegistry()
    const allComponents = registry.getAll()
    registeredComponentsCount.value = allComponents.length

    // 获取测试组件
    const testComps = getTestComponents()
    testComponents.value = testComps
    testComponentsCount.value = testComps.length

    // 获取数据需求信息
    const allComponentIds = componentDataRequirementsRegistry.getAllComponentIds()
    dataRequirementsCount.value = allComponentIds.length

    console.log('🔍 [Debug] 调试信息已刷新:', {
      registeredComponents: registeredComponentsCount.value,
      testComponents: testComponentsCount.value,
      dataRequirements: dataRequirementsCount.value
    })
  } catch (error) {
    console.error('刷新调试信息失败:', error)
    message.error(`刷新调试信息失败: ${error}`)
  }
}

/**
 * 显示组件数据需求
 */
const showRequirements = (component: any) => {
  const req = getComponentDataRequirements(component.type)
  if (req) {
    selectedComponent.value = component
    selectedComponentRequirements.value = req
    showRequirementsModal.value = true
  } else {
    message.warning('该组件没有数据需求声明')
  }
}

/**
 * 跳转到Visual Editor
 */
const goToVisualEditor = () => {
  router.push('/test/editor-integration')
}

/**
 * 跳转到数据绑定测试
 */
const goToDataBindingTest = () => {
  router.push('/test/data-binding-system-integration')
}

// 页面加载时初始化
onMounted(async () => {
  await initializeSystem()
})
</script>

<style scoped>
.debug-container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.debug-section {
  margin-bottom: 24px;
}

.debug-section h3 {
  margin: 0 0 12px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.no-data {
  text-align: center;
  padding: 40px 0;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.component-card {
  height: fit-content;
}

.component-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.component-name {
  font-weight: 600;
  flex: 1;
}

.component-info {
  font-size: 12px;
  line-height: 1.4;
}

.component-info p {
  margin: 4px 0;
}

.field-item {
  padding: 8px;
  border-left: 3px solid var(--primary-color);
  margin: 4px 0;
  background: var(--hover-color);
  border-radius: 4px;
}

.modal-requirements code {
  background: var(--code-color);
  padding: 2px 4px;
  border-radius: 2px;
  font-family: monospace;
  font-size: 11px;
}
</style>
