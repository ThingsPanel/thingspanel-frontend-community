<template>
  <GradientBg :start-color="startColor" :end-color="endColor">
    <div class="alarm-count-card-content">
      <h3 class="title">{{ title }}</h3>
      <div class="body">
        <SvgIcon :icon="icon" class="icon" />
        <CountTo :prefix="unit" :start-value="0" :end-value="data.alarmTotal" class="count-to" />
      </div>
    </div>
  </GradientBg>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { CountTo } from 'vue3-count-to'
import SvgIcon from '@/components/custom/svg-icon.vue'
import GradientBg from './components/GradientBg.vue'
import { useData } from './useData'

interface Props {
  title: string
  unit: string
  icon: string
  startColor: string
  endColor: string
}

const props = defineProps<Props>()
const { data } = useData()
</script>

<style scoped>
.alarm-count-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.title {
  font-size: 16px;
  margin-bottom: 0;
}
.body {
  flex-grow: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.icon {
  font-size: 32px;
}
.count-to {
  font-size: 30px;
}
</style>
