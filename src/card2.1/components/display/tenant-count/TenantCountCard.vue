<template>
  <GradientBg class="card-wrapper" :start-color="startColor" :end-color="endColor">
    <h3 class="title">{{ title }}</h3>
    <div class="content">
      <SvgIcon :icon="icon" class="icon" />
      <div class="data-display">
        <n-spin v-if="loading" size="small" />
        <template v-else>
          <CountTo :start-value="0" :end-value="value" :suffix="unit" class="value-text" />
        </template>
      </div>
    </div>
  </GradientBg>
</template>

<script setup lang="ts">
import { NSpin } from 'naive-ui'
import { CountTo } from '@/components/custom/count-to'
import { SvgIcon } from '@/components/common'
import { GradientBg } from './components'
import { useData } from './useData'

defineProps<{
  title: string
  unit: string
  icon: string
  startColor: string
  endColor: string
}>()

const { loading, value } = useData()
</script>

<style scoped>
.card-wrapper { width: 100%; height: 100%; padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; }
.title { font-size: 16px; margin: 0; }
.content { flex-grow: 1; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 12px; }
.icon { font-size: 32px; }
.data-display { display: flex; flex-direction: column; align-items: flex-end; }
.value-text { font-size: 30px; color: #fff; }
</style>
