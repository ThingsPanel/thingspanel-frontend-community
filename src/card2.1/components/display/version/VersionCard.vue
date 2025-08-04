<template>
  <div class="version-card-container">
    <div class="header">
      <div class="title-section">
        <Icon icon="carbon:information-square-filled" class="title-icon" />
        <span>{{ title }}</span>
      </div>
      <a :href="githubUrl" target="_blank" rel="noopener noreferrer" class="github-link">
        <svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M11.054 0C4.95 0 0 4.98 0 11.14c0 4.92 3.16 9.09 7.55 10.57.55.11.75-.24.75-.53 0-.26-.02-1.14-.02-2.06-3.07.66-3.71-1.33-3.71-1.33-.49-1.29-1.23-1.62-1.23-1.62-1.01-.68.07-.68.07-.68 1.12.07 1.7 1.14 1.7 1.14.99 1.7 2.58 1.22 3.22.92.09-.72.38-1.22.69-1.49-2.45-.26-5.03-1.22-5.03-5.49 0-1.22.44-2.21 1.13-2.99-.11-.28-.49-1.42.11-2.95 0 0 .93-.3 3.04 1.14.88-.25 1.83-.37 2.77-.37.93 0 1.88.13 2.76.37 2.1-1.44 3.04-1.14 3.04-1.14.6 1.53.22 2.67.11 2.95.71.78 1.13 1.77 1.13 2.99 0 4.28-2.58 5.22-5.05 5.49.4.35.75 1.01.75 2.06 0 1.49-.02 2.69-.02 3.06 0 .29.2.65.75.53 4.39-1.48 7.55-5.64 7.55-10.56C22.11 4.98 17.14 0 11.054 0z" fill="currentColor"/>
        </svg>
      </a>
    </div>
    <div class="content">
      <span class="label">{{ currentVersionLabel }}</span>
      <span class="version-number">{{ data.version || '--' }}</span>
      <n-tag :type="data.isLatest ? 'success' : 'warning'" size="medium" round class="status-tag">
        <template v-if="data.isLatest" #icon>
          <Icon icon="carbon:checkmark-outline" />
        </template>
        {{ data.isLatest ? latestLabel : `${latestVersionLabel}: ${data.latestVersion || '--'}` }}
      </n-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, toRefs } from 'vue'
import { Icon } from '@iconify/vue'
import { NTag } from 'naive-ui'
import { useData } from './useData'

interface Props {
  title: string
  currentVersionLabel: string
  latestLabel: string
  latestVersionLabel: string
  githubUrl: string
}

const props = defineProps<Props>()

const { data } = useData()
</script>

<style scoped>
.version-card-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
  background-color: var(--tp-c-bg);
  border-radius: 8px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--tp-c-text-1);
}
.title-section {
  display: flex;
  align-items: center;
}
.title-icon {
  margin-right: 8px;
  font-size: 1.2rem;
  color: var(--tp-c-brand);
}
.github-link {
  color: var(--tp-c-text-2);
  transition: color 0.3s;
}
.github-link:hover {
  color: var(--tp-c-brand);
}
.content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.label {
  font-size: 0.9rem;
  color: var(--tp-c-text-2);
  margin-bottom: 4px;
}
.version-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--tp-c-text-0);
  margin-bottom: 12px;
}
.status-tag {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  50% {
    opacity: 0.8;
  }
}
</style>
