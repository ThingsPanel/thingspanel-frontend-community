<script setup lang="tsx">
/**
 * 步骤4：App图表配置
 * 使用template-panel组件配置App端图表
 */

import { provide, ref } from 'vue'
import { $t } from '@/locales'
import { getTemplat, putTemplat } from '@/service/api'
import type { ICardView } from '@/components/panel/card'
import templatePanel from '@/views/device/template/components/card-select/template-panel.vue'

const emit = defineEmits(['update:stepCurrent', 'update:modalVisible'])

const props = defineProps({
  stepCurrent: {
    type: Number,
    required: true
  },
  modalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: {
    type: String,
    required: true
  }
})

const web_chart_config = ref<ICardView[]>([])
provide('web_chart_config', web_chart_config)

// 取消
const cancellation: () => void = () => {
  emit('update:modalVisible', false)
}

// 上一步
const back: () => void = () => {
  emit('update:stepCurrent', 3)
}

// 下一步
const next = async () => {
  let flag = false
  let theIndex = 0
  web_chart_config?.value?.forEach((i, index) => {
    if (i?.data?.dataSource?.deviceSource && !i?.data?.dataSource?.deviceSource[0]?.metricsId) {
      flag = true
      theIndex = index
    }
  })

  if (flag) {
    window.$message?.error(`${$t('common.section')}${theIndex + 1}${$t('common.accompaniedIndicators')}`)
  } else {
    const res = await getTemplat(props.deviceTemplateId)
    await putTemplat({ ...res.data, app_chart_config: JSON.stringify(web_chart_config.value) })
    emit('update:stepCurrent', 5)
  }
}
</script>

<template>
  <div>
    <templatePanel :template-id="props.deviceTemplateId" :is-app="true" />
    <div class="box1 m-t2">
      <NButton type="primary" @click="next">{{ $t('device_template.nextStep') }}</NButton>
      <NButton class="m-r3" ghost type="primary" @click="back">{{ $t('device_template.back') }}</NButton>
      <NButton class="m-r3" @click="cancellation">{{ $t('generate.cancel') }}</NButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.box1 {
  display: flex;
  flex-direction: row-reverse;
}
</style>
