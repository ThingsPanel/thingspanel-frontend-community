import { ref, computed, watch } from 'vue'
import type { DataSource, ModelValue, DataSourceConfig } from '../types'

/**
 * @file 数据源状态管理
 * @description 这是一个 Composable，用于管理数据源选择和配置的状态。
 * @description 它在内部维护一个本地状态副本(localModelValue)，以确保组件内部的响应式更新能够独立、稳定地工作，
 * @description 同时通过 watch 与父组件的 v-model 进行双向同步，从而解决复杂的响应式问题。
 */

// 标准化数据源的辅助函数
// 无论传入的是数组还是对象，都统一转换为 { [key: string]: DataSource } 的形式
function normalizeDataSources(dataSources: Record<string, DataSource> | DataSource[]): Record<string, DataSource> {
  // 检查传入的是否为数组
  if (Array.isArray(dataSources)) {
    // 如果是数组，则使用 reduce 方法将其转换为对象
    return dataSources.reduce(
      (acc, ds) => {
        // 确保数据源对象自身包含一个有效的 key
        if (ds.key) {
          // 使用数据源的 key 作为新对象的键
          acc[ds.key] = ds
        }
        return acc
      },
      {} as Record<string, DataSource>
    )
  }
  // 如果传入的已经是对象，或者为 null/undefined，则直接返回（或返回一个空对象）
  return dataSources || {}
}

export function useDataSourceState(
  props: Readonly<{
    modelValue: ModelValue
    // 允许多态，父组件可以传入数组或对象
    dataSources: Record<string, DataSource> | DataSource[]
  }>,
  emit: (e: 'update:modelValue', value: ModelValue) => void
) {
  // 创建一个计算属性，它始终持有标准化的数据源对象
  const normalizedDataSources = computed(() => normalizeDataSources(props.dataSources))

  // 创建一个本地的响应式状态，作为 props.modelValue 的代理和内部的"真理之源"
  const localModelValue = ref<ModelValue>(
    JSON.parse(
      JSON.stringify(
        props.modelValue || {
          activeDataSourceKey: '',
          dataSourceBindings: {}
        }
      )
    )
  )

  console.log('🚀 useDataSourceState 初始化:', {
    propsModelValue: props.modelValue,
    localModelValue: localModelValue.value,
    dataSources: props.dataSources
  })

  // 监听外部 props 的变化，同步到本地状态
  watch(
    () => props.modelValue,
    newParentValue => {
      // 只有当外部状态与本地状态不同步时才更新，避免不必要的重渲染和循环
      if (JSON.stringify(newParentValue) !== JSON.stringify(localModelValue.value)) {
        localModelValue.value = JSON.parse(JSON.stringify(newParentValue || {}))
      }
    },
    { deep: true }
  )

  // 监听本地状态的变化，通过 emit 更新父组件
  watch(
    localModelValue,
    newLocalValue => {
      // 只有当本地状态与外部状态不同步时才发出更新事件
      if (JSON.stringify(newLocalValue) !== JSON.stringify(props.modelValue)) {
        emit('update:modelValue', newLocalValue)
      }
    },
    { deep: true }
  )

  // 核心侦听器：负责初始化和同步 activeDataSourceKey 和 dataSourceBindings
  watch(
    normalizedDataSources,
    sources => {
      console.log('🔄 normalizedDataSources watch 触发:', {
        sources,
        allKeys: Object.keys(sources),
        currentLocalModelValue: localModelValue.value
      })

      const allDataSourceKeys = Object.keys(sources)
      if (allDataSourceKeys.length === 0) {
        console.log('⚠️ 没有数据源，跳过初始化')
        return // 如果没有数据源，则不执行任何操作
      }

      let currentKey = localModelValue.value.activeDataSourceKey
      let newKey = currentKey

      // 步骤 1: 智能地确定激活的数据源 Key (newKey)
      // 场景 a: 当前 key 无效（未设置，或在新的数据源列表中不存在）
      if (!newKey || !allDataSourceKeys.includes(newKey)) {
        // 场景 b: 尝试从已有的配置绑定中找到一个有效的 key
        const bindingKeys = Object.keys(localModelValue.value.dataSourceBindings || {})
        const firstValidBindingKey = bindingKeys.find(key => allDataSourceKeys.includes(key))

        if (firstValidBindingKey) {
          // 如果找到了，就用它
          newKey = firstValidBindingKey
        } else {
          // 场景 c: 如果没有有效的绑定，则使用列表中的第一个数据源作为最后的备选
          newKey = allDataSourceKeys[0]
        }
      }

      // 步骤 2: 准备对 localModelValue 的更新
      let needsUpdate = false
      // 创建一个副本进行修改，以避免在侦听器中多次直接修改 ref
      const updatedModelValue = JSON.parse(JSON.stringify(localModelValue.value))

      // 如果经过上述逻辑后，key 发生了变化，则标记需要更新
      if (newKey && newKey !== updatedModelValue.activeDataSourceKey) {
        updatedModelValue.activeDataSourceKey = newKey
        needsUpdate = true
      }

      // 步骤 3: 确保激活的 key 有对应的配置
      // 即使 key 没有变，也可能因为 props.modelValue 的变化导致配置丢失
      if (newKey && !updatedModelValue.dataSourceBindings?.[newKey]) {
        const sourceDefinition = sources[newKey]
        // 优先使用 defaultConfig，如果不存在，则回退到 example
        const initialConfig = sourceDefinition.defaultConfig ?? sourceDefinition.example

        if (initialConfig) {
          // 初始化 dataSourceBindings（如果还不存在）
          if (!updatedModelValue.dataSourceBindings) {
            updatedModelValue.dataSourceBindings = {}
          }
          // 为新的数据源添加初始配置
          updatedModelValue.dataSourceBindings[newKey] = JSON.parse(JSON.stringify(initialConfig))
          needsUpdate = true
        }
      }

      // 步骤 4: 如果有任何更改，则一次性更新 localModelValue
      if (needsUpdate) {
        localModelValue.value = updatedModelValue
      }
    },
    { immediate: true, deep: true }
  ) // immediate: 确保初始化时立即执行; deep: 侦听数据源定义的变化

  // 当前激活的数据源 key，所有操作都基于本地状态
  const activeDataSourceKey = computed({
    get: () => localModelValue.value.activeDataSourceKey,
    set: key => {
      if (key && key !== localModelValue.value.activeDataSourceKey) {
        // 直接修改本地状态，将触发上面的 watch 来更新父组件
        localModelValue.value = {
          ...localModelValue.value,
          activeDataSourceKey: key
        }
      }
    }
  })

  // 数据源选项，基于标准化的数据源生成
  const dataSourceOptions = computed(() => {
    return Object.values(normalizedDataSources.value).map(ds => ({
      label: ds.name,
      value: ds.key
    }))
  })

  // 当前激活的数据源配置
  const activeDataSourceConfig = computed({
    get: () => {
      const key = localModelValue.value.activeDataSourceKey
      console.log('🔍 activeDataSourceConfig getter:', {
        key,
        localModelValue: localModelValue.value,
        dataSourceBindings: localModelValue.value.dataSourceBindings,
        configForKey: localModelValue.value.dataSourceBindings?.[key]
      })
      if (!key) return null
      return localModelValue.value.dataSourceBindings?.[key] ?? null
    },
    set: newConfig => {
      const key = localModelValue.value.activeDataSourceKey
      console.log('✏️ activeDataSourceConfig setter:', {
        key,
        newConfig,
        currentLocalModelValue: localModelValue.value
      })
      if (!key) return

      // 创建新的绑定对象，以确保响应式更新
      const newBindings = {
        ...(localModelValue.value.dataSourceBindings || {}),
        [key]: newConfig as DataSourceConfig
      }

      // 更新本地状态
      localModelValue.value = {
        ...localModelValue.value,
        dataSourceBindings: newBindings
      }

      console.log('✅ activeDataSourceConfig updated:', localModelValue.value)
    }
  })

  // 当前激活的数据源的完整定义
  const activeDataSource = computed(() => {
    const key = activeDataSourceKey.value
    if (!key || !normalizedDataSources.value) return null
    return normalizedDataSources.value[key] ?? null
  })

  return {
    activeDataSourceKey,
    dataSourceOptions,
    activeDataSourceConfig,
    activeDataSource
  }
}
