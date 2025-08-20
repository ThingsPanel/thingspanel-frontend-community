<template>
  <div class="data-source-config-form">
    <!-- 🔥 新增：全局操作区域 -->
    <div class="global-actions" style="margin-bottom: 16px">
      <n-space justify="space-between" align="center">
        <n-text strong style="font-size: 16px">数据源配置管理</n-text>
        <n-space :size="12">
          <n-button type="primary" @click="exportAllConfig">
            <template #icon>
              <n-icon>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L12 15M12 15L8 11M12 15L16 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17L2 19C2 20.1046 2.89543 21 4 21L20 21C21.1046 21 22 20.1046 22 19L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </n-icon>
            </template>
            导出完整配置
          </n-button>
          <n-button type="success" @click="showImportModal = true">
            <template #icon>
              <n-icon>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 22L12 9M12 9L16 13M12 9L8 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 7L2 5C2 3.89543 2.89543 3 4 3L20 3C21.1046 3 22 3.89543 22 5L22 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </n-icon>
            </template>
            导入配置
          </n-button>
        </n-space>
      </n-space>
    </div>
    
    <n-collapse :default-expanded-names="[props.dataSources[0]?.key]" accordion>
      <n-collapse-item v-for="dataSource in props.dataSources" :key="dataSource.key" :name="dataSource.key">
        <template #header>
          <div class="data-source-header">
            <span>{{ dataSource.name || dataSource.key }} ({{ getDataTypeText(dataSource) }})</span>
            <!-- 🔥 新增：示例数据提示图标 -->
            <n-tooltip placement="right" trigger="hover">
              <template #trigger>
                <n-icon size="16" class="example-data-icon">
                  <InformationCircleOutline />
                </n-icon>
              </template>
              <div class="example-data-tooltip">
                <div class="tooltip-title">示例数据格式:</div>
                <div class="example-code-container">
                  <pre class="example-code">{{ getExampleDataCode(dataSource) }}</pre>
                </div>
              </div>
            </n-tooltip>
          </div>
        </template>
        <!-- 数据源配置内容 -->
        <div class="data-source-content">
          <n-space vertical :size="16">
            <!-- 原始数据管理 -->
            <div>
              <n-text strong>原始数据管理:</n-text>
              <n-space vertical :size="8" style="margin-top: 8px">
                <!-- 添加原始数据按钮 - 弹窗形式 -->
                <n-button type="dashed" size="small" class="add-data-btn" @click="openAddRawDataModal(dataSource.key)">
                  <template #icon>
                    <n-icon size="14">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                      </svg>
                    </n-icon>
                  </template>
                  添加数据项
                </n-button>

                <!-- 原始数据列表 -->
                <div v-if="dataValues[dataSource.key]?.rawDataList?.length > 0" class="raw-data-list">
                  <n-text depth="3" style="font-size: 12px">
                    原始数据列表 ({{ dataValues[dataSource.key].rawDataList.length }} 项):
                  </n-text>
                  <n-space vertical :size="4" style="margin-top: 4px">
                    <div
                      v-for="rawDataItem in dataValues[dataSource.key].rawDataList"
                      :key="rawDataItem.id"
                      class="raw-data-item-compact"
                    >
                      <n-space align="center" justify="space-between">
                        <n-space align="center" :size="8">
                          <span class="raw-data-name">{{ rawDataItem.name }}</span>
                          <!-- 🔥 新增：显示数据项类型 -->
                          <n-tag :type="getDataItemTypeColor(rawDataItem.type)" size="small" round>
                            {{ rawDataItem.type?.toUpperCase() || 'JSON' }}
                          </n-tag>
                        </n-space>
                        <n-space :size="4">
                          <n-button
                            size="tiny"
                            quaternary
                            type="info"
                            class="compact-btn"
                            @click="viewRawDataDetail(dataSource.key, rawDataItem.id)"
                          >
                            查看
                          </n-button>
                          <!-- 🔥 新增：编辑按钮 -->
                          <n-button
                            size="tiny"
                            quaternary
                            type="warning"
                            class="compact-btn"
                            @click="editRawData(dataSource.key, rawDataItem.id)"
                          >
                            编辑
                          </n-button>
                          <n-button
                            size="tiny"
                            quaternary
                            type="error"
                            class="compact-btn"
                            @click="deleteRawData(dataSource.key, rawDataItem.id)"
                          >
                            删除
                          </n-button>
                        </n-space>
                      </n-space>
                    </div>
                  </n-space>
                </div>
                <n-text v-else depth="3" style="font-size: 12px">暂无原始数据项</n-text>
              </n-space>
            </div>

            <!-- 🆕 数据源最终处理配置 -->
            <div class="final-data-processing">
              <n-text strong>数据源最终处理:</n-text>
              <n-space vertical :size="12" style="margin-top: 8px">
                <!-- 处理方式选择 -->
                <div>
                  <n-text depth="2" style="font-size: 12px; margin-bottom: 4px; display: block">
                    选择如何将多个原始数据项合并为最终数据:
                  </n-text>
                  <n-radio-group 
                    :value="dataValues[dataSource.key]?.finalProcessingType || 'custom-script'"
                    @update:value="(value) => updateFinalProcessingType(dataSource.key, value)"
                    style="width: 100%"
                  >
                    <n-space vertical :size="6">
                      <n-radio value="merge-object" style="width: 100%">
                        <n-space align="center" :size="8">
                          <span style="font-weight: 500">对象合并</span>
                          <n-text depth="3" style="font-size: 11px">
                            将多个对象合并成一个大对象 (Object.assign)
                          </n-text>
                        </n-space>
                      </n-radio>
                      <n-radio value="concat-array" style="width: 100%">
                        <n-space align="center" :size="8">
                          <span style="font-weight: 500">数组连接</span>
                          <n-text depth="3" style="font-size: 11px">
                            将多个数组连接成一个数组 (Array.concat)
                          </n-text>
                        </n-space>
                      </n-radio>
                      <n-radio value="custom-script" style="width: 100%">
                        <n-space align="center" :size="8">
                          <span style="font-weight: 500">自定义脚本</span>
                          <n-text depth="3" style="font-size: 11px">
                            用JavaScript脚本自定义处理逻辑
                          </n-text>
                        </n-space>
                      </n-radio>
                      <n-radio value="select-specific" style="width: 100%">
                        <n-space align="center" :size="8">
                          <span style="font-weight: 500">选择特定数据项</span>
                          <n-text depth="3" style="font-size: 11px">
                            从多个数据项中选择一个作为最终数据
                          </n-text>
                        </n-space>
                      </n-radio>
                    </n-space>
                  </n-radio-group>
                </div>

                <!-- 自定义脚本编辑区域 -->
                <div 
                  v-if="(dataValues[dataSource.key]?.finalProcessingType || 'custom-script') === 'custom-script'" 
                  class="custom-script-area"
                >
                  <n-card size="small" :bordered="false" style="background: var(--hover-color)">
                    <template #header>
                      <n-space align="center" justify="space-between">
                        <n-text depth="2" style="font-size: 12px">最终处理脚本</n-text>
                        <n-space :size="4">
                          <n-button size="tiny" tertiary @click="formatFinalScript(dataSource.key)">
                            <template #icon>
                              <n-icon size="12">
                                <svg viewBox="0 0 24 24" fill="none">
                                  <path d="M9.5 15.5L4.5 10.5L9.5 5.5L8.09 4.09L1.5 10.68L8.09 17.27L9.5 15.5Z" fill="currentColor"/>
                                  <path d="M14.5 8.5L19.5 13.5L14.5 18.5L15.91 19.91L22.5 13.32L15.91 6.73L14.5 8.5Z" fill="currentColor"/>
                                </svg>
                              </n-icon>
                            </template>
                            格式化
                          </n-button>
                          <n-button size="tiny" tertiary @click="validateFinalScript(dataSource.key)">
                            <template #icon>
                              <n-icon size="12">
                                <svg viewBox="0 0 24 24" fill="none">
                                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" fill="none"/>
                                </svg>
                              </n-icon>
                            </template>
                            验证
                          </n-button>
                        </n-space>
                      </n-space>
                    </template>
                    
                    <!-- 脚本编辑器 -->
                    <div class="script-editor-container">
                      <n-input
                        :value="dataValues[dataSource.key]?.finalProcessingScript || 'return processedDataList'"
                        @update:value="(value) => updateFinalProcessingScript(dataSource.key, value)"
                        type="textarea"
                        :rows="8"
                        placeholder="// 编写最终处理脚本&#10;// 参数: processedDataList - 已处理的原始数据项列表&#10;// 返回: 合并后的最终数据&#10;return processedDataList"
                        style="font-family: 'Courier New', monospace; font-size: 12px"
                      />
                      
                      <!-- 脚本说明 -->
                      <div style="margin-top: 8px; padding: 8px; background: var(--info-color-pressed); border-radius: 4px">
                        <n-text depth="2" style="font-size: 11px; line-height: 1.4">
                          <strong>脚本说明:</strong><br/>
                          • <code>processedDataList</code>: 所有原始数据项经过过滤和脚本处理后的结果数组<br/>
                          • 示例: <code>Object.assign({}, ...processedDataList)</code> 合并对象<br/>
                          • 示例: <code>processedDataList.flat()</code> 连接数组<br/>
                          • 示例: <code>processedDataList[0]</code> 使用第一个数据项
                        </n-text>
                      </div>
                    </div>
                  </n-card>
                </div>

                <!-- 🆕 数据项选择器 -->
                <div 
                  v-if="(dataValues[dataSource.key]?.finalProcessingType || 'custom-script') === 'select-specific'"
                  class="data-item-selector"
                >
                  <n-card size="small" :bordered="false" style="background: var(--hover-color)">
                    <template #header>
                      <n-text depth="2" style="font-size: 12px">选择数据项</n-text>
                    </template>
                    
                    <div class="selector-content">
                      <n-text depth="2" style="font-size: 11px; margin-bottom: 8px; display: block">
                        从 {{ dataValues[dataSource.key]?.rawDataList?.length || 0 }} 个原始数据项中选择一个作为最终数据:
                      </n-text>
                      
                      <!-- 下拉选择器 -->
                      <n-select
                        :value="dataValues[dataSource.key]?.selectedDataItemIndex ?? 0"
                        @update:value="(index) => updateSelectedDataItemIndex(dataSource.key, index)"
                        :options="getDataItemSelectOptions(dataSource.key)"
                        placeholder="选择数据项"
                        size="small"
                        style="width: 100%"
                      />
                      
                      <!-- 选中数据项预览 -->
                      <div style="margin-top: 8px">
                        <n-text depth="3" style="font-size: 10px; display: block; margin-bottom: 4px">
                          选中数据项预览:
                        </n-text>
                        <n-card 
                          size="small" 
                          :bordered="false"
                          style="background: var(--code-color); max-height: 120px; overflow-y: auto"
                        >
                          <pre style="margin: 0; font-size: 10px; white-space: pre-wrap">{{
                            getSelectedDataItemPreview(dataSource.key)
                          }}</pre>
                        </n-card>
                      </div>
                    </div>
                  </n-card>
                </div>

                <!-- 处理结果预览 -->
                <div class="final-processing-preview">
                  <n-space align="center" justify="space-between" style="margin-bottom: 4px">
                    <n-text depth="2" style="font-size: 12px">
                      最终数据预览:
                    </n-text>
                    <!-- 状态指示 -->
                    <n-space :size="4" align="center">
                      <!-- 加载状态 -->
                      <n-spin 
                        v-if="finalProcessingStatus[dataSource.key]?.loading" 
                        size="small" 
                        show
                        style="width: 14px; height: 14px"
                      />
                      <!-- 成功状态 -->
                      <n-text 
                        v-else-if="!finalProcessingStatus[dataSource.key]?.error && finalProcessingStatus[dataSource.key]?.lastUpdateTime"
                        depth="3" 
                        style="font-size: 10px; color: var(--success-color)"
                      >
                        ✅ {{ new Date(finalProcessingStatus[dataSource.key].lastUpdateTime).toLocaleTimeString() }}
                      </n-text>
                      <!-- 错误状态 -->
                      <n-text 
                        v-else-if="finalProcessingStatus[dataSource.key]?.error"
                        depth="3" 
                        style="font-size: 10px; color: var(--error-color)"
                      >
                        ❌ 处理失败
                      </n-text>
                      <!-- 数据项计数 -->
                      <n-text depth="3" style="font-size: 10px">
                        ({{ processingPreviewStatus[dataSource.key]?.dataCount || dataValues[dataSource.key]?.rawDataList?.length || 0 }} 项)
                      </n-text>
                    </n-space>
                  </n-space>
                  
                  <!-- 预览内容 -->
                  <n-card 
                    size="small" 
                    :bordered="false" 
                    style="max-height: 120px; overflow: auto"
                    :style="{
                      background: finalProcessingStatus[dataSource.key]?.error 
                        ? 'var(--error-color-pressed)' 
                        : 'var(--code-color)'
                    }"
                  >
                    <!-- 错误信息 -->
                    <div 
                      v-if="finalProcessingStatus[dataSource.key]?.error"
                      style="color: var(--error-color); font-size: 11px; line-height: 1.3"
                    >
                      <strong>处理错误:</strong><br/>
                      {{ finalProcessingStatus[dataSource.key].error }}
                    </div>
                    <!-- 正常数据预览 -->
                    <pre 
                      v-else
                      style="margin: 0; font-size: 11px; line-height: 1.3; white-space: pre-wrap"
                    >{{
                      dataValues[dataSource.key]?.currentData 
                        ? JSON.stringify(dataValues[dataSource.key].currentData, null, 2) 
                        : (dataValues[dataSource.key]?.rawDataList?.length > 0 ? '等待处理...' : '暂无数据')
                    }}</pre>
                  </n-card>
                  
                  <!-- 详细错误信息展开 -->
                  <n-collapse-transition :show="!!finalProcessingStatus[dataSource.key]?.error">
                    <div style="margin-top: 8px; padding: 8px; background: var(--warning-color-pressed); border-radius: 4px">
                      <n-text depth="2" style="font-size: 11px">
                        <strong>调试建议:</strong><br/>
                        • 检查原始数据项是否配置正确<br/>
                        • 验证处理脚本语法是否正确<br/>
                        • 查看浏览器控制台获取详细错误信息
                      </n-text>
                    </div>
                  </n-collapse-transition>
                </div>
              </n-space>
            </div>

            <!-- 操作按钮 -->
            <n-space :size="8">
              <n-button @click="resetData(dataSource.key)">重置为默认</n-button>
              <n-button type="info" @click="showCurrentFinalData(dataSource.key)">查看当前数据源最终数据</n-button>
            </n-space>
          </n-space>
        </div>
      </n-collapse-item>
    </n-collapse>
  </div>

  <!-- 添加/编辑原始数据弹窗 - 左右分栏布局 -->
  <n-modal
    v-model:show="showAddRawDataModal"
    preset="dialog"
    :title="isEditMode ? '编辑数据项' : '添加数据项'"
    style="width: 1400px"
  >
    <n-grid :cols="2" :x-gap="12">
      <!-- 左侧：数据获取区域 -->
      <n-grid-item>
        <n-space vertical :size="4">
          <n-text strong style="font-size: 13px; color: var(--primary-color)">📥 数据获取</n-text>

          <!-- 基本信息 -->
          <n-grid :cols="2" :x-gap="6">
            <n-grid-item>
              <n-form-item label="名称" size="small" :label-width="50">
                <n-input v-model:value="newRawDataName" placeholder="用户数据" clearable size="small" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="类型" size="small" :label-width="50">
                <n-space :size="4">
                  <n-tag
                    v-for="type in ['json', 'http', 'websocket']"
                    :key="type"
                    :type="newRawDataType === type ? 'primary' : 'default'"
                    :bordered="newRawDataType !== type"
                    checkable
                    :checked="newRawDataType === type"
                    style="cursor: pointer; user-select: none"
                    size="small"
                    @click="newRawDataType = type as RawDataItemType"
                  >
                    {{ type.toUpperCase() }}
                  </n-tag>
                </n-space>
              </n-form-item>
            </n-grid-item>
          </n-grid>

          <!-- 数据录入区域 -->
          <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
            <template #header>
              <n-text depth="2" style="font-size: 11px">数据录入</n-text>
            </template>

            <!-- JSON数据输入 -->
            <div v-if="newRawDataType === 'json'">
              <n-form-item label="JSON数据" size="small" :label-width="60" style="margin-bottom: 2px">
                <div class="text-editor-container">
                  <!-- 编辑器工具栏 -->
                  <div class="editor-toolbar">
                    <n-space :size="6" align="center">
                      <n-button size="tiny" tertiary @click="formatJsonData">
                        <template #icon>
                          <n-icon size="12">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M9.5 15.5L4.5 10.5L9.5 5.5L8.09 4.09L1.5 10.68L8.09 17.27L9.5 15.5Z"
                                fill="currentColor"
                              />
                              <path
                                d="M14.5 8.5L19.5 13.5L14.5 18.5L15.91 19.91L22.5 13.32L15.91 6.73L14.5 8.5Z"
                                fill="currentColor"
                              />
                            </svg>
                          </n-icon>
                        </template>
                        格式化
                      </n-button>
                      <n-button size="tiny" tertiary @click="validateJsonData">
                        <template #icon>
                          <n-icon size="12">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                                stroke="currentColor"
                                stroke-width="2"
                                fill="none"
                              />
                            </svg>
                          </n-icon>
                        </template>
                        验证
                      </n-button>
                      <n-button size="tiny" tertiary @click="compressJsonData">
                        <template #icon>
                          <n-icon size="12">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M8 6H16V8H8V6ZM8 10H16V12H8V10ZM8 14H13V16H8V14Z" fill="currentColor" />
                            </svg>
                          </n-icon>
                        </template>
                        压缩
                      </n-button>
                      <n-popover placement="bottom" trigger="hover">
                        <template #trigger>
                          <n-tag size="small" :type="jsonValidationStatus.type" style="font-size: 10px; cursor: help">
                            {{ jsonValidationStatus.text }}
                          </n-tag>
                        </template>
                        <div style="max-width: 300px; font-size: 12px">
                          {{ jsonValidationStatus.detail }}
                        </div>
                      </n-popover>
                    </n-space>
                  </div>
                  <n-input
                    v-model:value="newRawDataJsonContent"
                    type="textarea"
                    placeholder="请输入JSON数据"
                    :rows="8"
                    style="font-family: 'Courier New', monospace; font-size: 12px;"
                    @input="handleJsonChange"
                  />
                </div>
              </n-form-item>
            </div>

            <!-- HTTP数据输入 - 完整配置 -->
            <div v-else-if="newRawDataType === 'http'">
              <n-tabs type="line" size="small" animated>
                <!-- 基础配置Tab -->
                <n-tab-pane name="basic" tab="基础配置">
                  <n-space vertical :size="6">
                    <!-- URL和方法 -->
                    <n-grid :cols="4" :x-gap="8">
                      <n-grid-item :span="1">
                        <n-form-item label="方法" size="small" :label-width="40" style="margin-bottom: 2px">
                          <n-select
                            v-model:value="httpConfig.method"
                            :options="httpMethodOptions"
                            size="small"
                            @update:value="onHttpConfigChange"
                          />
                        </n-form-item>
                      </n-grid-item>
                      <n-grid-item :span="3">
                        <n-form-item label="URL" size="small" :label-width="30" style="margin-bottom: 2px">
                          <n-input
                            v-model:value="httpConfig.url"
                            placeholder="https://api.example.com/data 或 /api/device/list"
                            clearable
                            size="small"
                            @input="onHttpConfigChange"
                          >
                            <template #suffix>
                              <n-tooltip trigger="hover">
                                <template #trigger>
                                  <n-icon size="14" style="color: var(--info-color); cursor: help">
                                    <InformationCircleOutline />
                                  </n-icon>
                                </template>
                                <div style="max-width: 300px; font-size: 12px">
                                  <p style="margin: 2px 0"><strong>支持的URL格式：</strong></p>
                                  <p style="margin: 2px 0">• 绝对路径: https://api.example.com/data</p>
                                  <p style="margin: 2px 0">• 相对路径: /api/device/list (使用当前系统域名)</p>
                                  <p style="margin: 2px 0">• API列表: 点击下方按钮查看可用接口</p>
                                </div>
                              </n-tooltip>
                            </template>
                          </n-input>
                        </n-form-item>
                      </n-grid-item>
                    </n-grid>

                    <!-- 快速选择系统API -->
                    <div>
                      <n-text depth="3" style="font-size: 11px">快速选择系统API:</n-text>
                      <n-space :size="4" style="margin-top: 4px">
                        <n-button
                          v-for="apiItem in systemApiOptions"
                          :key="apiItem.path"
                          size="tiny"
                          tertiary
                          @click="selectSystemApi(apiItem)"
                        >
                          {{ apiItem.name }}
                        </n-button>
                        <n-button size="tiny" quaternary @click="showApiListModal = true">
                          查看全部接口
                        </n-button>
                      </n-space>
                    </div>

                    <!-- 测试连接按钮 -->
                    <n-space justify="space-between" align="center">
                      <n-space :size="6">
                        <n-button 
                          size="small" 
                          type="primary" 
                          :loading="httpTesting" 
                          @click="testHttpRequest"
                          :disabled="!httpConfig.url.trim()"
                        >
                          <template #icon>
                            <n-icon size="14">
                              <svg viewBox="0 0 24 24" fill="none">
                                <path d="M8 12L10.5 14.5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </n-icon>
                          </template>
                          测试请求
                        </n-button>
                        <n-tag v-if="httpTestResult.status" :type="httpTestResult.success ? 'success' : 'error'" size="small">
                          {{ httpTestResult.message }}
                        </n-tag>
                      </n-space>
                      <n-text depth="3" style="font-size: 10px">
                        配置完成后会自动触发请求
                      </n-text>
                    </n-space>
                  </n-space>
                </n-tab-pane>

                <!-- 请求头Tab -->
                <n-tab-pane name="headers" tab="请求头">
                  <n-space vertical :size="6">
                    <n-space justify="space-between" align="center">
                      <n-text depth="2" style="font-size: 11px">HTTP Headers 配置</n-text>
                      <n-space :size="4">
                        <n-button size="tiny" @click="addHttpHeader">添加</n-button>
                        <n-button size="tiny" @click="loadDefaultHeaders">加载默认</n-button>
                        <n-button size="tiny" @click="clearHttpHeaders">清空</n-button>
                      </n-space>
                    </n-space>
                    
                    <!-- 动态头部列表 -->
                    <div v-if="httpConfig.headers.length > 0" class="http-headers-list">
                      <div 
                        v-for="(header, index) in httpConfig.headers" 
                        :key="index" 
                        class="header-item"
                      >
                        <n-grid :cols="6" :x-gap="6" style="align-items: center">
                          <n-grid-item :span="2">
                            <n-input 
                              v-model:value="header.key" 
                              placeholder="Header名称"
                              size="small"
                              @input="onHttpConfigChange"
                            />
                          </n-grid-item>
                          <n-grid-item :span="3">
                            <n-input 
                              v-model:value="header.value" 
                              placeholder="Header值"
                              size="small"
                              @input="onHttpConfigChange"
                            />
                          </n-grid-item>
                          <n-grid-item :span="1">
                            <n-button 
                              size="small" 
                              quaternary 
                              type="error" 
                              @click="removeHttpHeader(index)"
                            >
                              删除
                            </n-button>
                          </n-grid-item>
                        </n-grid>
                      </div>
                    </div>
                    <n-text v-else depth="3" style="font-size: 11px">暂无自定义请求头</n-text>
                    
                    <!-- JSON格式输入 -->
                    <n-collapse size="small">
                      <n-collapse-item title="JSON格式批量输入" name="json-headers">
                        <n-space vertical :size="4">
                          <n-input
                            v-model:value="httpHeadersJson"
                            type="textarea"
                            :rows="4"
                            placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                            size="small"
                            style="font-family: monospace; font-size: 11px"
                          />
                          <n-space :size="4">
                            <n-button size="tiny" @click="parseHeadersFromJson">解析并应用</n-button>
                            <n-button size="tiny" @click="exportHeadersToJson">导出为JSON</n-button>
                          </n-space>
                        </n-space>
                      </n-collapse-item>
                    </n-collapse>
                  </n-space>
                </n-tab-pane>

                <!-- 请求参数Tab -->
                <n-tab-pane name="params" tab="请求参数">
                  <n-space vertical :size="6">
                    <!-- URL参数 -->
                    <div>
                      <n-text strong style="font-size: 11px">URL Query参数:</n-text>
                      <n-space justify="end" style="margin-bottom: 4px">
                        <n-button size="tiny" @click="addUrlParam">添加</n-button>
                        <n-button size="tiny" @click="clearUrlParams">清空</n-button>
                      </n-space>
                      
                      <div v-if="httpConfig.params.length > 0" class="param-list">
                        <div 
                          v-for="(param, index) in httpConfig.params" 
                          :key="index" 
                          class="param-item"
                        >
                          <n-grid :cols="6" :x-gap="6" style="align-items: center">
                            <n-grid-item :span="2">
                              <n-input 
                                v-model:value="param.key" 
                                placeholder="参数名"
                                size="small"
                                @input="onHttpConfigChange"
                              />
                            </n-grid-item>
                            <n-grid-item :span="3">
                              <n-input 
                                v-model:value="param.value" 
                                placeholder="参数值"
                                size="small"
                                @input="onHttpConfigChange"
                              />
                            </n-grid-item>
                            <n-grid-item :span="1">
                              <n-button 
                                size="small" 
                                quaternary 
                                type="error" 
                                @click="removeUrlParam(index)"
                              >
                                删除
                              </n-button>
                            </n-grid-item>
                          </n-grid>
                        </div>
                      </div>
                      <n-text v-else depth="3" style="font-size: 11px">暂无URL参数</n-text>
                    </div>

                    <!-- 请求体 (POST/PUT) -->
                    <div v-if="['POST', 'PUT', 'PATCH'].includes(httpConfig.method)">
                      <n-text strong style="font-size: 11px">请求体 (Request Body):</n-text>
                      <n-radio-group v-model:value="httpConfig.bodyType" size="small" style="margin: 4px 0">
                        <n-space>
                          <n-radio value="none">无</n-radio>
                          <n-radio value="json">JSON</n-radio>
                          <n-radio value="form">表单</n-radio>
                          <n-radio value="raw">原始文本</n-radio>
                        </n-space>
                      </n-radio-group>
                      
                      <!-- JSON请求体 -->
                      <div v-if="httpConfig.bodyType === 'json'">
                        <n-input
                          v-model:value="httpConfig.bodyContent"
                          type="textarea"
                          :rows="6"
                          placeholder='{
  "key": "value",
  "data": {
    "nested": true
  }
}'
                          size="small"
                          style="font-family: monospace; font-size: 11px"
                          @input="onHttpConfigChange"
                        />
                        <n-space style="margin-top: 4px" :size="4">
                          <n-button size="tiny" @click="formatJsonBody">格式化JSON</n-button>
                          <n-button size="tiny" @click="validateJsonBody">验证格式</n-button>
                        </n-space>
                      </div>
                      
                      <!-- 表单请求体 -->
                      <div v-else-if="httpConfig.bodyType === 'form'">
                        <div class="form-data-list">
                          <div 
                            v-for="(item, index) in httpConfig.formData" 
                            :key="index" 
                            class="form-data-item"
                          >
                            <n-grid :cols="6" :x-gap="6" style="align-items: center">
                              <n-grid-item :span="2">
                                <n-input 
                                  v-model:value="item.key" 
                                  placeholder="字段名"
                                  size="small"
                                  @input="onHttpConfigChange"
                                />
                              </n-grid-item>
                              <n-grid-item :span="3">
                                <n-input 
                                  v-model:value="item.value" 
                                  placeholder="字段值"
                                  size="small"
                                  @input="onHttpConfigChange"
                                />
                              </n-grid-item>
                              <n-grid-item :span="1">
                                <n-button 
                                  size="small" 
                                  quaternary 
                                  type="error" 
                                  @click="removeFormDataItem(index)"
                                >
                                  删除
                                </n-button>
                              </n-grid-item>
                            </n-grid>
                          </div>
                        </div>
                        <n-space style="margin-top: 4px">
                          <n-button size="tiny" @click="addFormDataItem">添加字段</n-button>
                          <n-button size="tiny" @click="clearFormData">清空</n-button>
                        </n-space>
                      </div>
                      
                      <!-- 原始文本请求体 -->
                      <div v-else-if="httpConfig.bodyType === 'raw'">
                        <n-input
                          v-model:value="httpConfig.bodyContent"
                          type="textarea"
                          :rows="4"
                          placeholder="原始文本内容"
                          size="small"
                          @input="onHttpConfigChange"
                        />
                      </div>
                    </div>
                  </n-space>
                </n-tab-pane>

                <!-- 脚本配置Tab -->
                <n-tab-pane name="scripts" tab="脚本配置">
                  <n-space vertical :size="8">
                    <!-- 请求脚本 -->
                    <div>
                      <n-space justify="space-between" align="center">
                        <n-text strong style="font-size: 11px">请求前脚本 (Pre-request Script):</n-text>
                        <n-space :size="4">
                          <n-switch v-model:value="httpConfig.enablePreScript" size="small" />
                          <n-text depth="3" style="font-size: 10px">{{ httpConfig.enablePreScript ? '启用' : '禁用' }}</n-text>
                        </n-space>
                      </n-space>
                      
                      <div v-if="httpConfig.enablePreScript">
                        <n-input
                          v-model:value="httpConfig.preRequestScript"
                          type="textarea"
                          :rows="6"
                          placeholder="// 请求前执行的JavaScript脚本
// 可用变量:
//   config - HTTP配置对象 (url, method, headers, params)
//   utils - 工具函数 (时间戳、随机数等)

// 示例: 添加时间戳和随机数
config.params = config.params || [];
config.params.push({ key: 'timestamp', value: Date.now().toString() });
config.params.push({ key: 'nonce', value: Math.random().toString(36).substr(2, 9) });

// 示例: 动态设置Authorization
if (config.headers) {
  const token = localStorage.getItem('api_token');
  if (token) {
    config.headers.push({ key: 'Authorization', value: 'Bearer ' + token });
  }
}

return config; // 必须返回修改后的config"
                          size="small"
                          style="font-family: monospace; font-size: 11px"
                          @input="onHttpConfigChange"
                        />
                        <n-space style="margin-top: 4px" :size="4">
                          <n-button size="tiny" @click="testPreRequestScript">测试脚本</n-button>
                          <n-button size="tiny" @click="loadPreScriptTemplate">加载模板</n-button>
                          <n-button size="tiny" @click="clearPreRequestScript">清空</n-button>
                        </n-space>
                      </div>
                    </div>

                    <!-- 响应脚本 -->
                    <div>
                      <n-space justify="space-between" align="center">
                        <n-text strong style="font-size: 11px">响应处理脚本 (Response Script):</n-text>
                        <n-space :size="4">
                          <n-switch v-model:value="httpConfig.enableResponseScript" size="small" />
                          <n-text depth="3" style="font-size: 10px">{{ httpConfig.enableResponseScript ? '启用' : '禁用' }}</n-text>
                        </n-space>
                      </n-space>
                      
                      <div v-if="httpConfig.enableResponseScript">
                        <n-input
                          v-model:value="httpConfig.responseScript"
                          type="textarea"
                          :rows="6"
                          placeholder="// 响应后执行的JavaScript脚本
// 可用变量:
//   response - 响应对象 { data, status, headers }
//   request - 请求配置对象

// 示例: 提取特定字段
if (response.data && response.data.code === 200) {
  return response.data.result; // 返回result字段内容
}

// 示例: 转换数据格式
if (Array.isArray(response.data)) {
  return response.data.map(item => ({
    id: item.id,
    name: item.name,
    status: item.status === 1 ? 'active' : 'inactive'
  }));
}

// 示例: 错误处理
if (response.status >= 400) {
  throw new Error('HTTP ' + response.status + ': ' + response.data?.message);
}

return response.data; // 默认返回data字段"
                          size="small"
                          style="font-family: monospace; font-size: 11px"
                          @input="onHttpConfigChange"
                        />
                        <n-space style="margin-top: 4px" :size="4">
                          <n-button size="tiny" @click="testResponseScript">测试脚本</n-button>
                          <n-button size="tiny" @click="loadResponseScriptTemplate">加载模板</n-button>
                          <n-button size="tiny" @click="clearResponseScript">清空</n-button>
                        </n-space>
                      </div>
                    </div>
                  </n-space>
                </n-tab-pane>

                <!-- 高级配置Tab -->
                <n-tab-pane name="advanced" tab="高级配置">
                  <n-space vertical :size="6">
                    <n-grid :cols="2" :x-gap="12">
                      <n-grid-item>
                        <n-form-item label="请求超时" size="small" :label-width="60">
                          <n-input-number
                            v-model:value="httpConfig.timeout"
                            :min="1000"
                            :max="300000"
                            :step="1000"
                            size="small"
                            @update:value="onHttpConfigChange"
                          >
                            <template #suffix>ms</template>
                          </n-input-number>
                        </n-form-item>
                      </n-grid-item>
                      <n-grid-item>
                        <n-form-item label="重试次数" size="small" :label-width="60">
                          <n-input-number
                            v-model:value="httpConfig.retries"
                            :min="0"
                            :max="5"
                            size="small"
                            @update:value="onHttpConfigChange"
                          />
                        </n-form-item>
                      </n-grid-item>
                    </n-grid>

                    <n-space vertical :size="4">
                      <n-checkbox v-model:checked="httpConfig.followRedirects" @update:checked="onHttpConfigChange">
                        跟随重定向
                      </n-checkbox>
                      <n-checkbox v-model:checked="httpConfig.validateSSL" @update:checked="onHttpConfigChange">
                        验证SSL证书
                      </n-checkbox>
                      <n-checkbox v-model:checked="httpConfig.enableCookies" @update:checked="onHttpConfigChange">
                        启用Cookie管理
                      </n-checkbox>
                    </n-space>

                    <!-- 代理配置 -->
                    <n-collapse size="small">
                      <n-collapse-item title="代理配置" name="proxy">
                        <n-checkbox v-model:checked="httpConfig.enableProxy" @update:checked="onHttpConfigChange">
                          启用代理
                        </n-checkbox>
                        <div v-if="httpConfig.enableProxy" style="margin-top: 8px">
                          <n-grid :cols="2" :x-gap="8">
                            <n-grid-item>
                              <n-form-item label="代理地址" size="small" :label-width="60">
                                <n-input
                                  v-model:value="httpConfig.proxyHost"
                                  placeholder="127.0.0.1"
                                  size="small"
                                  @input="onHttpConfigChange"
                                />
                              </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                              <n-form-item label="代理端口" size="small" :label-width="60">
                                <n-input-number
                                  v-model:value="httpConfig.proxyPort"
                                  :min="1"
                                  :max="65535"
                                  size="small"
                                  @update:value="onHttpConfigChange"
                                />
                              </n-form-item>
                            </n-grid-item>
                          </n-grid>
                        </div>
                      </n-collapse-item>
                    </n-collapse>
                  </n-space>
                </n-tab-pane>
              </n-tabs>
            </div>

            <!-- WebSocket数据输入 -->
            <div v-else-if="newRawDataType === 'websocket'">
              <n-space vertical :size="3">
                <n-form-item label="WebSocket URL" size="small" :label-width="80" style="margin-bottom: 2px">
                  <n-input
                    v-model:value="newRawDataWebsocketUrl"
                    placeholder="ws://localhost:8080/ws"
                    clearable
                    size="small"
                    @input="updatePreviewData"
                  />
                </n-form-item>
                <n-form-item label="协议" size="small" :label-width="80" style="margin-bottom: 0">
                  <n-input
                    v-model:value="newRawDataWebsocketProtocols"
                    placeholder="protocol1,protocol2"
                    clearable
                    size="small"
                    @input="updatePreviewData"
                  />
                </n-form-item>
              </n-space>
            </div>
          </n-card>

          <!-- 数据展示区域 -->
          <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
            <template #header>
              <n-text depth="2" style="font-size: 11px">原始数据预览</n-text>
            </template>
            <n-code
              :code="previewOriginalData"
              language="json"
              style="max-height: 220px; overflow-y: auto; font-size: 10px"
              :show-line-numbers="false"
            />
          </n-card>
        </n-space>
      </n-grid-item>

      <!-- 右侧：数据处理区域 -->
      <n-grid-item>
        <n-space vertical :size="4">
          <n-text strong style="font-size: 13px; color: var(--success-color)">⚙️ 数据处理</n-text>

          <!-- 处理配置区域 -->
          <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
            <template #header>
              <n-text depth="2" style="font-size: 11px">处理配置</n-text>
            </template>

            <n-space vertical :size="3">
              <!-- 过滤路径 -->
              <n-form-item label="过滤路径" size="small" :label-width="60" style="margin-bottom: 2px">
                <n-input
                  v-model:value="currentFilterPath"
                  placeholder="$.data.list"
                  clearable
                  size="small"
                  @input="updatePreviewData"
                />
              </n-form-item>

              <!-- 处理脚本 -->
              <n-form-item size="small" :label-width="60" style="margin-bottom: 0">
                <template #label>
                  <n-space :size="2" align="center">
                    <span style="font-size: 11px">处理脚本</span>
                    <n-tooltip placement="top" trigger="hover">
                      <template #trigger>
                        <n-icon size="10" style="color: var(--info-color); cursor: help">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                            <path
                              d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M12 17h.01"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </n-icon>
                      </template>
                      <div style="max-width: 260px">
                        <div style="font-weight: 600; margin-bottom: 4px; font-size: 11px">📝 脚本编写指南</div>
                        <div style="font-size: 10px; line-height: 1.2">
                          <p style="margin: 2px 0">
                            <strong>可用变量：</strong>
                            <br />
                            • data - 输入数据
                          </p>
                          <p style="margin: 2px 0">
                            <strong>常用操作：</strong>
                            <br />
                            • 修改字段：data.newField = data.oldField
                            <br />
                            • 删除字段：delete data.fieldName
                            <br />
                            • 返回结果：return data
                          </p>
                          <p style="margin: 2px 0">
                            <strong>注意：</strong>
                            使用 var 定义变量
                          </p>
                        </div>
                      </div>
                    </n-tooltip>
                  </n-space>
                </template>
                <div class="text-editor-container">
                  <!-- JavaScript 编辑器工具栏 -->
                  <div class="editor-toolbar">
                    <n-space :size="6" align="center">
                      <n-button size="tiny" tertiary @click="formatJavaScriptCode">
                        <template #icon>
                          <n-icon size="12">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M9.5 15.5L4.5 10.5L9.5 5.5L8.09 4.09L1.5 10.68L8.09 17.27L9.5 15.5Z"
                                fill="currentColor"
                              />
                              <path
                                d="M14.5 8.5L19.5 13.5L14.5 18.5L15.91 19.91L22.5 13.32L15.91 6.73L14.5 8.5Z"
                                fill="currentColor"
                              />
                            </svg>
                          </n-icon>
                        </template>
                        格式化
                      </n-button>
                      <n-button size="tiny" tertiary @click="insertScriptTemplate">
                        <template #icon>
                          <n-icon size="12">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
                            </svg>
                          </n-icon>
                        </template>
                        模板
                      </n-button>
                      <n-button size="tiny" tertiary @click="validateJavaScriptCode">
                        <template #icon>
                          <n-icon size="12">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                                stroke="currentColor"
                                stroke-width="2"
                                fill="none"
                              />
                            </svg>
                          </n-icon>
                        </template>
                        检查
                      </n-button>
                      <n-dropdown :options="scriptTemplateOptions" @select="handleTemplateSelect">
                        <n-button size="tiny" tertiary>
                          <template #icon>
                            <n-icon size="12">
                              <svg viewBox="0 0 24 24" fill="none">
                                <path d="M7 10l5 5 5-5z" fill="currentColor" />
                              </svg>
                            </n-icon>
                          </template>
                          代码片段
                        </n-button>
                      </n-dropdown>
                    </n-space>
                  </div>
                  <n-input
                    v-model:value="currentProcessScript"
                    type="textarea"
                    placeholder="请输入JavaScript代码"
                    :rows="8"
                    style="font-family: 'Courier New', monospace; font-size: 12px;"
                    @input="handleJsChange"
                  />
                </div>
              </n-form-item>
            </n-space>
          </n-card>

          <!-- 处理结果区域 -->
          <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
            <template #header>
              <n-space justify="space-between" align="center" style="margin: 0">
                <n-text depth="2" style="font-size: 11px">处理结果</n-text>
                <n-tag :type="previewStatus.type" size="small" style="font-size: 10px">
                  {{ previewStatus.text }}
                </n-tag>
              </n-space>
            </template>

            <n-space vertical :size="2">
              <n-code
                :code="previewProcessedData"
                language="json"
                style="max-height: 250px; overflow-y: auto; font-size: 10px"
                :show-line-numbers="false"
              />

              <!-- 处理状态消息 -->
              <div v-if="previewStatus.message" style="margin-top: 2px">
                <n-text depth="3" style="font-size: 10px">
                  {{ previewStatus.message }}
                </n-text>
              </div>
            </n-space>
          </n-card>
        </n-space>
      </n-grid-item>
    </n-grid>

    <template #action>
      <n-space :size="12" justify="end">
        <n-button size="medium" @click="cancelEdit">取消</n-button>
        <n-button
          size="medium"
          type="primary"
          @click="handleConfirmClick"
        >
          {{ isEditMode ? '保存修改' : '确认添加' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <!-- 查看最终数据弹窗 -->
  <n-modal v-model:show="showFinalDataModal" preset="dialog" title="当前数据源最终数据" style="width: 600px">
    <n-space vertical :size="12">
      <n-text>数据源 "{{ currentDataSourceKey }}" 的当前最终数据：</n-text>
      <n-code
        :code="currentFinalData"
        language="json"
        :show-line-numbers="true"
        style="max-height: 400px; overflow-y: auto"
      />
    </n-space>
    <template #action>
      <n-button @click="showFinalDataModal = false">关闭</n-button>
    </template>
  </n-modal>

  <!-- 查看原始数据详情弹窗 -->
  <n-modal v-model:show="showRawDataDetailModal" preset="dialog" title="原始数据详情" style="width: 600px">
    <n-space vertical :size="12">
      <n-text>数据项 "{{ currentRawDataName }}" 的详细内容：</n-text>
      <n-code
        :code="currentRawDataDetail"
        language="json"
        :show-line-numbers="true"
        style="max-height: 400px; overflow-y: auto"
      />
    </n-space>
    <template #action>
      <n-button @click="showRawDataDetailModal = false">关闭</n-button>
    </template>
  </n-modal>

  <!-- 🆕 系统 API 列表弹窗 -->
  <n-modal v-model:show="showApiListModal" preset="dialog" title="系统 API 列表" style="width: 800px">
    <n-space vertical :size="12">
      <n-text depth="2">选择一个系统 API 作为 HTTP 数据源：</n-text>
      
      <div class="api-list">
        <div 
          v-for="apiItem in systemApiOptions" 
          :key="apiItem.path" 
          class="api-item"
          @click="selectSystemApiFromList(apiItem)"
        >
          <n-card 
            size="small" 
            hoverable 
            style="cursor: pointer; margin-bottom: 8px"
          >
            <n-space justify="space-between" align="center">
              <div>
                <n-space align="center" :size="8">
                  <n-tag :type="apiItem.method === 'GET' ? 'info' : 'success'" size="small">
                    {{ apiItem.method }}
                  </n-tag>
                  <n-text strong>{{ apiItem.name }}</n-text>
                </n-space>
                <div style="margin-top: 4px">
                  <n-text depth="3" style="font-size: 12px">{{ apiItem.path }}</n-text>
                  <br>
                  <n-text depth="2" style="font-size: 11px">{{ apiItem.description }}</n-text>
                  <div v-if="apiItem.params && apiItem.params.length > 0" style="margin-top: 2px">
                    <n-text depth="3" style="font-size: 10px">
                      预制参数: {{ apiItem.params.map(p => `${p.key}=${p.value}`).join(', ') }}
                    </n-text>
                  </div>
                </div>
              </div>
              <n-button size="small" type="primary">选择</n-button>
            </n-space>
          </n-card>
        </div>
      </div>
      
      <n-alert type="info" style="font-size: 11px">
        <template #header>提示</template>
        选择 API 后会自动填入 URL 和请求方法，您可以根据需要进一步修改请求参数、请求头等配置。
      </n-alert>
    </n-space>
    <template #action>
      <n-button @click="showApiListModal = false">关闭</n-button>
    </template>
  </n-modal>

  <!-- 🆕 导入配置弹窗 -->
  <n-modal
    v-model:show="showImportModal"
    preset="dialog"
    title="导入数据源配置"
    style="width: 800px"
  >
    <n-space vertical :size="16">
      <n-alert type="info">
        <template #header>导入说明</template>
        请粘贴之前导出的数据源配置JSON，系统将自动恢复所有配置项包括原始数据、处理脚本等。
      </n-alert>
      
      <n-form-item label="配置内容">
        <n-input
          v-model:value="importConfigContent"
          type="textarea"
          :rows="12"
          placeholder='请粘贴导出的配置JSON，格式如：
{
  "dataSourceKey": "example",
  "configuration": { ... },
  "exportTime": "2024-01-01T00:00:00.000Z"
}'
          style="font-family: monospace; font-size: 12px"
        />
      </n-form-item>
      
      <div v-if="importPreview" style="margin-top: 8px">
        <n-text depth="2" style="font-size: 12px">配置预览:</n-text>
        <n-card size="small" style="margin-top: 4px; background: var(--code-color)">
          <pre style="margin: 0; font-size: 11px; color: var(--text-color-2)">{{ importPreview }}</pre>
        </n-card>
      </div>
    </n-space>
    
    <template #action>
      <n-space>
        <n-button @click="cancelImport">取消</n-button>
        <n-button type="primary" :disabled="!importConfigContent.trim()" @click="confirmImport">
          确认导入
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
/**
 * 数据源配置表单 - 极简重写版本
 * 目标：实现基础数据流闭环
 */

import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue'
import {
  NCollapse,
  NCollapseItem,
  NSpace,
  NText,
  NCode,
  NButton,
  NTooltip,
  NIcon,
  NModal,
  NCard,
  NInput,
  NList,
  NListItem,
  NThing,
  NTime,
  NFormItem,
  NAlert,
  NTag,
  NGrid,
  NGridItem,
  NTabs,
  NTabPane,
  NSelect,
  NInputNumber,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NSwitch
} from 'naive-ui'
import { InformationCircleOutline } from '@vicons/ionicons5'
import { configurationManager } from '@/components/visual-editor/configuration/ConfigurationManager'

// 🔥 使用 Monaco Editor

// 🔥 新增：导入脚本引擎
import { defaultScriptEngine } from '@/core/script-engine'
import { request } from '@/service/request'

// 🆕 核心数据处理函数
/**
 * 处理最终数据 - 将多个处理后的数据项合并为最终数据
 * @param processedDataList 已处理的原始数据项列表
 * @param processingType 处理类型
 * @param customScript 自定义脚本内容
 * @returns 最终数据
 */
async function processFinalData(
  processedDataList: any[], 
  processingType: FinalProcessingType, 
  customScript?: string,
  selectedIndex?: number
): Promise<any> {
  console.log(`🔧 [ProcessFinalData] 开始处理最终数据:`, {
    processingType,
    dataCount: processedDataList.length,
    hasCustomScript: !!customScript
  })

  // 如果没有数据，返回null
  if (!processedDataList || processedDataList.length === 0) {
    console.log('⚠️ [ProcessFinalData] 没有数据需要处理')
    return null
  }

  try {
    switch (processingType) {
      case 'merge-object':
        // 对象合并：使用Object.assign合并多个对象
        console.log('🔧 [ProcessFinalData] 执行对象合并')
        const mergedObject = Object.assign({}, ...processedDataList.filter(item => 
          item && typeof item === 'object' && !Array.isArray(item)
        ))
        console.log('✅ [ProcessFinalData] 对象合并完成:', mergedObject)
        return mergedObject

      case 'concat-array':
        // 数组连接：将多个数组连接成一个数组
        console.log('🔧 [ProcessFinalData] 执行数组连接')
        const flattenedArray = processedDataList.flat()
        console.log('✅ [ProcessFinalData] 数组连接完成:', flattenedArray)
        return flattenedArray

      case 'custom-script':
        // 自定义脚本：用户完全控制处理逻辑
        console.log('🔧 [ProcessFinalData] 执行自定义脚本')
        if (!customScript) {
          console.warn('⚠️ [ProcessFinalData] 自定义脚本为空，返回原始数据列表')
          return processedDataList
        }
        
        try {
          // 使用脚本引擎安全执行用户脚本
          const result = await defaultScriptEngine.execute(customScript, { 
            processedDataList: [...processedDataList] // 传入数据的副本
          })
          
          if (result.success) {
            console.log('✅ [ProcessFinalData] 自定义脚本执行成功:', result.data)
            return result.data
          } else {
            console.error('❌ [ProcessFinalData] 自定义脚本执行失败:', result.error)
            throw new Error(`脚本执行失败: ${result.error}`)
          }
        } catch (scriptError) {
          console.error('❌ [ProcessFinalData] 脚本执行异常:', scriptError)
          throw new Error(`脚本执行异常: ${scriptError.message}`)
        }

      case 'select-specific':
        // 选择特定数据项
        console.log('🔧 [ProcessFinalData] 选择特定数据项:', { selectedIndex, totalItems: processedDataList.length })
        
        let targetIndex = selectedIndex ?? 0 // 默认选择第一项
        
        // 确保索引在有效范围内
        if (targetIndex < 0 || targetIndex >= processedDataList.length) {
          console.warn(`⚠️ [ProcessFinalData] 索引超出范围，使用默认索引0: ${targetIndex}`)
          targetIndex = 0
        }
        
        const selectedData = processedDataList[targetIndex] || null
        console.log(`✅ [ProcessFinalData] 数据项选择完成: index=${targetIndex}`, selectedData)
        return selectedData

      default:
        console.warn(`⚠️ [ProcessFinalData] 未知的处理类型: ${processingType}，返回原始数据列表`)
        return processedDataList
    }
  } catch (error) {
    console.error('❌ [ProcessFinalData] 数据处理失败:', error)
    throw error
  }
}

interface DataSource {
  key: string
  name?: string
  description?: string
  fieldMappings?: Record<string, any>
  fieldsToMap?: Array<{ key: string; targetProperty: string }>
}

interface Props {
  selectedWidgetId?: string // 修改为匹配 ConfigurationPanel 传递的属性名
  dataSources: DataSource[]
}

interface Emits {
  (e: 'update', config: any): void
  (e: 'request-current-data', widgetId: string): void // 🔥 新增：请求当前数据
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 🔥 新增：原始数据项类型枚举
type RawDataItemType = 'json' | 'http' | 'websocket'

// 🔥 新增：原始数据项接口（增加类型字段）
// 🔥 修复：使用与执行器一致的RawDataItem类型定义
interface RawDataItem {
  id: string
  name: string
  type: RawDataItemType // 数据项类型
  data: any
  config?: {
    // 🆕 关键字段：数据过滤和处理配置
    filterPath?: string      // 数据过滤路径（JSONPath格式）
    processScript?: string   // 数据处理脚本
    // 根据类型存储不同的配置
    jsonData?: string // json类型的数据
    httpConfig?: {
      // http类型的配置
      url: string
      method: string
      headers?: Record<string, string>
    }
    websocketConfig?: {
      // websocket类型的配置
      url: string
      protocols?: string[]
    }
    // 支持扩展字段
    [key: string]: any
  }
  createdAt: string
  isActive: boolean
}

// 🔥 数据源最终处理类型
type FinalProcessingType = 
  | 'merge-object'      // 对象合并（多个对象合并成一个大对象）
  | 'concat-array'      // 数组连接（多个数组连接起来）
  | 'custom-script'     // 自定义脚本（完全自定义处理逻辑）
  | 'select-specific'   // 选择特定数据项（预留，后续实现条件使用等）

// 🔥 修改：数据结构接口 - 原始数据项完全独立，新增最终处理配置
interface DataSourceValue {
  currentData: any // 最终数据（完全独立）
  rawDataList: RawDataItem[] // 原始数据列表（完全独立，不影响最终数据）
  // 🆕 最终处理配置
  finalProcessingType: FinalProcessingType // 最终处理类型
  finalProcessingScript?: string // 自定义脚本内容
  finalProcessingConfig?: any // 其他处理配置（预留）
  // 🆕 选择特定数据项配置
  selectedDataItemIndex?: number // 选中的数据项索引
}

// 数据存储 - 🔥 修改：支持原始数据列表
const dataValues = reactive<Record<string, DataSourceValue>>({})

// 🔥 弹窗状态管理
const showAddRawDataModal = ref(false)
const currentDataSourceKey = ref('')
const newRawDataName = ref('')

// 🆕 导入/导出配置相关状态
const showImportModal = ref(false)
const importConfigContent = ref('')
const importPreview = computed(() => {
  if (!importConfigContent.value.trim()) return ''
  
  try {
    const config = JSON.parse(importConfigContent.value)
    return `数据源: ${config.dataSourceKey || '未知'}\n配置项: ${Object.keys(config.configuration || {}).length} 个\n导出时间: ${config.exportTime || '未知'}`
  } catch (error) {
    return '配置格式错误，请检查JSON格式'
  }
})

// 🔥 新增：数据项类型选择相关状态
const newRawDataType = ref<RawDataItemType>('json')
const newRawDataJsonContent = ref('')
const newRawDataHttpUrl = ref('')
const newRawDataHttpMethod = ref('GET')
const newRawDataHttpHeaders = ref('')
const newRawDataWebsocketUrl = ref('')
const newRawDataWebsocketProtocols = ref('')

// 🆕 HTTP数据源配置 - 完整配置结构
const httpConfig = reactive({
  // 基础配置
  method: 'GET',
  url: '',
  
  // 请求头
  headers: [] as Array<{ key: string; value: string }>,
  
  // URL参数
  params: [] as Array<{ key: string; value: string }>,
  
  // 请求体
  bodyType: 'none' as 'none' | 'json' | 'form' | 'raw',
  bodyContent: '',
  formData: [] as Array<{ key: string; value: string }>,
  
  // 脚本配置
  enablePreScript: false,
  preRequestScript: '',
  enableResponseScript: false,
  responseScript: '',
  
  // 高级配置
  timeout: 10000,
  retries: 0,
  followRedirects: true,
  validateSSL: true,
  enableCookies: false,
  
  // 代理配置
  enableProxy: false,
  proxyHost: '',
  proxyPort: 8080
})

// HTTP相关状态
const httpTesting = ref(false)
const httpTestResult = reactive({
  status: false,
  success: false,
  message: '',
  responseTime: 0
})
const httpHeadersJson = ref('')
const showApiListModal = ref(false)

// HTTP方法选项
const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' }
]

// 系统预制API选项 - 后续可扩展为JSON配置文件
// 未来JSON格式参考:
// {
//   "apis": [
//     {
//       "name": "设备列表",
//       "path": "/device/list",
//       "method": "GET",
//       "description": "获取所有设备列表",
//       "params": [],
//       "headers": [],
//       "category": "device"
//     }
//   ]
// }
const systemApiOptions = [
  { 
    name: '设备列表', 
    path: '/device', 
    method: 'GET', 
    description: '获取设备列表（分页）',
    params: [
      { key: 'page', value: '1', description: '页码' },
      { key: 'page_size', value: '10', description: '每页数量' }
    ]
  },
  { 
    name: '租户设备列表', 
    path: '/device/tenant/list', 
    method: 'GET', 
    description: '获取当前租户的设备列表',
    params: [
      { key: 'group_id', value: null, description: '设备分组ID（可选）' },
      { key: 'device_name', value: null, description: '设备名称（可选）' },
      { key: 'bind_config', value: '0', description: '绑定配置状态' }
    ]
  },
  { 
    name: '设备分组', 
    path: '/device/group', 
    method: 'GET', 
    description: '获取设备分组信息',
    params: [
      { key: 'page', value: '1', description: '页码' },
      { key: 'page_size', value: '10', description: '每页数量' },
      { key: 'parent_id', value: '0', description: '父级分组ID' }
    ]
  },
  { 
    name: '告警历史', 
    path: '/alarm/info/history', 
    method: 'GET', 
    description: '获取告警历史信息',
    params: [
      { key: 'page', value: '1', description: '页码' },
      { key: 'page_size', value: '20', description: '每页数量' }
    ]
  }
]

// 🔥 新增：查看最终数据相关状态
const showFinalDataModal = ref(false)
const currentFinalData = ref('')

// 🔥 新增：查看原始数据详情相关状态
const showRawDataDetailModal = ref(false)
const currentRawDataDetail = ref('')
const currentRawDataName = ref('')

// 🆕 最终处理状态和错误处理
const finalProcessingStatus = reactive<Record<string, {
  loading: boolean
  error?: string
  lastUpdateTime?: Date
}>>({})

// 🆕 脚本验证状态
const scriptValidationStatus = reactive<Record<string, {
  isValid: boolean
  error?: string
}>>({})

// 🆕 处理预览状态
const processingPreviewStatus = reactive<Record<string, {
  loading: boolean
  error?: string
  dataCount: number
}>>({})

/**
 * 获取或初始化数据源状态
 */
const getOrInitStatus = <T>(statusMap: Record<string, T>, key: string, defaultValue: T): T => {
  if (!statusMap[key]) {
    statusMap[key] = { ...defaultValue }
  }
  return statusMap[key]
}

// 🔥 简化：直接的状态管理
const currentFilterPath = ref('')
const currentProcessScript = ref('')

// 🔥 新增：编辑模式状态管理
const isEditMode = ref(false)
const editingDataSourceKey = ref('')
const editingRawDataId = ref('')

// 🔥 新增：数据预览状态
const previewOriginalData = ref('{}')
const previewProcessedData = ref('{}')
const previewStatus = ref({ type: 'default', text: '等待处理', message: '' })

const jsonValidationStatus = ref({ type: 'default', text: '未验证', detail: '请输入JSON数据进行验证' })


// 脚本模板选项
const scriptTemplateOptions = [
  {
    label: '数组过滤',
    key: 'array-filter',
    value: `// 过滤数组数据
if (Array.isArray(data)) {
  return data.filter(item => {
    // 在这里添加过滤条件
    return item.status === 'active';
  });
}
return data;`
  },
  {
    label: '数据映射',
    key: 'data-map',
    value: `// 映射数据结构
return {
  id: data.id,
  name: data.name,
  status: data.status,
  timestamp: new Date().toISOString()
};`
  },
  {
    label: '数据聚合',
    key: 'data-aggregate',
    value: `// 聚合数据
if (Array.isArray(data)) {
  return {
    total: data.length,
    active: data.filter(item => item.status === 'active').length,
    inactive: data.filter(item => item.status === 'inactive').length
  };
}
return data;`
  },
  {
    label: '数据转换',
    key: 'data-transform',
    value: `// 转换数据格式
var result = {};
if (data && typeof data === 'object') {
  Object.keys(data).forEach(key => {
    result[key.toLowerCase()] = data[key];
  });
}
return result;`
  }
]

// 🔥 Monaco Editor 功能函数

/**
 * JSON编辑器功能
 */
const formatJsonData = () => {
  try {
    if (!newRawDataJsonContent.value.trim()) return
    const parsed = JSON.parse(newRawDataJsonContent.value)
    newRawDataJsonContent.value = JSON.stringify(parsed, null, 2)
  } catch (error) {
    window.$message?.error('JSON格式错误，无法格式化')
  }
}

const validateJsonData = () => {
  try {
    if (!newRawDataJsonContent.value.trim()) {
      jsonValidationStatus.value = { type: 'warning', text: '空数据', detail: '请输入JSON数据' }
      return
    }

    const parsed = JSON.parse(newRawDataJsonContent.value)
    jsonValidationStatus.value = {
      type: 'success',
      text: 'JSON有效',
      detail: `解析成功，包含 ${Object.keys(parsed).length} 个顶级属性`
    }
  } catch (error) {
    jsonValidationStatus.value = {
      type: 'error',
      text: 'JSON无效',
      detail: `错误：${error.message}`
    }
  }
}

const compressJsonData = () => {
  try {
    if (!newRawDataJsonContent.value.trim()) return
    const parsed = JSON.parse(newRawDataJsonContent.value)
    newRawDataJsonContent.value = JSON.stringify(parsed)
  } catch (error) {
    console.warn('无法压缩JSON:', error)
  }
}

/**
 * JavaScript编辑器功能
 */
const formatJavaScriptCode = () => {
  // 简单的JavaScript格式化（基础缩进）
  const code = currentProcessScript.value
  if (!code.trim()) return
  
  // 简单的格式化逻辑
  let formatted = code
    .replace(/\{/g, '{\n  ')
    .replace(/\}/g, '\n}')
    .replace(/;/g, ';\n')
    .replace(/\n\s*\n/g, '\n') // 移除多余空行
  
  currentProcessScript.value = formatted
}

const insertScriptTemplate = () => {
  if (!currentProcessScript.value.trim()) {
    currentProcessScript.value = `// 数据处理脚本
// 可用变量: data (输入数据)
// 必须返回: 处理后的数据

var result = data;

// 在这里添加你的处理逻辑
// 例如：
// if (Array.isArray(data)) {
//   result = data.filter(item => item.active);
// }

return result;`
  }
}

const validateJavaScriptCode = () => {
  try {
    // 简单的语法检查
    new Function('data', currentProcessScript.value)
    window.$message?.success('JavaScript语法检查通过')
  } catch (error) {
    window.$message?.error(`JavaScript语法错误: ${error.message}`)
  }
}

const handleTemplateSelect = (key: string) => {
  const template = scriptTemplateOptions.find(t => t.key === key)
  if (template) {
    currentProcessScript.value = template.value
    updatePreviewData()
  }
}

/**
 * 编辑器事件处理
 */

const handleJsonChange = () => {
  // 自动验证JSON
  validateJsonData()
  updatePreviewData()
}

const handleJsChange = () => {
  updatePreviewData()
}

// 🆕 HTTP数据源功能函数

/**
 * HTTP配置变化处理
 */
const onHttpConfigChange = () => {
  console.log('🔧 [HTTP] 配置变化:', httpConfig)
  updatePreviewData()
}

/**
 * 选择系统 API
 */
const selectSystemApi = (apiItem: typeof systemApiOptions[0]) => {
  httpConfig.method = apiItem.method
  httpConfig.url = apiItem.path
  
  // 清空现有参数，然后添加预制参数（跳过null值）
  httpConfig.params = []
  if (apiItem.params && apiItem.params.length > 0) {
    httpConfig.params = apiItem.params
      .filter(p => p.value !== null) // 过滤掉null值的参数
      .map(p => ({ key: p.key, value: String(p.value) }))
  }
  
  console.log('📡 [HTTP] 选择系统 API:', apiItem.name, '参数:', apiItem.params)
  onHttpConfigChange()
}

/**
 * 从 API 列表中选择 API
 */
const selectSystemApiFromList = (apiItem: typeof systemApiOptions[0]) => {
  selectSystemApi(apiItem)
  showApiListModal.value = false
  window.$message?.success(`已选择 API: ${apiItem.name}`)
}

/**
 * 添加 HTTP 请求头
 */
const addHttpHeader = () => {
  httpConfig.headers.push({ key: '', value: '' })
}

/**
 * 移除 HTTP 请求头
 */
const removeHttpHeader = (index: number) => {
  httpConfig.headers.splice(index, 1)
  onHttpConfigChange()
}

/**
 * 加载默认请求头
 */
const loadDefaultHeaders = () => {
  const defaultHeaders = [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Accept', value: 'application/json' },
    { key: 'User-Agent', value: 'ThingsPanel-DataSource/1.0' }
  ]
  httpConfig.headers.push(...defaultHeaders)
  onHttpConfigChange()
}

/**
 * 清空 HTTP 请求头
 */
const clearHttpHeaders = () => {
  httpConfig.headers = []
  onHttpConfigChange()
}

/**
 * 从 JSON 解析请求头
 */
const parseHeadersFromJson = () => {
  try {
    if (!httpHeadersJson.value.trim()) return
    const parsed = JSON.parse(httpHeadersJson.value)
    httpConfig.headers = Object.entries(parsed).map(([key, value]) => ({
      key,
      value: String(value)
    }))
    onHttpConfigChange()
    window.$message?.success('请求头解析成功')
  } catch (error) {
    window.$message?.error('JSON 格式错误，无法解析')
  }
}

/**
 * 导出请求头为 JSON
 */
const exportHeadersToJson = () => {
  const headersObj: Record<string, string> = {}
  httpConfig.headers.forEach(header => {
    if (header.key && header.value) {
      headersObj[header.key] = header.value
    }
  })
  httpHeadersJson.value = JSON.stringify(headersObj, null, 2)
}

/**
 * 添加 URL 参数
 */
const addUrlParam = () => {
  httpConfig.params.push({ key: '', value: '' })
}

/**
 * 移除 URL 参数
 */
const removeUrlParam = (index: number) => {
  httpConfig.params.splice(index, 1)
  onHttpConfigChange()
}

/**
 * 清空 URL 参数
 */
const clearUrlParams = () => {
  httpConfig.params = []
  onHttpConfigChange()
}

/**
 * 添加表单数据项
 */
const addFormDataItem = () => {
  httpConfig.formData.push({ key: '', value: '' })
}

/**
 * 移除表单数据项
 */
const removeFormDataItem = (index: number) => {
  httpConfig.formData.splice(index, 1)
  onHttpConfigChange()
}

/**
 * 清空表单数据
 */
const clearFormData = () => {
  httpConfig.formData = []
  onHttpConfigChange()
}

/**
 * 格式化 JSON 请求体
 */
const formatJsonBody = () => {
  try {
    if (!httpConfig.bodyContent.trim()) return
    const parsed = JSON.parse(httpConfig.bodyContent)
    httpConfig.bodyContent = JSON.stringify(parsed, null, 2)
    onHttpConfigChange()
  } catch (error) {
    window.$message?.error('JSON 格式错误，无法格式化')
  }
}

/**
 * 验证 JSON 请求体
 */
const validateJsonBody = () => {
  try {
    if (!httpConfig.bodyContent.trim()) {
      window.$message?.warning('请求体为空')
      return
    }
    JSON.parse(httpConfig.bodyContent)
    window.$message?.success('JSON 格式验证通过')
  } catch (error) {
    window.$message?.error('JSON 格式错误')
  }
}

/**
 * 测试请求脚本
 */
const testPreRequestScript = () => {
  console.log('📝 [HTTP] 测试请求脚本:', httpConfig.preRequestScript)
  // TODO: 实现请求脚本测试逻辑
  window.$message?.info('请求脚本测试功能待实现')
}

/**
 * 加载请求脚本模板
 */
const loadPreScriptTemplate = () => {
  httpConfig.preRequestScript = `// 请求前执行的JavaScript脚本
// 可用变量: config - HTTP配置对象

// 示例：添加时间戳
config.params = config.params || []
config.params.push({ key: 'timestamp', value: Date.now().toString() })

// 示例：动态设置认证头
const token = localStorage.getItem('token')
if (token) {
  config.headers = config.headers || []
  config.headers.push({ key: 'Authorization', value: 'Bearer ' + token })
}

return config`
  onHttpConfigChange()
}

/**
 * 清空请求脚本
 */
const clearPreRequestScript = () => {
  httpConfig.preRequestScript = ''
  onHttpConfigChange()
}

/**
 * 测试响应脚本
 */
const testResponseScript = () => {
  console.log('📝 [HTTP] 测试响应脚本:', httpConfig.responseScript)
  // TODO: 实现响应脚本测试逻辑
  window.$message?.info('响应脚本测试功能待实现')
}

/**
 * 加载响应脚本模板
 */
const loadResponseScriptTemplate = () => {
  httpConfig.responseScript = `// 响应后执行的JavaScript脚本
// 可用变量: response - 响应对象 { data, status, headers }

// 示例：提取特定字段
if (response.data && response.data.code === 200) {
  return response.data.result
}

// 示例：数据转换
if (Array.isArray(response.data)) {
  return response.data.map(item => ({
    id: item.id,
    name: item.name,
    status: item.status === 1 ? 'active' : 'inactive'
  }))
}

return response.data`
  onHttpConfigChange()
}

/**
 * 清空响应脚本
 */
const clearResponseScript = () => {
  httpConfig.responseScript = ''
  onHttpConfigChange()
}

/**
 * 🆕 HTTP请求自动执行功能 - 用于配置完成后自动获取数据
 */
const executeHttpRequest = async (httpConfig: any): Promise<any> => {
  console.log('🚀 [HTTP-Execute] 开始执行HTTP请求:', httpConfig)

  if (!httpConfig.url) {
    throw new Error('请求 URL 不能为空')
  }

  try {
    // 1. 🔥 修复：直接使用原始URL，让项目request服务处理代理配置
    const requestUrl = httpConfig.url.trim()
    console.log('🔗 [HTTP-Execute] 使用URL:', requestUrl, '(让request服务处理代理)')

    // 2. 构建请求配置
    let requestConfig: any = {
      method: httpConfig.method || 'GET',
      url: requestUrl,
      timeout: httpConfig.timeout || 10000,
      headers: {},
      params: {},
      data: undefined
    }

    // 3. 处理请求头
    if (httpConfig.headers && Array.isArray(httpConfig.headers)) {
      httpConfig.headers.forEach((header: any) => {
        if (header.key && header.value) {
          requestConfig.headers[header.key] = header.value
        }
      })
    }

    // 4. 处理URL参数
    if (httpConfig.params && Array.isArray(httpConfig.params)) {
      httpConfig.params.forEach((param: any) => {
        if (param.key && param.value) {
          requestConfig.params[param.key] = param.value
        }
      })
    }

    // 5. 处理请求体
    if (['POST', 'PUT', 'PATCH'].includes(httpConfig.method) && httpConfig.bodyType !== 'none') {
      if (httpConfig.bodyType === 'json' && httpConfig.bodyContent) {
        try {
          requestConfig.data = JSON.parse(httpConfig.bodyContent)
        } catch (error) {
          throw new Error('JSON 请求体格式错误')
        }
      } else if (httpConfig.bodyType === 'form' && httpConfig.formData) {
        const formData: Record<string, string> = {}
        httpConfig.formData.forEach((item: any) => {
          if (item.key && item.value) {
            formData[item.key] = item.value
          }
        })
        requestConfig.data = formData
      } else if (httpConfig.bodyType === 'raw') {
        requestConfig.data = httpConfig.bodyContent
      }
    }

    // 6. 执行请求前脚本
    if (httpConfig.enablePreScript && httpConfig.preRequestScript) {
      try {
        const scriptFunction = new Function('config', 'utils', httpConfig.preRequestScript + '\nreturn config')
        const utils = {
          timestamp: () => Date.now(),
          randomString: (length = 8) => Math.random().toString(36).substr(2, length),
          uuid: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
        requestConfig = scriptFunction(requestConfig, utils)
        console.log('📝 [HTTP-Execute] 请求前脚本执行成功:', requestConfig)
      } catch (error) {
        console.error('🚫 [HTTP-Execute] 请求前脚本错误:', error)
        throw new Error('请求前脚本执行失败: ' + (error instanceof Error ? error.message : String(error)))
      }
    }

    // 7. 🔥 修复：使用项目request服务，简化请求逻辑
    console.log('🚀 [HTTP-Execute] 发送请求:', { method: httpConfig.method, url: requestUrl })
    
    // 使用系统的 request 实例
    const { request } = await import('@/service/request')
    
    // 🔥 简化：构建请求选项，与HttpDataInput保持一致
    const requestOptions = {
      timeout: requestConfig.timeout,
      headers: requestConfig.headers,
      params: requestConfig.params
    }
    
    let response: any
    const method = httpConfig.method?.toUpperCase() || 'GET'
    
    // 🔥 简化：直接调用request方法，让它处理所有配置
    switch (method) {
      case 'GET':
        response = await request.get(requestUrl, requestOptions)
        break
      case 'POST':
        response = await request.post(requestUrl, requestConfig.data, requestOptions)
        break
      case 'PUT':
        response = await request.put(requestUrl, requestConfig.data, requestOptions)
        break
      case 'DELETE':
        response = await request.delete(requestUrl, requestOptions)
        break
      case 'PATCH':
        response = await request.patch(requestUrl, requestConfig.data, requestOptions)
        break
      default:
        throw new Error('不支持的 HTTP 方法: ' + method)
    }

    console.log('✅ [HTTP-Execute] 请求成功:', response)

    // 8. 执行响应脚本
    let finalResponse = response
    if (httpConfig.enableResponseScript && httpConfig.responseScript) {
      try {
        const scriptFunction = new Function(
          'response',
          'request', 
          httpConfig.responseScript
        )
        const responseWrapper = {
          data: response,
          status: 200, // 简化处理，实际应该传递真实状态码
          headers: {}, // 简化处理
          url: requestUrl,
          method: method
        }
        const result = scriptFunction(responseWrapper, requestConfig)
        // 如果脚本返回了值，就使用返回值；否则使用原响应
        if (result !== undefined) {
          finalResponse = result
        }
        console.log('📝 [HTTP-Execute] 响应脚本执行成功:', finalResponse)
      } catch (error) {
        console.error('🚫 [HTTP-Execute] 响应脚本错误:', error)
        // 响应脚本错误不中断流程，只记录错误并使用原响应
        console.warn('响应脚本执行错误，使用原始响应')
      }
    }

    return finalResponse

  } catch (error) {
    console.error('❌ [HTTP-Execute] HTTP请求失败:', error)
    throw error
  }
}

/**
 * 测试 HTTP 请求 - 使用系统封装的 request
 */
const testHttpRequest = async () => {
  if (!httpConfig.url.trim()) {
    window.$message?.error('请输入请求 URL')
    return
  }

  httpTesting.value = true
  httpTestResult.status = false
  const startTime = Date.now()

  try {
    console.log('🚀 [HTTP] 开始请求:', httpConfig.url)

    // 🔥 修复：直接使用项目封装好的request，不要重复造轮子
    console.log('🚀 [HTTP] 使用项目request发送请求:', httpConfig.url, httpConfig.method)
    
    // 构建请求参数对象（如果有的话）
    const params: Record<string, any> = {}
    if (httpConfig.params && Array.isArray(httpConfig.params)) {
      httpConfig.params.forEach(param => {
        if (param.key && param.value) {
          params[param.key] = param.value
        }
      })
    }
    
    // 构建请求选项（让request自己处理所有配置）
    const requestOptions: any = {}
    if (Object.keys(params).length > 0) {
      requestOptions.params = params
    }
    
    let response: any
    
    // 直接使用项目的request，它会自动处理代理、baseURL、拦截器等
    if (httpConfig.method === 'GET') {
      response = await request.get(httpConfig.url, requestOptions)
    } else if (httpConfig.method === 'POST') {
      let data = {}
      if (httpConfig.bodyContent) {
        try {
          data = JSON.parse(httpConfig.bodyContent)
        } catch (error) {
          console.warn('JSON解析失败，使用空对象:', error)
        }
      }
      response = await request.post(httpConfig.url, data, requestOptions)
    } else if (httpConfig.method === 'PUT') {
      let data = {}
      if (httpConfig.bodyContent) {
        try {
          data = JSON.parse(httpConfig.bodyContent)
        } catch (error) {
          console.warn('JSON解析失败，使用空对象:', error)
        }
      }
      response = await request.put(httpConfig.url, data, requestOptions)
    } else if (httpConfig.method === 'DELETE') {
      response = await request.delete(httpConfig.url, requestOptions)
    } else {
      // 其他方法暂时使用GET
      response = await request.get(httpConfig.url, requestOptions)
    }

    console.log('✅ [HTTP] 请求成功，返回数据:', response)

    // 更新测试结果
    httpTestResult.status = true
    httpTestResult.success = true
    httpTestResult.message = '请求成功'
    httpTestResult.responseTime = Date.now() - startTime

    // 更新预览数据 - response 已经是系统处理后的净数据
    previewOriginalData.value = JSON.stringify(response, null, 2)
    
    // 🔥 修复HTTP数据持久化：将HTTP响应保存到对应数据源
    if (currentDataSourceKey.value) {
      console.log('🔥 [HTTP-Persistence] 保存HTTP响应到数据源:', currentDataSourceKey.value)
      
      // 确保数据源存在
      if (!dataValues[currentDataSourceKey.value]) {
        dataValues[currentDataSourceKey.value] = {
          currentData: {},
          rawDataList: [],
          finalProcessingType: 'custom-script',
          finalProcessingScript: 'return processedDataList',
          finalProcessingConfig: {},
          selectedDataItemIndex: 0
        }
      }
      
      // 保存HTTP响应数据作为currentData
      dataValues[currentDataSourceKey.value].currentData = response
      console.log('✅ [HTTP-Persistence] HTTP数据已保存:', dataValues[currentDataSourceKey.value].currentData)
      
      // 保存配置
      sendUpdate()
    }
    
    window.$message?.success(`HTTP 请求成功 (${httpTestResult.responseTime}ms)`)

  } catch (error) {
    console.error('❌ [HTTP] 请求失败:', error)
    
    httpTestResult.status = true
    httpTestResult.success = false
    httpTestResult.message = error instanceof Error ? error.message : String(error)
    httpTestResult.responseTime = Date.now() - startTime
    
    // 更新错误预览
    previewOriginalData.value = JSON.stringify({ 
      error: httpTestResult.message,
      timestamp: new Date().toISOString()
    }, null, 2)
    
    window.$message?.error('请求失败: ' + httpTestResult.message)
  } finally {
    httpTesting.value = false
  }
}

/**
 * 🔥 新增：更新数据预览 - 支持HTTP类型
 */
const updatePreviewData = async () => {
  try {
    // 1. 根据类型获取原始数据
    let originalData = {}
    
    if (newRawDataType.value === 'json') {
      // JSON 类型
      if (newRawDataJsonContent.value.trim()) {
        try {
          originalData = JSON.parse(newRawDataJsonContent.value)
        } catch (error) {
          previewStatus.value = { type: 'error', text: 'JSON错误', message: 'JSON格式不正确' }
          previewOriginalData.value = '{"error": "JSON格式错误"}'
          previewProcessedData.value = '{"error": "JSON格式错误"}'
          return
        }
      }
    } else if (newRawDataType.value === 'http') {
      // HTTP 类型 - 保持已获取的数据，不要清空
      if (previewOriginalData.value && previewOriginalData.value !== '{}') {
        try {
          // 如果已经有数据，保持不变
          originalData = JSON.parse(previewOriginalData.value)
          console.log('🔧 [PreviewData] HTTP类型保持已有数据')
        } catch {
          // 解析失败时使用空对象
          originalData = {}
        }
      } else {
        // 没有数据时显示空对象
        originalData = {}
      }
    } else if (newRawDataType.value === 'websocket') {
      // WebSocket 类型
      originalData = {
        _previewMode: 'WebSocket配置预览',
        url: newRawDataWebsocketUrl.value || '未设置',
        protocols: newRawDataWebsocketProtocols.value || '无',
        _note: 'WebSocket功能待实现'
      }
    }

    previewOriginalData.value = JSON.stringify(originalData, null, 2)

    // 2. 应用数据处理（对JSON和HTTP类型都有效）
    let processedData = originalData

    if (newRawDataType.value === 'json' || newRawDataType.value === 'http') {
      // 应用过滤路径
      if (currentFilterPath.value.trim()) {
        try {
          console.log('🔧 [PreviewData] 开始过滤 - 数据类型:', newRawDataType.value, '原始数据:', processedData)
          processedData = applyDataFilter(processedData, currentFilterPath.value)
          console.log('🔧 [PreviewData] 应用过滤路径:', currentFilterPath.value, '结果:', processedData)
        } catch (error) {
          console.error('❌ [PreviewData] 过滤路径出错:', error)
          previewStatus.value = { type: 'warning', text: '过滤警告', message: '过滤路径可能有误: ' + (error instanceof Error ? error.message : String(error)) }
        }
      }

      // 应用处理脚本
      if (currentProcessScript.value.trim()) {
        try {
          processedData = await applyProcessScript(processedData, currentProcessScript.value)
          previewStatus.value = { type: 'success', text: '处理成功', message: '数据已处理' }
          console.log('🔧 [PreviewData] 应用处理脚本结果:', processedData)
        } catch (error) {
          previewStatus.value = { type: 'error', text: '脚本错误', message: '脚本执行失败' }
        }
      } else {
        previewStatus.value = { type: 'info', text: '无脚本', message: '未设置处理脚本' }
      }
    } else {
      // 非-JSON 类型，显示配置状态
      previewStatus.value = { 
        type: 'info', 
        text: newRawDataType.value.toUpperCase() + '数据源', 
        message: '请点击"测试请求"按钮获取数据' 
      }
    }

    previewProcessedData.value = JSON.stringify(processedData, null, 2)
  } catch (error) {
    previewStatus.value = { type: 'error', text: '预览错误', message: '数据预览失败' }
    previewProcessedData.value = '{"error": "预览失败"}'
  }
}

/**
 * 获取数据类型文本描述
 */
const getDataTypeText = (dataSource: DataSource) => {
  // 根据 fieldsToMap 判断期望的数据类型
  if (dataSource.fieldsToMap && dataSource.fieldsToMap.length > 0) {
    const targetProperty = dataSource.fieldsToMap[0].targetProperty
    if (targetProperty.includes('array') || targetProperty.includes('Array')) {
      return '数组'
    }
    if (targetProperty.includes('object') || targetProperty.includes('Object')) {
      return '对象'
    }
  }

  // 根据 key 判断
  if (dataSource.key.toLowerCase().includes('array')) return '数组'
  if (dataSource.key.toLowerCase().includes('object')) return '对象'

  return '数据'
}

/**
 * 获取默认数据 - 🔥 修改：统一返回空对象
 */
const getDefaultData = (dataSourceKey: string) => {
  const dataSource = props.dataSources.find(ds => ds.key === dataSourceKey)
  if (!dataSource) return {}

  // 🔥 修复：优先从 fieldMappings 中获取 defaultValue
  if (dataSource.fieldMappings) {
    // 查找匹配的字段映射
    const targetFieldMapping = Object.values(dataSource.fieldMappings).find(
      (mapping: any) => mapping.targetField === dataSourceKey || mapping.type
    )

    if (targetFieldMapping && targetFieldMapping.defaultValue !== undefined) {
      console.log(`🔧 [DEBUG-Config] 使用组件定义的默认值 (${dataSourceKey}):`, targetFieldMapping.defaultValue)
      return targetFieldMapping.defaultValue
    }
  }

  // 🔥 修改：统一返回空对象，不再使用示例数据
  return {}
}

/**
 * 格式化显示数据 - 🔥 修改：显示当前激活的数据
 */
const getFormattedData = (dataSourceKey: string) => {
  const dataSourceValue = dataValues[dataSourceKey]

  // 🔥 调试：打印数据状态
  console.log(`🔧 [DEBUG-Config] getFormattedData(${dataSourceKey}):`, {
    dataSourceValue,
    hasCurrentData: !!dataSourceValue?.currentData,
    currentData: dataSourceValue?.currentData,
    dataValuesKeys: Object.keys(dataValues)
  })

  if (!dataSourceValue?.currentData) {
    console.warn(`⚠️ [DEBUG-Config] 数据源 ${dataSourceKey} 没有currentData，dataSourceValue:`, dataSourceValue)
    return '暂无数据'
  }

  try {
    return JSON.stringify(dataSourceValue.currentData, null, 2)
  } catch {
    return String(dataSourceValue.currentData)
  }
}

/**
 * 🔥 修改：获取示例数据代码用于悬停提示 - 统一返回空对象
 */
const getExampleDataCode = (dataSource: DataSource) => {
  // 从 fieldMappings 中获取 defaultValue
  if (dataSource.fieldMappings) {
    const firstMapping = Object.values(dataSource.fieldMappings)[0] as any
    if (firstMapping && firstMapping.defaultValue !== undefined) {
      try {
        return JSON.stringify(firstMapping.defaultValue, null, 2)
      } catch {
        return JSON.stringify(firstMapping.defaultValue)
      }
    }
  }

  // 🔥 修改：统一返回空对象格式
  return '{}'
}

/**
 * 重置数据为默认 - 🔥 修改：支持新的数据结构
 */
const resetData = (dataSourceKey: string) => {
  const defaultData = getDefaultData(dataSourceKey)

  // 🔥 修改：更新数据结构，包含最终处理配置
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      currentData: defaultData,
      rawDataList: [],
      // 🆕 最终处理配置默认值
      finalProcessingType: 'custom-script', // 默认使用自定义脚本，给用户最大灵活性
      finalProcessingScript: `// 数据源最终处理脚本
// 参数: processedDataList - 已处理的原始数据项列表
// 返回: 最终的合并数据

// 示例1: 对象合并
// return Object.assign({}, ...processedDataList)

// 示例2: 数组连接  
// return processedDataList.flat()

// 示例3: 选择特定数据项
// return processedDataList[0] // 使用第一个数据项

// 示例4: 条件处理
// return processedDataList.filter(item => item.status === 'active')

// 默认: 返回处理后的数据列表
return processedDataList`,
      finalProcessingConfig: {}
    }
  } else {
    dataValues[dataSourceKey].currentData = defaultData
    // 确保新字段存在
    if (!dataValues[dataSourceKey].finalProcessingType) {
      dataValues[dataSourceKey].finalProcessingType = 'custom-script'
      dataValues[dataSourceKey].finalProcessingScript = `// 数据源最终处理脚本
return processedDataList` // 简化的默认脚本
      dataValues[dataSourceKey].finalProcessingConfig = {}
    }
  }

  console.log('🔧 [DEBUG-Config] 重置数据:', { dataSourceKey, data: dataValues[dataSourceKey] })
  sendUpdate()
}

// 上次发送的配置，用于防止重复发送
let lastSentConfig: string | null = null

/**
 * 发送配置更新 - 🔥 修改：原始数据项与最终数据完全分离
 */
const sendUpdate = () => {
  const dataSourceBindings: Record<string, any> = {}

  // 🔥 修改：构建兼容原有格式的配置结构
  props.dataSources.forEach(dataSource => {
    const dataSourceValue = dataValues[dataSource.key]
    if (dataSourceValue) {
      // 🔥 保持原有的结构，但增强数据内容
      dataSourceBindings[dataSource.key] = {
        // 保持原有的字段
        rawData: dataSourceValue.currentData ? JSON.stringify(dataSourceValue.currentData) : undefined,

        // 🔥 新增：增强的数据源配置
        enhancedConfig: {
          // 原始数据项列表
          rawDataList: dataSourceValue.rawDataList || [],
          // 元数据
          metadata: {
            hasRawDataList: (dataSourceValue.rawDataList?.length || 0) > 0,
            rawDataCount: dataSourceValue.rawDataList?.length || 0,
            lastUpdated: new Date().toISOString(),
            version: '2.1'
          },
          // 数据源类型信息
          dataSourceInfo: {
            key: dataSource.key,
            name: dataSource.name,
            description: dataSource.description,
            fieldMappings: dataSource.fieldMappings,
            fieldsToMap: dataSource.fieldsToMap
          }
        }
      }
    }
  })

  // 🔥 保持兼容的配置结构，同时增强功能
  const config = {
    dataSourceBindings,
    // 🔥 新增：系统级配置
    systemConfig: {
      version: '2.1',
      features: ['rawDataManagement', 'scriptProcessing', 'dataFiltering'],
      lastConfigUpdate: new Date().toISOString(),
      selectedWidgetId: props.selectedWidgetId
    }
  }
  const configHash = JSON.stringify(config)

  // 🔥 关键修复：只在配置真正变化时才发送
  if (configHash !== lastSentConfig) {
    console.log('🔧 [DEBUG-Config] 检测到配置变化，发送更新:', {
      selectedWidgetId: props.selectedWidgetId,
      bindingKeys: Object.keys(dataSourceBindings),
      hasDataChanged: configHash !== lastSentConfig,
      config
    })

    lastSentConfig = configHash
    emit('update', config)
  } else {
    console.log('🔧 [DEBUG-Config] 配置未变化，跳过发送:', {
      selectedWidgetId: props.selectedWidgetId,
      bindingKeys: Object.keys(dataSourceBindings)
    })
  }
}

/**
 * 初始化数据 - 🔥 修复：优先使用当前运行时数据
 */
const initializeData = () => {
  console.log('🔧 [DEBUG-Config] 初始化数据源数据:', {
    selectedWidgetId: props.selectedWidgetId,
    dataSourcesCount: props.dataSources.length,
    dataSourceKeys: props.dataSources.map(ds => ds.key)
  })

  // 🔥 重置配置缓存，允许新的配置发送
  lastSentConfig = null

  // 🔥 核心修复：先请求当前运行时数据
  if (props.selectedWidgetId) {
    console.log('🔄 [DataSourceConfigForm] 请求当前运行时数据:', props.selectedWidgetId)
    emit('request-current-data', props.selectedWidgetId)

    // 给父组件一点时间响应，然后再尝试恢复
    setTimeout(() => {
      attemptDataRestore()
    }, 50)
  } else {
    // 没有选中组件，使用默认数据
    useDefaultData()
  }
}

/**
 * 尝试数据恢复（从存储的配置）
 */
const attemptDataRestore = () => {
  let hasRestoredData = false

  if (props.selectedWidgetId) {
    try {
      console.log('🔍 [DEBUG-Restore] 开始尝试恢复配置:', props.selectedWidgetId)
      const savedConfig = configurationManager.getConfiguration(props.selectedWidgetId)
      console.log('🔍 [DEBUG-Restore] ConfigurationManager返回的完整配置:', savedConfig)

      // 尝试从多种数据结构恢复
      let dataSourceBindings = null

      // 🔥 修复：重新启用配置恢复逻辑
      if (savedConfig?.dataSource?.config?.dataSourceBindings) {
        dataSourceBindings = savedConfig.dataSource.config.dataSourceBindings
        console.log('🔧 [DEBUG-Config] 从dataSource.config恢复数据:', dataSourceBindings)
      } else if (savedConfig?.dataSourceBindings) {
        dataSourceBindings = savedConfig.dataSourceBindings
        console.log('🔧 [DEBUG-Config] 从dataSourceBindings直接恢复数据:', dataSourceBindings)
      }

      if (dataSourceBindings && Object.keys(dataSourceBindings).length > 0) {
        // 恢复每个数据源的保存数据
        Object.entries(dataSourceBindings).forEach(([key, binding]: [string, any]) => {
          if (binding?.rawData) {
            try {
              // 🔥 修复：检查保存的数据结构格式
              const parsedRawData = JSON.parse(binding.rawData)

              // 🔥 修复：根据数据结构决定如何恢复，包含最终处理配置
              if (parsedRawData && typeof parsedRawData === 'object' && parsedRawData.currentData !== undefined) {
                // 新数据结构：包含 currentData 和 rawDataList
                dataValues[key] = {
                  currentData: parsedRawData.currentData,
                  rawDataList: parsedRawData.rawDataList || [],
                  // 🆕 恢复最终处理配置，或使用默认值
                  finalProcessingType: parsedRawData.finalProcessingType || 'custom-script',
                  finalProcessingScript: parsedRawData.finalProcessingScript || 'return processedDataList',
                  finalProcessingConfig: parsedRawData.finalProcessingConfig || {},
                  selectedDataItemIndex: parsedRawData.selectedDataItemIndex ?? 0
                }
                console.log(`🔧 [DEBUG-Config] 恢复新数据结构 ${key}:`, dataValues[key])
              } else {
                // 旧数据结构：直接是数据内容
                dataValues[key] = {
                  currentData: parsedRawData,
                  rawDataList: [],
                  // 🆕 添加默认最终处理配置
                  finalProcessingType: 'custom-script',
                  finalProcessingScript: 'return processedDataList',
                  finalProcessingConfig: {},
                  selectedDataItemIndex: 0
                }
                console.log(`🔧 [DEBUG-Config] 恢复旧数据结构并转换 ${key}:`, dataValues[key])
              }

              // 🔥 修复：同时从原始数据列表配置中恢复
              if (binding.rawDataList) {
                dataValues[key].rawDataList = binding.rawDataList
                console.log(`🔧 [DEBUG-Config] 恢复原始数据列表 ${key}:`, binding.rawDataList)
              }

              hasRestoredData = true
            } catch (error) {
              console.warn(`⚠️ [DEBUG-Config] 恢复数据源 ${key} 失败:`, error)
              // 🔥 修复：恢复失败时使用默认数据结构，包含最终处理配置
              const defaultData = getDefaultData(key)
              dataValues[key] = {
                currentData: defaultData,
                rawDataList: [],
                // 🆕 添加默认最终处理配置
                finalProcessingType: 'custom-script',
                finalProcessingScript: 'return processedDataList',
                finalProcessingConfig: {},
                selectedDataItemIndex: 0
              }
            }
          }
        })
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG-Config] 配置恢复失败:', error)
    }
  }

  // 如果没有恢复到数据，使用默认数据
  if (!hasRestoredData) {
    useDefaultData()
  }

  // 🔥 修复：只在没有恢复到数据时发送初始配置
  // 恢复数据时不发送，避免重复发送相同配置
  if (!hasRestoredData) {
    console.log('🔧 [DEBUG-Config] 使用默认数据，发送初始配置')
    sendUpdate()
  } else {
    console.log('🔧 [DEBUG-Config] 数据已恢复，不发送重复配置')
    // 🔥 修复：更新 lastSentConfig 以避免后续重复发送
    const dataSourceBindings: Record<string, any> = {}
    props.dataSources.forEach(dataSource => {
      const dataSourceValue = dataValues[dataSource.key]
      if (dataSourceValue?.currentData !== undefined) {
        dataSourceBindings[dataSource.key] = {
          rawData: JSON.stringify(dataSourceValue.currentData),
          rawDataList: dataSourceValue.rawDataList || [],
          metadata: {
            hasRawDataList: dataSourceValue.rawDataList?.length > 0
            // 移除 activeRawDataId，因为原始数据项不影响最终数据
          }
        }
      }
    })
    lastSentConfig = JSON.stringify({ dataSourceBindings })
  }
}

/**
 * 使用默认数据 - 🔥 修改：支持新的数据结构
 */
const useDefaultData = () => {
  console.log('🔥 [DEBUG-Config] 使用默认数据初始化 - 新数据结构')
  props.dataSources.forEach(dataSource => {
    const defaultData = getDefaultData(dataSource.key)
    dataValues[dataSource.key] = {
      currentData: defaultData,
      rawDataList: [],
      // 🆕 添加默认最终处理配置
      finalProcessingType: 'custom-script',
      finalProcessingScript: 'return processedDataList',
      finalProcessingConfig: {},
      selectedDataItemIndex: 0
    }
    console.log(`🔧 [DEBUG-Config] 初始化数据源: ${dataSource.key}`, dataValues[dataSource.key])
  })
}

// 🔥 原始数据管理函数

/**
 * 🔥 新增：获取复杂JSON示例
 */
const getJsonPlaceholder = () => {
  return `{
  "name": "张三",
  "age": 25,
  "email": "zhangsan@example.com"
}`
}

/**
 * 🔥 新增：获取JSON示例的默认值（用于初始化输入框）
 */
const getJsonDefaultValue = () => {
  return getJsonPlaceholder()
}

// 🔥 新增：辅助函数

/**
 * 根据类型获取显示名称
 */
const getTypeDisplayName = (type: string): string => {
  const typeNames: Record<string, string> = {
    'json': 'JSON',
    'http': 'HTTP', 
    'websocket': 'WS'
  }
  return typeNames[type] || type.toUpperCase()
}

// 🔥 新增：数据处理核心函数

/**
 * 应用数据过滤路径
 */
const applyDataFilter = (data: any, filterPath: string): any => {
  if (!filterPath || filterPath.trim() === '') return data

  console.log('🔍 [DataFilter] 开始过滤:', { filterPath, data })

  try {
    // 🔥 修复：检查数据是否为有效对象
    if (data === null || data === undefined) {
      console.warn('🔧 [DataFilter] 输入数据为空，返回原数据')
      return data
    }

    // 简单的JSONPath实现
    let current = data
    let cleanPath = filterPath.replace(/^\$\.?/, '').trim()

    if (!cleanPath) return data

    // 按点分割，但要处理数组索引
    const parts = cleanPath.split(/\.|\[|\]/).filter(part => part !== '')
    console.log('🔍 [DataFilter] 路径分割:', parts)

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      console.log(`🔍 [DataFilter] 处理部分 ${i}: "${part}", 当前数据类型:`, typeof current)
      
      if (current === null || current === undefined) {
        console.log('🔍 [DataFilter] 数据为空，返回空对象')
        return {}
      }

      // 处理数组索引
      if (/^\d+$/.test(part)) {
        const index = parseInt(part)
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index]
          console.log(`🔍 [DataFilter] 数组索引 ${index} 成功，结果:`, current)
        } else {
          console.log(`🔍 [DataFilter] 数组索引 ${index} 失败，当前类型: ${typeof current}, 是否数组: ${Array.isArray(current)}`)
          return {}
        }
      } else {
        // 处理对象属性
        if (typeof current === 'object' && current !== null && part in current) {
          current = current[part]
          console.log(`🔍 [DataFilter] 属性 "${part}" 成功，结果:`, current)
        } else {
          const availableKeys = typeof current === 'object' && current !== null 
            ? Object.keys(current) 
            : []
          console.log(`🔍 [DataFilter] 属性 "${part}" 失败，当前类型: ${typeof current}, 可用属性:`, availableKeys)
          return {}
        }
      }
    }

    console.log('🔍 [DataFilter] 过滤完成，最终结果:', current)
    return current
  } catch (error) {
    console.error('❌ [DataFilter] 过滤路径解析失败:', error)
    console.error('❌ [DataFilter] 错误详情:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      filterPath,
      dataType: typeof data,
      dataPreview: data ? JSON.stringify(data).substring(0, 200) : 'null/undefined'
    })
    return data // 失败时返回原数据
  }
}

/**
 * 应用处理脚本
 */
const applyProcessScript = async (data: any, script: string): Promise<any> => {
  if (!script || script.trim() === '') return data

  // 🔥 修复：确保传递给脚本的数据不是null
  const safeData = data === null || data === undefined ? {} : data

  try {
    console.log('🔧 [ProcessScript] 执行脚本:', script.substring(0, 100))
    console.log('🔧 [ProcessScript] 输入数据类型:', typeof safeData, '数据:', safeData)

    // 🔥 修复：创建数据的深拷贝，避免修改原始数据
    const dataCopy = JSON.parse(JSON.stringify(safeData))

    // 使用脚本引擎执行
    const result = await defaultScriptEngine.execute(script, { data: dataCopy })

    if (result.success) {
      console.log('✅ [ProcessScript] 脚本执行成功')
      return result.data
    } else {
      console.error('❌ [ProcessScript] 脚本执行失败:', result.error)
      console.warn('🔧 [ProcessScript] 返回原始数据')
      return data // 失败时返回原数据
    }
  } catch (error) {
    console.error('❌ [ProcessScript] 脚本执行异常:', error)
    console.warn('🔧 [ProcessScript] 返回原始数据')
    return data // 异常时返回原数据
  }
}

/**
 * 完整的数据处理流程：原始数据 -> HTTP自动执行 -> 过滤 -> 脚本处理
 */
const processRawData = async (rawData: any, config: any): Promise<any> => {
  let processedData = rawData

  // 🆕 0. HTTP类型自动执行请求
  if (config?.httpConfig) {
    console.log('🚀 [HTTP-Auto] HTTP类型数据项，开始自动执行请求:', config.httpConfig)
    
    try {
      // 执行HTTP请求获取实际数据
      const httpResponse = await executeHttpRequest(config.httpConfig)
      processedData = httpResponse
      console.log('✅ [HTTP-Auto] HTTP自动请求成功:', processedData)
    } catch (error) {
      console.error('❌ [HTTP-Auto] HTTP自动请求失败:', error)
      // HTTP失败时使用原始数据，但记录错误
      processedData = {
        _error: 'HTTP请求失败',
        _errorMessage: error instanceof Error ? error.message : String(error),
        _timestamp: new Date().toISOString(),
        _originalData: rawData
      }
    }
  }

  // 1. 应用数据过滤
  if (config?.filterPath) {
    processedData = applyDataFilter(processedData, config.filterPath)
    console.log('🔧 [DataProcess] 过滤后数据:', processedData)
  }

  // 2. 应用处理脚本
  if (config?.processScript) {
    processedData = await applyProcessScript(processedData, config.processScript)
    console.log('🔧 [DataProcess] 脚本处理后数据:', processedData)
  }

  return processedData
}

/**
 * 🔥 新增：获取数据项类型对应的颜色
 */
const getDataItemTypeColor = (
  type: RawDataItemType
): 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' => {
  switch (type) {
    case 'json':
      return 'success'
    case 'http':
      return 'info'
    case 'websocket':
      return 'warning'
    default:
      return 'default'
  }
}

/**
 * 🔥 新增：根据类型生成数据
 */
const generateDataFromType = (type: RawDataItemType) => {
  console.log('🔧 [DEBUG-GenerateData] 生成数据，类型:', type, '内容:', newRawDataJsonContent.value.substring(0, 50))

  switch (type) {
    case 'json':
      // JSON 类型：如果用户输入了内容，尝试解析，否则返回空对象
      if (newRawDataJsonContent.value.trim()) {
        try {
          return JSON.parse(newRawDataJsonContent.value)
        } catch (error) {
          console.warn('JSON 解析失败，使用空对象:', error)
          return {}
        }
      }
      return {}

    case 'http':
      // HTTP 类型：返回HTTP配置结构
      return {
        url: httpConfig.url || '',
        method: httpConfig.method || 'GET',
        headers: Object.fromEntries(httpConfig.headers.map(h => [h.key, h.value])),
        params: Object.fromEntries(httpConfig.params.map(p => [p.key, p.value])),
        bodyType: httpConfig.bodyType,
        bodyContent: httpConfig.bodyContent,
        status: 'ready',
        lastFetch: null
      }

    case 'websocket':
      // WebSocket 类型：返回默认WebSocket配置结构
      return {
        url: newRawDataWebsocketUrl.value || '',
        protocols: newRawDataWebsocketProtocols.value
          ? newRawDataWebsocketProtocols.value.split(',').map(p => p.trim())
          : [],
        readyState: 'connecting',
        lastMessage: null
      }

    default:
      return {}
  }
}

/**
 * 🔥 简化：根据类型生成配置（包含过滤路径和处理脚本）
 */
const generateConfigFromType = (type: RawDataItemType) => {
  const baseConfig = {
    filterPath: currentFilterPath.value.trim() || undefined,
    processScript: currentProcessScript.value.trim() || undefined
  }

  switch (type) {
    case 'json':
      return {
        ...baseConfig,
        jsonData: newRawDataJsonContent.value || ''
      }

    case 'http':
      return {
        ...baseConfig,
        httpConfig: {
          // 基础配置
          method: httpConfig.method,
          url: httpConfig.url,
          
          // 请求头
          headers: httpConfig.headers.filter(h => h.key && h.value),
          
          // URL参数
          params: httpConfig.params.filter(p => p.key && p.value),
          
          // 请求体
          bodyType: httpConfig.bodyType,
          bodyContent: httpConfig.bodyContent,
          formData: httpConfig.formData.filter(f => f.key && f.value),
          
          // 脚本配置
          enablePreScript: httpConfig.enablePreScript,
          preRequestScript: httpConfig.preRequestScript,
          enableResponseScript: httpConfig.enableResponseScript,
          responseScript: httpConfig.responseScript,
          
          // 高级配置
          timeout: httpConfig.timeout,
          retries: httpConfig.retries,
          followRedirects: httpConfig.followRedirects,
          validateSSL: httpConfig.validateSSL,
          enableCookies: httpConfig.enableCookies,
          
          // 代理配置
          enableProxy: httpConfig.enableProxy,
          proxyHost: httpConfig.proxyHost,
          proxyPort: httpConfig.proxyPort
        }
      }

    case 'websocket':
      return {
        ...baseConfig,
        websocketConfig: {
          url: newRawDataWebsocketUrl.value || '',
          protocols: newRawDataWebsocketProtocols.value
            ? newRawDataWebsocketProtocols.value.split(',').map(p => p.trim())
            : []
        }
      }

    default:
      return baseConfig
  }
}

/**
 * 打开添加原始数据弹窗
 */
const openAddRawDataModal = (dataSourceKey: string) => {
  // 🔥 新增：重置编辑模式状态（确保是添加模式）
  resetEditMode()

  currentDataSourceKey.value = dataSourceKey
  newRawDataName.value = ''

  // 🔥 修改：重置表单状态并设置JSON默认值
  newRawDataType.value = 'json'
  newRawDataJsonContent.value = getJsonDefaultValue() // 设置默认JSON内容
  newRawDataHttpUrl.value = ''
  newRawDataHttpMethod.value = 'GET'
  newRawDataHttpHeaders.value = ''
  newRawDataWebsocketUrl.value = ''
  newRawDataWebsocketProtocols.value = ''

  // 🔥 简化：重置过滤路径和添加示例处理脚本
  currentFilterPath.value = ''
  currentProcessScript.value = `// 示例：把第一个key变成username
// 检查数据是否为有效对象
if (!data || typeof data !== 'object') {
  return data; // 如果数据为空或不是对象，直接返回
}

var keys = Object.keys(data);
if (keys.length > 0) {
  var firstKey = keys[0];
  var firstValue = data[firstKey];
  delete data[firstKey];
  data.username = firstValue;
}
return data;`

  // 🔥 新增：初始化数据预览
  updatePreviewData()

  showAddRawDataModal.value = true
}

/**
 * 快速添加原始数据 - 极简交互，直接添加（备用）
 */
const quickAddRawData = (dataSourceKey: string) => {
  // 🔥 修复：确保数据源存在且rawDataList是数组
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      currentData: getDefaultData(dataSourceKey),
      rawDataList: []
    }
  }

  if (!dataValues[dataSourceKey].rawDataList || !Array.isArray(dataValues[dataSourceKey].rawDataList)) {
    dataValues[dataSourceKey].rawDataList = []
  }

  // 生成简洁的数据项名称
  const itemCount = dataValues[dataSourceKey].rawDataList.length + 1
  const itemName = `数据项${itemCount}`

  // 🔥 修改：创建新的原始数据项，包含类型信息
  const newRawDataItem: RawDataItem = {
    id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: itemName,
    type: 'json', // 快速添加默认为 JSON 类型
    data: {}, // 空对象，完全独立
    config: { jsonData: '' }, // 默认JSON配置
    createdAt: new Date().toISOString(),
    isActive: false
  }

  // 添加到列表
  dataValues[dataSourceKey].rawDataList.push(newRawDataItem)

  console.log('🔧 [DEBUG-Config] 快速添加数据项:', {
    dataSourceKey,
    itemName,
    totalCount: dataValues[dataSourceKey].rawDataList.length
  })
}

/**
 * 添加原始数据（弹窗版本）- 🔥 支持复杂配置
 */
const addRawData = () => {
  console.log('🔧 [DEBUG-AddRawData] addRawData 函数开始执行:', {
    newRawDataName: newRawDataName.value,
    trimmed: newRawDataName.value.trim(),
    currentDataSourceKey: currentDataSourceKey.value
  })

  // 🔥 修复：名字为空时自动生成，不再阻止添加
  console.log('🔧 [DEBUG-AddRawData] 名字验证 - 允许空名字，将自动生成')

  const dataSourceKey = currentDataSourceKey.value

  console.log('🔧 [DEBUG-AddRawData] 检查数据源Key:', {
    dataSourceKey,
    hasDataSource: !!dataValues[dataSourceKey],
    allDataKeys: Object.keys(dataValues)
  })

  // 🔥 修复：确保数据源存在且rawDataList是数组，包含最终处理配置
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      currentData: getDefaultData(dataSourceKey),
      rawDataList: [],
      // 🆕 添加默认最终处理配置
      finalProcessingType: 'custom-script',
      finalProcessingScript: 'return processedDataList',
      finalProcessingConfig: {},
      selectedDataItemIndex: 0
    }
  }

  if (!dataValues[dataSourceKey].rawDataList || !Array.isArray(dataValues[dataSourceKey].rawDataList)) {
    dataValues[dataSourceKey].rawDataList = []
  }

  // 🔥 修改：根据类型生成数据和配置
  const generatedData = generateDataFromType(newRawDataType.value)
  const generatedConfig = generateConfigFromType(newRawDataType.value)

  // 🔥 修复：名字为空时自动生成
  const finalName = newRawDataName.value.trim() || `${getTypeDisplayName(newRawDataType.value)}_${Date.now().toString().slice(-6)}`
  
  // 创建新的原始数据项 - 使用用户输入的名称或自动生成的名称
  const newRawDataItem: RawDataItem = {
    id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: finalName,
    type: newRawDataType.value, // 🔥 新增：保存类型
    data: generatedData, // 🔥 修改：根据类型生成数据
    config: generatedConfig, // 🔥 新增：保存配置
    createdAt: new Date().toISOString(),
    isActive: false
  }

  // 添加到列表
  dataValues[dataSourceKey].rawDataList.push(newRawDataItem)

  console.log('🔧 [DEBUG-Config] 添加数据项（弹窗版本）:', {
    dataSourceKey,
    newItem: newRawDataItem,
    totalCount: dataValues[dataSourceKey].rawDataList.length
  })

  // 🔥 修复：调用 sendUpdate 通知外部组件数据变化
  sendUpdate()

  console.log('🔧 [DEBUG-AddRawData] 准备关闭弹窗并重置表单')

  // 🔥 修复：先关闭弹窗并重置表单，确保UI不会被数据处理错误阻塞
  showAddRawDataModal.value = false
  newRawDataName.value = ''

  // 🔥 新增：重置类型选择相关状态
  newRawDataType.value = 'json'
  newRawDataJsonContent.value = ''
  newRawDataHttpUrl.value = ''
  newRawDataHttpMethod.value = 'GET'

  // 🆕 在UI操作完成后再更新最终数据，避免阻塞UI
  updateFinalData(dataSourceKey).catch(error => {
    console.error(`❌ [AddRawData] 最终数据更新失败:`, error)
    // 数据处理失败不影响弹窗的关闭和表单重置
  })
  newRawDataHttpHeaders.value = ''
  newRawDataWebsocketUrl.value = ''
  newRawDataWebsocketProtocols.value = ''
  
  // 🆕 重置HTTP配置
  httpConfig.method = 'GET'
  httpConfig.url = ''
  httpConfig.headers = []
  httpConfig.params = []
  httpConfig.bodyType = 'none'
  httpConfig.bodyContent = ''
  httpConfig.formData = []
  httpConfig.enablePreScript = false
  httpConfig.preRequestScript = ''
  httpConfig.enableResponseScript = false
  httpConfig.responseScript = ''
  httpConfig.timeout = 10000
  httpConfig.retries = 0
  httpConfig.followRedirects = true
  httpConfig.validateSSL = true
  httpConfig.enableCookies = false
  httpConfig.enableProxy = false
  httpConfig.proxyHost = ''
  httpConfig.proxyPort = 8080
  
  // 重置HTTP测试状态
  httpTestResult.status = false
  httpTestResult.success = false
  httpTestResult.message = ''
  httpTestResult.responseTime = 0
  httpHeadersJson.value = ''

  console.log('🔧 [DEBUG-Config] 数据项已添加，已通知更新')
}

/**
 * 删除原始数据 - 🔥 修改：原始数据项完全独立，不影响最终数据
 */
const deleteRawData = (dataSourceKey: string, rawDataId: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue) return

  // 找到要删除的项的索引
  const itemIndex = dataSourceValue.rawDataList.findIndex(item => item.id === rawDataId)
  if (itemIndex === -1) return

  const deletedItem = dataSourceValue.rawDataList[itemIndex]

  // 删除项
  dataSourceValue.rawDataList.splice(itemIndex, 1)

  console.log('🔧 [DEBUG-Config] 删除独立原始数据项:', {
    dataSourceKey,
    rawDataId,
    deletedItem,
    remainingCount: dataSourceValue.rawDataList.length
  })

  // 🆕 现在原始数据项会影响最终数据，需要更新
  updateFinalData(dataSourceKey).catch(error => {
    console.error(`❌ [DeleteRawData] 最终数据更新失败:`, error)
  })
  
  console.log('🔧 [DEBUG-Config] 原始数据项已删除，最终数据已更新')
}

// 🔥 新增：查看当前数据源最终数据
const showCurrentFinalData = (dataSourceKey: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (dataSourceValue?.currentData) {
    try {
      currentFinalData.value = JSON.stringify(dataSourceValue.currentData, null, 2)
    } catch {
      currentFinalData.value = String(dataSourceValue.currentData)
    }
  } else {
    currentFinalData.value = '暂无数据'
  }

  currentDataSourceKey.value = dataSourceKey
  showFinalDataModal.value = true
}

// 🔥 修改：查看数据详情 - 显示处理后的数据
const viewRawDataDetail = async (dataSourceKey: string, rawDataId: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue) return

  const targetItem = dataSourceValue.rawDataList.find(item => item.id === rawDataId)
  if (!targetItem) return

  try {
    // 应用数据处理逻辑
    const processedData = await processRawData(targetItem.data, targetItem.config)

    // 显示处理后的数据
    currentRawDataDetail.value = JSON.stringify(processedData, null, 2)
    console.log('🔧 [ViewData] 原始数据:', targetItem.data)
    console.log('🔧 [ViewData] 处理后数据:', processedData)
  } catch {
    currentRawDataDetail.value = String(targetItem.data)
  }

  currentRawDataName.value = targetItem.name
  showRawDataDetailModal.value = true
}

// 🔥 新增：编辑数据项
const editRawData = (dataSourceKey: string, rawDataId: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue) return

  const targetItem = dataSourceValue.rawDataList.find(item => item.id === rawDataId)
  if (!targetItem) return

  // 进入编辑模式
  isEditMode.value = true
  editingDataSourceKey.value = dataSourceKey
  editingRawDataId.value = rawDataId

  // 填充表单数据
  newRawDataName.value = targetItem.name
  newRawDataType.value = targetItem.type

  // 根据类型填充对应的数据
  switch (targetItem.type) {
    case 'json':
      newRawDataJsonContent.value = targetItem.config?.jsonData || JSON.stringify(targetItem.data, null, 2)
      break
    case 'http':
      // 加载HTTP配置到httpConfig对象
      const httpConf = targetItem.config?.httpConfig
      if (httpConf) {
        httpConfig.method = httpConf.method || 'GET'
        httpConfig.url = httpConf.url || ''
        httpConfig.headers = httpConf.headers || []
        httpConfig.params = httpConf.params || []
        httpConfig.bodyType = httpConf.bodyType || 'none'
        httpConfig.bodyContent = httpConf.bodyContent || ''
        httpConfig.formData = httpConf.formData || []
        httpConfig.enablePreScript = httpConf.enablePreScript || false
        httpConfig.preRequestScript = httpConf.preRequestScript || ''
        httpConfig.enableResponseScript = httpConf.enableResponseScript || false
        httpConfig.responseScript = httpConf.responseScript || ''
        httpConfig.timeout = httpConf.timeout || 10000
        httpConfig.retries = httpConf.retries || 0
        httpConfig.followRedirects = httpConf.followRedirects !== false
        httpConfig.validateSSL = httpConf.validateSSL !== false
        httpConfig.enableCookies = httpConf.enableCookies || false
        httpConfig.enableProxy = httpConf.enableProxy || false
        httpConfig.proxyHost = httpConf.proxyHost || ''
        httpConfig.proxyPort = httpConf.proxyPort || 8080
      }
      // 兼容旧格式
      newRawDataHttpUrl.value = httpConf?.url || ''
      newRawDataHttpMethod.value = httpConf?.method || 'GET'
      newRawDataHttpHeaders.value = httpConf?.headers && !Array.isArray(httpConf.headers)
        ? JSON.stringify(httpConf.headers)
        : ''
      break
    case 'websocket':
      newRawDataWebsocketUrl.value = targetItem.config?.websocketConfig?.url || ''
      newRawDataWebsocketProtocols.value = targetItem.config?.websocketConfig?.protocols
        ? targetItem.config.websocketConfig.protocols.join(',')
        : ''
      break
  }

  // 填充过滤路径和处理脚本
  currentFilterPath.value = targetItem.config?.filterPath || ''
  currentProcessScript.value = targetItem.config?.processScript || ''

  console.log('🔧 [EditData] 进入编辑模式:', {
    dataSourceKey,
    rawDataId,
    targetItem,
    editMode: true
  })

  showAddRawDataModal.value = true
}

// 🔥 新增：保存编辑
const saveEdit = () => {
  if (!isEditMode.value || !editingDataSourceKey.value || !editingRawDataId.value) return

  const dataSourceValue = dataValues[editingDataSourceKey.value]
  if (!dataSourceValue) return

  const targetItemIndex = dataSourceValue.rawDataList.findIndex(item => item.id === editingRawDataId.value)
  if (targetItemIndex === -1) return

  const targetItem = dataSourceValue.rawDataList[targetItemIndex]

  // 更新基本信息
  // 🔥 修复：名字为空时自动生成
  targetItem.name = newRawDataName.value.trim() || `${getTypeDisplayName(newRawDataType.value)}_${Date.now().toString().slice(-6)}`
  targetItem.type = newRawDataType.value

  // 根据类型生成新的数据和配置
  targetItem.data = generateDataFromType(newRawDataType.value)
  targetItem.config = generateConfigFromType(newRawDataType.value)

  console.log('🔧 [SaveEdit] 保存编辑:', {
    dataSourceKey: editingDataSourceKey.value,
    rawDataId: editingRawDataId.value,
    updatedItem: targetItem
  })

  // 🔥 新增：通知外部组件数据变化
  sendUpdate()
  
  // 🔥 新增：更新最终数据
  updateFinalData(editingDataSourceKey.value).catch(error => {
    console.error(`❌ [SaveEdit] 最终数据更新失败:`, error)
  })
  
  // 退出编辑模式并关闭弹窗
  resetEditMode()
  showAddRawDataModal.value = false
}

// 🔥 新增：取消编辑
const cancelEdit = () => {
  resetEditMode()
  showAddRawDataModal.value = false
}

// 🔥 新增：重置编辑模式状态
const resetEditMode = () => {
  isEditMode.value = false
  editingDataSourceKey.value = ''
  editingRawDataId.value = ''

  // 清空表单数据
  newRawDataName.value = ''
  newRawDataType.value = 'json'
  newRawDataJsonContent.value = ''
  newRawDataHttpUrl.value = ''
  newRawDataHttpMethod.value = 'GET'
  newRawDataHttpHeaders.value = ''
  newRawDataWebsocketUrl.value = ''
  newRawDataWebsocketProtocols.value = ''
  currentFilterPath.value = ''
  currentProcessScript.value = ''
}

// 🔥 新增：统一的确认点击处理函数
const handleConfirmClick = () => {
  console.log('🔧 [DEBUG-Click] 确认按钮被点击:', {
    isEditMode: isEditMode.value,
    newRawDataName: newRawDataName.value,
    currentDataSourceKey: currentDataSourceKey.value
  })

  if (isEditMode.value) {
    console.log('🔧 [DEBUG-Click] 执行编辑保存')
    saveEdit()
  } else {
    console.log('🔧 [DEBUG-Click] 执行添加数据')
    addRawData()
  }
}

// 🆕 数据源最终处理相关函数

/**
 * 更新最终处理类型
 */
const updateFinalProcessingType = (dataSourceKey: string, type: FinalProcessingType) => {
  console.log(`🔧 [FinalProcessing] 更新处理类型: ${dataSourceKey} -> ${type}`)
  
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      currentData: null,
      rawDataList: [],
      finalProcessingType: type,
      finalProcessingScript: 'return processedDataList',
      finalProcessingConfig: {}
    }
  } else {
    dataValues[dataSourceKey].finalProcessingType = type
    
    // 根据类型设置默认脚本
    if (type !== 'custom-script') {
      const defaultScripts = {
        'merge-object': 'return Object.assign({}, ...processedDataList)',
        'concat-array': 'return processedDataList.flat()',
        'select-specific': 'return processedDataList[0] // 使用第一个数据项'
      }
      dataValues[dataSourceKey].finalProcessingScript = defaultScripts[type] || 'return processedDataList'
    }
  }
  
  // 重新计算最终数据
  updateFinalData(dataSourceKey)
}

/**
 * 更新最终处理脚本
 */
const updateFinalProcessingScript = (dataSourceKey: string, script: string) => {
  console.log(`🔧 [FinalProcessing] 更新处理脚本: ${dataSourceKey}`)
  
  if (!dataValues[dataSourceKey]) return
  
  dataValues[dataSourceKey].finalProcessingScript = script
  
  // 重新计算最终数据
  updateFinalData(dataSourceKey)
}

/**
 * 格式化最终处理脚本
 */
const formatFinalScript = (dataSourceKey: string) => {
  const script = dataValues[dataSourceKey]?.finalProcessingScript
  if (!script) return
  
  try {
    // 简单的JS格式化
    const formatted = script
      .replace(/;/g, ';\n')
      .replace(/\{/g, '{\n  ')
      .replace(/\}/g, '\n}')
      .replace(/,/g, ',\n')
    
    updateFinalProcessingScript(dataSourceKey, formatted)
    console.log('✅ [FinalProcessing] 脚本格式化成功')
  } catch (error) {
    console.warn('⚠️ [FinalProcessing] 脚本格式化失败:', error)
  }
}

/**
 * 验证最终处理脚本
 */
const validateFinalScript = (dataSourceKey: string) => {
  const script = dataValues[dataSourceKey]?.finalProcessingScript
  if (!script) return
  
  try {
    // 创建函数检查语法
    new Function('processedDataList', script)
    console.log('✅ [FinalProcessing] 脚本语法验证通过')
    window.$message?.success('脚本语法正确')
  } catch (error) {
    console.error('❌ [FinalProcessing] 脚本语法错误:', error)
    window.$message?.error(`脚本语法错误: ${error.message}`)
  }
}

/**
 * 🆕 更新选中的数据项索引
 */
const updateSelectedDataItemIndex = (dataSourceKey: string, index: number) => {
  console.log(`🔧 [SelectSpecific] 更新数据项选择: ${dataSourceKey} -> index ${index}`)
  
  if (!dataValues[dataSourceKey]) return
  
  dataValues[dataSourceKey].selectedDataItemIndex = index
  
  // 重新计算最终数据
  updateFinalData(dataSourceKey)
}

/**
 * 🆕 获取数据项选择器的选项
 */
const getDataItemSelectOptions = (dataSourceKey: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue?.rawDataList) return []
  
  return dataSourceValue.rawDataList.map((item, index) => ({
    label: `${index}: ${item.name} (${item.type})`,
    value: index
  }))
}

/**
 * 🆕 获取选中数据项的预览
 */
const getSelectedDataItemPreview = (dataSourceKey: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue?.rawDataList?.length) return '暂无数据项'
  
  const selectedIndex = dataSourceValue.selectedDataItemIndex ?? 0
  const selectedItem = dataSourceValue.rawDataList[selectedIndex]
  
  if (!selectedItem) return '选择的数据项不存在'
  
  try {
    // 显示数据项的实际数据内容
    return JSON.stringify(selectedItem.data, null, 2)
  } catch {
    return JSON.stringify(selectedItem, null, 2)
  }
}

/**
 * 🆕 仅更新处理配置 - 保持原始数据不变，只重新处理已有数据
 */
const updateFinalDataProcessingOnly = async (dataSourceKey: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue) return

  console.log(`🔧 [ProcessingOnly] 仅重新处理数据: ${dataSourceKey}`)

  // 获取状态对象
  const status = getOrInitStatus(finalProcessingStatus, dataSourceKey, {
    loading: false,
    error: undefined,
    lastUpdateTime: undefined
  })

  try {
    // 设置加载状态
    status.loading = true
    status.error = undefined

    // 直接使用已有的原始数据进行最终处理
    const rawDataItems = dataSourceValue.rawDataList || []
    let finalResult: any = null

    // 根据处理类型执行最终处理
    switch (dataSourceValue.finalProcessingType) {
      case 'merge-object': {
        finalResult = {}
        rawDataItems.forEach((item: any) => {
          if (item.data && typeof item.data === 'object' && !Array.isArray(item.data)) {
            Object.assign(finalResult, item.data)
          }
        })
        break
      }

      case 'concat-array': {
        finalResult = []
        rawDataItems.forEach((item: any) => {
          if (Array.isArray(item.data)) {
            finalResult = finalResult.concat(item.data)
          } else if (item.data !== null && item.data !== undefined) {
            finalResult.push(item.data)
          }
        })
        break
      }

      case 'select-specific': {
        const selectedIndex = dataSourceValue.selectedDataItemIndex ?? 0
        const selectedItem = rawDataItems[selectedIndex]
        finalResult = selectedItem ? selectedItem.data : null
        break
      }

      case 'custom-script': {
        if (!dataSourceValue.finalProcessingScript) {
          throw new Error('自定义脚本处理类型需要提供脚本内容')
        }

        // 执行自定义脚本
        const scriptContext = {
          rawDataList: rawDataItems.map((item: any) => item.data),
          dataCount: rawDataItems.length,
          console: console
        }

        finalResult = await defaultScriptEngine.execute(dataSourceValue.finalProcessingScript, scriptContext)
        break
      }

      default:
        throw new Error(`不支持的处理类型: ${dataSourceValue.finalProcessingType}`)
    }

    // 更新最终结果
    dataSourceValue.finalData = finalResult

    // 更新状态
    status.loading = false
    status.lastUpdateTime = new Date().toISOString()

    console.log(`✅ [ProcessingOnly] 处理配置更新完成: ${dataSourceKey}`, finalResult)

    // 通知外部更新
    sendUpdate()

  } catch (error) {
    console.error(`❌ [ProcessingOnly] 处理配置更新失败 ${dataSourceKey}:`, error)
    status.loading = false
    status.error = error instanceof Error ? error.message : String(error)
  }
}

/**
 * 更新最终数据 - 带状态管理和错误处理
 */
const updateFinalData = async (dataSourceKey: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue) return
  
  // 获取状态对象
  const status = getOrInitStatus(finalProcessingStatus, dataSourceKey, {
    loading: false,
    error: undefined,
    lastUpdateTime: undefined
  })
  
  const previewStatus = getOrInitStatus(processingPreviewStatus, dataSourceKey, {
    loading: false,
    error: undefined,
    dataCount: 0
  })
  
  try {
    // 设置加载状态
    status.loading = true
    status.error = undefined
    previewStatus.loading = true
    previewStatus.error = undefined
    
    console.log(`🔧 [FinalProcessing] 开始更新最终数据: ${dataSourceKey}`)
    
    // 处理原始数据项
    previewStatus.dataCount = dataSourceValue.rawDataList.length
    
    const processedDataList = await Promise.all(
      dataSourceValue.rawDataList.map(async (item, index) => {
        try {
          console.log(`🔧 [FinalProcessing] 处理数据项 ${index + 1}/${dataSourceValue.rawDataList.length}: ${item.name}`)
          return await processRawData(item.data, item.config)
        } catch (error) {
          console.error(`❌ [FinalProcessing] 数据项 ${item.name} 处理失败:`, error)
          throw new Error(`数据项"${item.name}"处理失败: ${error.message}`)
        }
      })
    )
    
    console.log(`🔧 [FinalProcessing] 已处理原始数据项: ${processedDataList.length} 项`)
    
    // 根据处理类型生成最终数据
    const finalData = await processFinalData(
      processedDataList,
      dataSourceValue.finalProcessingType,
      dataSourceValue.finalProcessingScript,
      dataSourceValue.selectedDataItemIndex
    )
    
    // 更新最终数据
    dataSourceValue.currentData = finalData
    
    // 更新状态
    status.loading = false
    status.lastUpdateTime = new Date()
    previewStatus.loading = false
    
    console.log(`✅ [FinalProcessing] 最终数据更新完成:`, finalData)
    
    // 通知父组件
    sendUpdate()
    
  } catch (error) {
    // 设置错误状态
    status.loading = false
    status.error = error.message
    previewStatus.loading = false
    previewStatus.error = error.message
    
    console.error(`❌ [FinalProcessing] 最终数据更新失败:`, error)
    
    // 根据错误类型给出不同的提示
    if (error.message.includes('脚本执行')) {
      window.$message?.error(`脚本执行错误: ${error.message}`)
    } else if (error.message.includes('数据项')) {
      window.$message?.error(`数据处理错误: ${error.message}`)
    } else {
      window.$message?.error(`数据处理失败: ${error.message}`)
    }
    
    // 抛出错误，让调用方知道处理失败
    throw error
  }
}

// 组件挂载时初始化
onMounted(() => {
  initializeData()
})

// 🆕 响应式数据更新机制 - 监听特定字段变化
// 注意：由于我们在addRawData和deleteRawData中手动调用updateFinalData，
// 这里主要监听最终处理配置的变化
let updateTimer: NodeJS.Timeout | null = null

const debouncedFinalDataUpdate = (dataSourceKey: string) => {
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  
  updateTimer = setTimeout(() => {
    updateFinalData(dataSourceKey).catch(error => {
      console.error(`❌ [Reactive] 数据源 ${dataSourceKey} 防抖更新失败:`, error)
    })
    updateTimer = null
  }, 300) // 300ms防抖
}

// 🆕 仅处理配置更新 - 不重新获取原始数据，只重新处理已有数据
let processingUpdateTimer: NodeJS.Timeout | null = null
const debouncedProcessingOnlyUpdate = (dataSourceKey: string) => {
  if (processingUpdateTimer) {
    clearTimeout(processingUpdateTimer)
  }
  
  processingUpdateTimer = setTimeout(() => {
    updateFinalDataProcessingOnly(dataSourceKey).catch(error => {
      console.error(`❌ [Reactive] 数据源 ${dataSourceKey} 处理配置更新失败:`, error)
    })
    processingUpdateTimer = null
  }, 300) // 300ms防抖
}

// 监听最终处理配置变化和原始数据项变化
watch(
  () => Object.entries(dataValues).map(([key, value]) => ({
    key,
    type: value?.finalProcessingType,
    script: value?.finalProcessingScript,
    rawDataList: value?.rawDataList ? JSON.stringify(value.rawDataList) : '', // 序列化用于比较
    selectedIndex: value?.selectedDataItemIndex // 🆕 监听选中数据项索引变化
  })),
  (newConfigs, oldConfigs) => {
    if (!oldConfigs) return // 初始化时跳过
    
    newConfigs.forEach((newConfig, index) => {
      const oldConfig = oldConfigs[index]
      if (oldConfig) {
        // 检查原始数据变化（需要重新获取数据）
        const rawDataChanged = newConfig.rawDataList !== oldConfig.rawDataList
        
        // 检查处理配置变化（只需要重新处理已有数据）
        const processingChanged = (
          newConfig.type !== oldConfig.type || 
          newConfig.script !== oldConfig.script ||
          newConfig.selectedIndex !== oldConfig.selectedIndex
        )
        
        if (rawDataChanged || processingChanged) {
          console.log(`🔧 [Reactive] 数据源 ${newConfig.key} 配置变化:`, {
            finalProcessingType: newConfig.type !== oldConfig.type ? 'changed' : 'unchanged',
            finalProcessingScript: newConfig.script !== oldConfig.script ? 'changed' : 'unchanged',
            rawDataList: rawDataChanged ? 'changed' : 'unchanged',
            selectedIndex: newConfig.selectedIndex !== oldConfig.selectedIndex ? 'changed' : 'unchanged'
          })
          
          if (rawDataChanged) {
            // 原始数据变化，需要重新获取和处理
            console.log(`📊 [Reactive] 原始数据变化，重新获取和处理: ${newConfig.key}`)
            debouncedFinalDataUpdate(newConfig.key)
          } else if (processingChanged) {
            // 只是处理配置变化，仅重新处理已有数据
            console.log(`🔧 [Reactive] 处理配置变化，仅重新处理数据: ${newConfig.key}`)
            debouncedProcessingOnlyUpdate(newConfig.key)
          }
        }
      }
    })
  },
  { deep: true }
)

// 🔥 监听 selectedWidgetId 变化，重新初始化
watch(
  () => props.selectedWidgetId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      console.log('🔄 [DataSourceConfigForm] selectedWidgetId 变化，重新初始化:', { oldId, newId })
      initializeData()
    }
  },
  { immediate: false }
)

// 监听 props 变化，重新初始化
watch(
  () => props.dataSources,
  () => {
    initializeData()
  },
  { deep: true }
)

// 🔥 调试：监听dataValues变化
watch(
  () => dataValues,
  newDataValues => {
    console.log('🔧 [DEBUG-Config] dataValues变化:', {
      keys: Object.keys(newDataValues),
      values: newDataValues
    })
  },
  { deep: true, immediate: true }
)

// 🆕 导出配置功能
// 🔥 修复：导出所有数据源的完整配置
const exportAllConfig = () => {
  try {
    // 构建所有数据源的配置
    const allDataSourcesConfig: Record<string, any> = {}
    
    props.dataSources.forEach(dataSource => {
      const dataSourceValue = dataValues[dataSource.key]
      if (dataSourceValue) {
        allDataSourcesConfig[dataSource.key] = {
          name: dataSource.name,
          fieldsToMap: dataSource.fieldsToMap,
          configuration: {
            rawDataList: dataSourceValue.rawDataList,
            finalProcessingType: dataSourceValue.finalProcessingType,
            finalProcessingScript: dataSourceValue.finalProcessingScript,
            selectedDataItemIndex: dataSourceValue.selectedDataItemIndex,
            finalProcessingConfig: dataSourceValue.finalProcessingConfig
          },
          currentData: dataSourceValue.currentData
        }
      }
    })
    
    // 构建完整导出配置
    const exportData = {
      version: '2.0.0',
      exportTime: new Date().toISOString(),
      selectedWidgetId: props.selectedWidgetId,
      dataSources: allDataSourcesConfig,
      systemConfig: {
        features: ['rawDataManagement', 'scriptProcessing', 'dataFiltering', 'httpRequests'],
        configVersion: '2.1',
        lastUpdateTime: new Date().toISOString()
      }
    }
    
    // 转换为JSON字符串
    const configJson = JSON.stringify(exportData, null, 2)
    
    // 创建下载文件
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `datasource_complete_config_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('📤 [Export] 导出完整配置:', {
      dataSourceCount: Object.keys(allDataSourcesConfig).length,
      totalRawDataItems: Object.values(allDataSourcesConfig).reduce((sum, ds: any) => sum + (ds.configuration.rawDataList?.length || 0), 0),
      exportData
    })
    
    window.$message?.success(`导出成功！包含 ${Object.keys(allDataSourcesConfig).length} 个数据源的完整配置`)
    
  } catch (error) {
    console.error('❌ [Export] 导出失败:', error)
    window.$message?.error('导出失败: ' + (error instanceof Error ? error.message : String(error)))
  }
}

// 🔥 兼容性：保留单个数据源导出功能（现在调用完整导出）
const exportConfig = (dataSourceKey: string) => {
  console.warn('⚠️ [Export] 使用单个数据源导出，现在导出所有数据源')
  exportAllConfig() // 直接调用完整导出
}

// 🆕 导入配置功能
const confirmImport = () => {
  try {
    if (!importConfigContent.value.trim()) {
      window.$message?.error('请输入配置内容')
      return
    }

    // 解析配置
    const importData = JSON.parse(importConfigContent.value)
    
    // 🔥 修复：支持新的完整配置格式（v2.0.0）和旧格式兼容性
    let importedDataSources: Record<string, any> = {}
    let importStats = { total: 0, success: 0, failed: 0 }
    
    if (importData.version === '2.0.0' && importData.dataSources) {
      // 新格式：完整配置
      console.log('📥 [Import] 检测到v2.0完整配置格式')
      importedDataSources = importData.dataSources
    } else if (importData.dataSourceKey && importData.configuration) {
      // 旧格式：单个数据源
      console.log('📥 [Import] 检测到旧版单数据源格式，转换为新格式')
      importedDataSources = {
        [importData.dataSourceKey]: {
          configuration: importData.configuration
        }
      }
    } else {
      window.$message?.error('配置格式不正确，请检查JSON格式')
      return
    }

    // 批量导入所有数据源
    Object.entries(importedDataSources).forEach(([dataSourceKey, sourceConfig]) => {
      importStats.total++
      
      try {
        // 检查目标数据源是否存在
        if (!dataValues[dataSourceKey]) {
          console.warn(`⚠️ [Import] 数据源 "${dataSourceKey}" 不存在，跳过导入`)
          importStats.failed++
          return
        }

        // 导入配置到目标数据源
        const targetDataSource = dataValues[dataSourceKey]
        const configuration = sourceConfig.configuration
        
        if (configuration.rawDataList) {
          targetDataSource.rawDataList = configuration.rawDataList
        }
        if (configuration.finalProcessingType) {
          targetDataSource.finalProcessingType = configuration.finalProcessingType
        }
        if (configuration.finalProcessingScript) {
          targetDataSource.finalProcessingScript = configuration.finalProcessingScript
        }
        if (configuration.selectedDataItemIndex !== undefined) {
          targetDataSource.selectedDataItemIndex = configuration.selectedDataItemIndex
        }
        if (configuration.finalProcessingConfig) {
          targetDataSource.finalProcessingConfig = configuration.finalProcessingConfig
        }
        
        // 如果有当前数据，也恢复
        if (sourceConfig.currentData) {
          targetDataSource.currentData = sourceConfig.currentData
        }

        console.log(`📥 [Import] 数据源 "${dataSourceKey}" 导入成功`)
        importStats.success++
        
        // 更新最终数据
        updateFinalData(dataSourceKey).catch(error => {
          console.error(`❌ [Import] 数据源 "${dataSourceKey}" 导入后数据更新失败:`, error)
        })
        
      } catch (error) {
        console.error(`❌ [Import] 数据源 "${dataSourceKey}" 导入失败:`, error)
        importStats.failed++
      }
    })

    console.log('📥 [Import] 批量导入完成:', importStats)

    // 通知外部组件
    sendUpdate()
    
    // 显示导入结果
    if (importStats.success > 0) {
      window.$message?.success(`导入完成！成功: ${importStats.success} 个数据源，失败: ${importStats.failed} 个`)
    } else {
      window.$message?.error('导入失败，没有数据源被成功导入')
    }
    
    // 关闭弹窗并清空内容
    showImportModal.value = false
    importConfigContent.value = ''
    
  } catch (error) {
    console.error('❌ [Import] 导入失败:', error)
    window.$message?.error('导入失败: ' + (error instanceof Error ? error.message : String(error)))
  }
}

// 🆕 取消导入
const cancelImport = () => {
  showImportModal.value = false
  importConfigContent.value = ''
}
</script>

<style scoped>
.data-source-config-form {
  width: 100%;
}

.data-source-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.example-data-icon {
  color: var(--text-color-3);
  margin-left: 8px;
  cursor: help;
  transition: color 0.2s;
}

.example-data-icon:hover {
  color: var(--primary-color);
}

.example-data-tooltip {
  max-width: 350px;
  padding: 4px 0;
}

.tooltip-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
  opacity: 0.9;
}

.example-code-container {
  background: var(--code-color, var(--card-color));
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.example-code {
  margin: 0;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-color);
  background: transparent;
  overflow-x: auto;
  white-space: pre;
  max-height: 200px;
  overflow-y: auto;
}

/* 明暗主题适配 */
[data-theme='dark'] .example-code-container {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .example-code {
  color: rgba(255, 255, 255, 0.9);
}

[data-theme='light'] .example-code-container {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme='light'] .example-code {
  color: rgba(0, 0, 0, 0.85);
}

/* 滚动条美化 */
.example-code::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.example-code::-webkit-scrollbar-track {
  background: transparent;
}

.example-code::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.example-code::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}

.data-source-content {
  padding: 16px;
  background: var(--card-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

/* 添加按钮样式 - 极简经济设计 */
.add-data-btn {
  width: 100%;
  border-style: dashed;
  border-width: 1px;
  background: transparent;
  transition: all 0.2s ease;
  font-size: 12px;
  height: 28px;
  color: var(--text-color-3);
}

.add-data-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--primary-color-hover);
}

.add-data-btn:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-pressed);
}

/* 原始数据列表样式 */
.raw-data-list {
  max-height: 200px;
  overflow-y: auto;
}

.raw-data-item-compact {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  margin-bottom: 3px;
  transition: all 0.15s;
  background-color: var(--card-color);
  font-size: 12px;
}

.raw-data-item-compact:hover {
  border-color: var(--primary-color);
  background-color: var(--hover-color);
}

/* 紧凑按钮样式 */
.compact-btn {
  min-width: 36px;
  height: 20px;
  font-size: 10px;
  padding: 0 6px;
  border-radius: 3px;
}

.compact-btn:hover {
  transform: none;
  box-shadow: none;
}

.raw-data-name {
  font-weight: 500;
  color: var(--text-color);
}

/* 🔥 新增：动态表单区域样式 - 紧凑化布局 */
.dynamic-form-area {
  margin-top: 6px;
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  padding: 8px;
  background: var(--hover-color);
  transition: all 0.2s ease;
  min-height: 60px;
}

.dynamic-form-area:hover {
  border-color: var(--primary-color);
  background: var(--primary-color-hover);
}

/* 弹窗内部表单项紧凑化 */
.dynamic-form-area .n-form-item {
  margin-bottom: 0;
}

/* 弹窗文本区域优化 */
.dynamic-form-area .n-input__textarea-el {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.4;
}

/* 类型标签样式调整 */
.dynamic-form-area .n-tag {
  transition: all 0.15s ease;
}

.dynamic-form-area .n-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 明暗主题适配 */
[data-theme='dark'] .dynamic-form-area {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .dynamic-form-area:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--primary-color);
}

[data-theme='light'] .dynamic-form-area {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme='light'] .dynamic-form-area:hover {
  background: rgba(0, 0, 0, 0.03);
  border-color: var(--primary-color);
}

/* 🔥 简化：移除复杂样式，使用标准表单样式 */

/* 文本编辑器容器样式 */
.text-editor-container {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  overflow: hidden;
  background: var(--card-color);
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: var(--hover-color);
  border-bottom: 1px solid var(--border-color);
  min-height: 32px;
}

/* 暗主题适配 */
[data-theme='dark'] .text-editor-container {
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .editor-toolbar {
  background: rgba(255, 255, 255, 0.05);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

/* 工具栏按钮样式 */
.editor-toolbar :deep(.n-button) {
  height: 24px;
  padding: 0 6px;
  font-size: 11px;
}

.editor-toolbar :deep(.n-button .n-icon) {
  font-size: 12px;
}

/* 🆕 HTTP相关样式 */
.http-headers-list,
.param-list,
.form-data-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px;
  background: var(--card-color);
}

.header-item,
.param-item,
.form-data-item {
  padding: 4px 0;
  border-bottom: 1px solid var(--divider-color);
}

.header-item:last-child,
.param-item:last-child,
.form-data-item:last-child {
  border-bottom: none;
}

/* API列表样式 */
.api-list {
  max-height: 400px;
  overflow-y: auto;
}

.api-item :deep(.n-card) {
  transition: all 0.2s ease;
}

.api-item :deep(.n-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
