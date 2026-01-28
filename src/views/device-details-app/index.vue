<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useRoute } from 'vue-router';
import ThingsVisEditor from '@/components/thingsvis/ThingsVisEditor.vue';
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields';
import { $t, setLocale } from '@/locales';
import { deviceDetail, deviceTemplateDetail } from '@/service/api/device';
import { formatDateTime } from '@/utils/common/datetime';
import { localStg } from '@/utils/storage';
import type { PlatformField } from '@/utils/thingsvis/types';
import TelemetryDataCards from './telemetryDataCards.vue';

const { query } = useRoute();
const { d_id, token, lang } = query;
const deviceData: any = ref({});

if (token) {
  localStg.set('token', token as string);
}

if (lang) {
  setLocale(lang as App.I18n.LangType);
}

const device_color = ref('#ccc');
const device_type = ref('');
const icon_type = ref('');
const device_number = ref('');

const showDefaultCards = ref(false);
const showAppChart = ref(false);
const cardHeight = ref(160); // 卡片的高度
const cardMargin = ref(15); // 卡片的间距

// ThingsVis 编辑器相关
const editorRef = ref<InstanceType<typeof ThingsVisEditor>>();
const initialConfig = ref<any>(null);
const platformFields = ref<PlatformField[]>([]);

// 数据更新定时器
let dataUpdateInterval: NodeJS.Timeout | null = null;

const getDeviceDetail = async () => {
  const { data, error } = await deviceDetail(d_id);
  if (!error) {
    deviceData.value = data;
    device_number.value = data.device_number;
    if (data.is_online !== 0) {
      device_color.value = 'rgb(2,153,52)';
      icon_type.value = 'rgb(2,153,52)';
    }
    if (data.device_config !== undefined) {
      device_type.value = data.device_config.device_type;
    }

    // 加载模板配置
    if (data.device_config?.device_template_id) {
      const res = await deviceTemplateDetail({ id: data.device_config.device_template_id });
      if (res.data) {
        // 提取平台字段
        platformFields.value = extractPlatformFields(res.data);

        // 加载 app_chart_config
        if (res.data.app_chart_config) {
          try {
            const configJson = JSON.parse(res.data.app_chart_config);
            initialConfig.value = configJson;
            showAppChart.value = true;
          } catch (e) {
            console.warn('解析 app_chart_config 失败', e);
            showDefaultCards.value = true;
          }
        } else {
          showDefaultCards.value = true;
        }
      }
    } else {
      showDefaultCards.value = true;
    }
  }
};

/**
 * 推送设备实时数据
 */
const pushDeviceData = async () => {
  if (!editorRef.value || !showAppChart.value) return;

  try {
    const { data, error } = await deviceDetail(d_id);

    if (!error && data) {
      const dataMap: Record<string, any> = {};

      // 从设备数据中提取字段值
      platformFields.value.forEach((field) => {
        if (data[field.id] !== undefined) {
          dataMap[field.id] = data[field.id];
        }
      });

      if (Object.keys(dataMap).length > 0) {
        editorRef.value.pushPlatformDataBatch(dataMap);
      }
    }
  } catch (error) {
    console.error('推送设备数据失败:', error);
  }
};

/**
 * 启动数据更新
 */
const startDataUpdate = () => {
  pushDeviceData();
  dataUpdateInterval = setInterval(() => {
    pushDeviceData();
  }, 5000);
};

/**
 * 停止数据更新
 */
const stopDataUpdate = () => {
  if (dataUpdateInterval) {
    clearInterval(dataUpdateInterval);
    dataUpdateInterval = null;
  }
};

/**
 * 编辑器就绪
 */
const handleEditorReady = () => {
  startDataUpdate();
};

onMounted(() => {
  getDeviceDetail();
});

onBeforeUnmount(() => {
  stopDataUpdate();
});
</script>

<template>
  <div class="mx-auto max-w-md rounded-3xl bg-gray-50 p-6 shadow-lg">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl text-gray-900 font-semibold">{{ deviceData?.name || '--' }}</h1>
      <div class="flex items-center">
        <SvgIcon
          local-icon="CellTowerRound"
          style="margin-right: 5px"
          class="color-ccc text-20px text-primary"
          :stroke="icon_type"
        />
        <span class="text-sm text-blue-500 font-medium">
          {{ deviceData?.is_online === 1 ? $t('custom.device_details.online') : $t('custom.device_details.offline') }}
        </span>
        <template v-if="deviceData?.alarmStatus === true">
          <SvgIcon
            local-icon="AlertFilled"
            style="color: #ee0808; margin-right: 5px"
            class="text-20px text-primary"
            :stroke="icon_type"
          />
          <span style="color: #ee0808">{{ $t('custom.device_details.alarm') }}</span>
        </template>
      </div>
    </div>

    <div class="mb-6 text-sm text-gray-500">
      {{ $t('custom.device_details.lastUpdate') }}: {{ formatDateTime(deviceData?.ts) || '--' }}
    </div>

    <n-divider title-placement="left"></n-divider>

    <TelemetryDataCards
      v-if="showDefaultCards"
      :id="d_id as string"
      :card-height="cardHeight"
      :card-margin="cardMargin"
    />
    <div v-if="showAppChart">
      <ThingsVisEditor
        ref="editorRef"
        mode="viewer"
        :initial-config="initialConfig"
        :platform-fields="platformFields"
        height="500px"
        @ready="handleEditorReady"
      />
    </div>
    <!--
    <div>
      <n-tabs v-model:value="tabValue" animated type="line" @update:value="changeTabs">
        <n-tab-pane v-for="component in components" :key="component.key" :tab="component.name" :name="component.key">
          <n-spin size="small" :show="loading">
            <component
              :is="component.component"
              :id="d_id as string"
              :device-config-id="deviceData?.device_config_id || ''"
            />
          </n-spin>
        </n-tab-pane>
      </n-tabs>
    </div>
    -->
  </div>
</template>

<style scoped>
.color-ccc {
  color: #ccc;
}
:root {
  --n-padding-left: 0px;
  --n-padding-right: 0px;
}
:deep(.n-card__content) {
  padding-left: 5px !important;
  padding-right: 5px !important;
}
</style>
