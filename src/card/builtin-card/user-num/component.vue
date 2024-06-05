<script lang="ts" setup>
import { ref } from 'vue';
import { $t } from '@/locales';
import { tenant } from '@/service/api';

// 租户总数
const tenantNum = ref<number>(0);
// 昨日新增
const user_added_yesterday = ref<number>(0);

// 历史新增
const historyAdd = ref<number>(0);
// 本月新增
const thisMonth = ref<number>(0);

// 获取数据
const getData: () => void = async () => {
  try {
    const response: { data: any } = await tenant();
    tenantNum.value = response.data.user_total;
    user_added_yesterday.value = response.data.user_added_yesterday;
    historyAdd.value = response.data.user_list_month.reduce((a, b) => a + b.num, 0);
    thisMonth.value = tenantNum.value - historyAdd.value;
    console.log(historyAdd);
  } catch (error) {
    // 错误处理逻辑
    console.error('Error fetching data:', error);
  }
};

// 调用 getData 函数
getData();
</script>

<template>
  <div class="device flex-col flex-justify-center flex-items-center">
    <div class="device-top h-full w-full flex flex-justify-between flex-items-center">
      <div class="left h-full flex-col">
        <span>{{ $t('dashboard_panel.cardName.userNum') }}</span>
        <span>{{ tenantNum }}</span>
      </div>
      <SvgIcon local-icon="user-num" class="device-icon" />
    </div>
    <div class="device-bottom m-t3 w-full flex flex-justify-between flex-content-start flex-items-center">
      <div class="device-bottom-state flex flex-items-center">
        <SvgIcon local-icon="day" class="device_bottom-icon" />
        <span>{{ $t('dashboard_panel.cardName.yesterdayAdd') }} {{ user_added_yesterday }}</span>
      </div>
      <div class="device-bottom-state flex flex-items-center">
        <SvgIcon local-icon="month" class="device_bottom-icon" />
        <span>{{ $t('dashboard_panel.cardName.thisMonth') }} {{ thisMonth }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.device {
  padding: 0px 70px;

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
  }
}
</style>
