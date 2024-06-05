<script lang="ts" setup>
import { $t } from '@/locales';
</script>

<template>
  <div class="device flex-col flex-justify-center flex-items-center">
    <div class="device-top h-full w-full flex flex-justify-between flex-items-center">
      <div class="left h-full flex-col">
        <span>{{ $t('dashboard_panel.cardName.userNum') }}</span>
        <span>7</span>
      </div>
      <SvgIcon local-icon="user-num" class="device-icon" />
    </div>
    <div class="device-bottom m-t3 w-full flex flex-justify-between flex-content-start flex-items-center">
      <div class="device-bottom-state flex flex-items-center">
        <SvgIcon local-icon="day" class="device_bottom-icon" />
        <span>{{ $t('dashboard_panel.cardName.userNum') }} 7</span>
      </div>
      <div class="device-bottom-state flex flex-items-center">
        <SvgIcon local-icon="month" class="device_bottom-icon" />
        <span>{{ $t('dashboard_panel.cardName.thisMonth') }} 0</span>
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
