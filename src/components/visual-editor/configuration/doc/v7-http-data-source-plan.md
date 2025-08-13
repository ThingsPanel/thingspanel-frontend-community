# V7 优化方案：引入HTTP动态数据源

**目标:** 在V6“定义驱动UI”的成功基础上，扩展数据源配置能力，引入HTTP作为一种新的动态数据源类型。用户将能够通过配置API请求，将实时数据绑定到组件上。

---

## 核心思想：可插拔的数据源 (Pluggable Data Sources)

我们将对V6的数据结构进行扩展，使其能够支持多种数据源类型。UI将根据用户选择的数据源类型，动态显示不同的配置项。无论是静态JSON还是HTTP请求，其最终输出的数据（`rawData`）都将无缝接入V6中已定义的后续处理流程（字段映射、数据绑定）。

---

## 任务一：升级数据结构以支持多源类型

这是实现多源支持的基石。我们需要修改 `dataMappingConfig` 的结构，使其能够区分并存储不同数据源的特定配置。

**影响文件**: `v6-data-migration-plan.md` 中定义的“最终的数据结构约定”。

**修改思路**: 在 `dataSourceBindings` 的每个条目中，增加一个 `sourceType` 字段，并根据其值来决定包含哪些配置信息。

**新的数据结构约定**:

```json
{
  "staticParams": {
    "chartTitle": "我是一个动态标题"
  },
  "dataSourceBindings": {
    "mainData": {
      "sourceType": "http", // <--- 新增字段: 'static' | 'http'

      // 当 sourceType 为 'static' 时使用
      "staticData": {
        "rawData": "[{\"value\": 10, \"name\": \"A\"}]"
      },

      // 当 sourceType 为 'http' 时使用
      "httpConfig": {
        "url": "https://api.example.com/data",
        "headers": "{\n  \"Authorization\": \"Bearer ...\"\n}",
        "params": "{\n  \"page\": 1\n}",
        "responseData": "[{\"value\": 10, \"name\": \"A\"}]" // <--- 用于存储请求成功后的数据
      },

      // 公共部分，处理流程的下游
      "fieldMappings": {
        "valueField": "$.value",
        "nameField": "$.name"
      }
    }
  }
}
```

*   **关键变更**: 我们用 `sourceType` 来做区分，并用 `responseData` 字段来存储HTTP请求成功后返回的JSON数据，这个字段将扮演过去`rawData`的角色，进入后续的处理流程。

---

## 任务二：增强 `SimpleDataMappingForm.vue` - 支持数据源切换

**文件**: `e:\wbh\things2\thingspanel-frontend-community\src\components\visual-editor\configuration\forms\SimpleDataMappingForm.vue`

**重构目标**: 使表单能够根据用户选择的 `sourceType` 动态渲染出对应的配置界面。

**修改步骤**:

1.  **添加数据源类型切换器**:
    *   在每个数据源的折叠面板 (`NCollapseItem`) 内部的最上方，添加一个 `NRadioGroup` 或 `NSwitch`，让用户可以在“静态数据”和“HTTP请求”之间切换。此切换器绑定到 `modelValue.dataSourceBindings[key].sourceType`。

2.  **条件渲染配置块**:
    *   使用 `v-if="...sourceType === 'static'"` 来包裹原来的JSON编辑器。
    *   使用 `v-if="...sourceType === 'http'"` 来包裹一个新的HTTP配置表单。

3.  **实现HTTP配置表单**:
    *   该表单应包含以下输入项，并分别绑定到 `modelValue.dataSourceBindings[key].httpConfig` 的对应字段：
        *   **请求地址 (URL)**: `NInput`，用于填写 `url`。
        *   **请求头 (Headers)**: `NInput`，`type="textarea"`，用于以JSON格式填写 `headers`。
        *   **请求参数 (Params)**: `NInput`，`type="textarea"`，用于以JSON格式填写 `params`。
    *   添加一个 **“发送请求”** 按钮。

4.  **交互逻辑**:
    *   点击“发送请求”按钮时，组件不自己发送请求。而是通过 `emit` 一个自定义事件，例如 `emit('fetch-http-data', { dataSourceKey: key, config: modelValue.dataSourceBindings[key].httpConfig })`，通知父组件代为执行。
    *   在HTTP配置块下方，可以放一个只读的JSON展示区，用于显示 `httpConfig.responseData` 的内容，以便用户在请求成功后预览数据和进行字段映射。

---

## 任务三：在 `ConfigurationPanel.vue` 中编排HTTP请求

**文件**: `e:\wbh\things2\thingspanel-frontend-community\src\components\visual-editor\configuration\ConfigurationPanel.vue`

**重构目标**: 作为父组件，响应子组件的请求事件，执行HTTP调用，并将结果数据写回 `dataMappingConfig`。

**修改步骤**:

1.  **监听事件**: 在模板中，监听 `<SimpleDataMappingForm>` 派发的 `fetch-http-data` 事件。
    ```html
    <SimpleDataMappingForm
      ...
      @fetch-http-data="handleFetchHttpData"
    />
    ```

2.  **实现 `handleFetchHttpData` 方法**:
    *   该方法接收 `(payload)` 对象，包含 `dataSourceKey` 和 `config`。
    *   **执行请求**: 使用 `axios` 或其他HTTP客户端，根据 `payload.config` 中的 `url`, `headers`, `params` 发起网络请求。
    *   **处理响应**: 
        *   在请求期间，可以设置一个加载状态，并在UI上显示（例如给“发送请求”按钮添加loading状态）。
        *   请求成功后，将返回的 `response.data` 更新到 `dataMappingConfig` 的对应位置：`dataMappingConfig.value.dataSourceBindings[dataSourceKey].httpConfig.responseData = response.data`。
        *   请求失败时，通过 `NMessage` 或其他方式向用户显示错误信息。

*   **数据流闭环**: 一旦 `responseData` 被更新，由于 `v-model` 的存在，新数据会自动传递给 `SimpleDataMappingForm` 并显示在预览区域，用户可以立即开始配置字段映射。

---

## 任务四：确保配置的持久化与回显

**文件**: `e:\wbh\things2\thingspanel-frontend-community\src\components\visual-editor\configuration\ConfigurationManager.ts`

**目标**: 确保新增的HTTP配置能够被正确保存和加载。

**修改思路**: V6的 `ConfigurationManager.ts` 设计已经很好地将“数据获取”和“数据处理”解耦，因此几乎不需要修改。

*   **保存**: `applyConfiguration` 方法在持久化时，会保存完整的 `config` 对象，其中自然就包含了新的 `sourceType` 和 `httpConfig`，无需任何更改。
*   **加载**: `loadWidgetConfiguration` 加载配置时，会将保存的完整对象读出。`ConfigurationPanel.vue` 将其传递给 `SimpleDataMappingForm.vue` 后，后者会根据 `sourceType` 的值，自动渲染出正确的UI（静态JSON或HTTP配置），实现了完美回显。

**结论**:

通过以上四个任务，我们可以在现有框架下，以最小的侵入性、最清晰的逻辑，平滑地扩展出HTTP数据源功能，并为未来接入更多数据源类型（如MQTT、WebSocket等）打下坚实的基础。