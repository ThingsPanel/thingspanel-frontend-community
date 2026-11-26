<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getNotificationUiCapabilities } from '@/service/api/notification-v2'
import NotificationInstances from './NotificationInstances.vue'
import NotificationPlatformAccounts from './NotificationPlatformAccounts.vue'

const route = useRoute()
const capabilities = computed(() => getNotificationUiCapabilities())
const initialTenant = computed(() => (typeof route.query.tenant === 'string' ? route.query.tenant : undefined))
</script>

<template>
  <NCard :bordered="false">
    <NotificationPlatformAccounts v-if="capabilities.canManageAccounts" :initial-tenant-id="initialTenant" />
    <NotificationInstances v-else-if="capabilities.canRead" />
  </NCard>
</template>
