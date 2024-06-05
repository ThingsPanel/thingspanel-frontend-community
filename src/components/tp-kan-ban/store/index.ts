import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';

export const useResponsiveStore = defineStore(SetupStoreId.responsive, () => {
  const responsive = ref<boolean>(false); // 更具体的类型替换 any
  return responsive;
});
