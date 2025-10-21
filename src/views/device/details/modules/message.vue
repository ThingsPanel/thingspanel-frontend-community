<script setup lang="tsx">
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { FormInst } from 'naive-ui';
import { NButton, NSpace, useMessage, NInputNumber, NTooltip, NIcon, NInput, NSelect, NSwitch } from 'naive-ui';
import { deviceConfigInfo, deviceDetail, deviceLocation } from '@/service/api';
// 移除deviceConfigEdit导入，不再调用设备配置接口
import { $t } from '@/locales';
import TencentMap from './public/tencent-map.vue'; // 路径根据实际位置调整
import { getCoordinateStringValidationError } from '@/utils/common/map-validator';

const props = defineProps<{
  id: string;
  deviceConfigId: string;
}>();
const latitude = ref('');
const longitude = ref('');
const isShow = ref(false);
// 扩展信息数据
const additionInfo = ref([] as ExtensionInfo[]);
// 表单引用
const extensionFormRef = ref<HTMLElement & FormInst>();

// 扩展信息接口定义
interface ExtensionInfo {
  name: string;
  type: 'String' | 'Number' | 'Boolean' | 'Enum';
  default_value: string;
  value?: string;
  desc?: string;
  enable: boolean;
  options?: Array<{ label: string; value: string }>; // 枚举类型的选项
}
// postData变量已移除，不再需要调用设备配置接口
const { query } = useRoute();
const message = useMessage();
const handleSave = async () => {
  try {
    // 验证经纬度是否有效
    if (latitude.value && longitude.value) {
      const error = getCoordinateStringValidationError(latitude.value, longitude.value);
      if (error) {
        message.error(`经纬度无效: ${error}`);
        return;
      }
    }
    
    // 验证扩展信息表单
    if (extensionFormRef.value) {
      await extensionFormRef.value.validate();
    }
    
    // 只调用设备位置接口，将扩展信息一并保存
    const res = await deviceLocation({
      id: props.id,
      location: `${longitude.value},${latitude.value}`,
      additional_info: JSON.stringify({ extendedInfo: additionInfo.value })
    });
    if (!res.error) {
      message.success($t('common.modifySuccess'));
    }
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请检查表单数据');
  }
};
// 移除单独的扩展信息保存函数，统一使用底部保存按钮
// 不再调用设备配置接口，只通过设备位置接口保存扩展信息

// handleSwitchChange函数已移除，因为开关功能已被移除
// 扩展信息的启用/禁用状态通过过滤逻辑处理
// 根据类型渲染表单控件
const renderFormControl = (item: ExtensionInfo, index: number) => {
  const { type, options, default_value } = item;
  
  switch (type) {
    case 'String':
      return (
        <NInput 
          v-model:value={additionInfo.value[index].value}
          placeholder={`默认值: ${default_value}`}
        />
      );
    case 'Number':
      return (
        <NInputNumber 
          v-model:value={additionInfo.value[index].value}
          placeholder={`默认值: ${default_value}`}
          class="w-full"
        />
      );
    case 'Boolean':
      return (
        <NSwitch 
          v-model:value={additionInfo.value[index].value}
          checkedValue="true"
          uncheckedValue="false"
        />
      );
    case 'Enum':
      return (
        <NSelect 
          v-model:value={additionInfo.value[index].value}
          options={options || []}
          placeholder={`默认值: ${default_value}`}
        />
      );
    default:
      return (
        <NInput 
          v-model:value={additionInfo.value[index].value}
          placeholder={`默认值: ${default_value}`}
        />
      );
  }
};

const onPositionSelected = position => {
  latitude.value = position.lat.toString();
  longitude.value = position.lng.toString();
  isShow.value = false;
};

const openMapAndGetPosition = () => {
  // 验证当前输入的经纬度是否有效
  if (latitude.value && longitude.value) {
    const error = getCoordinateStringValidationError(latitude.value, longitude.value);
    if (error) {
      window.$message?.error(`当前经纬度无效: ${error}`);
      return;
    }
  }
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
        const extendedItem = extendedInfo.find(info => info.name === item.name);
        return {
          name: item.name,
          type: item.type,
          default_value: item.default_value,
          value: extendedItem?.value || item.default_value, // 如果没有值就使用默认值
          desc: item.desc,
          enable: item.enable,
          options: item.options || [] // 枚举类型的选项
        };
      });
    }
  }
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
      <NSpace>
        <NInput v-model:value="longitude" :placeholder="$t('generate.longitude')" class="w-140px" />
        <NInput v-model:value="latitude" :placeholder="$t('generate.latitude')" class="w-140px" />

        <NButton type="primary" @click="openMapAndGetPosition">{{ $t('generate.location') }}</NButton>
      </NSpace>
    </NCard>

    <NCard :title="$t('generate.extension-info')" class="mb-4">
      <!-- 扩展信息表单 -->
        <div v-if="additionInfo.filter(item => item.enable === true).length > 0">
          <NForm ref="extensionFormRef" class="mt-4">
            <div class="space-y-4">
              <div v-for="item in additionInfo.filter(item => item.enable === true)" :key="item.name" class="flex items-center gap-3">
                <!-- 名称和信息图标 -->
                <div class="w-40 text-sm font-medium text-gray-700 flex-shrink-0 flex items-center gap-1">
                  <span class="truncate" :title="item.name">{{ item.name }}</span>
                  <NTooltip trigger="hover">
                    <template #trigger>
                      <NIcon size="14" class="text-gray-400 cursor-help">
                        <svg viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41c0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                        </svg>
                      </NIcon>
                    </template>
                    <div class="max-w-xs">
                      <div class="text-sm font-medium mb-1">名称: {{ item.name }}</div>
                      <div class="text-sm font-medium mb-1">类型: {{ item.type }}</div>
                      <div class="text-sm mb-1">默认值: {{ item.default_value }}</div>
                      <div class="text-sm text-gray-600">{{ item.desc || '无描述' }}</div>
                    </div>
                  </NTooltip>
                </div>
                
                <!-- 表单控件 -->
                <div class="flex-1">
                  <component :is="renderFormControl(item, additionInfo.findIndex(originalItem => originalItem.name === item.name))" />
                </div>
              </div>
            </div>
          </NForm>
        </div>
        
        <div v-else class="text-center text-gray-400 py-8">
          {{ $t('common.noData') }}
        </div>
      </NCard>

    <NButton type="primary" @click="handleSave">{{ $t('common.save') }}</NButton>
    <NModal v-model:show="isShow" class="flex-center" :class="getPlatform ? 'max-w-90%' : 'max-w-720px'">
      <NCard class="flex flex-1">
        <TencentMap
          v-show="isShow"
          class="flex-1 h-440px w-680px"
          :longitude="longitude"
          :latitude="latitude"
          @position-selected="onPositionSelected"
        />
       </NCard>
     </NModal>
   </div>
</template>
