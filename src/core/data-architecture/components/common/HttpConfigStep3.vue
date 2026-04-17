<!--
  HTTP配置第3步 - 参数配置组件
  配置查询参数和路径参数
  ✨ 优化：添加接口模板智能推荐卡片
-->
<script setup lang="ts">
/**
 * HttpConfigStep3 - HTTP参数配置步骤（UI优化版）
 * 包含查询参数和路径参数的配置
 *
 * 🎯 优化3：接口模板智能推荐
 * - 检测currentApiInfo是否有预制查询参数
 * - 显示智能推荐卡片
 * - 应用模板后高亮提示
 */

import { ref, computed, watch } from 'vue'
import { NText } from 'naive-ui'
import type { HttpConfig } from '@/core/data-architecture/types/http-config'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
import DynamicParameterEditor from '@/core/data-architecture/components/common/DynamicParameterEditor.vue'
// 导入图标
import { Sparkles as SparkleIcon } from '@vicons/ionicons5'

interface Props {
  /** HTTP配置数据 */
  modelValue: Partial<HttpConfig>
  /** 当前选择的内部接口信息 */
  currentApiInfo?: any
  /** 🔥 新增：当前组件ID，用于属性绑定 */
  componentId?: string
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 🎯 优化3：智能推荐卡片显示状态
 */
const showTemplateRecommend = ref(false)
const hasAppliedTemplate = ref(false)

/**
 * 🎯 优化3：检测是否有可用的查询参数模板
 */
const hasQueryParamTemplate = computed(() => {
  if (!props.currentApiInfo || !props.currentApiInfo.commonParams) return false

  // 排除路径参数，只显示查询参数
  const pathParamNames = props.currentApiInfo.pathParamNames || []
  const queryParams = props.currentApiInfo.commonParams.filter(
    (param: any) => !pathParamNames.includes(param.name) && param.type !== 'header'
  )

  return queryParams.length > 0
})

/**
 * 🎯 优化3：获取查询参数模板
 */
const queryParamTemplates = computed(() => {
  if (!props.currentApiInfo || !props.currentApiInfo.commonParams) return []

  const pathParamNames = props.currentApiInfo.pathParamNames || []
  return props.currentApiInfo.commonParams.filter(
    (param: any) => !pathParamNames.includes(param.name) && param.type !== 'header'
  )
})

/**
 * 🎯 优化3：监听currentApiInfo变化，自动显示推荐卡片
 */
watch(
  () => props.currentApiInfo,
  newValue => {
    if (newValue && hasQueryParamTemplate.value && !hasAppliedTemplate.value) {
      showTemplateRecommend.value = true
    }
  },
  { immediate: true }
)

/**
 * 🎯 优化3：应用接口模板
 */
const applyTemplate = () => {
  if (!queryParamTemplates.value || queryParamTemplates.value.length === 0) return

  // 生成模板参数
  const templateParams: EnhancedParameter[] = queryParamTemplates.value.map((param: any) => ({
    key: param.name,
    value: param.example || param.defaultValue || '',
    enabled: true,
    isDynamic: false,
    valueMode: 'manual',
    selectedTemplate: 'manual',
    variableName: '',
    description: param.description || `${param.name}查询参数`,
    dataType: param.type === 'number' ? 'number' : param.type === 'boolean' ? 'boolean' : 'string',
    defaultValue: param.example || param.defaultValue,
    _id: `param_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }))

  // 合并到现有参数（避免重复）
  const existingKeys = new Set((props.modelValue.params || []).map(p => p.key))
  const newParams = templateParams.filter(p => !existingKeys.has(p.key))

  if (newParams.length > 0) {
    const updatedParams = [...(props.modelValue.params || []), ...newParams]
    emit('update:modelValue', { ...props.modelValue, params: updatedParams })

    // 标记已应用模板
    hasAppliedTemplate.value = true
    showTemplateRecommend.value = false
  }
}

/**
 * 🎯 优化3：关闭推荐卡片
 */
const dismissRecommend = () => {
  showTemplateRecommend.value = false
}
</script>

<template>
  <div class="http-config-step3">
    <!-- 🎯 优化3：接口模板智能推荐卡片 -->
    <n-alert v-if="showTemplateRecommend" type="success" closable style="margin-bottom: 16px" @close="dismissRecommend">
      <template #header>
        <n-space align="center">
          <n-icon size="18"><sparkle-icon /></n-icon>
          <span>检测到内部接口模板可用</span>
        </n-space>
      </template>

      <n-space vertical size="small">
        <n-text depth="3">
          接口 "
          <n-text type="success" strong>{{ currentApiInfo?.label }}</n-text>
          " 包含
          <n-text type="success" strong>{{ queryParamTemplates.length }}</n-text>
          个预制查询参数
        </n-text>

        <n-space size="small" style="flex-wrap: wrap">
          <n-tag
            v-for="param in queryParamTemplates.slice(0, 4)"
            :key="param.name"
            type="success"
            size="small"
            :bordered="false"
          >
            {{ param.name }}
            <span v-if="param.required" style="color: var(--error-color); margin-left: 2px">*</span>
          </n-tag>
          <n-text v-if="queryParamTemplates.length > 4" depth="3" style="font-size: 12px">
            +{{ queryParamTemplates.length - 4 }} 个
          </n-text>
        </n-space>

        <n-space style="margin-top: 8px">
          <n-button type="success" size="small" @click="applyTemplate">
            <template #icon>
              <n-icon><sparkle-icon /></n-icon>
            </template>
            应用模板
          </n-button>
          <n-button size="small" @click="dismissRecommend">稍后手动配置</n-button>
        </n-space>
      </n-space>
    </n-alert>

    <!-- 查询参数配置 -->
    <DynamicParameterEditor
      :model-value="modelValue.params || []"
      parameter-type="query"
      title="查询参数配置"
      add-button-text="添加查询参数"
      key-placeholder="参数名（如：deviceId）"
      value-placeholder="参数值（如：DEV001）"
      :current-api-info="currentApiInfo"
      :current-component-id="componentId"
      @update:model-value="
        updatedParams => {
          emit('update:modelValue', { ...modelValue, params: updatedParams })
        }
      "
    />

    <!-- 提示信息 -->
    <div style="margin-top: 16px; padding: 12px; background: var(--info-color-suppl); border-radius: 6px">
      <n-text depth="3" style="font-size: 12px">
        💡 提示：选择内部接口后，如果有预制参数会自动显示推荐卡片。也可在"添加查询参数"下拉菜单中选择"✨
        应用接口模板"导入
      </n-text>
    </div>
  </div>
</template>

<style scoped>
.http-config-step3 {
  width: 100%;
  padding: 12px;
}

.param-section {
  margin-bottom: 16px;
}
</style>
