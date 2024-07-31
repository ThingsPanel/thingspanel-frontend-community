<script setup lang="tsx">
import { reactive, ref } from 'vue';
import { editFunction, getFunction } from '@/service/api/setting';

const queryParam = reactive({
  function_id: ''
});
const localParam = reactive({
  enable_reg: false,
  use_captcha: false
});

// const yzm_active = ref(false);

// const zc_active = ref(false);

// const changeYzm = async (value: boolean) => {
//   queryParam.function_id = yzm_id.value;
//   console.log(queryParam);
//   const res = await editFunction(queryParam);
//   if (!res.error) {
//     console.log('success');
//     localParam.use_captcha = value;
//   }
//   localStorage.setItem('enableZcAndYzm', JSON.stringify(localParam));
// };

// const changeZc = async (value: boolean) => {
//   queryParam.function_id = zc_id.value;
//   const res = await editFunction(queryParam);
//   if (!res.error) {
//     localParam.enable_reg = value;
//   }
//   localStorage.setItem('enableZcAndYzm', JSON.stringify(localParam));
// };

const changeFunc = async (item: object, value: boolean) => {
  queryParam.function_id = item.id;
  const res = await editFunction(queryParam);
  if (!res.error) {
    localParam[item.name] = value;
  }
  localStorage.setItem('enableZcAndYzm', JSON.stringify(localParam));
};
const funcOptions = ref([]);
async function getFunctionOption() {
  const { data } = await getFunction();
  funcOptions.value = data.map(v => {
    localParam[v.name] = v.enable_flag === 'enable';
    return {
      ...v,
      value: v.enable_flag === 'enable'
    };
  });
  localStorage.setItem('enableZcAndYzm', JSON.stringify(localParam));
}

getFunctionOption();
</script>

<template>
  <NFlex>
    <NForm label-placement="left" :label-width="140">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem v-for="(item, index) in funcOptions" :key="index" :span="24" :label="item.description">
          <n-switch v-model:value="item.value" @change="val => changeFunc(item, val)" />
        </NFormItemGridItem>
        <!--
 <NFormItemGridItem :span="24" label="是否开启系统注册">
          <n-switch v-model:value="zc_active" @change="changeZc" />
        </NFormItemGridItem> 
-->
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="start"></NSpace>
    </NForm>
  </NFlex>
</template>

<style lang="scss"></style>
