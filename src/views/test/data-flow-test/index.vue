<template>
  <div class="data-flow-test">
    <h2>🔄 数据源配置数据流测试</h2>
    
    <!-- 模拟编辑器配置 -->
    <div class="editor-section">
      <h3>📝 编辑器配置</h3>
      <div class="config-display">
        <h4>当前编辑器配置:</h4>
        <pre>{{ JSON.stringify(editorConfig, null, 2) }}</pre>
      </div>
      
      <div class="editor-actions">
        <button @click="loadFromStorage" class="btn btn-info">
          📂 从存储加载配置
        </button>
        <button @click="saveToStorage" class="btn btn-warning">
          💾 保存配置到存储
        </button>
        <button @click="resetConfig" class="btn btn-danger">
          🔄 重置配置
        </button>
      </div>
    </div>

    <!-- 数据源配置表单 -->
    <div class="form-section">
      <h3>⚙️ 数据源配置表单</h3>
      <DataSourceConfigForm 
        v-model="editorConfig"
        :data-sources="availableDataSources"
        @update:modelValue="onConfigUpdate"
      />
    </div>

    <!-- 数据流日志 -->
    <div class="log-section">
      <h3>📋 数据流日志</h3>
      <div class="log-container">
        <div 
          v-for="(log, index) in dataFlowLogs" 
          :key="index"
          class="log-entry"
          :class="log.type"
        >
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-type">{{ log.type.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
          <pre v-if="log.data" class="log-data">{{ JSON.stringify(log.data, null, 2) }}</pre>
        </div>
      </div>
      <button @click="clearLogs" class="btn btn-secondary">
        🗑️ 清空日志
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import DataSourceConfigForm from '@/core/data-source-system/components/DataSourceConfigForm.vue';

// 数据流日志
interface DataFlowLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

const dataFlowLogs = ref<DataFlowLog[]>([]);

// 添加日志的辅助函数
const addLog = (type: DataFlowLog['type'], message: string, data?: any) => {
  const log: DataFlowLog = {
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
    data
  };
  dataFlowLogs.value.unshift(log);
  console.log(`[${type.toUpperCase()}] ${message}`, data || '');
};

// 模拟可用的数据源
const availableDataSources = reactive({
  dataSource1: {
    key: 'dataSource1',
    name: '数据源1 - API接口',
    type: 'api',
    fieldMapping: {
      id: 'id',
      name: 'name',
      value: 'value'
    },
    description: '从API接口获取数据'
  },
  dataSource2: {
    key: 'dataSource2',
    name: '数据源2 - 数据库',
    type: 'database',
    fieldMapping: {
      id: 'db_id',
      name: 'db_name',
      value: 'db_value'
    },
    description: '从数据库获取数据'
  }
});

// 模拟编辑器配置（基于真实数据结构）
const editorConfig = ref({
  activeDataSourceKey: 'dataSource1',
  config: {
    dataSourceBindings: {
      dataSource1: {
        rawData: JSON.stringify({
          id: 1,
          name: '初始数据',
          value: 100,
          timestamp: new Date().toISOString()
        }, null, 2),
        enhancedConfig: {
          finalProcessingType: 'transform',
          finalProcessingScript: '// 初始处理脚本\nfunction process(data) {\n  return data;\n}'
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        },
        info: {
          description: '数据源1的配置信息',
          tags: ['api', 'json']
        },
        processingLogic: {
          steps: ['fetch', 'transform', 'validate'],
          errorHandling: 'retry'
        }
      },
      dataSource2: {
        rawData: JSON.stringify({
          db_id: 2,
          db_name: '数据库数据',
          db_value: 200
        }, null, 2),
        enhancedConfig: {
          finalProcessingType: 'filter',
          finalProcessingScript: '// 数据库处理脚本\nfunction process(data) {\n  return data.filter(item => item.db_value > 0);\n}'
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        },
        info: {
          description: '数据源2的配置信息',
          tags: ['database', 'sql']
        },
        processingLogic: {
          steps: ['query', 'filter', 'format'],
          errorHandling: 'fallback'
        }
      }
    }
  }
});

// 监听配置变化
watch(editorConfig, (newConfig, oldConfig) => {
  addLog('info', '编辑器配置发生变化', {
    old: oldConfig,
    new: newConfig
  });
}, { deep: true });

// 配置更新处理
const onConfigUpdate = (newConfig: any) => {
  addLog('success', '数据源配置表单触发更新', newConfig);
  editorConfig.value = { ...newConfig };
};

// 存储相关操作
const STORAGE_KEY = 'data-source-config-test';

const saveToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(editorConfig.value));
    addLog('success', '配置已保存到本地存储');
  } catch (error) {
    addLog('error', '保存配置失败', error);
  }
};

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      editorConfig.value = JSON.parse(stored);
      addLog('success', '配置已从本地存储加载');
    } else {
      addLog('warning', '本地存储中没有找到配置');
    }
  } catch (error) {
    addLog('error', '加载配置失败', error);
  }
};

const resetConfig = () => {
  editorConfig.value = {
    activeDataSourceKey: '',
    config: {
      dataSourceBindings: {}
    }
  };
  addLog('warning', '配置已重置');
};

const clearLogs = () => {
  dataFlowLogs.value = [];
};

// 组件挂载时的初始化
onMounted(() => {
  addLog('info', '数据流测试页面已加载');
  addLog('info', '初始编辑器配置', editorConfig.value);
  addLog('info', '可用数据源', availableDataSources);
});
</script>

<style lang="scss" scoped>
.data-flow-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h2 {
    color: #333;
    margin-bottom: 30px;
    text-align: center;
  }

  h3 {
    color: #555;
    margin-bottom: 16px;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 8px;
  }

  .editor-section,
  .form-section,
  .log-section {
    margin-bottom: 40px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    background: #fafafa;
  }

  .config-display {
    margin-bottom: 20px;

    h4 {
      margin-bottom: 10px;
      color: #666;
    }

    pre {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.4;
      max-height: 300px;
      overflow-y: auto;
    }
  }

  .editor-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &.btn-info {
      background: #17a2b8;
      color: white;
      &:hover { background: #138496; }
    }

    &.btn-warning {
      background: #ffc107;
      color: #212529;
      &:hover { background: #e0a800; }
    }

    &.btn-danger {
      background: #dc3545;
      color: white;
      &:hover { background: #c82333; }
    }

    &.btn-secondary {
      background: #6c757d;
      color: white;
      &:hover { background: #5a6268; }
    }
  }

  .log-container {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background: white;
    margin-bottom: 12px;
  }

  .log-entry {
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;

    &:last-child {
      border-bottom: none;
    }

    &.info {
      background: #e7f3ff;
      border-left: 4px solid #007bff;
    }

    &.success {
      background: #e8f5e8;
      border-left: 4px solid #28a745;
    }

    &.warning {
      background: #fff8e1;
      border-left: 4px solid #ffc107;
    }

    &.error {
      background: #ffeaea;
      border-left: 4px solid #dc3545;
    }

    .log-time {
      color: #666;
      margin-right: 8px;
    }

    .log-type {
      font-weight: bold;
      margin-right: 8px;
      min-width: 60px;
      display: inline-block;
    }

    .log-message {
      color: #333;
    }

    .log-data {
      margin-top: 8px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 3px;
      padding: 8px;
      font-size: 11px;
      line-height: 1.3;
      max-height: 200px;
      overflow-y: auto;
    }
  }
}
</style>