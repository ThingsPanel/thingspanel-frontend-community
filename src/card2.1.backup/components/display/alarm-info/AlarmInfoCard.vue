<template>
  <div class="alarm-info-card">
    <div class="header">
      <h3 class="title">{{ title }}</h3>
      <NButton text size="small" type="primary" @click="viewAllAlarms">
        {{ viewAllText }}
      </NButton>
    </div>
    <div class="content">
      <n-data-table
        :columns="columns"
        :data="alarmList"
        :loading="loading"
        :bordered="false"
        striped
        size="small"
        flex-height
        class="data-table"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NDataTable } from 'naive-ui'
import { useData } from './useData'

interface Props {
  title: string
  viewAllText: string
  viewAllRoute: string
}

const props = defineProps<Props>()
const router = useRouter()
const { loading, alarmList, columns } = useData()

const viewAllAlarms = () => {
  if (props.viewAllRoute) {
    router.push(props.viewAllRoute)
  }
}
</script>

<style scoped>
.alarm-info-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
  background-color: var(--tp-c-bg);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.content {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}
.data-table {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
