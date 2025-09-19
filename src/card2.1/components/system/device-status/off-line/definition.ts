import type { CardDefinition } from '@/card2.1/types/card-definition';

export default {
  type: 'off-line',
  name: '离线设备数',
  description: '显示当前离线的设备数量',
  category: 'system',
  subcategory: 'device-status',
  isTool: false,
  isPreset: true,
  isGenerated: false,
  isSystem: true,
  isOfficial: true,
  permissions: [],
  requirements: [],
  presets: [
    {
      "name": "默认样式",
      "isDefault": true,
      "isSystem": true,
      "isOfficial": true,
      "card": {
        "type": "off-line",
        "color": "#a5a58d",
        "grid": {
          "x": 0,
          "y": 0,
          "w": 2,
          "h": 2
        }
      }
    }
  ],
} as CardDefinition;