# 数据源订阅错误修复测试

## 修复的问题

### 1. `unsubscribeDataSource is not a function` 错误

**问题描述：**
- 在删除组件时出现 `unsubscribeDataSource is not a function` 错误
- 错误发生在 `DigitIndicatorCard.vue:136` 和 `MultiDataTestCard.vue` 中

**根本原因：**
- `dataSourceManager.subscribe()` 返回字符串ID，不是函数
- 组件代码错误地将返回值当作函数调用

**修复内容：**
- 将 `unsubscribeDataSource` 变量改为 `currentSubscriberId`
- 使用 `dataSourceManager.unsubscribe(currentSubscriberId)` 取消订阅
- 添加类型检查，只处理设备数据源
- 导入正确的类型定义

### 2. 类型不匹配问题

**问题描述：**
- TypeScript 类型错误：`DataSource` 不能赋值给 `DeviceDataSource`

**修复内容：**
- 添加类型检查 `dataSource.type === 'device'`
- 使用类型断言 `dataSource as DeviceDataSource`
- 添加对不支持数据源类型的处理

## 修复的文件

1. `src/card2.1/components/digit-indicator/DigitIndicatorCard.vue`
2. `src/card2.1/components/multi-data-test/MultiDataTestCard.vue`

## 测试步骤

1. 启动开发服务器
2. 进入可视化编辑器
3. 添加一个数字指示器组件
4. 配置数据源
5. 右键删除组件
6. 验证不再出现 `unsubscribeDataSource is not a function` 错误

## 预期结果

- 删除组件时不再出现订阅相关的错误
- 数据源订阅和取消订阅正常工作
- 类型检查通过，没有 TypeScript 错误 