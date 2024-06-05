<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '@/locales';

export interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}

const emit = defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {});
const title = ref('OpenWeather气象服务');

const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

function handleUpdateFormModelByModalType() {}

const formRef = ref<HTMLElement & FormInst>();

type FormModel = Pick<DataService.Data, 'name'>;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('custom.devicePage.deviceKey'))
};

function createDefaultFormModel(): FormModel {
  return {
    name: ''
  };
}

function handleSubmit() {
  console.log('提交');
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType();
    }
  }
);
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-700px">
    <NForm ref="formRef" label-placement="left" :label-width="120" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="$t('generate.enter-key')" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItemGridItem>
      </NGrid>
    </NForm>
    <div class="box">
      <div style="width: 100px; height: 10px"></div>
      <NButton class="save w-72px" type="default" @click="handleSubmit">{{ $t('common.save') }}</NButton>
    </div>
  </NModal>
</template>

<style scoped>
.box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
