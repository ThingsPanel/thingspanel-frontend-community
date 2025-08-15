<template>
  <div class="user-info-card">
    <!-- 用户头像和基本信息 -->
    <div class="user-header">
      <div class="avatar-container">
        <img
          :src="userInfo?.avatar || '/default-avatar.png'"
          :alt="userInfo?.name || '用户'"
          class="user-avatar"
          @error="handleAvatarError"
        />
        <div class="status-indicator" :class="userInfo?.status || 'offline'"></div>
      </div>
      <div class="user-basic">
        <h3 class="user-name">{{ userInfo?.name || '未知用户' }}</h3>
        <p class="user-title">{{ userInfo?.title || '暂无职位' }}</p>
      </div>
    </div>

    <!-- 用户统计信息 -->
    <div class="user-stats">
      <div class="stat-item">
        <span class="stat-value">{{ userInfo?.stats?.projects || 0 }}</span>
        <span class="stat-label">项目数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ userInfo?.stats?.tasks || 0 }}</span>
        <span class="stat-label">任务数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ userInfo?.stats?.score || 0 }}</span>
        <span class="stat-label">评分</span>
      </div>
    </div>

    <!-- 技能标签 -->
    <div v-if="userInfo?.skills?.length" class="user-skills">
      <h4 class="skills-title">技能标签</h4>
      <div class="skills-list">
        <n-tag v-for="skill in userInfo.skills" :key="skill" size="small" type="info" class="skill-tag">
          {{ skill }}
        </n-tag>
      </div>
    </div>

    <!-- 最近活动 -->
    <div v-if="recentActivities?.length" class="recent-activities">
      <h4 class="activities-title">最近活动</h4>
      <div class="activities-list">
        <div v-for="activity in recentActivities.slice(0, 3)" :key="activity.id" class="activity-item">
          <div class="activity-time">{{ formatTime(activity.time) }}</div>
          <div class="activity-content">{{ activity.content }}</div>
        </div>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebugInfo" class="debug-info">
      <n-collapse size="small">
        <n-collapse-item title="调试信息" name="debug">
          <n-code :code="debugCode" language="json" />
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户信息卡片组件
 * 展示用户基本信息、统计数据、技能标签和最近活动
 */

import { computed, watch } from 'vue'
import { NTag, NCollapse, NCollapseItem, NCode } from 'naive-ui'

interface UserInfo {
  id: string
  name: string
  title?: string
  avatar?: string
  status: 'online' | 'offline' | 'busy' | 'away'
  stats: {
    projects: number
    tasks: number
    score: number
  }
  skills?: string[]
}

interface Activity {
  id: string
  time: string
  content: string
}

interface Props {
  rawDataSources?: any // 🔥 修复：接收原始数据源配置，与 dual-data-test 保持一致
  showDebugInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rawDataSources: null,
  showDebugInfo: false
})

// 🔥 组件自己解析需要的数据
const userInfo = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.userInfo
  if (!binding?.rawData) return null
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null
  }
})

const recentActivities = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.recentActivities
  if (!binding?.rawData) return null
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null
  }
})

// 调试代码显示
const debugCode = computed(() => {
  return JSON.stringify(
    {
      userInfo: userInfo.value,
      recentActivities: recentActivities.value,
      hasUserInfo: !!userInfo.value,
      activitiesCount: recentActivities.value?.length || 0,
      rawDataSources: props.rawDataSources,
      propsKeys: Object.keys(props)
    },
    null,
    2
  )
})

/**
 * 处理头像加载失败
 */
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmNWY1ZjUiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeD0iOCIgeT0iOCI+CjxwYXRoIGQ9Ik0xMiAxMkM5Ljc5IDEyIDggMTAuMjEgOCA4UzkuNzkgNiAxMiA2IDE2IDcuNzkgMTYgMTBTMTQuMjEgMTIgMTIgMTJaTTEyIDJDOS4yNCAyIDcgNC4yNCA3IDdTOS4yNCAxMiAxMiAxMlMxNyA5Ljc2IDE3IDdTMTQuNzYgMiAxMiAyWiIgZmlsbD0iIzk5OTk5OSIvPgo8L3N2Zz4KPC9zdmc+'
}

/**
 * 格式化时间显示
 */
const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 1000 * 60) return '刚刚'
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}分钟前`
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}小时前`

    return date.toLocaleDateString()
  } catch {
    return timeStr
  }
}

// 监听 props 变化输出调试信息（可选，生产环境可删除）
// watch(() => props.rawDataSources, (newRawDataSources) => {
//   console.log('🔧 [DEBUG-UserInfoCard] rawDataSources变化:', newRawDataSources)
// }, { deep: true, immediate: true })
</script>

<style scoped>
.user-info-card {
  padding: 20px;
  background: var(--card-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.avatar-container {
  position: relative;
  margin-right: 12px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--card-color);
}

.status-indicator.online {
  background-color: #52c41a;
}

.status-indicator.offline {
  background-color: #d9d9d9;
}

.status-indicator.busy {
  background-color: #ff4d4f;
}

.status-indicator.away {
  background-color: #faad14;
}

.user-basic {
  flex: 1;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.user-title {
  margin: 0;
  font-size: 14px;
  color: var(--text-color-2);
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin: 16px 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-color-2);
}

.user-skills {
  margin-bottom: 16px;
}

.skills-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-tag {
  font-size: 12px;
}

.recent-activities {
  margin-bottom: 16px;
}

.activities-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.activities-list {
  space-y: 8px;
}

.activity-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  font-size: 12px;
  color: var(--text-color-3);
  margin-bottom: 4px;
}

.activity-content {
  font-size: 14px;
  color: var(--text-color);
}

.debug-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 400px) {
  .user-info-card {
    padding: 16px;
  }

  .user-stats {
    flex-direction: column;
    gap: 12px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-value {
    display: inline;
    margin-bottom: 0;
  }
}
</style>
