<script lang="ts" setup>
import { inject, onMounted } from 'vue';
import { NButton, NForm, NIcon, NInput } from 'naive-ui';
import { DeleteOutlined, PlusOutlined } from '@vicons/antd';
import type { IConfigCtx } from '@/components/panel/card';
import { $t } from '@/locales';

const ctx = inject<IConfigCtx>('config-ctx')!;

// 配置默认按钮数据
const addButtonConfig = () => {
  ctx.config.btOptions = [
    ...ctx.config.btOptions,
    {
      label: `$t('generate.button')${ctx.config.btOptions.length + 1}`,
      value: $t('generate.fieldValue')
    }
  ];
};

// 删除按钮
const removeButtonConfig = (index: number) => {
  ctx.config.btOptions.splice(index, 1);
  ctx.config.btOptions = [...ctx.config.btOptions];
};

// 初始化默认的按钮配置
onMounted(() => {
  if (!ctx.config.btOptions) {
    ctx.config.btOptions = [
      { label: $t('card.heating'), value: 'heat' },
      { label: $t('card.cooling'), value: 'cool' },
      { label: $t('card.ventilate'), value: 'fan' },
      { label: $t('card.automatic'), value: 'auto' }
    ];
  }
});
</script>

<template>
  <div>
    <NForm :model="ctx.config">
      <!-- 动态按钮配置 -->
      <div v-for="(button, index) in ctx.config.btOptions" :key="index" class="button-config">
        <div class="flex flex-row items-center gap-2">
          <span>{{ index + 1 }}</span>
          <NInput v-model:value="button.label" :placeholder="$t('card.inputButtonName')" />
          <NInput v-model:value="button.value" :placeholder="$t('card.inputButtonValue')" />
          <NButton v-if="ctx.config.btOptions.length > 2" type="error" text @click="removeButtonConfig(index)">
            <NIcon size="20">
              <DeleteOutlined />
            </NIcon>
          </NButton>
        </div>

        <!-- 删除按钮 -->
      </div>

      <!-- 添加按钮 -->
      <NButton type="primary" @click="addButtonConfig">
        <NIcon size="20">
          <PlusOutlined />
        </NIcon>
        {{ $t('card.addButton') }}
      </NButton>
    </NForm>
  </div>
</template>

<style scoped lang="scss">
.button-config {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  .n-form-item {
    flex: 1;
  }

  .n-button {
    margin-left: 8px;
  }
}
</style>
