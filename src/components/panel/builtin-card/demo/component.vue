<script lang="ts" setup>
import type { ICardData } from '@/components/panel/card'
import { $t } from '@/locales'

defineProps<{
  card: ICardData
}>()
</script>

<template>
  <div>
    {{ "测试" }} ：{{ card.type }} {{ "用户名" }} ：{{ card.config?.username }}。
    {{ "年龄" }}：{{ card.config?.age }}
  </div>
</template>
