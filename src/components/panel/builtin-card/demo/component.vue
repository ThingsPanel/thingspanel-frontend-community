<script lang="ts" setup>
import type { ICardData } from '@/components/panel/card';
import { $t } from '@/locales';

defineProps<{
  card: ICardData;
}>();
</script>

<template>
  <div>
    {{ $t('common.test') }} ：{{ card.type }} {{ $t('generate.username') }} ：{{ card.config?.username }}。
    {{ $t('generate.age') }}：{{ card.config?.age }}
  </div>
</template>
