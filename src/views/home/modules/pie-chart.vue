<script setup lang="ts">
import { watch } from 'vue'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'
import { useEcharts } from '@/hooks/chart/use-echarts'

defineOptions({
  name: 'PieChart'
})

const appStore = useAppStore()

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    bottom: '1%',
    left: 'center',
    itemStyle: {
      borderWidth: 0
    }
  },
  series: [
    {
      color: ['#5da8ff', '#8e9dff', '#fedc69', '#26deca'],
      name: "作息安排",
      type: 'pie',
      radius: ['45%', '75%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '12'
        }
      },
      labelLine: {
        show: false
      },
      data: [] as { name: string; value: number }[]
    }
  ]
}))

async function mockData() {
  await new Promise(resolve => {
    setTimeout(resolve, 1000)
  })

  await updateOptions(opts => {
    opts.series[0].data = [
      { name: "学习", value: 20 },
      { name: "娱乐", value: 10 },
      { name: "工作", value: 40 },
      { name: "休息", value: 30 }
    ]

    return opts
  })
}

function updateLocale() {
  updateOptions((opts, factory) => {
    const originOpts = factory()

    opts.series[0].name = originOpts.series[0].name

    opts.series[0].data = [
      { name: "学习", value: 20 },
      { name: "娱乐", value: 10 },
      { name: "工作", value: 40 },
      { name: "休息", value: 30 }
    ]

    return opts
  })
}

async function init() {
  mockData()
}

watch(
  () => appStore.locale,
  () => {
    updateLocale()
  }
)

// init
init()
</script>

<template>
  <div ref="domRef" class="h-360px w-full"></div>
</template>

<style scoped></style>
