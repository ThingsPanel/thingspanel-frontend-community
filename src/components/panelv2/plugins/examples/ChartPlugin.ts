// src/components/panelv2/plugins/examples/ChartPlugin.ts

import { defineComponent, h } from 'vue'
import type { Plugin, PluginContext } from '../types'

// 图表卡片组件
const ChartCard = defineComponent({
  name: 'ChartCard',
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    return () =>
      h(
        'div',
        {
          style: {
            padding: '20px',
            background: '#f0f2f5',
            borderRadius: '8px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }
        },
        [
          h('h3', { style: { margin: '0 0 10px 0' } }, props.config.title?.value || '图表'),
          h(
            'div',
            {
              style: {
                fontSize: '48px',
                fontWeight: 'bold',
                color: props.config.color?.value || '#1890ff'
              }
            },
            props.config.value?.value || '0'
          ),
          h(
            'p',
            {
              style: {
                margin: '10px 0 0 0',
                color: '#666'
              }
            },
            props.config.unit?.value || '单位'
          )
        ]
      )
  }
})

// 饼图卡片组件
const PieChartCard = defineComponent({
  name: 'PieChartCard',
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    return () =>
      h(
        'div',
        {
          style: {
            padding: '20px',
            background: '#fff',
            borderRadius: '8px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }
        },
        [
          h('h3', { style: { margin: '0 0 20px 0' } }, props.config.title?.value || '饼图'),
          h(
            'svg',
            {
              width: '200',
              height: '200',
              viewBox: '0 0 200 200'
            },
            [
              h('circle', {
                cx: '100',
                cy: '100',
                r: '80',
                fill: props.config.primaryColor?.value || '#1890ff',
                opacity: '0.8'
              }),
              h('circle', {
                cx: '100',
                cy: '100',
                r: '50',
                fill: props.config.secondaryColor?.value || '#52c41a',
                opacity: '0.8'
              })
            ]
          ),
          h(
            'p',
            {
              style: {
                margin: '20px 0 0 0',
                color: '#666',
                fontSize: '14px'
              }
            },
            props.config.description?.value || '数据可视化示例'
          )
        ]
      )
  }
})

// 图表插件定义
export const ChartPlugin: Plugin = {
  meta: {
    name: 'chart-plugin',
    version: '1.0.0',
    description: '提供各种图表组件的插件',
    author: 'PanelV2 Team'
  },

  // 插件提供的卡片组件
  cards: {
    'number-chart': ChartCard,
    'pie-chart': PieChartCard
  },

  // 插件提供的可拖拽项
  draggableItems: [
    {
      type: 'number-chart',
      label: '数字图表',
      icon: 'fa fa-chart-line',
      defaultData: {
        type: 'chart-plugin:number-chart',
        config: {
          title: { value: '数字图表', inspector: 'text-input' },
          value: { value: '100', inspector: 'text-input' },
          unit: { value: '个', inspector: 'text-input' },
          color: { value: '#1890ff', inspector: 'color-picker' }
        }
      }
    },
    {
      type: 'pie-chart',
      label: '饼图',
      icon: 'fa fa-chart-pie',
      defaultData: {
        type: 'chart-plugin:pie-chart',
        config: {
          title: { value: '饼图示例', inspector: 'text-input' },
          description: { value: '这是一个饼图示例', inspector: 'textarea' },
          primaryColor: { value: '#1890ff', inspector: 'color-picker' },
          secondaryColor: { value: '#52c41a', inspector: 'color-picker' }
        }
      }
    }
  ],

  // 插件提供的工具栏动作
  toolbarActions: [
    {
      id: 'refresh-charts',
      icon: 'fa fa-sync',
      tooltip: '刷新所有图表',
      action: store => {
        console.log('刷新所有图表')
        // 发送刷新事件
        store.emit('chart-plugin:refresh', { timestamp: Date.now() })
      }
    }
  ],

  // 生命周期钩子
  async onInstall(context: PluginContext) {
    console.log('Chart Plugin installed')

    // 监听刷新事件
    context.on('refresh', data => {
      console.log('Received refresh event:', data)
    })
  },

  async onUninstall(context: PluginContext) {
    console.log('Chart Plugin uninstalled')
  },

  async onActivate(context: PluginContext) {
    console.log('Chart Plugin activated')

    // 发送激活事件
    context.emit('activated', {
      plugin: 'chart-plugin',
      timestamp: Date.now()
    })
  },

  async onDeactivate(context: PluginContext) {
    console.log('Chart Plugin deactivated')
  }
}
