import type { CardDefinition } from '@/card2.1/types/card-definition';

export default {
  type: 'on-line',
  name: '在线设备数',
  description: '显示当前在线的设备数量',
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
        "type": "on-line",
        "color": "#6a994e",
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