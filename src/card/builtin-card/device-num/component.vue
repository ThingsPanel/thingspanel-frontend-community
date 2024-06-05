<script lang="ts" setup>
import { ref } from 'vue';
import { $t } from '@/locales';
import { totalNumber } from '@/service/api';
// 设备总数
const deviceNum = ref(0);
// 设备在线数
const deviceOn = ref(0);
// 设备离线数
const deviceOff = ref(0);
// 设备在线率（百分比）
const deviceOnlineRate = ref(0);

// 获取数据
// 获取数据
const getData: () => void = async () => {
  try {
    const response: { data: any } = await totalNumber();
    if (response.data) {
      deviceNum.value = response.data.device_total;
      deviceOn.value = response?.data?.device_on ?? 0;
      deviceOff.value = (deviceNum?.value ?? 0) - (deviceOn?.value ?? 0);
      // 计算激活率
      const rate = deviceOn.value === 0 || deviceNum.value === 0 ? 0 : (deviceOn?.value / deviceNum.value) * 100;
      deviceOnlineRate.value = Number(rate.toFixed(2)); // 转换为数字并保留四位小数
    } else {
      console.error('Data does not contain the required properties or they are not numbers.');
    }
  } catch (error) {
    // 处理请求数据时的错误
    console.error('Error fetching data:', error);
  }
};
// 调用 getData 函数
getData();

// 调用 getData 函数
getData();
</script>

<template>
  <div class="device flex-col flex-justify-center flex-items-center">
    <div class="device-top h-full w-full flex flex-justify-between flex-items-center">
      <div class="left h-full flex-col">
        <span>{{ $t('dashboard_panel.cardName.deviceNum') }}</span>
        <span>{{ deviceNum }}</span>
      </div>
      <SvgIcon local-icon="device" class="device-icon" />
    </div>
    <div class="device-bottom m-t3 w-full flex flex-justify-between flex-content-start flex-items-center">
      <div class="device-bottom-state flex flex-items-center">
        <SvgIcon local-icon="on-line" class="device_bottom-icon" />
        <span>{{ $t('dashboard_panel.cardName.onLine') }} {{ deviceOn }}</span>
      </div>
      <div class="device-bottom-state flex flex-items-center">
        <SvgIcon local-icon="offline" class="device_bottom-icon" />
        <span>{{ $t('dashboard_panel.cardName.offline') }} {{ deviceOff }}</span>
      </div>
      <div class="device-bottom-state flex flex-items-center">
        <SvgIcon local-icon="online-rate1" class="device_bottom-icon" />
        <span>{{ $t('dashboard_panel.cardName.onlineRate') }} {{ deviceOnlineRate }}%</span>
        <SvgIcon local-icon="online-rate2" class="device_bottom-icon" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.device {
  padding: 0 70px;

  .device-top {
    .left > span:nth-child(1) {
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: bold;
      line-height: 18.48px;
      color: rgba(35, 43, 46, 1);
      text-align: left;
    }

    .left > span:nth-child(2) {
      font-size: 26px;
      font-weight: bold;
      line-height: 31.49px;
      color: rgba(0, 0, 0, 1);
      text-align: left;
    }

    .device-icon {
      font-size: 70px;
    }
  }

  .device-bottom {
    .device-bottom-state {
      position: relative;
    }

    .device-bottom-state > svg:nth-child(1) {
      font-size: 16px;
    }

    .device-bottom-state > span:nth-child(2) {
      font-size: 14px;
      font-weight: 400;
      line-height: 18.48px;
      color: #7a8487ff;
      text-align: left;
      margin: 0 10px;
    }

    .device-bottom-state > svg:nth-child(3) {
      font-size: 9px;
      position: absolute;
      top: -1px;
      left: 9px;
    }
  }
}
</style>
