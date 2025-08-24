<template>
  <div class="data-update-fix-test">
    <h1>🔧 数据更新修复测试</h1>
    <p class="description">
      测试原始数据修改后是否能立即更新，无需关闭重开配置面板
    </p>

    <!-- 模拟编辑器配置 -->
    <div class="editor-config">
      <h2>📝 模拟编辑器配置</h2>
      <div class="config-display">
        <h3>当前配置:</h3>
        <pre>{{ JSON.stringify(editorConfig, null, 2) }}</pre>
      </div>
      
      <div class="test-buttons">
        <button @click="resetConfig" class="btn btn-warning">
          🔄 重置配置
        </button>
        <button @click="simulateDataChange" class="btn btn-info">
          🎲 模拟数据变更
        </button>
      </div>
    </div>

    <!-- 数据源配置表单 -->
    <div class="config-form">
      <h2>⚙️ 数据源配置表单</h2>
      <DataSourceConfigForm 
        v-model="editorConfig"
        :data-sources="dataSources"
        :component-id="'test-component-001'"
        :component-type="'chart'"
        @update:modelValue="handleConfigUpdate"
      />
    </div>

    <!-- 数据流监控 -->
    <div class="data-flow-monitor">
      <h2>📊 数据流监控</h2>
      <div class="monitor-grid">
        <div class="monitor-item">
          <h3>配置更新次数:</h3>
          <div class="counter">{{ updateCount }}</div>
        </div>
        <div class="monitor-item">
          <h3>最后更新时间:</h3>
          <div class="timestamp">{{ lastUpdateTime }}</div>
        </div>
        <div class="monitor-item">
          <h3>强制更新标记:</h3>
          <div class="flag">{{ editorConfig.metadata?.forceUpdate ? '✅' : '❌' }}</div>
        </div>
        <div class="monitor-item">
          <h3>最后变更字段:</h3>
          <div class="field">{{ editorConfig.metadata?.lastChangedField || '无' }}</div>
        </div>
      </div>
    </div>

    <!-- 实时日志 -->
    <div class="real-time-logs">
      <h2>📋 实时日志</h2>
      <div class="log-controls">
        <button @click="clearLogs" class="btn btn-secondary">
          🗑️ 清空日志
        </button>
        <button @click="toggleAutoScroll" class="btn" :class="autoScroll ? 'btn-success' : 'btn-outline'">
          {{ autoScroll ? '🔄 自动滚动: 开' : '⏸️ 自动滚动: 关' }}
        </button>
      </div>
      <div class="log-container" ref="logContainer">
        <div 
          v-for="(log, index) in logs" 
          :key="index" 
          class="log-entry"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted } from 'vue';
import DataSourceConfigForm from '@/core/data-source-system/components/DataSourceConfigForm.vue';

// 测试数据源定义
const dataSources = {
  dataSource1: {
    key: 'dataSource1',
    name: '用户数据源',
    type: 'static',
    description: '静态用户数据'
  },
  dataSource2: {
    key: 'dataSource2',
    name: '产品数据源', 
    type: 'static',
    description: '静态产品数据'
  }
};

// 编辑器配置
const editorConfig = ref({
  activeDataSourceKey: 'dataSource1',
  config: {
    dataSourceBindings: {
      dataSource1: {
        rawData: JSON.stringify({
          id: 1,
          username: '张三',
          email: 'zhangsan@example.com',
          age: 25
        }, null, 2),
        enhancedConfig: {
          finalProcessingType: 'transform',
          finalProcessingScript: '// 数据转换脚本\nfunction process(data) {\n  return data;\n}'
        }
      },
      dataSource2: {
        rawData: JSON.stringify({
          id: 1,
          name: '测试产品',
          price: 99.99,
          category: '电子产品'
        }, null, 2),
        enhancedConfig: {
          finalProcessingType: 'filter',
          finalProcessingScript: '// 数据过滤脚本\nfunction filter(data) {\n  return data;\n}'
        }
      }
    }
  },
  metadata: {
    updatedAt: Date.now()
  }
});

// 监控状态
const updateCount = ref(0);
const lastUpdateTime = ref('');
const logs = ref<Array<{time: string, message: string, type: string}>>([]);
const autoScroll = ref(true);
const logContainer = ref<HTMLElement>();

// 添加日志
const addLog = (message: string, type: string = 'info') => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  
  logs.value.push({
    time: timeStr,
    message,
    type
  });
  
  // 自动滚动到底部
  if (autoScroll.value) {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
      }
    });
  }
};

// 处理配置更新
const handleConfigUpdate = (newConfig: any) => {
  updateCount.value++;
  lastUpdateTime.value = new Date().toLocaleTimeString();
  
  addLog(`🔄 配置更新 #${updateCount.value}`, 'update');
  addLog(`📝 更新字段: ${newConfig.metadata?.lastChangedField || '未知'}`, 'info');
  addLog(`🏷️ 强制更新: ${newConfig.metadata?.forceUpdate ? '是' : '否'}`, 'info');
  
  console.log('🔧 [测试页面] 配置更新:', newConfig);
};

// 重置配置
const resetConfig = () => {
  editorConfig.value = {
    activeDataSourceKey: 'dataSource1',
    config: {
      dataSourceBindings: {
        dataSource1: {
          rawData: JSON.stringify({
            id: 1,
            username: '张三',
            email: 'zhangsan@example.com',
            age: 25
          }, null, 2),
          enhancedConfig: {
            finalProcessingType: 'transform',
            finalProcessingScript: '// 数据转换脚本\nfunction process(data) {\n  return data;\n}'
          }
        }
      }
    },
    metadata: {
      updatedAt: Date.now()
    }
  };
  
  updateCount.value = 0;
  addLog('🔄 配置已重置', 'reset');
};

// 模拟数据变更
const simulateDataChange = () => {
  const randomData = {
    id: Math.floor(Math.random() * 1000),
    username: `用户_${Math.random().toString(36).substr(2, 6)}`,
    email: `user${Math.floor(Math.random() * 1000)}@example.com`,
    age: Math.floor(Math.random() * 50) + 18,
    timestamp: new Date().toISOString()
  };
  
  // 直接修改原始数据
  if (editorConfig.value.config.dataSourceBindings.dataSource1) {
    editorConfig.value.config.dataSourceBindings.dataSource1.rawData = JSON.stringify(randomData, null, 2);
    
    // 添加强制更新标记
    editorConfig.value.metadata = {
      ...editorConfig.value.metadata,
      updatedAt: Date.now(),
      forceUpdate: true,
      lastChangedField: 'dataSource1.rawData'
    };
  }
  
  addLog('🎲 模拟数据变更完成', 'simulate');
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
  addLog('🗑️ 日志已清空', 'clear');
};

// 切换自动滚动
const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value;
  addLog(`${autoScroll.value ? '🔄 开启' : '⏸️ 关闭'}自动滚动`, 'setting');
};

// 监听配置变化
watch(editorConfig, (newConfig) => {
  console.log('🔍 [测试页面] 配置变化监听:', newConfig);
}, { deep: true });

// 组件挂载
onMounted(() => {
  addLog('🚀 数据更新修复测试页面已加载', 'init');
  addLog('📋 测试说明: 修改原始数据后应立即更新，无需关闭重开配置面板', 'info');
});
</script>

<style lang="scss" scoped>
.data-update-fix-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  
  h1 {
    color: #2c3e50;
    text-align: center;
    margin-bottom: 10px;
  }
  
  .description {
    text-align: center;
    color: #7f8c8d;
    margin-bottom: 30px;
    font-style: italic;
  }
  
  .editor-config, .config-form, .data-flow-monitor, .real-time-logs {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    
    h2 {
      color: #495057;
      margin-bottom: 15px;
      border-bottom: 2px solid #dee2e6;
      padding-bottom: 5px;
    }
  }
  
  .config-display {
    margin-bottom: 15px;
    
    h3 {
      color: #6c757d;
      margin-bottom: 10px;
    }
    
    pre {
      background: #ffffff;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 15px;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
  }
  
  .test-buttons {
    display: flex;
    gap: 10px;
  }
  
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    
    &.btn-warning {
      background: #ffc107;
      color: #212529;
      
      &:hover {
        background: #e0a800;
      }
    }
    
    &.btn-info {
      background: #17a2b8;
      color: white;
      
      &:hover {
        background: #138496;
      }
    }
    
    &.btn-secondary {
      background: #6c757d;
      color: white;
      
      &:hover {
        background: #5a6268;
      }
    }
    
    &.btn-success {
      background: #28a745;
      color: white;
      
      &:hover {
        background: #218838;
      }
    }
    
    &.btn-outline {
      background: transparent;
      color: #6c757d;
      border: 1px solid #6c757d;
      
      &:hover {
        background: #6c757d;
        color: white;
      }
    }
  }
  
  .monitor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
  
  .monitor-item {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 15px;
    text-align: center;
    
    h3 {
      color: #6c757d;
      font-size: 14px;
      margin-bottom: 10px;
    }
    
    .counter, .timestamp, .flag, .field {
      font-size: 18px;
      font-weight: bold;
      color: #495057;
    }
    
    .flag {
      font-size: 24px;
    }
  }
  
  .log-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .log-container {
    background: #ffffff;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    height: 300px;
    overflow-y: auto;
    padding: 10px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }
  
  .log-entry {
    margin-bottom: 5px;
    padding: 2px 0;
    
    .log-time {
      color: #6c757d;
      margin-right: 10px;
    }
    
    .log-message {
      color: #495057;
    }
    
    &.update {
      .log-message {
        color: #007bff;
        font-weight: bold;
      }
    }
    
    &.error {
      .log-message {
        color: #dc3545;
        font-weight: bold;
      }
    }
    
    &.success {
      .log-message {
        color: #28a745;
        font-weight: bold;
      }
    }
    
    &.simulate {
      .log-message {
        color: #17a2b8;
        font-weight: bold;
      }
    }
    
    &.reset {
      .log-message {
        color: #ffc107;
        font-weight: bold;
      }
    }
    
    &.clear {
      .log-message {
        color: #6c757d;
        font-style: italic;
      }
    }
    
    &.init {
      .log-message {
        color: #28a745;
        font-weight: bold;
      }
    }
    
    &.setting {
      .log-message {
        color: #6f42c1;
      }
    }
  }
}
</style>