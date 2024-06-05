<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
// import axios from 'axios'
import * as echarts from 'echarts';
import { $t } from '@/locales';
// import type { ICardData } from '@/components/panel/card'
// defineProps<{
//   card: ICardData;
// }>();
interface Props {
  /** 渐变开始的颜色 */
  startColor?: string;
  /** 渐变结束的颜色 */
  endColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  startColor: '#ff3680',
  endColor: '#cd4e9f'
});
const gradientStyle = computed(() => `linear-gradient(to bottom right, ${props.startColor}, ${props.endColor})`);

const equipment = ref(null);
// 获取 echats 要渲染的dom

onMounted(() => {
  if (equipment.value) {
    // const myecharts = echarts.init(box.value);
    const myecharts = echarts.init(equipment.value);
    const option = {
      title: {
        text: '3344',
        show: true,
        top: '0',
        textStyle: {
          color: '#fff'
        }
      },
      graphic: {
        elements: [
          {
            type: 'group',
            left: '5',
            top: '30',
            children: Array.from({ length: 10 })
              .fill(0)
              .map((_value, i) => ({
                type: 'rect',
                x: i * 20,
                shape: {
                  x: 0,
                  y: 0,
                  width: 10,
                  height: 80
                },
                style: {
                  // fill: "#ecb34f",
                  fill: '#fff'
                },
                keyframeAnimation: {
                  duration: 1000,
                  delay: i * 200,
                  loop: true
                }
              }))
          }
        ]
      }
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
  }
  return {
    equipment
  };
});
</script>

<template>
  <div class="rounded-8px p-16px text-white" :style="{ backgroundImage: gradientStyle }">
    <div>{{ $t('generate.message-total') }}</div>
    <div id="equipment" ref="equipment" class="h-full w-full"></div>
  </div>
</template>

<style></style>
