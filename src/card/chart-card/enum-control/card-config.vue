<script lang="ts" setup>
import { inject, onMounted } from 'vue'
import { NButton, NForm, NIcon, NInput } from 'naive-ui'
import { DeleteOutlined, PlusOutlined } from '@vicons/antd'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'

const ctx = inject<IConfigCtx>('config-ctx')!

// 配置默认按钮数据
const addButtonConfig = () => {
  ctx.config.btOptions = [
    ...ctx.config.btOptions,
    {
      label: `${"按钮"}${ctx.config.btOptions.length + 1}`,
      value: "值"
    }
  ]
}

// 删除按钮
const removeButtonConfig = (index: number) => {
  ctx.config.btOptions.splice(index, 1)
  ctx.config.btOptions = [...ctx.config.btOptions]
}

// 初始化默认的按钮配置
onMounted(() => {
  if (!ctx.config.btOptions) {
    ctx.config.btOptions = [
      { label: $t('page.general.heating'), value: 'heat' },
      { label: $t('page.general.cooling'), value: 'cool' },
      { label: $t('page.general.ventilation'), value: 'fan' },
      { label: $t('page.general.auto'), value: 'auto' }
    ]
  }
})
</script>

<template>
  <div>
    <NForm :model="ctx.config">
      <!-- 动态按钮配置 -->
      <div v-for="(button, index) in ctx.config.btOptions" :key="index" class="button-config">
        <div class="flex flex-row items-center gap-2">
          <span>{{ index + 1 }}</span>
          <NInput v-model:value="button.label" :placeholder="$t('page.general.enterButtonName')" />
          <NInput v-model:value="button.value" :placeholder="$t('page.general.enterButtonValue')" />
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
        {{ $t('page.general.addButton') }}
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
