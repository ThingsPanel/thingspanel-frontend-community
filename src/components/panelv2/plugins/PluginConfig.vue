<template>
  <div class="plugin-config">
    <div class="plugin-config-header">
      <h3>插件管理</h3>
      <button class="add-plugin-btn" @click="showAddDialog = true">
        <i class="fa fa-plus"></i>
        添加插件
      </button>
    </div>

    <div class="plugin-list">
      <div 
        v-for="plugin in installedPlugins" 
        :key="plugin.meta.name"
        class="plugin-item"
        :class="{ 'activated': plugin.activated }"
      >
        <div class="plugin-info">
          <h4>{{ plugin.meta.name }}</h4>
          <p class="plugin-version">v{{ plugin.meta.version }}</p>
          <p class="plugin-description">{{ plugin.meta.description || '暂无描述' }}</p>
          <p v-if="plugin.meta.author" class="plugin-author">作者: {{ plugin.meta.author }}</p>
        </div>
        
        <div class="plugin-actions">
          <button 
            v-if="!plugin.activated"
            class="action-btn activate"
            @click="handleActivate(plugin.meta.name)"
          >
            激活
          </button>
          <button 
            v-else
            class="action-btn deactivate"
            @click="handleDeactivate(plugin.meta.name)"
          >
            停用
          </button>
          <button 
            class="action-btn uninstall"
            @click="handleUninstall(plugin.meta.name)"
          >
            卸载
          </button>
        </div>

        <div v-if="plugin.error" class="plugin-error">
          <i class="fa fa-exclamation-triangle"></i>
          {{ plugin.error }}
        </div>
      </div>

      <div v-if="installedPlugins.length === 0" class="empty-state">
        <i class="fa fa-plug"></i>
        <p>暂无已安装的插件</p>
      </div>
    </div>

    <!-- 添加插件对话框 -->
    <div v-if="showAddDialog" class="dialog-overlay" @click.self="showAddDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>添加插件</h3>
          <button class="close-btn" @click="showAddDialog = false">
            <i class="fa fa-times"></i>
          </button>
        </div>
        
        <div class="dialog-body">
          <div class="input-group">
            <label>插件来源</label>
            <select v-model="addMethod" class="form-control">
              <option value="url">从URL加载</option>
              <option value="local">本地文件</option>
              <option value="registry">插件市场</option>
            </select>
          </div>

          <div v-if="addMethod === 'url'" class="input-group">
            <label>插件URL</label>
            <input 
              v-model="pluginUrl" 
              type="text" 
              class="form-control"
              placeholder="https://example.com/plugin.js"
            />
          </div>

          <div v-if="addMethod === 'local'" class="input-group">
            <label>选择文件</label>
            <input 
              type="file" 
              class="form-control"
              accept=".js,.json"
              @change="handleFileSelect"
            />
          </div>

          <div v-if="addMethod === 'registry'" class="plugin-registry">
            <p class="info">插件市场功能即将推出...</p>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-default" @click="showAddDialog = false">取消</button>
          <button 
            class="btn btn-primary" 
            :disabled="!canAddPlugin"
            @click="handleAddPlugin"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { usePluginManager } from './composables/usePlugin'

const { 
  installedPlugins, 
  installPlugin, 
  uninstallPlugin,
  activatePlugin,
  deactivatePlugin,
  loadPlugin
} = usePluginManager()

// 对话框状态
const showAddDialog = ref(false)
const addMethod = ref('url')
const pluginUrl = ref('')
const selectedFile = ref<File | null>(null)

// 计算属性
const canAddPlugin = computed(() => {
  if (addMethod.value === 'url') {
    return pluginUrl.value.trim() !== ''
  }
  if (addMethod.value === 'local') {
    return selectedFile.value !== null
  }
  return false
})

// 事件处理
const handleActivate = async (name: string) => {
  try {
    await activatePlugin(name)
  } catch (error) {
    console.error('Failed to activate plugin:', error)
  }
}

const handleDeactivate = async (name: string) => {
  try {
    await deactivatePlugin(name)
  } catch (error) {
    console.error('Failed to deactivate plugin:', error)
  }
}

const handleUninstall = async (name: string) => {
  if (confirm(`确定要卸载插件 ${name} 吗？`)) {
    try {
      await uninstallPlugin(name)
    } catch (error) {
      console.error('Failed to uninstall plugin:', error)
    }
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] || null
}

const handleAddPlugin = async () => {
  try {
    if (addMethod.value === 'url' && pluginUrl.value) {
      await loadPlugin(pluginUrl.value)
    } else if (addMethod.value === 'local' && selectedFile.value) {
      // 处理本地文件
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        // 这里需要根据文件类型解析插件
        console.log('Local file content:', content)
      }
      reader.readAsText(selectedFile.value)
    }
    
    showAddDialog.value = false
    pluginUrl.value = ''
    selectedFile.value = null
  } catch (error) {
    console.error('Failed to add plugin:', error)
  }
}
</script>

<style scoped>
.plugin-config {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.plugin-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.plugin-config-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.add-plugin-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s;
}

.add-plugin-btn:hover {
  background: #40a9ff;
}

.plugin-list {
  flex: 1;
  overflow-y: auto;
}

.plugin-item {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.plugin-item.activated {
  border-color: #52c41a;
  background: #f6ffed;
}

.plugin-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.plugin-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
}

.plugin-version {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.plugin-description {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
}

.plugin-author {
  margin: 4px 0;
  color: #999;
  font-size: 12px;
}

.plugin-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.action-btn.activate {
  border-color: #52c41a;
  color: #52c41a;
}

.action-btn.activate:hover {
  background: #52c41a;
  color: white;
}

.action-btn.deactivate {
  border-color: #faad14;
  color: #faad14;
}

.action-btn.deactivate:hover {
  background: #faad14;
  color: white;
}

.action-btn.uninstall {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.action-btn.uninstall:hover {
  background: #ff4d4f;
  color: white;
}

.plugin-error {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fff2e8;
  border: 1px solid #ffbb96;
  border-radius: 4px;
  color: #d4380d;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover {
  color: #333;
}

.dialog-body {
  padding: 20px;
}

.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.plugin-registry {
  padding: 40px;
  text-align: center;
  background: #f5f5f5;
  border-radius: 4px;
}

.info {
  color: #666;
  margin: 0;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-default {
  background: white;
  border: 1px solid #d9d9d9;
  color: #333;
}

.btn-default:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.btn-primary {
  background: #1890ff;
  border: 1px solid #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
  border-color: #40a9ff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>