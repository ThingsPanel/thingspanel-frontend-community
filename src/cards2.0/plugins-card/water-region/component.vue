<script lang="ts" setup>
import { reactive } from 'vue'
import { $t } from '@/locales'

interface AirItem {
  id: string
  icons: string
  air: string
  text: string
}

const airList: AirItem[] = reactive([
  {
    id: '1',
    icons: 'air-humidity',
    air: '102%',
    text: "土壤湿度"
  },
  {
    id: '2',
    icons: 'air-temperature',
    air: '20.5°C',
    text: "土壤温度"
  },
  {
    id: '3',
    icons: 'air-conductivity',
    air: '14%',
    text: "导电率"
  },
  {
    id: '4',
    icons: 'contain-potassium',
    air: '102%',
    text: "含钾量"
  },
  {
    id: '5',
    icons: 'contain-phosphorus',
    air: '20.5°C',
    text: "含磷量"
  },
  {
    id: '6',
    icons: 'contain-nitrogen',
    air: '14%',
    text: "含氮量"
  }
])
</script>

<template>
  <div class="flex flex-col-center">
    <header class="w-full flex flex-justify-between flex-items-center">
      <div class="header-title font-500">{{ "浇灌区域" }}</div>
      <SvgIcon local-icon="more" class="more" />
    </header>
    <div v-for="index in 5" :key="index" class="row w-full flex flex-justify-between flex-items-center">
      <div class="row-left flex flex-1 flex-justify-between">
        <div class="col-icon flex flex-justify-center flex-items-center">
          <SvgIcon local-icon="map-icon" class="text-8" />
        </div>
        <div class="col-region flex-col-center">
          <span>{{ "区域名称" }}</span>
          <span>{{ "玉米" }}</span>
        </div>
        <div class="col-type flex-col-center">
          <span>{{ "喷灌沟灌" }}</span>
          <span>{{ "灌溉类型" }}</span>
        </div>
        <div class="col-size flex-col-center">
          <span>100 {{ "公顷" }}</span>
          <span>{{ "区域面积" }}</span>
        </div>
        <div class="col-soil-type flex-col-center">
          <span>{{ "沙壤土" }}</span>
          <span>{{ "土壤类型" }}</span>
        </div>
      </div>
      <div class="row-border"></div>
      <div class="row-right flex flex-1 flex-justify-between">
        <div v-for="item in airList" :key="item.id" class="col-weather flex-col-center">
          <SvgIcon :local-icon="item.icons" class="col-weather-icon" />
          <span>{{ item.air }}</span>
          <span>{{ item.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
header {
  .header-title {
    font-size: 18px;
    letter-spacing: 0px;
    line-height: 21.12px;
    color: rgba(35, 43, 46, 1);
    text-align: left;
    vertical-align: top;
    position: relative;
    padding-left: 8px;
    font-weight: 600;
  }

  .header-title::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 0;
    display: inline-block;
    width: 2px;
    height: 15px;
    border-radius: 12px;
    background: rgba(34, 179, 229, 1);
  }

  .more {
    cursor: pointer;
    font-size: 40px;
  }
}

.row {
  margin-top: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid rgba($color: #7a8487ff, $alpha: 0.2);

  .row-left {
    .col-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #ccc;
    }

    .col-region > span:nth-child(1) {
      font-size: 16px;
      color: #009bcfff;
    }

    .col-region > span:nth-child(2) {
      margin-top: 6px;
      font-size: 14px;
      color: #7a8487ff;
    }

    .col-type > span:nth-child(1),
    .col-size > span:nth-child(1),
    .col-soil-type > span:nth-child(1) {
      font-size: 14px;
      color: #232b2eff;
      font-weight: bold;
    }

    .col-type > span:nth-child(2),
    .col-size > span:nth-child(2),
    .col-soil-type > span:nth-child(2) {
      margin-top: 6px;
      font-size: 12px;
      color: #7a8487ff;
    }
  }

  .row-border {
    margin: 0 40px;
    width: 34px;
    transform: rotate(90deg);
    border: 1px solid rgba($color: #7a8487ff, $alpha: 0.2);
  }

  .col-weather > span:nth-child(2) {
    margin: 3px 0 3px;
    font-size: 16px;
    color: #232b2eff;
  }

  .col-weather > span:nth-child(3) {
    font-size: 12px;
    color: #7a8487ff;
  }

  .col-weather-icon {
    font-size: 25px;
  }
}

.row:last-child {
  border-bottom: none;
}
</style>
