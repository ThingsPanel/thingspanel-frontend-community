import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';
import { deviceDetail } from '@/service/api';

export const useDeviceDataStore = defineStore(SetupStoreId.Device, () => {
  const deviceData = ref<DeviceManagement.DeviceDetail | any>({}); // 更具体的类型替换 any
  async function fetchData(id: string) {
    try {
      const { data, error } = await deviceDetail(id);
      if (!error) {
        deviceData.value = data;
      } else {
        deviceData.value = {};
      }
    } catch (error) {
      console.error('fetchData error:', error);
      deviceData.value = {};
    }
  }

  return { deviceData, fetchData };
});
