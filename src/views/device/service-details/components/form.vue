<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'

const rules = ref({})

const protocol_config = defineModel<any>('protocolConfig', { default: {} })

interface Props {
  formElements?: object | any
}

const props = defineProps<Props>()
const visibleElements = computed(() => {
  if (!Array.isArray(props.formElements)) return []
  return props.formElements.filter((element: any) => isRenderableElement(element) && isElementVisible(element))
})

const isRenderableElement = (element: any) => {
  return !!element && typeof element === 'object' && !!element.dataKey && !!element.type
}

const isElementVisible = (element: any) => {
  const condition = element?.visibleWhen || element?.showWhen
  if (!condition) return true
  const key = condition.key || condition.field || condition.dataKey
  if (!key) return true
  const currentValue = protocol_config.value?.[key]
  if (Array.isArray(condition.values)) {
    return condition.values.includes(currentValue)
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'value')) {
    return currentValue === condition.value
  }
  return true
}

watchEffect(() => {
  const str = '{}'
  const thejson = JSON.parse(str)
  if (Array.isArray(props.formElements)) {
    props.formElements.forEach(element => {
      if (!isRenderableElement(element)) return
      if (element.type === 'table') {
        protocol_config.value[element.dataKey] ??= thejson[element.dataKey] || []
      } else {
        rules.value[element.dataKey] = element.validate || {}
        protocol_config.value[element.dataKey] ??= element.default ?? thejson[element.dataKey] ?? ''
      }
    })
  }
})

const onCreate = () => {
  return {}
}

const tableItemPath = (parentKey: string, rowIndex: number, childKey: string) => {
  return `${parentKey}[${rowIndex}]${childKey}`
}

const normalizeSelectOptions = (options: unknown): SelectMixedOption[] => {
  if (!Array.isArray(options)) return []
  return options.filter((option): option is SelectMixedOption => !!option && typeof option === 'object')
}
</script>

<template>
  <div class="connection-box">
    <NForm :model="protocol_config" :rules="rules" label-placement="top" class="w-full">
      <div class="w-full">
        <template v-for="element in visibleElements" :key="element.dataKey">
          <div v-if="element.type === 'input'">
            <NFormItem :label="element.label" :path="element.dataKey">
              <NInputNumber
                v-if="element.validate.type === 'number'"
                v-model:value="protocol_config[element.dataKey]"
                :placeholder="element.placeholder"
              />
              <NInput
                v-else
                v-model:value="protocol_config[element.dataKey]"
                :placeholder="element.placeholder"
                :type="element.inputType === 'password' ? 'password' : 'text'"
                show-password-on="click"
              />
            </NFormItem>
          </div>
          <div v-if="element.type === 'select'">
            <NFormItem :label="element.label" :path="element.dataKey">
              <NSelect
                v-model:value="protocol_config[element.dataKey]"
                :options="normalizeSelectOptions(element.options)"
              />
            </NFormItem>
          </div>

          <template v-if="element.type === 'table'">
            <div class="mb-12px w-full flex justify-between">
              <n-ellipsis
                v-for="subElement in element.array"
                :key="subElement.dataKey + element.dataKey"
                class="mr-24px flex-1"
              >
                {{ subElement.label }}
              </n-ellipsis>
              <div class="ml-20px w-68px"></div>
            </div>
            <n-dynamic-input
              v-model:value="protocol_config[element.dataKey]"
              item-style="margin-bottom: 0;"
              :on-create="onCreate"
              #="{ index }"
            >
              <div class="w-full flex justify-between">
                <template v-for="subElement in element.array" :key="subElement.dataKey">
                  <template v-if="subElement.type === 'input'">
                    <n-form-item
                      class="flex-1"
                      ignore-path-change
                      :show-label="false"
                      :label="subElement.label"
                      :path="tableItemPath(element.dataKey, index, subElement.dataKey)"
                      :rule="element.validate"
                    >
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
                    </n-form-item>
                  </template>
                  <template v-if="subElement.type === 'select'">
                    <n-form-item
                      class="flex-1"
                      ignore-path-change
                      :show-label="false"
                      :label="subElement.label"
                      :path="tableItemPath(element.dataKey, index, subElement.dataKey)"
                      :rule="element.validate"
                    >
                      <NSelect
                        v-model:value="protocol_config[element.dataKey][index][subElement.dataKey]"
                        :options="normalizeSelectOptions(subElement.options)"
                      />
                    </n-form-item>
                  </template>
                  <div class="w-12px"></div>
                </template>
              </div>
            </n-dynamic-input>
          </template>
        </template>
      </div>
    </NForm>
  </div>
</template>

<style scoped lang="scss">
.connection-box {
  width: 100%;
}
</style>
