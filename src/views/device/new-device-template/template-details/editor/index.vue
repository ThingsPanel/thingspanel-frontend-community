<script setup lang="ts">
/**
 * 模板编辑器页面
 * 5步流程：模板信息 → 模型定义 → Web图表 → App图表 → 完成
 */

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NSteps, NStep, NButton } from 'naive-ui'
import { $t } from '@/locales'
import SvgIcon from '@/components/custom/svg-icon.vue'
import StepTemplateInfo from './step-template-info.vue'
import StepModelDefinition from './step-model-definition.vue'
import StepWebChart from './step-web-chart.vue'
import StepAppChart from './step-app-chart.vue'
import StepPublish from './step-publish.vue'

const route = useRoute()
const router = useRouter()

// 当前步骤 (1-5)
const stepCurrent = ref<number>(1)

// 从路由获取模板ID（编辑模式）
const templateId = computed(() => {
  const id = route.query.id
  return typeof id === 'string' ? id : ''
})

// 编辑类型
const editorType = computed<'add' | 'edit'>(() => {
  return templateId.value ? 'edit' : 'add'
})

// 设备模板ID（步骤1保存后获得）
const deviceTemplateId = ref<string>(templateId.value)

// 步骤组件映射（根据新增/编辑模式动态生成）
const componentsList = computed(() => {
  if (editorType.value === 'add') {
    // 新增模式：只有3步（模板信息 → 模型定义 → 完成）
    return [
      { id: 1, components: StepTemplateInfo },
      { id: 2, components: StepModelDefinition },
      { id: 3, components: StepPublish }
    ]
  } else {
    // 编辑模式：完整5步
    return [
      { id: 1, components: StepTemplateInfo },
      { id: 2, components: StepModelDefinition },
      { id: 3, components: StepWebChart },
      { id: 4, components: StepAppChart },
      { id: 5, components: StepPublish }
    ]
  }
})

const CurrentStepComponent = computed(() => {
  return componentsList.value.find(item => item.id === stepCurrent.value)?.components
})

const title = computed(() => {
  const titles: Record<'add' | 'edit', string> = {
    add: $t('device_template.addThingModel'),
    edit: $t('device_template.editThingModel')
  }
  return titles[editorType.value]
})

// 返回列表
const handleBack = () => {
  router.push({ name: 'device_new-device-template_template-list' })
}

// 模态框可见性控制（用于步骤组件的取消按钮）
const modalVisible = computed({
  get() {
    return true
  },
  set(value) {
    if (!value) {
      handleBack()
    }
  }
})

onMounted(() => {
  // 初始化时如果是编辑模式，设置deviceTemplateId
  if (templateId.value) {
    deviceTemplateId.value = templateId.value
  }
})
</script>

<template>
  <div class="template-editor-page">
    <NCard :bordered="false">
      <template #header>
        <div class="page-header">
          <div class="header-left">
            <NButton text @click="handleBack">
              <template #icon>
                <SvgIcon local-icon="arrow-left" />
              </template>
            </NButton>
            <span class="page-title">{{ title }}</span>
          </div>
        </div>
      </template>

      <!-- 步骤指示器 -->
      <NSteps :current="stepCurrent" status="process" class="steps-container">
        <!-- 新增模式：3步 -->
        <template v-if="editorType === 'add'">
          <NStep :title="$t('device_template.templateInfo')" :description="$t('device_template.addDeviceInfo')" />
          <NStep
            :title="$t('device_template.modelDefinition')"
            :description="$t('device_template.deviceParameterDescribe')"
          />
          <NStep :title="$t('device_template.release')" :description="$t('device_template.releaseAppStore')" />
        </template>

        <!-- 编辑模式：5步 -->
        <template v-else>
          <NStep :title="$t('device_template.templateInfo')" :description="$t('device_template.addDeviceInfo')" />
          <NStep
            :title="$t('device_template.modelDefinition')"
            :description="$t('device_template.deviceParameterDescribe')"
          />
          <NStep
            :title="$t('device_template.webChartConfiguration')"
            :description="$t('device_template.bindTheCorrespondingChart')"
          />
          <NStep
            :title="$t('device_template.appChartConfiguration')"
            :description="$t('device_template.editAppDetailsPage')"
          />
          <NStep :title="$t('device_template.release')" :description="$t('device_template.releaseAppStore')" />
        </template>
      </NSteps>

      <!-- 步骤内容 -->
      <div class="step-content">
        <component
          :is="CurrentStepComponent"
          v-model:stepCurrent="stepCurrent"
          v-model:modalVisible="modalVisible"
          v-model:deviceTemplateId="deviceTemplateId"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.template-editor-page {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.steps-container {
  margin: 24px 0;
}

.step-content {
  margin-top: 32px;
}
</style>
