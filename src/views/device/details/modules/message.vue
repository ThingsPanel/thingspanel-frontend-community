<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { deviceConfigInfo, deviceDetail, deviceLocation } from '@/service/api';
import { $t } from '@/locales';
import TencentMap from './public/tencent-map.vue'; // 路径根据实际位置调整

const props = defineProps<{
  id: string;
  deviceConfigId: string;
}>();
const latitude = ref('');
const longitude = ref('');
const isShow = ref(false);
const additionInfo = ref<any>({});
const { query } = useRoute();

const onPositionSelected = position => {
  latitude.value = position.lat.toString();
  longitude.value = position.lng.toString();
  isShow.value = false;
};

const openMapAndGetPosition = () => {
  isShow.value = true;
};
const getConfigInfo = async () => {
  const result = await deviceDetail(query.d_id as string);
  const location = result?.data?.location || '';
  const deviceAdditionalInfo = JSON.parse(result?.data?.additional_info || '');
  const locationData = location?.split(',') || [];
  latitude.value = locationData[1] || '';
  longitude.value = locationData[0] || '';

  if (props.deviceConfigId) {
    const resultData = await deviceConfigInfo({ id: props.deviceConfigId });
    const tempAdditionalInfo = resultData?.data?.additional_info || '';
    if (tempAdditionalInfo) {
      const extendedInfo = deviceAdditionalInfo?.extendedInfo || [];
      additionInfo.value = (JSON.parse(tempAdditionalInfo) || []).map(item => {
        return {
          enable: item.enable,
          desc: item.desc,
          name: item.name,
          value: extendedInfo.find(info => info.name === item.name)?.value || item.default_value
        };
      });
    }
  }
};

const handleSave = () => {
  deviceLocation({
    id: props.id,
    location: `${longitude.value},${latitude.value}`,
    additional_info: JSON.stringify({ extendedInfo: additionInfo.value })
  });
};
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
onMounted(getConfigInfo);
</script>

<template>
  <div>
    <NCard :title="$t('generate.device-location')" class="mb-4">
      <n-space>
        <NInput v-model:value="longitude" :placeholder="$t('generate.longitude')" class="w-140px" />
        <NInput v-model:value="latitude" :placeholder="$t('generate.latitude')" class="w-140px" />

        <NButton type="primary" @click="openMapAndGetPosition">{{ $t('generate.location') }}</NButton>
      </n-space>
    </NCard>

    <NCard :title="$t('generate.extension-info')" class="mb-4">
      <template v-for="item in additionInfo" :key="item.name">
        <NFlex v-if="item.enable === true" justify="" class="mb-24px items-center">
          <NFormItem :label="item.name" path="name" class="flex items-center">
            <NInput v-model:value="item.value" style="margin-left: 15px" />
          </NFormItem>
          <div>{{ item.desc }}</div>
        </NFlex>
      </template>
    </NCard>

    <NButton type="primary" @click="handleSave">{{ $t('common.save') }}</NButton>
    <NModal v-model:show="isShow" class="flex-center" :class="getPlatform ? 'max-w-90%' : 'max-w-640px'">
      <NCard class="flex flex-1">
        <TencentMap
          v-show="isShow"
          class="flex-1"
          :longitude="longitude"
          :latitude="latitude"
          @position-selected="onPositionSelected"
        />
      </NCard>
    </NModal>
  </div>
</template>
