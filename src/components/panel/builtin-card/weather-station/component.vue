<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import * as echarts from 'echarts';
import { $t } from '@/locales';

const active = ref('3');

const submit: (item: string) => void = item => {
  active.value = item;
};

interface WeatherItem {
  id: string;
  icons1: string;
  icons2: string;
  mark1: string;
  mark2: string;
  text1: string;
  text2: string;
  value1: string;
  value2: string;
}

const weatherList: WeatherItem[] = reactive([
  {
    id: '1',
    icons1: 'wind-speed',
    value1: '30',
    mark1: 'm/s',
    text1: $t('dashboard_panel.cardName.windSpeed'),
    icons2: 'wind-direction',
    value2: '265',
    mark2: '°',
    text2: $t('dashboard_panel.cardName.windDirection')
  },
  {
    id: '2',
    icons1: 'wind-temperature',
    value1: '26',
    mark1: '°',
    text1: $t('dashboard_panel.cardName.temperature'),
    icons2: 'wind-humidity',
    value2: '64',
    mark2: '%',
    text2: $t('dashboard_panel.cardName.humidity')
  },
  {
    id: '3',
    icons1: 'wind-pressure',
    value1: '456',
    mark1: 'm/s',
    text1: $t('dashboard_panel.cardName.pressure'),
    icons2: 'wind-rainfall',
    value2: '220',
    mark2: 'mm',
    text2: $t('dashboard_panel.cardName.rainfall')
  }
]);

// 图表
const foldLine = ref(null);

const init: () => void = () => {
  const myecharts = echarts.init(foldLine.value, null, { renderer: 'svg' });
  const option = {
    title: {
      show: false
    },
    tooltip: {
      size: '20',
      trigger: 'axis', // 触发类型，可选为'item'、'axis'
      formatter(params) {
        // params是一个包含当前数据信息的数组
        const res = params.map(item => {
          // item 是单个数据的信息对象
          return (
            `<span style="font-size: 14px;font-weight: 600; color:rgba(35, 43, 46, 1); ">${item.seriesName}<br/>${item.data}mm` +
            `</span>`
          );
        });
        return res.join('<br/>'); // 使用换行符将多个数据项分隔开
      }
    },
    legend: {
      show: false
    },
    grid: {
      top: '5%',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
        '22',
        '23',
        '24',
        '25',
        '26',
        '27',
        '28',
        '29',
        '30',
        '31'
      ]
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: $t('dashboard_panel.cardName.rainfall'),
        type: 'line',
        stack: 'Total',
        data: [
          50, 100, 120, 130, 150, 180, 200, 250, 290, 300, 240, 290, 300, 240, 220, 180, 160, 150, 180, 110, 190, 123,
          150, 200, 210, 260, 220, 210, 200, 280, 300
        ],
        areaStyle: {
          // 设置阴影样式
          color: new echarts.graphic.LinearGradient( // 使用线性渐变
            0,
            0,
            0,
            1, // 渐变方向（从左上角到右下角）
            [
              { offset: 0, color: 'rgba(11, 132, 240, .1)' }, // 结束颜色（完全透明）
              { offset: 1, color: 'rgba(255, 255, 255, 1)' } // 起始颜色（透明度为0.8的灰色）
            ]
          ),
          opacity: 1 // 设置阴影透明度（1表示完全不透明）
        }
      }
    ]
  };
  const dom = document.getElementById('foldLine')!;
  const ro = new ResizeObserver(_entries => {
    myecharts.resize();
  });
  ro.observe(dom);
  // 监听窗口大小变化
  myecharts.setOption(option);
};
onMounted(() => {
  init();
});
</script>

<template>
  <div>
    <header class="w-full flex flex-justify-between flex-items-center">
      <div class="header-title font-500">{{ $t('dashboard_panel.cardName.weatherStation') }}</div>
      <SvgIcon local-icon="signal" class="more" />
    </header>
    <div class="weather-card flex flex-justify-between flex-items-center">
      <div
        v-for="item in weatherList"
        :key="item.id"
        class="weather-card-item p-2"
        :class="[item.id === active ? 'weather-card-item-active' : '']"
        @click="submit(item.id)"
      >
        <div class="top m-t3 flex flex-items-center p-l4">
          <SvgIcon :local-icon="item.icons1" />
          <div class="right flex-col">
            <div>
              <span>{{ item.value1 }}</span>
              <span>{{ item.mark1 }}</span>
            </div>
            <span>{{ item.text1 }}</span>
          </div>
        </div>
        <div class="top m-t3 flex flex-items-center p-l4">
          <SvgIcon :local-icon="item.icons2" />
          <div class="right flex-col">
            <div>
              <span>{{ item.value2 }}</span>
              <span>{{ item.mark2 }}</span>
            </div>
            <span>{{ item.text2 }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="line">
      <div class="m-l3">{{ $t('dashboard_panel.cardName.historyData') }}</div>
      <div class="icons flex flex-items-center">
        <SvgIcon local-icon="line-icon1" />
        <SvgIcon local-icon="line-icon2" />
        <SvgIcon local-icon="line-icon3" />
      </div>
      <div id="foldLine" ref="foldLine" class="h-full w-full"></div>
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
    font-size: 16px;
  }
}

.weather-card {
  margin-top: 16px;

  .weather-card-item {
    width: 175px;
    height: 148px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.05);

    .top {
      svg {
        font-size: 30px;
        margin-right: 26px;
      }

      .right > div > span:nth-child(1) .right > div > span:nth-child(1) {
        font-size: 20px;
        font-weight: 500;
        line-height: 24.22px;
        color: rgba(122, 132, 135, 1);
        text-align: right;
      }

      .right > div > span:nth-child(2) {
        font-size: 10px;
        font-weight: 400;
        line-height: 13.2px;
        color: rgba(122, 132, 135, 1);
        text-align: left;
      }

      .right > span:nth-child(2) {
        margin-top: 4px;
        font-size: 13px;
        font-weight: 400;
        line-height: 17.16px;
        color: rgba(122, 132, 135, 1);
        text-align: center;
      }
    }
  }
}

.weather-card-item-active {
  background: rgba(50, 50, 153, 1) !important;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.05);

  .right > div > span:nth-child(1),
  .right > div > span:nth-child(2),
  .right > span:nth-child(2) {
    color: #fff !important;
  }
}

.line {
  margin-top: 30px;
  width: 100%;
  height: 255px;

  div:nth-child(1) {
    font-size: 16px;
    font-weight: 600;
    line-height: 21.12px;
    color: rgba(35, 43, 46, 1);
    text-align: left;
  }

  .icons {
    margin: 8px 4px;

    svg {
      margin-left: 15px;
      color: salmon;
      font-size: 20px;
    }
  }
}
</style>
