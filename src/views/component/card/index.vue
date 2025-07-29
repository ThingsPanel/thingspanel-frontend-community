<script setup lang="ts">
import { $t } from '@/locales'
</script>

<template>
  <div>
    <NCard :title="$t('generate.card')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <NSpace :vertical="true">
        <NCard :title="$t('generate.basic-usage')">
          <p class="pb-16px">{{ $t('generate.basic-card') }}</p>
          <NCard :title="$t('generate.card')">{{ $t('generate.card-content') }}</NCard>
        </NCard>
        <NCard :title="$t('generate.size')">
          <p class="pb-16px">
            <span>{{ $t('card.cardHas') }}</span>
            small、medium、large、huge
            <span>{{ $t('card.size') }}</span>
            。
          </p>
          <NSpace vertical>
            <NCard :title="$t('generate.small-card')" size="small">{{ $t('generate.card-content') }}</NCard>
            <NCard :title="$t('generate.medium-card')" size="medium">{{ $t('generate.card-content') }}</NCard>
            <NCard :title="$t('generate.large-card')" size="large">{{ $t('generate.card-content') }}</NCard>
            <NCard :title="$t('generate.extra-large-card')" size="huge">{{ $t('generate.card-content') }}</NCard>
          </NSpace>
        </NCard>
        <NCard :title="$t('generate.text-button')">
          <p class="pb-16px">
            {{ $t('card.contentFooter') }}
          </p>
          <NCard
            :title="$t('generate.card-segment-example')"
            :segmented="{
              content: true,
              footer: 'soft'
            }"
          >
            <template #header-extra>#header-extra</template>
            {{ $t('generate.card-content') }}
            <template #footer>#footer</template>
            <template #action>#action</template>
          </NCard>
        </NCard>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped></style>
