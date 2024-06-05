<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import type { NumberAnimationInst } from 'naive-ui';
import * as echarts from 'echarts';
import { totalNumber } from '@/service/api';
import { $t } from '@/locales';
const numberAnimationInstRef = ref<NumberAnimationInst | null>(null);

// 设备总数
const deviceNum = ref(0);
// 设备激活数
const activeNum = ref(0);
// 未激活设备数
const notActiveNum = ref(0);
// 设备激活率（百分比）
const activeRateNum = ref(0);

// 获取数据
const getData: () => void = async () => {
  try {
    const response: { data: any } = await totalNumber();
    if (response.data) {
      deviceNum.value = response.data.device_total;
      activeNum.value = response.data.device_on;
      notActiveNum.value = deviceNum.value - activeNum.value;
      // 计算激活率
      const rate = activeNum.value === 0 || deviceNum.value === 0 ? 0 : (activeNum.value / deviceNum.value) * 100;
      activeRateNum.value = Number(rate.toFixed(2)); // 转换为数字并保留四位小数
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

const equipment = ref(null);

const init: () => void = () => {
  const myecharts = echarts.init(equipment.value, null, { renderer: 'svg' });
  const option = {
    title: {
      show: false,
      text: '',
      subtext: '',
      left: 'center'
    },
    color: ['rgb(80,135,236)', 'rgb(104,187,196 )'],
    tooltip: {
      trigger: 'item'
    },
    legend: {
      show: false,
      orient: 'vertical',
      left: 'left'
    },
    label: {
      alignTo: 'edge',
      formatter: '{name|{b}}\n{time|{c}}',
      minMargin: 5,
      edgeDistance: 10,
      lineHeight: 15,
      rich: {
        time: {
          fontSize: 10,
          color: '#000'
        }
      }
    },
    series: [
      {
        name: '',
        type: 'pie',
        radius: '90%',
        itemStyle: {
          borderRadius: 3, // 设置圆角大小
          borderWidth: 1 // 设置边框宽度
        },
        data: [
          { value: 10000, name: $t('dashboard_panel.cardName.active') },
          { value: 5005, name: $t('dashboard_panel.cardName.notActive') }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(255, 255, 255, 0.5)'
          }
        }
      }
    ]
  };
  const dom = document.getElementById('equipment')!;
  const ro = new ResizeObserver(_entries => {
    myecharts.resize();
  });
  ro.observe(dom);
  // 监听窗口大小变化
  myecharts.setOption(option);
  // window.onresize = function () {
  //   // 使用刚指定的配置项和数据显示图表。
  //   myecharts.setOption(option);
  //   console.log("窗口大小发生改变了");
  //   // echarts适配
  //   myecharts.resize();
  // };
  // 监听图表点击事件
  // myecharts.on('click', params => {
  //   console.log(params.name) // 打印被点击的数据名称
  //   // 这里可以执行更多监听逻辑
  // })
};
// 获取 echats 要渲染的dom
onMounted(() => {
  if (equipment.value) {
    // const myecharts = echarts.init(box.value);
    init();
  }
  return {
    equipment
  };
});
</script>

<template>
  <div>
    <div class="header">
      {{ $t('dashboard_panel.cardName.deviceNumPie') }}
      <n-number-animation ref="numberAnimationInstRef" :to="deviceNum" />
    </div>
    <div class="content-data">
      <div>
        <span>{{ $t('dashboard_panel.cardName.active') }}</span>
        <n-number-animation ref="numberAnimationInstRef" :to="activeNum" />
      </div>
      <div>
        <span>{{ $t('dashboard_panel.cardName.notActive') }}</span>
        <n-number-animation ref="numberAnimationInstRef" :to="notActiveNum" />
      </div>
      <div>
        <span>{{ $t('dashboard_panel.cardName.activationRate') }}</span>
        <span>{{ activeRateNum }}%</span>
      </div>
    </div>
    <div id="equipment" ref="equipment" class="h-full w-full"></div>
  </div>
</template>

<style lang="scss" scoped>
#equipment {
  min-height: 200px;
}

.header {
  font-weight: 900;
}

.content-data {
  // font-size: 20px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0;

  span {
    margin-right: 8px;
  }
}
</style>
