<template>
  <div class="test-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <n-page-header>
        <template #title>测试中心</template>
        <template #subtitle>系统功能测试和集成验证工具集合</template>
      </n-page-header>
    </div>

    <!-- 测试分类 -->
    <div class="test-categories">
      <!-- 脚本引擎测试 -->
      <n-card title="脚本引擎测试" size="small" class="category-card">
        <template #header-extra>
          <n-tag type="success" size="small">最新</n-tag>
        </template>

        <div class="category-description">
          <p>测试全局脚本处理引擎的完整功能，包括安全沙箱、模板系统、上下文管理和Visual Editor集成。</p>
          <div class="test-items">
            <n-space>
              <n-button type="primary" size="small" @click="navigateTo('/test/script-engine-test')">
                脚本引擎测试平台
              </n-button>
            </n-space>
          </div>
        </div>
      </n-card>

      <!-- 数据源系统测试 -->
      <n-card title="数据源系统测试" size="small" class="category-card">
        <template #header-extra>
          <n-tag type="info" size="small">新功能</n-tag>
        </template>

        <div class="category-description">
          <p>测试数据源配置系统MVP的完整功能，包括Card 2.1组件集成和Visual Editor系统集成。</p>
        </div>

        <div class="test-items">
          <n-space vertical>
            <!-- 数据源集成测试 -->
            <n-card size="small" embedded hoverable class="test-item">
              <template #header>
                <n-space align="center">
                  <n-icon size="18" color="var(--primary-color)">
                    <ServerOutline />
                  </n-icon>
                  <span>数据源集成测试</span>
                  <n-tag type="success" size="tiny">推荐</n-tag>
                </n-space>
              </template>

              <div class="test-description">
                <p>完整测试Card 2.1数据源测试组件与Visual Editor系统的双向集成，包括：</p>
                <ul>
                  <li>数据源配置和验证</li>
                  <li>实时数据流监控</li>
                  <li>错误处理和性能测试</li>
                  <li>组件生命周期管理</li>
                </ul>
              </div>

              <template #action>
                <n-button type="primary" size="small" @click="$router.push('/test/datasource-integration')">
                  开始测试
                </n-button>
              </template>
            </n-card>

            <!-- 数据绑定系统测试 -->
            <n-card size="small" embedded hoverable class="test-item">
              <template #header>
                <n-space align="center">
                  <n-icon size="18" color="var(--info-color)">
                    <Link />
                  </n-icon>
                  <span>数据绑定系统集成</span>
                </n-space>
              </template>

              <div class="test-description">
                <p>Card 2.1数据绑定系统的完整测试，包括组件需求管理和响应式绑定。</p>
              </div>

              <template #action>
                <n-button size="small" @click="$router.push('/test/data-binding-system-integration')">
                  进入测试
                </n-button>
              </template>
            </n-card>

            <!-- 数据过滤器测试 -->
            <n-card size="small" embedded hoverable class="test-item">
              <template #header>
                <n-space align="center">
                  <n-icon size="18" color="var(--success-color)">
                    <FunnelOutline />
                  </n-icon>
                  <span>数据过滤器测试</span>
                </n-space>
              </template>

              <div class="test-description">
                <p>JSONPath数据过滤器功能测试，支持复杂数据结构的路径过滤。</p>
              </div>

              <template #action>
                <n-button size="small" @click="$router.push('/test/data-filter-test')">进入测试</n-button>
              </template>
            </n-card>

            <!-- 数据映射器测试 -->
            <n-card size="small" embedded hoverable class="test-item">
              <template #header>
                <n-space align="center">
                  <n-icon size="18" color="var(--primary-color)">
                    <SwapHorizontalOutline />
                  </n-icon>
                  <span>数据映射器测试</span>
                  <n-tag type="success" size="tiny">新功能</n-tag>
                </n-space>
              </template>

              <div class="test-description">
                <p>字段映射组件功能测试，支持字段重命名和嵌套路径映射。</p>
              </div>

              <template #action>
                <n-button size="small" @click="$router.push('/test/data-mapping-test')">进入测试</n-button>
              </template>
            </n-card>
          </n-space>
        </div>
      </n-card>

      <!-- 编辑器系统测试 -->
      <n-card title="编辑器系统测试" size="small" class="category-card">
        <div class="category-description">
          <p>Visual Editor可视化编辑器的功能测试和集成验证。</p>
        </div>

        <div class="test-items">
          <n-space vertical>
            <!-- 编辑器集成测试 -->
            <n-card size="small" embedded hoverable class="test-item">
              <template #header>
                <n-space align="center">
                  <n-icon size="18" color="var(--warning-color)">
                    <Create />
                  </n-icon>
                  <span>编辑器集成测试</span>
                </n-space>
              </template>

              <div class="test-description">
                <p>Visual Editor多渲染器架构的集成测试和功能验证。</p>
              </div>

              <template #action>
                <n-button size="small" @click="$router.push('/test/editor-integration')">进入测试</n-button>
              </template>
            </n-card>

            <!-- 交互系统测试 -->
            <n-card size="small" embedded hoverable class="test-item">
              <template #header>
                <n-space align="center">
                  <n-icon size="18" color="var(--primary-color)">
                    <Settings />
                  </n-icon>
                  <span>交互系统测试</span>
                  <n-tag type="success" size="tiny">Phase 1</n-tag>
                </n-space>
              </template>

              <div class="test-description">
                <p>Card 2.1组件交互系统的完整测试，包括事件触发、状态管理和视觉反馈。</p>
              </div>

              <template #action>
                <n-button size="small" @click="$router.push('/test/interaction-system-test')">进入测试</n-button>
              </template>
            </n-card>
          </n-space>
        </div>
      </n-card>

      <!-- 组件开发测试 -->
      <n-card title="组件开发测试" size="small" class="category-card">
        <div class="category-description">
          <p>Card 2.1组件开发和测试相关功能。</p>
        </div>

        <div class="test-items">
          <n-space vertical>
            <!-- 组件API配置测试 -->
            <n-card size="small" embedded hoverable class="test-item">
              <template #header>
                <n-space align="center">
                  <n-icon size="18" color="var(--success-color)">
                    <Settings />
                  </n-icon>
                  <span>组件API配置测试</span>
                </n-space>
              </template>

              <div class="test-description">
                <p>测试组件配置系统和API接口功能。</p>
              </div>

              <template #action>
                <n-button size="small" @click="navigateToComponentTest">进入测试</n-button>
              </template>
            </n-card>
          </n-space>
        </div>
      </n-card>
    </div>

    <!-- 系统状态 -->
    <div class="system-status">
      <n-card title="系统状态" size="small">
        <n-descriptions size="small" :column="3" bordered>
          <n-descriptions-item label="Visual Editor">
            <n-tag type="success" size="small">正常</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="Card 2.1 系统">
            <n-tag type="success" size="small">正常</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="数据源系统">
            <n-tag type="success" size="small">MVP 已完成</n-tag>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NCard, NSpace, NButton, NTag, NIcon, NDescriptions, NDescriptionsItem, NPageHeader } from 'naive-ui'
import { ServerOutline, Link, Create, Settings, FunnelOutline, SwapHorizontalOutline } from '@vicons/ionicons5'

const router = useRouter()

/**
 * 导航到组件测试页面
 */
const navigateToComponentTest = () => {
  // 这里可以导航到具体的组件测试页面
  // 暂时使用alert提示
  alert('组件API配置测试页面开发中...')
}
</script>

<style scoped>
.test-page {
  padding: 16px;
  background: var(--body-color);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.test-categories {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.category-card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-hover, 0 4px 12px rgba(0, 0, 0, 0.15));
}

.category-description {
  margin-bottom: 16px;
  color: var(--text-color-2);
}

.category-description p {
  margin: 0;
  line-height: 1.5;
}

.test-items {
  margin-top: 16px;
}

.test-item {
  transition: transform 0.2s;
}

.test-item:hover {
  transform: translateX(4px);
}

.test-description {
  color: var(--text-color-2);
  font-size: 14px;
}

.test-description p {
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.test-description ul {
  margin: 8px 0 0 16px;
  padding: 0;
}

.test-description li {
  margin: 4px 0;
  line-height: 1.3;
}

.system-status {
  margin-top: 24px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .test-categories {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .test-page {
    padding: 12px;
  }

  .category-description,
  .test-description {
    font-size: 13px;
  }

  .test-categories {
    gap: 12px;
  }
}
</style>
