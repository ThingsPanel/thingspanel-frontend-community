<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { editFunction, getFunction } from '@/service/api/setting'

const queryParam = reactive({
  function_id: ''
})

const changeFunc = async (item: object) => {
  queryParam.function_id = item.id
  const res = await editFunction(queryParam)
  if (!res.error) {
    getFunctionOption()
  }
}
const funcOptions = ref([])
async function getFunctionOption() {
  const { data } = await getFunction()
  if (data) {
    localStorage.setItem('enableZcAndYzm', JSON.stringify(data))
    funcOptions.value = data.map(v => {
      return {
        ...v,
        value: v.enable_flag === 'enable'
      }
    })
  }
}

getFunctionOption()
</script>

<template>
  <NFlex class="function-setting-panel">
    <NForm class="function-setting-form" label-placement="left" :label-width="260">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem v-for="(item, index) in funcOptions" :key="index" :span="24" :label="item.description">
          <n-switch v-model:value="item.value" @change="val => changeFunc(item)" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="start"></NSpace>
    </NForm>
  </NFlex>
</template>

<style lang="scss" scoped>
.function-setting-panel {
  width: 100%;
  padding-top: 12px;
}

.function-setting-form {
  width: min(640px, 100%);
}
</style>
