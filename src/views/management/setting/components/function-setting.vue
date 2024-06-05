<script setup lang="tsx">
import { reactive, ref } from 'vue';
import { editFunction, getFunction } from '@/service/api/setting';

const zc_id = ref('');
const yzm_id = ref('');

const queryParam = reactive({
  function_id: ''
});
const localParam = reactive({
  enable_reg: false,
  use_captcha: false
});

const yzm_active = ref(false);

const zc_active = ref(false);

const changeYzm = async (value: boolean) => {
  queryParam.function_id = yzm_id.value;
  console.log(queryParam);
  const res = await editFunction(queryParam);
  if (!res.error) {
    console.log('success');
    localParam.use_captcha = value;
  }
  localStorage.setItem('enableZcAndYzm', JSON.stringify(localParam));
};

const changeZc = async (value: boolean) => {
  queryParam.function_id = zc_id.value;
  const res = await editFunction(queryParam);
  if (!res.error) {
    localParam.enable_reg = value;
  }
  localStorage.setItem('enableZcAndYzm', JSON.stringify(localParam));
};

async function getFunctionOption() {
  const { data } = await getFunction();
  data.forEach(item => {
    if (item.name === 'enable_reg') {
      zc_id.value = item.id;
      zc_active.value = item.enable_flag === 'enable';
    }
    if (item.name === 'use_captcha') {
      yzm_id.value = item.id;
      yzm_active.value = item.enable_flag === 'enable';
    }

    localParam.enable_reg = zc_active.value;
    localParam.use_captcha = yzm_active.value;
  });
  localStorage.setItem('enableZcAndYzm', JSON.stringify(localParam));
}

getFunctionOption();
</script>

<template>
  <NFlex>
    <NForm label-placement="left" :label-width="140">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" label="是否开启验证码登录">
          <n-switch v-model:value="yzm_active" @change="changeYzm" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" label="是否开启系统注册">
          <n-switch v-model:value="zc_active" @change="changeZc" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="start"></NSpace>
    </NForm>
  </NFlex>
</template>

<style lang="scss"></style>
