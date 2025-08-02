<template>
  <div class="settings-panel">
    <!-- WIDGET SETTINGS -->
    <div v-if="selectedWidget">
      <h3 class="panel-title">{{ widgetName }} 属性配置</h3>

      <n-collapse :default-expanded-names="['base', 'props']">
        <!-- 基础配置 -->
        <n-collapse-item name="base">
          <template #header>
            <h4 class="section-title">基础配置</h4>
          </template>
          <n-form label-placement="left" label-width="auto" size="small">
            <n-form-item label="显示标题">
              <n-switch v-model:value="editableProps.showLabel" @update:value="updateNode" />
            </n-form-item>
            <n-form-item label="标题">
              <n-input v-model:value="editableProps.label" @update:value="updateNode" />
            </n-form-item>
          </n-form>
        </n-collapse-item>

        <!-- 组件属性 -->
        <n-collapse-item v-if="hasProperties" name="props">
          <template #header>
            <h4 class="section-title">组件属性</h4>
          </template>
          <n-form label-placement="left" label-width="auto" size="small">
            <n-form-item v-for="(propDef, key) in selectedWidget.metadata?.card2Definition?.properties" :key="key" :label="propDef.label || String(key)">
              <n-input
                v-if="propDef.type === 'string'"
                v-model:value="editableProps.properties[key]"
                @update:value="updateNode"
              />
              <n-input-number
                v-else-if="propDef.type === 'number'"
                v-model:value="editableProps.properties[key]"
                @update:value="updateNode"
              />
              <n-switch
                v-else-if="propDef.type === 'boolean'"
                v-model:value="editableProps.properties[key]"
                @update:value="updateNode"
              />
              <n-text v-else depth="3">不支持的属性类型: {{ propDef.type }}</n-text>
            </n-form-item>
          </n-form>
        </n-collapse-item>

        <!-- 交互配置 -->
        <n-collapse-item name="interaction">
           <template #header>
            <h4 class="section-title">交互配置</h4>
          </template>
          <n-form label-placement="left" label-width="auto" size="small">
            <n-form-item label="点击事件">
              <n-select
                v-model:value="editableProps.interaction.onClick.type"
                :options="interactionTypeOptions"
                @update:value="updateNode"
              />
            </n-form-item>
            <n-form-item v-if="editableProps.interaction.onClick.type === 'link'" label="目标URL">
               <n-input v-model:value="editableProps.interaction.onClick.payload.url" @update:value="updateNode" />
            </n-form-item>
             <n-form-item v-if="editableProps.interaction.onClick.type === 'link'" label="新标签页打开">
               <n-switch v-model:value="editableProps.interaction.onClick.payload.newTab" @update:value="updateNode" />
            </n-form-item>
            <n-form-item v-if="editableProps.interaction.onClick.type === 'internal_route'" label="内部路由">
               <n-input v-model:value="editableProps.interaction.onClick.payload.route" @update:value="updateNode" />
            </n-form-item>
          </n-form>
        </n-collapse-item>
        
        <!-- 数据源配置 -->
        <n-collapse-item name="datasource">
           <template #header>
            <h4 class="section-title">数据源</h4>
          </template>
          <p>数据源配置区域（待实现）</p>
        </n-collapse-item>

      </n-collapse>
    </div>
    <!-- CANVAS SETTINGS -->
    <div v-else class="placeholder">
      <h3 class="panel-title">画布设置</h3>
      <p class="placeholder-text">请选择一个组件以编辑属性</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NForm, NFormItem, NInput, NInputNumber, NSwitch, NText, NCollapse, NCollapseItem, NSelect } from 'naive-ui';
import { useEditor } from '../hooks';
import type { VisualEditorWidget } from '../types';
import { cloneDeep } from 'lodash-es';

const props = defineProps<{
  selectedWidget: VisualEditorWidget | null;
}>();

const { stateManager } = useEditor();

const editableProps = ref<any>({});

const interactionTypeOptions = [
  { label: '无', value: 'none' },
  { label: '外部链接', value: 'link' },
  { label: '内部路由', value: 'internal_route' },
]

watch(() => props.selectedWidget, (widget) => {
  if (widget) {
    editableProps.value = cloneDeep({
      label: widget.label,
      showLabel: widget.showLabel,
      properties: widget.properties || {},
      interaction: widget.interaction || {
        onClick: { type: 'none', payload: {} }
      }
    });
  } else {
    editableProps.value = {};
  }
}, { immediate: true, deep: true });

const widgetName = computed(() => {
  return props.selectedWidget?.metadata?.card2Definition?.meta?.name || props.selectedWidget?.type || '';
});

const hasProperties = computed(() => {
  return props.selectedWidget && props.selectedWidget.properties && Object.keys(props.selectedWidget.properties).length > 0;
});

const updateNode = () => {
  if (props.selectedWidget) {
    stateManager.updateNode(props.selectedWidget.id, {
      label: editableProps.value.label,
      showLabel: editableProps.value.showLabel,
      properties: editableProps.value.properties,
      interaction: editableProps.value.interaction,
    });
  }
};

</script>

<style scoped>
.settings-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}
.panel-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}
.section-title {
  font-size: 14px;
  font-weight: 500;
}
.placeholder {
  text-align: center;
  padding-top: 40px;
}
.placeholder-text {
  margin-top: 12px;
  color: #999;
}
</style>
