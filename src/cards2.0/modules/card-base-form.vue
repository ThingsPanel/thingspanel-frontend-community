<script setup lang="ts">
import { reactive, watch } from 'vue'
import { debounce } from 'lodash'
import { $t } from '@/locales'

defineOptions({ name: 'CardBaseForm' })
const props = defineProps<{
  changeCtxConfig: (key: string, data: any) => void
  defaultBasisData: Record<string, any>
}>()

const basisData = reactive({ ...props.defaultBasisData })

const throttledWatcher = debounce(() => {
  props.changeCtxConfig('basis', basisData)
  // 在这里处理你的业务逻辑
}, 300)

watch(
  () => basisData,
  () => {
    throttledWatcher()
  },
  { deep: true }
)
</script>

<template>
  <n-form :model="basisData" label-placement="left" :label-width="70">
    <n-form-item :label="$t('card.title')" path="title">
      <n-input v-model:value="basisData.title" :disabled="!basisData.showTitle" :placeholder="$t('card.title')" />
    </n-form-item>
    <n-form-item :label="$t('card.isShow')" path="showTitle">
      <n-switch v-model:value="basisData.showTitle" />
    </n-form-item>
  </n-form>
</template>

<style scoped></style>
