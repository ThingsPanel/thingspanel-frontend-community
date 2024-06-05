<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { $t } from '@/locales';

const active: any = ref('0');
const submit: (item: any) => void = item => {
  active.value = item.id;
  console.log(active, '我被点击了');
};

interface WeatherItem {
  id: string;
  icons: string;
  temperature: string;
  humidity: string;
  text: string;
}

const weatherList: WeatherItem[] = reactive([
  {
    id: '0',
    temperature: '26°',
    humidity: '54%',
    text: $t('dashboard_panel.cardName.week.mon'),
    icons: 'sunlight'
  },
  {
    id: '1',
    temperature: '24°',
    humidity: '43%',
    text: $t('dashboard_panel.cardName.week.tue'),
    icons: 'cloudy'
  },
  {
    id: '2',
    temperature: '26°',
    humidity: '65%',
    text: $t('dashboard_panel.cardName.week.wed'),
    icons: 'rain'
  },
  {
    id: '3',
    temperature: '26°',
    humidity: '72%',
    text: $t('dashboard_panel.cardName.week.thur'),
    icons: 'snow'
  },
  {
    id: '4',
    temperature: '25°',
    humidity: '58%',
    text: $t('dashboard_panel.cardName.week.fri'),
    icons: 'yin'
  }
  // {
  //   id: '5',
  //   temperature: '24°',
  //   humidity: '64%',
  //   text: $t('dashboard_panel.cardName.week.sat'),
  //   icons: 'sunlight'
  // },
  // {
  //   id: '6',
  //   temperature: '24°',
  //   humidity: '64%',
  //   text: $t('dashboard_panel.cardName.week.sun'),
  //   icons: 'cloudy'
  // }
]);
</script>

<template>
  <div class="flex flex-col-center">
    <header class="w-full flex flex-justify-between flex-items-center">
      <div class="header-title font-500">{{ $t('dashboard_panel.cardName.sevenDayWeather') }}</div>
    </header>
    <div class="weather h-full w-full flex flex-justify-between flex-items-center">
      <div
        v-for="item in weatherList"
        :key="item.id"
        class="weather-item h-full flex-col flex-items-center"
        :class="[item.id === active ? 'weather-item-active' : '']"
        @click="submit(item)"
      >
        <span :class="[item.id === active ? 'color-active' : '']">{{ item.text }}</span>
        <SvgIcon :local-icon="item.icons" />
        <span :class="[item.id === active ? 'color-active' : '']">{{ item.temperature }}</span>
        <span :class="[item.id === active ? 'color-active' : '']">{{ item.humidity }}</span>
        <SvgIcon
          v-show="Number(item.humidity.slice(0, 2)) > 50"
          :local-icon="item.id === active ? 'humidity-active' : 'humidity'"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
header {
  .header-title {
    font-size: 18px;
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
    background: #22b3e5ff;
  }
}

.weather {
  padding: 0 20px;

  .weather-item {
    margin-top: 16px;
    cursor: pointer;
    width: 66px;
    height: 157px;
  }

  .weather-item-active {
    background: linear-gradient(180deg, #22e2e6ff 0%, #22b3e5ff 100%);
    border-radius: 182px;
  }

  .weather-item > span:nth-child(1) {
    margin-top: 14px;
    font-size: 16px;
    font-weight: 500;
    line-height: 19.38px;
    color: rgba(35, 43, 46, 1);
    text-align: center;
  }

  .weather-item > svg:nth-child(2) {
    font-size: 26px;
    margin-top: 12px;
  }

  .weather-item > span:nth-child(3) {
    margin-top: 12px;
    font-size: 18px;
    font-weight: 700;
    line-height: 21.8px;
    color: rgba(35, 43, 46, 1);
    text-align: center;
  }

  .weather-item > span:nth-child(4) {
    margin-top: 5px;
    font-size: 14px;
    font-weight: 400;
    line-height: 16.95px;
    color: rgba(35, 43, 46, 1);
    text-align: center;
    vertical-align: top;
  }

  .weather-item > span:nth-child(5) {
    margin-top: 9px;
    font-size: 12px;
  }

  .weather-item > svg:nth-child(5) {
    margin-top: 9px;
    font-size: 12px;
  }
}

.color-active {
  color: #fff !important;
}
</style>
