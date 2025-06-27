<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { $t } from '@/locales'
import { initTemplateInfoData, templateInfoData } from '../utils'
import AddInfo from './step/add-info.vue'
import ModelDefinition from './step/model-definition.vue'
import WebChartConfig from './step/web-chart-config.vue'
import AppChartConfig from './step/app-chart-config.vue'
import Complete from './step/complete.vue'

export interface Props {
  visible: boolean
  type: 'add' | 'edit'
  templateId: string
  getTableData: () => void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'add'
})

const stepCurrent = ref<number>(1)
const deviceTemplateId = ref<string>(props.type === 'add' ? '' : props.templateId)

const componentsList: { id: number; components: any }[] = [
  { id: 1, components: AddInfo },
  { id: 2, components: ModelDefinition },
  { id: 3, components: WebChartConfig },
  { id: 4, components: AppChartConfig },
  { id: 5, components: Complete }
]
const SwitchComponents = computed<any>(() => {
  return componentsList.find(item => item.id === stepCurrent.value)?.components
})

export type ModalType = NonNullable<Props['type']>

interface Emits {
  // eslint-disable-next-line no-unused-vars
  (e: 'update:visible', visible: boolean): void
}

const emit = defineEmits<Emits>()

const modalVisible = computed({
  get() {
    // eslint-disable-next-line vue/no-side-effects-in-computed-properties
    stepCurrent.value = 1
    if (!props.visible) {
      templateInfoData.value = { ...initTemplateInfoData }
    }
    return props.visible
  },
  set(visible) {
    emit('update:visible', visible)
  }
})
const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: "模板信息",
    edit: "修改模板信息"
  }
  return titles[props.type]
})

watchEffect(() => {
  deviceTemplateId.value = props.templateId
})

defineOptions({ name: 'TableActionModal' })
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="card"
    :title="title"
    class="w-80%"
    @after-leave="
      () => {
        deviceTemplateId = props.templateId
        props.getTableData()
      }
    "
  >
    <n-steps :current="stepCurrent" status="process">
      <n-step :title="模板信息" :description="添加设备的基本信息" />
      <n-step
        :title="模型定义"
        :description="根据系统提供的模型来配置参数以及设备类型"
      />
      <n-step
        :title="Web图表配置"
        :description="绑定相对应的图表"
      />
      <n-step
        :title="App图表配置"
        :description="编辑该设备模型的App详情页"
      />
      <n-step :title="发布" :description="发布到应用商店" />
    </n-steps>

    <component
      :is="SwitchComponents"
      v-model:stepCurrent="stepCurrent"
      v-model:modalVisible="modalVisible"
      v-model:deviceTemplateId="deviceTemplateId"
    ></component>
  </NModal>
</template>

<style scoped></style>
