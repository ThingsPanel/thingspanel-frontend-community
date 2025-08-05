<template>
  <div class="device-api-test">
    <n-card title="设备API配置系统测试页面" size="large">
      <template #header-extra>
        <n-space>
          <n-button size="small" @click="showNewSystem = !showNewSystem">
            {{ showNewSystem ? '显示旧系统' : '显示新系统' }}
          </n-button>
          <n-button size="small" @click="resetAll">重置所有</n-button>
        </n-space>
      </template>

      <!-- 系统选择说明 -->
      <n-alert type="info" class="system-info">
        <template #header>
          <strong>系统对比</strong>
        </template>
        <template #default>
          <div class="system-comparison">
            <div class="system-item">
              <h4>🔴 旧系统 (DeviceDataSourceConfig)</h4>
              <ul>
                <li>只支持基本的遥测数据</li>
                <li>表单固定，不够灵活</li>
                <li>API类型有限</li>
                <li>配置相对简单</li>
              </ul>
            </div>
            <div class="system-item">
              <h4>🟢 新系统 (DeviceApiConfig)</h4>
              <ul>
                <li>支持18种不同的API接口</li>
                <li>智能表单，根据API类型动态显示</li>
                <li>完整的轮询管理</li>
                <li>数据映射配置</li>
                <li>实时数据预览</li>
                <li>更好的错误处理</li>
              </ul>
            </div>
          </div>
        </template>
      </n-alert>

      <!-- 新系统 -->
      <template v-if="showNewSystem">
        <n-divider title-placement="left">
          <n-space align="center">
            <n-icon><Sparkles /></n-icon>
            <span>新的设备API配置系统</span>
          </n-space>
        </n-divider>

        <DeviceDataSourceExampleNew />
      </template>

      <!-- 旧系统 -->
      <template v-else>
        <n-divider title-placement="left">
          <n-space align="center">
            <n-icon><Settings /></n-icon>
            <span>原有的设备数据源配置</span>
          </n-space>
        </n-divider>

        <DeviceDataSourceExample />
      </template>

      <!-- 使用说明 -->
      <n-divider title-placement="left">
        <n-space align="center">
          <n-icon><HelpCircle /></n-icon>
          <span>使用说明</span>
        </n-space>
      </n-divider>

      <n-alert type="success">
        <template #header>
          <strong>🎯 如何测试新系统</strong>
        </template>
        <template #default>
          <ol>
            <li>
              <strong>选择API接口类型</strong>
              ：从18种API中选择一个（如"遥测数据 - 当前值"）
            </li>
            <li>
              <strong>选择设备</strong>
              ：从设备列表中选择一个设备
            </li>
            <li>
              <strong>配置参数</strong>
              ：根据API类型填写相应参数
            </li>
            <li>
              <strong>设置轮询</strong>
              ：可选择启用轮询并设置间隔
            </li>
            <li>
              <strong>测试配置</strong>
              ：点击"测试配置"按钮验证API调用
            </li>
            <li>
              <strong>保存配置</strong>
              ：点击"保存配置"按钮保存设置
            </li>
          </ol>
          <p>
            <strong>💡 提示</strong>
            ：新系统完全兼容原有的配置格式，可以无缝替换。
          </p>
        </template>
      </n-alert>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NDivider, NSpace, NButton, NAlert, NIcon } from 'naive-ui'
import { Sparkles, Settings, HelpCircle } from '@vicons/ionicons5'
import DeviceDataSourceExample from '@/components/visual-editor/settings/data-sources/DeviceDataSourceExample.vue'
import DeviceDataSourceExampleNew from '@/components/visual-editor/settings/data-sources/DeviceDataSourceExampleNew.vue'

// 响应式数据
const showNewSystem = ref(true)

// 事件处理
const resetAll = () => {
  console.log('重置所有配置')
}
</script>

<style scoped>
.device-api-test {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.system-info {
  margin-bottom: 20px;
}

.system-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 10px;
}

.system-item h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
}

.system-item ul {
  margin: 0;
  padding-left: 20px;
}

.system-item li {
  margin: 4px 0;
  font-size: 12px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .system-comparison {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}
</style>
