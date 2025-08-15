/**
 * 用户信息卡片组件定义
 * 展示用户基本信息、统计数据、技能标签和最近活动
 */

import UserInfoCard from './UserInfoCard.vue'
import type { ComponentDefinition } from '../../core/types'

const userInfoCardDefinition: ComponentDefinition = {
  type: 'user-info-card',
  name: '用户信息卡片',
  description: '展示用户头像、基本信息、统计数据、技能标签和最近活动的卡片组件',
  version: '1.0.0',
  component: UserInfoCard, // 🔥 关键修复：添加Vue组件引用

  // 组件分类
  category: 'display',
  mainCategory: '展示',
  subCategory: '用户信息',
  icon: 'person',
  author: 'Claude Code Assistant',
  permission: '不限',
  tags: ['用户', '信息', '卡片', '头像', '统计'],

  // 数据源定义 - 双数据源：用户信息对象 + 活动列表数组
  dataSources: [
    {
      key: 'userInfo',
      name: '用户信息',
      description: '用户的基本信息和统计数据',
      supportedTypes: ['static', 'api'],
      required: false,
      fieldMappings: {
        userInfo: {
          targetField: 'userInfo',
          type: 'object',
          required: false,
          description: '用户信息对象',
          defaultValue: {
            id: 'user-001',
            name: '张三',
            title: '前端工程师',
            avatar: '',
            status: 'online',
            stats: {
              projects: 0,
              tasks: 0,
              score: 0
            },
            skills: []
          }
        }
      }
    },
    {
      key: 'recentActivities',
      name: '最近活动',
      description: '用户最近的活动记录列表',
      supportedTypes: ['static', 'api'],
      required: false,
      fieldMappings: {
        recentActivities: {
          targetField: 'recentActivities',
          type: 'array',
          required: false,
          description: '最近活动列表',
          defaultValue: [
            {
              id: 'activity-001',
              time: '2024-01-01T10:00:00Z',
              content: '活动内容'
            }
          ]
        }
      }
    }
  ],

  config: {
    width: 320,
    height: 400
  }
}

export default userInfoCardDefinition
