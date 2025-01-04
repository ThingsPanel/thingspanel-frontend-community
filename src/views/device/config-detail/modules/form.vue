<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface';
import { find } from 'lodash';
import { $t } from '@/locales';
const rules = ref({});

const protocol_config = defineModel<any>('protocolConfig', { default: {} });

interface Props {
  formElements?: object | any;
}

const props = defineProps<Props>();
watchEffect(() => {
  const str = '{}';
  const thejson = JSON.parse(str);
  if (props.formElements) {
    props.formElements.forEach(element => {
      if (element.type === 'table') {
        protocol_config.value[element.dataKey] ??= thejson[element.dataKey] || [];
      } else {
        rules.value[element.dataKey] = element.validate || {};
        protocol_config.value[element.dataKey] ??= thejson[element.dataKey] || '';
      }
    });
  }
});

const onCreate = () => {
  return {};
};
</script>

<template>
  <div class="connection-box h-full w-full">
    <NForm :model="protocol_config" :rules="rules" label-placement="top" class="w-full">
      <div class="w-full">
        <template v-for="element in props.formElements" :key="element.dataKey">
          <template v-if="element.type === 'input'">
            <NFormItem
              :label="element.label"
              :path="element.dataKey"
              class="w-300"
              :rules="[element.validate || { required: false }]"
            >
              <NTooltip trigger="hover" placement="top">
                <template #trigger>
                  <NInputNumber
                    v-if="element.validate.type === 'number'"
                    v-model:value="protocol_config[element.dataKey]"
                    :placeholder="element.placeholder"
                  />
                  <NInput v-else v-model:value="protocol_config[element.dataKey]" :placeholder="element.placeholder" />
                </template>
                <template #default>
                  <span>{{ protocol_config[element.dataKey] }}</span>
                </template>
              </NTooltip>
            </NFormItem>
          </template>
          <template v-if="element.type === 'select'">
            <NFormItem
              :label="element.label"
              :path="element.dataKey"
              :rules="[element.validate || { required: false }]"
            >
              <NTooltip trigger="hover" placement="top">
                <template #trigger>
                  <NSelect
                    v-model:value="protocol_config[element.dataKey]"
                    :options="element.options as SelectMixedOption[]"
                  />
                </template>
                <template #default>
                  <span>
                    {{
                      find(element.options, {
                        value: protocol_config[element.dataKey]
                      })?.label
                    }}
                  </span>
                </template>
              </NTooltip>
            </NFormItem>
          </template>

          <template v-if="element.type === 'table'">
            <div class="w-full flex flex-col overflow-auto">
              <div class="mb-12px flex flex-1 justify-between">
                <n-ellipsis
                  v-for="subElement in element.array"
                  :key="subElement.dataKey + element.dataKey"
                  class="mr-24px min-w-[100px] flex-1"
                >
                  <span v-if="subElement?.validate?.required" class="text-[#FF3838]">*</span>

                  {{ subElement.label }}
                  <span>{{ subElement?.validate?.required ? $t('card.required') : $t('card.notRequired') }}</span>
                </n-ellipsis>
                <div class="mr-20px min-w-[68px] w-[68px]"></div>
              </div>
              <n-dynamic-input
                v-model:value="protocol_config[element.dataKey]"
                item-style="margin-bottom: 0;"
                :on-create="onCreate"
                #="{ index }"
              >
                <div class="mb-12px flex flex-1 justify-between">
                  <template v-for="subElement in element.array" :key="subElement.dataKey">
                    <template v-if="subElement.type === 'input'">
                      <div class="mr-24px min-w-[100px] flex-1">
                        <n-form-item
                          ignore-path-change
                          :show-label="false"
                          :label="subElement.label"
                          :path="`${element.dataKey}[${index}]${subElement.dataKey}`"
                          :rules="[element.validate || { required: false }]"
                        >
                          <NTooltip trigger="hover" placement="top">
                            <template #trigger>
                              <NInputNumber
                                v-if="subElement.validate.type === 'number'"
                                v-model:value="protocol_config[element.dataKey][index][subElement.dataKey]"
                                :placeholder="subElement.placeholder"
                                @keydown.enter.prevent
                              />
                              <NInput
                                v-else
                                v-model:value="protocol_config[element.dataKey][index][subElement.dataKey]"
                                :placeholder="subElement.placeholder"
                                @keydown.enter.prevent
                              />
                            </template>
                            <template #default>
                              <span>{{ protocol_config[element.dataKey][index][subElement.dataKey] }}</span>
                            </template>
                          </NTooltip>
                        </n-form-item>
                      </div>
                    </template>
                    <template v-if="subElement.type === 'select'">
                      <div class="mr-24px min-w-[100px] flex-1">
                        <n-form-item
                          style="margin-right: 24px"
                          class="mr-24px min-w-[100px] flex-1"
                          ignore-path-change
                          :show-label="false"
                          :label="subElement.label"
                          :path="`${element.dataKey}[${index}]${subElement.dataKey}`"
                          :rules="[element.validate || { required: false }]"
                        >
                          <NTooltip trigger="hover" placement="top">
                            <template #trigger>
                              <NSelect
                                v-model:value="protocol_config[element.dataKey][index][subElement.dataKey]"
                                :options="subElement.options as SelectMixedOption[]"
                              />
                            </template>
                            <template #default>
                              <span>
                                {{
                                  find(subElement.options, {
                                    value: protocol_config[element.dataKey][index][subElement.dataKey]
                                  })?.label
                                }}
                              </span>
                            </template>
                          </NTooltip>
                        </n-form-item>
                      </div>
                    </template>
                  </template>
                </div>
              </n-dynamic-input>
            </div>
          </template>
        </template>
      </div>
    </NForm>
  </div>
</template>

<style scoped lang="scss"></style>
