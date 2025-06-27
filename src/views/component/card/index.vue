<script setup lang="ts">
import { $t } from '@/locales'
</script>

<template>
  <div>
    <NCard :title="卡片" :bordered="false" class="h-full rounded-8px shadow-sm">
      <NSpace :vertical="true">
        <NCard :title="基本用法">
          <p class="pb-16px">{{ "基础卡片" }}</p>
          <NCard :title="卡片">{{ "卡片内容" }}</NCard>
        </NCard>
        <NCard :title="尺寸">
          <p class="pb-16px">
            <span>{{ "卡片有" }}</span>
            small、medium、large、huge
            <span>{{ "尺寸" }}</span>
            。
          </p>
          <NSpace vertical>
            <NCard :title="小卡片" size="small">{{ "卡片内容" }}</NCard>
            <NCard :title="中卡片" size="medium">{{ "卡片内容" }}</NCard>
            <NCard :title="大卡片" size="large">{{ "卡片内容" }}</NCard>
            <NCard :title="超大卡片" size="huge">{{ "卡片内容" }}</NCard>
          </NSpace>
        </NCard>
        <NCard :title="文本按钮">
          <p class="pb-16px">
            {{ "content 和 footer 可以被 hard 或 soft 分段，action 可以被分段。分段分割线会在区域的上方出现。" }}
          </p>
          <NCard
            :title="卡片分段示例"
            :segmented="{
              content: true,
              footer: 'soft'
            }"
          >
            <template #header-extra>#header-extra</template>
            {{ "卡片内容" }}
            <template #footer>#footer</template>
            <template #action>#action</template>
          </NCard>
        </NCard>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped></style>
