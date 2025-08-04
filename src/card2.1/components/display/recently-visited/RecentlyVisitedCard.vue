<template>
  <div class="recently-visited-card">
    <h3 class="title">{{ title }}</h3>
    <div class="list-container">
      <ul class="list">
        <li
          v-for="route in visitedRoutes"
          :key="route.path + JSON.stringify(route.query)"
          class="list-item"
          @click="navigateTo(route.path, route.query)"
        >
          <SvgIcon v-if="route.icon" :icon="route.icon" class="icon" />
          <span v-else class="icon-placeholder"></span>
          <span class="route-title">{{ getRouteDisplayTitle(route) }}</span>
          <span class="arrow">></span>
        </li>
        <li v-if="!visitedRoutes.length" class="empty-text">
          {{ $t('card.recentlyVisited.noRecords') }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { $t } from '@/locales'
import { useData } from './useData'
import SvgIcon from '@/components/custom/svg-icon.vue'

defineProps<{
  title: string
}>()

const { visitedRoutes, getRouteDisplayTitle } = useData()
const router = useRouter()

const navigateTo = (path: string, query?: Record<string, any>) => {
  router.push({ path, query })
}
</script>

<style scoped>
.recently-visited-card {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.list-container {
  flex-grow: 1;
  overflow: hidden;
}
.list {
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
  margin: 0;
  list-style: none;
}
.list-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.list-item:hover {
  background-color: var(--n-color-embedded-hover);
}
.icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  color: var(--n-primary-color);
  flex-shrink: 0;
}
.icon-placeholder {
  width: 20px;
  margin-right: 12px;
  flex-shrink: 0;
}
.route-title {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}
.arrow {
  margin-left: auto;
  color: var(--n-text-color-3);
}
.empty-text {
  font-size: 14px;
  color: var(--n-text-color-3);
  text-align: center;
  padding: 16px 0;
}
/* Custom scrollbar */
.list::-webkit-scrollbar { width: 4px; }
.list::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 4px; }
.list::-webkit-scrollbar-track { background-color: transparent; }
</style>
