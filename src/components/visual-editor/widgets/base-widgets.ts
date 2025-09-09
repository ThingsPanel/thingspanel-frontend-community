/**
 * @file base-widgets.ts
 * @description 定义并注册基础组件，例如文本、图片等。
 */

import { TextOutline, ImageOutline } from '@vicons/ionicons5'
import { widgetRegistry } from '../core/widget-registry'
import type { WidgetDefinition } from '../core/widget-registry'

const textWidget: WidgetDefinition = {
  type: 'text',
  name: '文本',
  description: '用于显示静态或动态文本内容。',
  icon: TextOutline,
  category: 'base',
  version: '1.0.0',
  defaultProperties: {
    content: '文本内容',
    fontSize: 14,
    color: '#333333',
    textAlign: 'left'
  },
  defaultLayout: {
    canvas: { width: 200, height: 50 },
    gridstack: { w: 2, h: 1 }
  }
}

const imageWidget: WidgetDefinition = {
  type: 'image',
  name: '图片',
  description: '用于显示静态图片或通过 URL 加载的动态图片。',
  icon: ImageOutline,
  category: 'base',
  version: '1.0.0',
  defaultProperties: {
    src: '',
    alt: '图片',
    objectFit: 'cover'
  },
  defaultLayout: {
    canvas: { width: 200, height: 150 },
    gridstack: { w: 2, h: 3 }
  }
}

export function registerBaseWidgets() {
  widgetRegistry.register(textWidget, imageWidget)
}
