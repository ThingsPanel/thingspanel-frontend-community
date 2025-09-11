<!--
  四种参数添加方式演示组件
  用于展示和测试DynamicParameterEditor的4种参数添加功能
-->
<script setup lang="ts">
/**
 * FourParameterTypesDemo - 四种参数添加方式演示组件
 * 演示手动输入、卡片属性绑定、设备选择、接口模板四种方式
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NSpace, NText, NDivider, NButton } from 'naive-ui'
import DynamicParameterEditor from '@/core/data-architecture/components/common/DynamicParameterEditor.vue'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'

const { t } = useI18n()

/**
 * 四种类型的参数演示数据
 */
const headerParams = ref<EnhancedParameter[]>([])
const queryParams = ref<EnhancedParameter[]>([])
const pathParams = ref<EnhancedParameter[]>([])

/**
 * 重置所有参数
 */
const resetAllParams = () => {
  headerParams.value = []
  queryParams.value = []
  pathParams.value = []
}

/**
 * 获取参数概述信息
 */
const getParamsSummary = (params: EnhancedParameter[]) => {
  if (params.length === 0) return '暂无参数'

  return params
    .map(param => {
      const template = param.selectedTemplate || 'manual'
      const templateNames: Record<string, string> = {
        manual: '手动输入',
        'property-binding': '属性绑定',
        'device-dispatch-selector': '设备选择',
        'interface-template': '接口模板'
      }

      return `${param.key}: ${param.value || '未设置'} (${templateNames[template] || template})`
    })
    .join(', ')
}
</script>

<template>
  <div class="four-parameter-types-demo">
    <n-card title="四种参数添加方式演示" size="small">
      <template #header-extra>
        <n-button size="small" @click="resetAllParams">重置所有</n-button>
      </template>

      <n-space vertical :size="24">
        <!-- 请求头参数 -->
        <div>
          <n-text strong>1. 请求头参数 (Header Parameters)</n-text>
          <n-text depth="3" style="display: block; margin: 8px 0; font-size: 12px">
            支持：手动输入、属性绑定、接口模板、内容类型模板、认证类型模板
          </n-text>
          <DynamicParameterEditor
            v-model="headerParams"
            parameter-type="header"
            title=""
            add-button-text="添加请求头参数"
            key-placeholder="Header名称"
            value-placeholder="Header值"
            :max-parameters="3"
          />
          <n-text depth="3" style="font-size: 11px; margin-top: 8px; display: block">
            当前参数：{{ getParamsSummary(headerParams) }}
          </n-text>
        </div>

        <n-divider />

        <!-- 查询参数 -->
        <div>
          <n-text strong>2. 查询参数 (Query Parameters)</n-text>
          <n-text depth="3" style="display: block; margin: 8px 0; font-size: 12px">
            支持：手动输入、属性绑定、接口模板、布尔值模板、设备选择
          </n-text>
          <DynamicParameterEditor
            v-model="queryParams"
            parameter-type="query"
            title=""
            add-button-text="添加查询参数"
            key-placeholder="参数名称"
            value-placeholder="参数值"
            :max-parameters="5"
          />
          <n-text depth="3" style="font-size: 11px; margin-top: 8px; display: block">
            当前参数：{{ getParamsSummary(queryParams) }}
          </n-text>
        </div>

        <n-divider />

        <!-- 路径参数 -->
        <div>
          <n-text strong>3. 路径参数 (Path Parameters)</n-text>
          <n-text depth="3" style="display: block; margin: 8px 0; font-size: 12px">
            支持：手动输入、属性绑定、接口模板、设备选择（限制1个参数）
          </n-text>
          <DynamicParameterEditor
            v-model="pathParams"
            parameter-type="path"
            title=""
            add-button-text="添加路径参数"
            key-placeholder="路径变量名"
            value-placeholder="路径变量值"
            :max-parameters="1"
          />
          <n-text depth="3" style="font-size: 11px; margin-top: 8px; display: block">
            当前参数：{{ getParamsSummary(pathParams) }}
          </n-text>
        </div>
      </n-space>
    </n-card>

    <!-- 使用说明 -->
    <n-card title="使用说明" size="small" style="margin-top: 16px">
      <n-space vertical :size="8">
        <div>
          <n-text strong>1. 手动输入：</n-text>
          <n-text depth="3">直接输入固定的参数值，适用于不变的静态参数</n-text>
        </div>
        <div>
          <n-text strong>2. 卡片属性绑定：</n-text>
          <n-text depth="3">绑定到组件属性，运行时动态获取值，适用于动态参数</n-text>
        </div>
        <div>
          <n-text strong>3. 设备选择：</n-text>
          <n-text depth="3">从设备列表中选择设备和指标，自动生成参数值</n-text>
        </div>
        <div>
          <n-text strong>4. 接口模板：</n-text>
          <n-text depth="3">使用预定义的参数模板，如设备ID、用户ID等常用参数</n-text>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<style scoped>
.four-parameter-types-demo {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
</style>
