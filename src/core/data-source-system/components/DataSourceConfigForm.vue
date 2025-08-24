<template>
  <div class="data-source-config-form">
    <!-- 数据源选择头部 -->
    <div class="data-source-header">
      <n-select
        v-model:value="selectedDataSource"
        :options="dataSourceOptions"
        placeholder="选择数据源"
        style="width: 200px;"
        @update:value="onDataSourceChange"
      />
      
      <!-- 示例数据提示 -->
      <n-tooltip trigger="hover" placement="top" class="example-data-tooltip">
        <template #trigger>
          <n-icon class="example-data-icon" size="16">
            <QuestionCircleOutlined />
          </n-icon>
        </template>
        <div class="tooltip-title">数据格式示例</div>
        <div class="example-code-container">
          <pre class="example-code">{{ getExampleDataCode() }}</pre>
        </div>
      </n-tooltip>
    </div>

    <!-- 数据源配置内容 -->
    <div class="data-source-content" v-if="selectedDataSource && currentDataValue">
      <!-- 原始数据管理 -->
      <n-card title="原始数据管理" size="small" style="margin-bottom: 16px;">
        <!-- 添加数据按钮 -->
        <n-button 
          class="add-data-btn" 
          dashed 
          @click="showAddDataModal = true"
          style="margin-bottom: 12px;"
        >
          <template #icon>
            <n-icon><PlusOutlined /></n-icon>
          </template>
          添加原始数据
        </n-button>
        
        <!-- 原始数据列表 -->
        <div class="raw-data-list" v-if="currentDataValue.rawDataList?.length">
          <div 
            v-for="(item, index) in currentDataValue.rawDataList" 
            :key="index"
            class="raw-data-item-compact"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <n-tag 
                  :type="getDataItemTypeColor(item.type)" 
                  size="small" 
                  style="margin-right: 8px;"
                >
                  {{ getTypeDisplayName(item.type) }}
                </n-tag>
                <span class="raw-data-name">{{ item.name || `数据项${index + 1}` }}</span>
              </div>
              <div style="display: flex; gap: 4px;">
                <n-button 
                  size="tiny" 
                  class="compact-btn"
                  @click="viewRawDataDetails(item, index)"
                >
                  查看
                </n-button>
                <n-button 
                  size="tiny" 
                  class="compact-btn"
                  @click="editDataSourceItem(index)"
                >
                  编辑
                </n-button>
                <n-button 
                  size="tiny" 
                  type="error" 
                  class="compact-btn"
                  @click="removeDataSourceItem(index)"
                >
                  删除
                </n-button>
              </div>
            </div>
          </div>
        </div>
        
        <n-empty v-else description="暂无原始数据" size="small" />
      </n-card>

      <!-- 最终数据处理 -->
      <n-card title="最终数据处理" size="small" style="margin-bottom: 16px;">
        <!-- 处理方式选择 -->
        <n-form-item label="处理方式" style="margin-bottom: 12px;">
          <n-select
            v-model:value="currentDataValue.finalProcessingType"
            :options="processingTypeOptions"
            placeholder="选择处理方式"
            @update:value="updateProcessingType"
          />
        </n-form-item>
        
        <!-- 对象合并配置 -->
        <template v-if="currentDataValue.finalProcessingType === 'merge'">
          <n-alert type="info" style="margin-bottom: 12px;" size="small">
            将多个原始数据对象合并为一个对象
          </n-alert>
        </template>
        
        <!-- 数组连接配置 -->
        <template v-if="currentDataValue.finalProcessingType === 'concat'">
          <n-alert type="info" style="margin-bottom: 12px;" size="small">
            将多个原始数据数组连接为一个数组
          </n-alert>
        </template>
        
        <!-- 自定义脚本配置 -->
        <template v-if="currentDataValue.finalProcessingType === 'script'">
          <n-form-item label="处理脚本">
            <div class="text-editor-container">
              <div class="editor-toolbar">
                <div style="display: flex; gap: 4px;">
                  <n-button size="tiny" @click="formatProcessingScript">
                    <template #icon><n-icon><CodeOutlined /></n-icon></template>
                    格式化
                  </n-button>
                  <n-button size="tiny" @click="validateProcessingScript">
                    <template #icon><n-icon><CheckCircleOutlined /></n-icon></template>
                    验证
                  </n-button>
                </div>
                <div style="font-size: 11px; color: var(--text-color-3);">
                  可用变量: rawDataList
                </div>
              </div>
              <n-input
                v-model:value="currentDataValue.finalProcessingScript"
                type="textarea"
                placeholder="// 处理脚本示例&#10;// rawDataList 是原始数据数组&#10;return rawDataList.map(item => ({&#10;  ...item,&#10;  processed: true&#10;}));"
                :rows="6"
                @update:value="updateProcessingScript"
                style="border: none; border-radius: 0;"
              />
            </div>
          </n-form-item>
        </template>
        
        <!-- 选择特定数据项 -->
        <template v-if="currentDataValue.finalProcessingType === 'select'">
          <n-form-item label="选择数据项">
            <n-select
              v-model:value="currentDataValue.selectedDataItemIndex"
              :options="getDataItemSelectorOptions()"
              placeholder="选择要使用的数据项"
              @update:value="updateSelectedDataItemIndex"
            />
          </n-form-item>
          
          <!-- 选中数据项预览 -->
          <div v-if="getSelectedDataItemPreview()" style="margin-top: 8px;">
            <n-alert type="success" size="small">
              <template #header>选中数据项预览</template>
              <pre style="margin: 0; font-size: 11px; max-height: 100px; overflow-y: auto;">{{ getSelectedDataItemPreview() }}</pre>
            </n-alert>
          </div>
        </template>
      </n-card>

      <!-- 处理结果预览 -->
      <n-card title="处理结果预览" size="small">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; color: var(--text-color-3);">最终数据预览</span>
          <div style="display: flex; gap: 4px;">
            <n-button size="tiny" @click="viewCurrentDataSourceFinalData">
              <template #icon><n-icon><EyeOutlined /></n-icon></template>
              查看最终数据
            </n-button>
          </div>
        </div>
        
        <div v-if="isProcessing" style="text-align: center; padding: 20px;">
          <n-spin size="small" />
          <div style="margin-top: 8px; font-size: 12px; color: var(--text-color-3);">处理中...</div>
        </div>
        
        <div v-else-if="currentDataValue.finalData">
          <pre style="background: var(--code-color, var(--card-color)); padding: 12px; border-radius: 4px; font-size: 11px; max-height: 200px; overflow-y: auto; margin: 0;">{{ formatDisplayData(currentDataValue.finalData) }}</pre>
        </div>
        
        <n-empty v-else description="暂无处理结果" size="small" />
      </n-card>
    </div>

    <!-- 添加/编辑原始数据弹窗 -->
    <n-modal 
      v-model:show="showAddDataModal" 
      preset="card" 
      title="添加原始数据" 
      style="width: 90%; max-width: 800px;"
      :mask-closable="false"
    >
      <div class="dynamic-form-area">
        <!-- 数据类型选择 -->
        <n-form-item label="数据类型" style="margin-bottom: 12px;">
          <n-select
            v-model:value="editingDataItem.type"
            :options="dataTypeOptions"
            placeholder="选择数据类型"
          />
        </n-form-item>
        
        <!-- 数据名称 -->
        <n-form-item label="数据名称" style="margin-bottom: 12px;">
          <n-input
            v-model:value="editingDataItem.name"
            placeholder="请输入数据名称"
          />
        </n-form-item>
        
        <!-- JSON数据录入 -->
        <template v-if="editingDataItem.type === 'json'">
          <n-form-item label="JSON数据">
            <div class="text-editor-container">
              <div class="editor-toolbar">
                <div style="display: flex; gap: 4px;">
                  <n-button size="tiny" @click="formatJsonData">
                    <template #icon><n-icon><CodeOutlined /></n-icon></template>
                    格式化
                  </n-button>
                  <n-button size="tiny" @click="validateJsonData">
                    <template #icon><n-icon><CheckCircleOutlined /></n-icon></template>
                    验证
                  </n-button>
                  <n-button size="tiny" @click="compressJsonData">
                    <template #icon><n-icon><CompressOutlined /></n-icon></template>
                    压缩
                  </n-button>
                  <n-button size="tiny" @click="insertJsonTemplate">
                    <template #icon><n-icon><FileAddOutlined /></n-icon></template>
                    模板
                  </n-button>
                </div>
                <div style="font-size: 11px; color: var(--text-color-3);">JSON格式数据</div>
              </div>
              <n-input
                v-model:value="editingDataItem.data"
                type="textarea"
                placeholder="请输入JSON格式数据"
                :rows="8"
                style="border: none; border-radius: 0;"
              />
            </div>
          </n-form-item>
        </template>
        
        <!-- HTTP数据录入 -->
        <template v-if="editingDataItem.type === 'http'">
          <!-- 基础配置 -->
          <n-card title="基础配置" size="small" style="margin-bottom: 12px;">
            <n-form-item label="请求方法">
              <n-select
                v-model:value="editingDataItem.httpConfig.method"
                :options="httpMethodOptions"
                placeholder="选择请求方法"
              />
            </n-form-item>
            
            <n-form-item label="请求URL">
              <div style="display: flex; gap: 8px;">
                <n-input
                  v-model:value="editingDataItem.httpConfig.url"
                  placeholder="请输入完整的URL地址"
                  style="flex: 1;"
                />
                <n-button @click="showSystemApiModal = true">
                  <template #icon><n-icon><ApiOutlined /></n-icon></template>
                  系统API
                </n-button>
              </div>
            </n-form-item>
          </n-card>
          
          <!-- 请求头配置 -->
          <n-card title="请求头" size="small" style="margin-bottom: 12px;">
            <div style="display: flex; gap: 4px; margin-bottom: 8px;">
              <n-button size="tiny" @click="addHttpHeader">
                <template #icon><n-icon><PlusOutlined /></n-icon></template>
                添加
              </n-button>
              <n-button size="tiny" @click="loadDefaultHeaders">
                <template #icon><n-icon><ReloadOutlined /></n-icon></template>
                默认
              </n-button>
              <n-button size="tiny" @click="parseHeadersFromJson">
                <template #icon><n-icon><ImportOutlined /></n-icon></template>
                从JSON解析
              </n-button>
              <n-button size="tiny" @click="clearHttpHeaders">
                <template #icon><n-icon><ClearOutlined /></n-icon></template>
                清空
              </n-button>
            </div>
            
            <div class="http-headers-list" v-if="editingDataItem.httpConfig.headers?.length">
              <div 
                v-for="(header, index) in editingDataItem.httpConfig.headers" 
                :key="index"
                class="header-item"
              >
                <div style="display: flex; gap: 8px; align-items: center;">
                  <n-input 
                    v-model:value="header.key" 
                    placeholder="Header名称" 
                    size="small" 
                    style="width: 150px;"
                  />
                  <n-input 
                    v-model:value="header.value" 
                    placeholder="Header值" 
                    size="small" 
                    style="flex: 1;"
                  />
                  <n-button size="tiny" type="error" @click="removeHttpHeader(index)">
                    <template #icon><n-icon><DeleteOutlined /></n-icon></template>
                  </n-button>
                </div>
              </div>
            </div>
            
            <n-empty v-else description="暂无请求头" size="small" />
          </n-card>
          
          <!-- URL参数配置 -->
          <n-card title="URL参数" size="small" style="margin-bottom: 12px;">
            <div style="display: flex; gap: 4px; margin-bottom: 8px;">
              <n-button size="tiny" @click="addUrlParam">
                <template #icon><n-icon><PlusOutlined /></n-icon></template>
                添加
              </n-button>
              <n-button size="tiny" @click="clearUrlParams">
                <template #icon><n-icon><ClearOutlined /></n-icon></template>
                清空
              </n-button>
            </div>
            
            <div class="param-list" v-if="editingDataItem.httpConfig.params?.length">
              <div 
                v-for="(param, index) in editingDataItem.httpConfig.params" 
                :key="index"
                class="param-item"
              >
                <div style="display: flex; gap: 8px; align-items: center;">
                  <n-input 
                    v-model:value="param.key" 
                    placeholder="参数名" 
                    size="small" 
                    style="width: 150px;"
                  />
                  <n-input 
                    v-model:value="param.value" 
                    placeholder="参数值" 
                    size="small" 
                    style="flex: 1;"
                  />
                  <n-button size="tiny" type="error" @click="removeUrlParam(index)">
                    <template #icon><n-icon><DeleteOutlined /></n-icon></template>
                  </n-button>
                </div>
              </div>
            </div>
            
            <n-empty v-else description="暂无URL参数" size="small" />
          </n-card>
          
          <!-- 请求体配置 -->
          <n-card title="请求体" size="small" style="margin-bottom: 12px;" v-if="['POST', 'PUT', 'PATCH'].includes(editingDataItem.httpConfig.method)">
            <n-form-item label="请求体类型">
              <n-select
                v-model:value="editingDataItem.httpConfig.bodyType"
                :options="bodyTypeOptions"
                placeholder="选择请求体类型"
              />
            </n-form-item>
            
            <!-- JSON请求体 -->
            <template v-if="editingDataItem.httpConfig.bodyType === 'json'">
              <n-form-item label="JSON数据">
                <div class="text-editor-container">
                  <div class="editor-toolbar">
                    <div style="display: flex; gap: 4px;">
                      <n-button size="tiny" @click="formatRequestBody">
                        <template #icon><n-icon><CodeOutlined /></n-icon></template>
                        格式化
                      </n-button>
                      <n-button size="tiny" @click="validateRequestBody">
                        <template #icon><n-icon><CheckCircleOutlined /></n-icon></template>
                        验证
                      </n-button>
                    </div>
                    <div style="font-size: 11px; color: var(--text-color-3);">JSON格式</div>
                  </div>
                  <n-input
                    v-model:value="editingDataItem.httpConfig.body"
                    type="textarea"
                    placeholder="请输入JSON格式的请求体"
                    :rows="6"
                    style="border: none; border-radius: 0;"
                  />
                </div>
              </n-form-item>
            </template>
            
            <!-- 表单数据 -->
            <template v-if="editingDataItem.httpConfig.bodyType === 'form'">
              <div style="display: flex; gap: 4px; margin-bottom: 8px;">
                <n-button size="tiny" @click="addFormDataItem">
                  <template #icon><n-icon><PlusOutlined /></n-icon></template>
                  添加
                </n-button>
                <n-button size="tiny" @click="clearFormData">
                  <template #icon><n-icon><ClearOutlined /></n-icon></template>
                  清空
                </n-button>
              </div>
              
              <div class="form-data-list" v-if="editingDataItem.httpConfig.formData?.length">
                <div 
                  v-for="(item, index) in editingDataItem.httpConfig.formData" 
                  :key="index"
                  class="form-data-item"
                >
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <n-input 
                      v-model:value="item.key" 
                      placeholder="字段名" 
                      size="small" 
                      style="width: 150px;"
                    />
                    <n-input 
                      v-model:value="item.value" 
                      placeholder="字段值" 
                      size="small" 
                      style="flex: 1;"
                    />
                    <n-button size="tiny" type="error" @click="removeFormDataItem(index)">
                      <template #icon><n-icon><DeleteOutlined /></n-icon></template>
                    </n-button>
                  </div>
                </div>
              </div>
              
              <n-empty v-else description="暂无表单数据" size="small" />
            </template>
            
            <!-- 原始文本 -->
            <template v-if="editingDataItem.httpConfig.bodyType === 'raw'">
              <n-form-item label="原始数据">
                <n-input
                  v-model:value="editingDataItem.httpConfig.body"
                  type="textarea"
                  placeholder="请输入原始文本数据"
                  :rows="6"
                />
              </n-form-item>
            </template>
          </n-card>
          
          <!-- 脚本配置 -->
          <n-card title="脚本配置" size="small" style="margin-bottom: 12px;">
            <!-- 请求前脚本 -->
            <n-form-item label="请求前脚本">
              <div class="text-editor-container">
                <div class="editor-toolbar">
                  <div style="display: flex; gap: 4px;">
                    <n-button size="tiny" @click="testPreRequestScript">
                      <template #icon><n-icon><PlayCircleOutlined /></n-icon></template>
                      测试
                    </n-button>
                    <n-button size="tiny" @click="loadPreRequestTemplate">
                      <template #icon><n-icon><FileAddOutlined /></n-icon></template>
                      模板
                    </n-button>
                    <n-button size="tiny" @click="clearPreRequestScript">
                      <template #icon><n-icon><ClearOutlined /></n-icon></template>
                      清空
                    </n-button>
                  </div>
                  <div style="font-size: 11px; color: var(--text-color-3);">可修改请求配置</div>
                </div>
                <n-input
                  v-model:value="editingDataItem.httpConfig.preRequestScript"
                  type="textarea"
                  :placeholder="preRequestScriptPlaceholder"
                  :rows="4"
                  style="border: none; border-radius: 0;"
                />
              </div>
            </n-form-item>
            
            <!-- 响应处理脚本 -->
            <n-form-item label="响应处理脚本">
              <div class="text-editor-container">
                <div class="editor-toolbar">
                  <div style="display: flex; gap: 4px;">
                    <n-button size="tiny" @click="testResponseScript">
                      <template #icon><n-icon><PlayCircleOutlined /></n-icon></template>
                      测试
                    </n-button>
                    <n-button size="tiny" @click="loadResponseTemplate">
                      <template #icon><n-icon><FileAddOutlined /></n-icon></template>
                      模板
                    </n-button>
                    <n-button size="tiny" @click="clearResponseScript">
                      <template #icon><n-icon><ClearOutlined /></n-icon></template>
                      清空
                    </n-button>
                  </div>
                  <div style="font-size: 11px; color: var(--text-color-3);">处理响应数据</div>
                </div>
                <n-input
                  v-model:value="editingDataItem.httpConfig.responseScript"
                  type="textarea"
                  :placeholder="responseScriptPlaceholder"
                  :rows="4"
                  style="border: none; border-radius: 0;"
                />
              </div>
            </n-form-item>
          </n-card>
          
          <!-- 高级配置 -->
          <n-card title="高级配置" size="small" style="margin-bottom: 12px;">
            <n-form-item label="请求超时(ms)">
              <n-input-number
                v-model:value="editingDataItem.httpConfig.timeout"
                placeholder="请求超时时间"
                :min="1000"
                :max="60000"
                :step="1000"
                style="width: 100%;"
              />
            </n-form-item>
            
            <n-form-item label="重试次数">
              <n-input-number
                v-model:value="editingDataItem.httpConfig.retries"
                placeholder="失败重试次数"
                :min="0"
                :max="5"
                style="width: 100%;"
              />
            </n-form-item>
            
            <n-form-item label="跟随重定向">
              <n-switch v-model:value="editingDataItem.httpConfig.followRedirects" />
            </n-form-item>
            
            <n-form-item label="验证SSL证书">
              <n-switch v-model:value="editingDataItem.httpConfig.validateSSL" />
            </n-form-item>
            
            <n-form-item label="启用Cookie管理">
              <n-switch v-model:value="editingDataItem.httpConfig.enableCookies" />
            </n-form-item>
            
            <!-- 代理配置 -->
            <n-form-item label="使用代理">
              <n-switch v-model:value="editingDataItem.httpConfig.useProxy" />
            </n-form-item>
            
            <template v-if="editingDataItem.httpConfig.useProxy">
              <n-form-item label="代理地址">
                <n-input
                  v-model:value="editingDataItem.httpConfig.proxyHost"
                  placeholder="代理服务器地址"
                />
              </n-form-item>
              
              <n-form-item label="代理端口">
                <n-input-number
                  v-model:value="editingDataItem.httpConfig.proxyPort"
                  placeholder="代理端口"
                  :min="1"
                  :max="65535"
                  style="width: 100%;"
                />
              </n-form-item>
              
              <n-form-item label="代理用户名">
                <n-input
                  v-model:value="editingDataItem.httpConfig.proxyUsername"
                  placeholder="代理用户名(可选)"
                />
              </n-form-item>
              
              <n-form-item label="代理密码">
                <n-input
                  v-model:value="editingDataItem.httpConfig.proxyPassword"
                  type="password"
                  placeholder="代理密码(可选)"
                  show-password-on="click"
                />
              </n-form-item>
            </template>
          </n-card>
          
          <!-- HTTP测试区域 -->
          <n-card title="测试请求" size="small">
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <n-button 
                type="primary" 
                @click="executeHttpRequest" 
                :loading="isHttpTesting"
                :disabled="!editingDataItem.httpConfig.url"
              >
                <template #icon><n-icon><SendOutlined /></n-icon></template>
                发送请求
              </n-button>
              <n-button @click="clearHttpTestResult">
                <template #icon><n-icon><ClearOutlined /></n-icon></template>
                清空结果
              </n-button>
            </div>
            
            <div v-if="httpTestResult">
              <n-alert 
                :type="httpTestResult.success ? 'success' : 'error'" 
                style="margin-bottom: 8px;"
                size="small"
              >
                <template #header>
                  {{ httpTestResult.success ? '请求成功' : '请求失败' }}
                  <span v-if="httpTestResult.status" style="margin-left: 8px;">
                    ({{ httpTestResult.status }})
                  </span>
                </template>
                {{ httpTestResult.message }}
              </n-alert>
              
              <div v-if="httpTestResult.data">
                <div style="font-size: 12px; color: var(--text-color-3); margin-bottom: 4px;">响应数据:</div>
                <pre style="background: var(--code-color, var(--card-color)); padding: 8px; border-radius: 4px; font-size: 11px; max-height: 200px; overflow-y: auto; margin: 0;">{{ formatDisplayData(httpTestResult.data) }}</pre>
              </div>
            </div>
          </n-card>
        </template>
        
        <!-- WebSocket数据录入 -->
        <template v-if="editingDataItem.type === 'websocket'">
          <n-form-item label="WebSocket地址">
            <n-input
              v-model:value="editingDataItem.websocketConfig.url"
              placeholder="请输入WebSocket地址 (ws:// 或 wss://)"
            />
          </n-form-item>
          
          <n-form-item label="连接协议">
            <n-select
              v-model:value="editingDataItem.websocketConfig.protocol"
              :options="websocketProtocolOptions"
              placeholder="选择WebSocket协议"
            />
          </n-form-item>
          
          <n-form-item label="心跳间隔(秒)">
            <n-input-number
              v-model:value="editingDataItem.websocketConfig.heartbeatInterval"
              placeholder="心跳间隔"
              :min="5"
              :max="300"
              style="width: 100%;"
            />
          </n-form-item>
          
          <n-form-item label="重连间隔(秒)">
            <n-input-number
              v-model:value="editingDataItem.websocketConfig.reconnectInterval"
              placeholder="重连间隔"
              :min="1"
              :max="60"
              style="width: 100%;"
            />
          </n-form-item>
          
          <n-form-item label="最大重连次数">
            <n-input-number
              v-model:value="editingDataItem.websocketConfig.maxReconnectAttempts"
              placeholder="最大重连次数"
              :min="0"
              :max="10"
              style="width: 100%;"
            />
          </n-form-item>
        </template>
      </div>
      
      <!-- 原始数据预览 -->
      <n-card title="原始数据预览" size="small" style="margin-top: 16px;" v-if="editingDataItem.type && editingDataItem.data">
        <pre style="background: var(--code-color, var(--card-color)); padding: 12px; border-radius: 4px; font-size: 11px; max-height: 150px; overflow-y: auto; margin: 0;">{{ formatDisplayData(editingDataItem.data) }}</pre>
      </n-card>
      
      <template #action>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <n-button @click="cancelEditDataSourceItem">取消</n-button>
          <n-button type="primary" @click="saveEditDataSourceItem">保存</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 查看最终数据弹窗 -->
    <n-modal 
      v-model:show="showFinalDataModal" 
      preset="card" 
      title="最终数据" 
      style="width: 90%; max-width: 800px;"
    >
      <div style="max-height: 500px; overflow-y: auto;">
        <pre style="background: var(--code-color, var(--card-color)); padding: 16px; border-radius: 4px; font-size: 12px; margin: 0;">{{ formatDisplayData(finalDataModalContent) }}</pre>
      </div>
      
      <template #action>
        <div style="display: flex; justify-content: flex-end;">
          <n-button @click="showFinalDataModal = false">关闭</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 查看原始数据详情弹窗 -->
    <n-modal 
      v-model:show="showRawDataDetailsModal" 
      preset="card" 
      title="原始数据详情" 
      style="width: 90%; max-width: 800px;"
    >
      <div v-if="rawDataDetailsModalContent">
        <n-descriptions :column="2" bordered size="small" style="margin-bottom: 16px;">
          <n-descriptions-item label="数据名称">
            {{ rawDataDetailsModalContent.name || '未命名' }}
          </n-descriptions-item>
          <n-descriptions-item label="数据类型">
            <n-tag :type="getDataItemTypeColor(rawDataDetailsModalContent.type)" size="small">
              {{ getTypeDisplayName(rawDataDetailsModalContent.type) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="创建时间" v-if="rawDataDetailsModalContent.createdAt">
            {{ new Date(rawDataDetailsModalContent.createdAt).toLocaleString() }}
          </n-descriptions-item>
          <n-descriptions-item label="更新时间" v-if="rawDataDetailsModalContent.updatedAt">
            {{ new Date(rawDataDetailsModalContent.updatedAt).toLocaleString() }}
          </n-descriptions-item>
        </n-descriptions>
        
        <div style="margin-bottom: 8px; font-weight: 500;">数据内容:</div>
        <div style="max-height: 400px; overflow-y: auto;">
          <pre style="background: var(--code-color, var(--card-color)); padding: 16px; border-radius: 4px; font-size: 12px; margin: 0;">{{ formatDisplayData(rawDataDetailsModalContent.data) }}</pre>
        </div>
      </div>
      
      <template #action>
        <div style="display: flex; justify-content: flex-end;">
          <n-button @click="showRawDataDetailsModal = false">关闭</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 系统API列表弹窗 -->
    <n-modal 
      v-model:show="showSystemApiModal" 
      preset="card" 
      title="系统API列表" 
      style="width: 90%; max-width: 1000px;"
    >
      <div class="api-list" style="max-height: 500px; overflow-y: auto;">
        <div 
          v-for="(api, index) in systemApiOptions" 
          :key="index"
          class="api-item"
          style="margin-bottom: 12px;"
        >
          <n-card size="small" hoverable @click="selectSystemApi(api)" style="cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <n-tag :type="api.method === 'GET' ? 'success' : api.method === 'POST' ? 'info' : 'warning'" size="small" style="margin-right: 8px;">
                    {{ api.method }}
                  </n-tag>
                  <span style="font-weight: 500;">{{ api.name }}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-color-3); margin-bottom: 4px;">{{ api.url }}</div>
                <div style="font-size: 11px; color: var(--text-color-3);">{{ api.description }}</div>
              </div>
              <n-button size="tiny" type="primary">
                选择
              </n-button>
            </div>
          </n-card>
        </div>
      </div>
      
      <template #action>
        <div style="display: flex; justify-content: flex-end;">
          <n-button @click="showSystemApiModal = false">关闭</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { 
  NCard, NButton, NSelect, NFormItem, NInput, NInputNumber, NSwitch, NTag, NAlert, NEmpty, NSpin, NModal, NIcon, NTooltip, NDescriptions, NDescriptionsItem
} from 'naive-ui'
import { 
  QuestionCircleOutlined, PlusOutlined, EyeOutlined, CodeOutlined, CheckCircleOutlined, 
  CompressOutlined, FileAddOutlined, ApiOutlined, ReloadOutlined, ImportOutlined, 
  ClearOutlined, DeleteOutlined, PlayCircleOutlined, SendOutlined
} from '@vicons/antd'

// 导入配置管理器
import { ConfigurationManager } from '../managers/ConfigurationManager'

// 导入项目请求服务
import { request } from '@/utils/request'

// 🔥 Props 定义
interface Props {
  modelValue?: Record<string, any> // v-model 双向绑定
  selectedWidgetId?: string // 当前选中的组件ID
  dataSources?: Record<string, any> // 数据源定义
  initialConfig?: Record<string, any> // 初始配置（用于回显）
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  selectedWidgetId: '',
  dataSources: () => ({}),
  initialConfig: () => ({})
})

// 🔥 Emits 定义
interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'dataSourceChange', dataSourceKey: string): void
  (e: 'configChange', config: Record<string, any>): void
}

const emit = defineEmits<Emits>()

// 🔥 响应式数据
const selectedDataSource = ref<string>('')
const dataValues = reactive<Record<string, any>>({})
const isInitializing = ref(false)
const isUpdatingConfig = ref(false)

// 🔥 弹窗状态
const showAddDataModal = ref(false)
const showDataProcessingModal = ref(false)
const showFinalDataModal = ref(false)
const showRawDataDetailsModal = ref(false)
const showSystemApiModal = ref(false)

// 🔥 编辑状态
const editingDataItem = reactive<any>({
  type: '',
  name: '',
  data: '',
  httpConfig: {
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    bodyType: 'json',
    body: '',
    formData: [],
    preRequestScript: '',
    responseScript: '',
    timeout: 10000,
    retries: 0,
    followRedirects: true,
    validateSSL: true,
    enableCookies: false,
    useProxy: false,
    proxyHost: '',
    proxyPort: 8080,
    proxyUsername: '',
    proxyPassword: ''
  },
  websocketConfig: {
    url: '',
    protocol: '',
    heartbeatInterval: 30,
    reconnectInterval: 5,
    maxReconnectAttempts: 3
  }
})

const editingIndex = ref(-1)
const dataProcessingConfig = reactive({
  filterPath: '',
  script: ''
})

// 🔥 测试状态
const isHttpTesting = ref(false)
const httpTestResult = ref<any>(null)
const isDataProcessingTesting = ref(false)
const dataProcessingPreview = ref<any>(null)
const isProcessing = ref(false)

// 🔥 弹窗内容
const finalDataModalContent = ref<any>(null)
const rawDataDetailsModalContent = ref<any>(null)

// 🔥 v-model 双向绑定的计算属性
const internalConfig = computed({
  get: () => props.modelValue || {},
  set: (value) => {
    console.log('🔄 [DataSourceConfigForm] internalConfig setter 触发:', value)
    emit('update:modelValue', value)
  }
})

// 🔥 数据源选项
const dataSourceOptions = computed(() => {
  return Object.keys(props.dataSources).map(key => ({
    label: props.dataSources[key]?.name || key,
    value: key
  }))
})

// 🔥 当前数据值
const currentDataValue = computed(() => {
  return selectedDataSource.value ? dataValues[selectedDataSource.value] : null
})

// 🔥 数据类型选项
const dataTypeOptions = [
  { label: 'JSON数据', value: 'json' },
  { label: 'HTTP请求', value: 'http' },
  { label: 'WebSocket', value: 'websocket' }
]

// 🔥 HTTP方法选项
const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' }
]

// 🔥 请求体类型选项
const bodyTypeOptions = [
  { label: 'JSON', value: 'json' },
  { label: '表单数据', value: 'form' },
  { label: '原始文本', value: 'raw' }
]

// 🔥 WebSocket协议选项
const websocketProtocolOptions = [
  { label: '默认', value: '' },
  { label: 'chat', value: 'chat' },
  { label: 'echo-protocol', value: 'echo-protocol' }
]

// 🔥 处理类型选项
const processingTypeOptions = [
  { label: '对象合并', value: 'merge' },
  { label: '数组连接', value: 'concat' },
  { label: '自定义脚本', value: 'script' },
  { label: '选择特定数据项', value: 'select' }
]

// 🔥 系统API选项（示例）
const systemApiOptions = [
  {
    name: '获取设备列表',
    method: 'GET',
    url: '/api/devices',
    description: '获取所有设备的列表信息'
  },
  {
    name: '获取设备详情',
    method: 'GET',
    url: '/api/devices/{id}',
    description: '根据设备ID获取设备详细信息'
  },
  {
    name: '创建设备',
    method: 'POST',
    url: '/api/devices',
    description: '创建新的设备'
  },
  {
    name: '更新设备',
    method: 'PUT',
    url: '/api/devices/{id}',
    description: '更新指定设备的信息'
  },
  {
    name: '删除设备',
    method: 'DELETE',
    url: '/api/devices/{id}',
    description: '删除指定的设备'
  }
]

// 🔥 脚本模板
const preRequestScriptPlaceholder = `// 请求前脚本示例
// 可以修改请求配置
// config.headers['Authorization'] = 'Bearer ' + getToken();
// config.params.timestamp = Date.now();
// return config;`

const responseScriptPlaceholder = `// 响应处理脚本示例
// 处理响应数据
// return response.data.result;
// 或者进行数据转换
// return response.data.list.map(item => ({
//   id: item.id,
//   name: item.name,
//   status: item.status === 1 ? '在线' : '离线'
// }));`

// 🔥 数据源变化处理
const onDataSourceChange = (dataSourceKey: string) => {
  console.log('🔄 [DataSourceConfigForm] 数据源变化:', dataSourceKey)
  selectedDataSource.value = dataSourceKey
  
  // 确保数据值存在
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      rawDataList: [],
      finalProcessingType: 'merge',
      finalProcessingScript: '',
      selectedDataItemIndex: 0,
      finalData: null
    }
  }
  
  // 触发数据源变化事件
  emit('dataSourceChange', dataSourceKey)
  
  // 更新配置
  triggerConfigUpdate()
}

// 🔥 获取示例数据代码
const getExampleDataCode = () => {
  if (!selectedDataSource.value) {
    return '请先选择数据源'
  }
  
  const dataSource = props.dataSources[selectedDataSource.value]
  if (!dataSource) {
    return '数据源不存在'
  }
  
  // 根据数据源类型返回示例
  switch (dataSource.type) {
    case 'api':
      return `{
  "code": 200,
  "data": [
    { "id": 1, "name": "设备1", "status": "在线" },
    { "id": 2, "name": "设备2", "status": "离线" }
  ],
  "message": "success"
}`
    case 'database':
      return `[
  { "id": 1, "name": "记录1", "value": 100 },
  { "id": 2, "name": "记录2", "value": 200 }
]`
    default:
      return `{
  "timestamp": "2024-01-01T00:00:00Z",
  "data": "示例数据"
}`
  }
}

// 🔥 获取数据项类型颜色
const getDataItemTypeColor = (type: string) => {
  switch (type) {
    case 'json': return 'info'
    case 'http': return 'success'
    case 'websocket': return 'warning'
    default: return 'default'
  }
}

// 🔥 获取类型显示名称
const getTypeDisplayName = (type: string) => {
  switch (type) {
    case 'json': return 'JSON'
    case 'http': return 'HTTP'
    case 'websocket': return 'WebSocket'
    default: return type
  }
}

// 🔥 格式化显示数据
const formatDisplayData = (data: any) => {
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      return data
    }
  }
  return JSON.stringify(data, null, 2)
}

// 🔥 添加原始数据项
const addDataSourceItem = () => {
  if (!selectedDataSource.value) return
  
  const newItem = {
    type: 'json',
    name: `数据项${(currentDataValue.value?.rawDataList?.length || 0) + 1}`,
    data: '{}',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  
  if (!currentDataValue.value.rawDataList) {
    currentDataValue.value.rawDataList = []
  }
  
  currentDataValue.value.rawDataList.push(newItem)
  triggerConfigUpdate()
}

// 🔥 编辑数据源项
const editDataSourceItem = (index: number) => {
  if (!currentDataValue.value?.rawDataList?.[index]) return
  
  const item = currentDataValue.value.rawDataList[index]
  editingIndex.value = index
  
  // 重置编辑项
  Object.assign(editingDataItem, {
    type: item.type || 'json',
    name: item.name || '',
    data: item.data || '',
    httpConfig: {
      method: item.httpConfig?.method || 'GET',
      url: item.httpConfig?.url || '',
      headers: item.httpConfig?.headers || [],
      params: item.httpConfig?.params || [],
      bodyType: item.httpConfig?.bodyType || 'json',
      body: item.httpConfig?.body || '',
      formData: item.httpConfig?.formData || [],
      preRequestScript: item.httpConfig?.preRequestScript || '',
      responseScript: item.httpConfig?.responseScript || '',
      timeout: item.httpConfig?.timeout || 10000,
      retries: item.httpConfig?.retries || 0,
      followRedirects: item.httpConfig?.followRedirects !== false,
      validateSSL: item.httpConfig?.validateSSL !== false,
      enableCookies: item.httpConfig?.enableCookies || false,
      useProxy: item.httpConfig?.useProxy || false,
      proxyHost: item.httpConfig?.proxyHost || '',
      proxyPort: item.httpConfig?.proxyPort || 8080,
      proxyUsername: item.httpConfig?.proxyUsername || '',
      proxyPassword: item.httpConfig?.proxyPassword || ''
    },
    websocketConfig: {
      url: item.websocketConfig?.url || '',
      protocol: item.websocketConfig?.protocol || '',
      heartbeatInterval: item.websocketConfig?.heartbeatInterval || 30,
      reconnectInterval: item.websocketConfig?.reconnectInterval || 5,
      maxReconnectAttempts: item.websocketConfig?.maxReconnectAttempts || 3
    }
  })
  
  showAddDataModal.value = true
}

// 🔥 保存编辑的数据源项
const saveEditDataSourceItem = () => {
  if (!selectedDataSource.value || !currentDataValue.value) return
  
  const newItem = {
    type: editingDataItem.type,
    name: editingDataItem.name,
    data: editingDataItem.data,
    httpConfig: editingDataItem.type === 'http' ? { ...editingDataItem.httpConfig } : undefined,
    websocketConfig: editingDataItem.type === 'websocket' ? { ...editingDataItem.websocketConfig } : undefined,
    createdAt: editingIndex.value >= 0 ? currentDataValue.value.rawDataList[editingIndex.value]?.createdAt : Date.now(),
    updatedAt: Date.now()
  }
  
  if (editingIndex.value >= 0) {
    // 编辑模式
    currentDataValue.value.rawDataList[editingIndex.value] = newItem
  } else {
    // 添加模式
    if (!currentDataValue.value.rawDataList) {
      currentDataValue.value.rawDataList = []
    }
    currentDataValue.value.rawDataList.push(newItem)
  }
  
  // 重置编辑状态
  resetEditingState()
  showAddDataModal.value = false
  
  // 触发配置更新
  triggerConfigUpdate()
}

// 🔥 取消编辑数据源项
const cancelEditDataSourceItem = () => {
  resetEditingState()
  showAddDataModal.value = false
}

// 🔥 重置编辑状态
const resetEditingState = () => {
  editingIndex.value = -1
  Object.assign(editingDataItem, {
    type: '',
    name: '',
    data: '',
    httpConfig: {
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      bodyType: 'json',
      body: '',
      formData: [],
      preRequestScript: '',
      responseScript: '',
      timeout: 10000,
      retries: 0,
      followRedirects: true,
      validateSSL: true,
      enableCookies: false,
      useProxy: false,
      proxyHost: '',
      proxyPort: 8080,
      proxyUsername: '',
      proxyPassword: ''
    },
    websocketConfig: {
      url: '',
      protocol: '',
      heartbeatInterval: 30,
      reconnectInterval: 5,
      maxReconnectAttempts: 3
    }
  })
}

// 🔥 删除数据源项
const removeDataSourceItem = (index: number) => {
  if (!currentDataValue.value?.rawDataList) return
  
  currentDataValue.value.rawDataList.splice(index, 1)
  triggerConfigUpdate()
}

// 🔥 查看原始数据详情
const viewRawDataDetails = (item: any, index: number) => {
  rawDataDetailsModalContent.value = { ...item, index }
  showRawDataDetailsModal.value = true
}

// 🔥 查看当前数据源最终数据
const viewCurrentDataSourceFinalData = () => {
  if (!currentDataValue.value?.finalData) return
  
  finalDataModalContent.value = currentDataValue.value.finalData
  showFinalDataModal.value = true
}

// 🔥 更新处理类型
const updateProcessingType = (type: string) => {
  if (!currentDataValue.value) return
  
  currentDataValue.value.finalProcessingType = type
  triggerConfigUpdate()
}

// 🔥 更新处理脚本
const updateProcessingScript = (script: string) => {
  if (!currentDataValue.value) return
  
  currentDataValue.value.finalProcessingScript = script
  triggerConfigUpdate()
}

// 🔥 更新选中的数据项索引
const updateSelectedDataItemIndex = (index: number) => {
  if (!currentDataValue.value) return
  
  currentDataValue.value.selectedDataItemIndex = index
  triggerConfigUpdate()
}

// 🔥 获取数据项选择器选项
const getDataItemSelectorOptions = () => {
  if (!currentDataValue.value?.rawDataList) return []
  
  return currentDataValue.value.rawDataList.map((item: any, index: number) => ({
    label: item.name || `数据项${index + 1}`,
    value: index
  }))
}

// 🔥 获取选中数据项预览
const getSelectedDataItemPreview = () => {
  if (!currentDataValue.value?.rawDataList || currentDataValue.value.selectedDataItemIndex === undefined) return null
  
  const selectedItem = currentDataValue.value.rawDataList[currentDataValue.value.selectedDataItemIndex]
  return selectedItem ? formatDisplayData(selectedItem.data) : null
}

// 🔥 HTTP相关方法
const addHttpHeader = () => {
  if (!editingDataItem.httpConfig.headers) {
    editingDataItem.httpConfig.headers = []
  }
  editingDataItem.httpConfig.headers.push({ key: '', value: '' })
}

const removeHttpHeader = (index: number) => {
  editingDataItem.httpConfig.headers.splice(index, 1)
}

const clearHttpHeaders = () => {
  editingDataItem.httpConfig.headers = []
}

const loadDefaultHeaders = () => {
  editingDataItem.httpConfig.headers = [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Accept', value: 'application/json' }
