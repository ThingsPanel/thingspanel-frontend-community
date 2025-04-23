<template>
  <div class="p-4 border rounded">
    <h2 class="text-lg font-semibold mb-2">Telemetry Filter Test</h2>
    <TelemetryDataHistoryListFilter
      :device-id="testDeviceId"
      :the-key="testKey"
        :display-mode="'simple'"
      :show-export-button="true"
      v-model:data="fetchedData"
      v-model:loading="isLoading"
    />

    <div class="mt-4">
      <h3 class="font-medium mb-1">Fetched Data:</h3>
      <div v-if="isLoading" class="text-gray-500">Loading...</div>
      <div v-else-if="fetchedData.length > 0" class="text-sm bg-gray-100 p-2 rounded max-h-40 overflow-auto">
        <pre>{{ JSON.stringify(fetchedData, null, 2) }}</pre>
      </div>
      <div v-else class="text-gray-500">No data received yet.</div>
    </div>

    <!-- Original content commented out for testing -->
    <!--
    <div class="bg-[#000]">
      {{ $t('cards.reportedData') }}
      88888
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// import { $t } from '@/locales';
// import { getLatestTelemetryData } from '@/service/api';
import TelemetryDataHistoryListFilter from '@/components/TelemetryDataHistoryListFilter.vue';

defineOptions({
  name: 'AlarmInfoCard'
});

// --- Test Data for Filter Component ---
const testDeviceId = ref('cab39a7a-c5e6-1893-0af7-1e71ebf44b11'); // Replace with a valid device ID if needed
const testKey = ref('lamp_bright'); // Replace with a valid key if needed
const fetchedData = ref<any[]>([]); // To store data from the filter component
const isLoading = ref(false); // To store loading state from the filter component

// Original onMounted logic commented out for testing
/*
onMounted(async () => {
  try {
    const data = await getLatestTelemetryData();
    console.log('Latest Telemetry Data:', data);
  } catch (error) {
    console.error('Error fetching latest telemetry data:', error);
  }
});
*/

</script>

<style scoped>
/* 在这里添加组件的样式 */
</style>
