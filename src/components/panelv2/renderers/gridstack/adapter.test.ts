// GridStack数据适配器测试文件
// GridStack data adapter test file

import { GridStackAdapter } from './adapter'
import type { ExternalPanelData } from './adapter'

// 测试数据 - 基于用户提供的真实数据
const testPanelData: ExternalPanelData = {
  "id": "fb368f9b-dc2b-ef3e-d444-f304b9f8cf8b",
  "name": "home",
  "config": "[{\"x\":6,\"y\":0,\"w\":3,\"h\":2,\"minW\":2,\"minH\":2,\"i\":1745306022634299,\"data\":{\"cardId\":\"on-num\",\"type\":\"builtin\",\"title\":\"在线设备数\",\"config\":{},\"layout\":{\"w\":3,\"h\":2,\"minH\":2,\"minW\":2},\"basicSettings\":{},\"dataSource\":{\"origin\":\"system\",\"systemSource\":[{}],\"deviceSource\":[{}]}},\"moved\":false},{\"x\":0,\"y\":0,\"w\":3,\"h\":2,\"minW\":2,\"minH\":2,\"i\":1745296008998001,\"data\":{\"cardId\":\"access-num\",\"type\":\"builtin\",\"title\":\"设备总数\",\"config\":{},\"layout\":{\"w\":3,\"h\":2,\"minH\":2,\"minW\":2},\"basicSettings\":{},\"dataSource\":{\"origin\":\"system\",\"systemSource\":[{}],\"deviceSource\":[{}]}},\"moved\":false}]",
  "tenant_id": "63a4b529",
  "created_at": "2025-03-25T11:28:21.500215+08:00",
  "updated_at": "2025-06-13T15:07:07.107459+08:00",
  "home_flag": "Y",
  "description": "123",
  "remark": null,
  "menu_flag": ""
}

// 测试函数
export function testGridStackAdapter() {
  console.log('🧪 GridStack数据适配器测试开始')
  
  // 1. 数据验证测试
  console.log('\n1️⃣ 数据验证测试:')
  const validation = GridStackAdapter.validateExternalData(testPanelData)
  console.log('验证结果:', validation)
  
  // 2. 数据解析测试
  console.log('\n2️⃣ 数据解析测试:')
  const parsedItems = GridStackAdapter.parsePanelData(testPanelData)
  console.log('解析的项目数量:', parsedItems.length)
  console.log('第一个项目:', parsedItems[0])
  
  // 3. 数据转换测试
  console.log('\n3️⃣ 数据转换测试:')
  const gridStackItems = GridStackAdapter.convertPanelToGridStackItems(testPanelData)
  console.log('转换后的GridStack项目数量:', gridStackItems.length)
  console.log('第一个GridStack项目:', gridStackItems[0])
  
  // 4. 反向转换测试
  console.log('\n4️⃣ 反向转换测试:')
  if (gridStackItems.length > 0) {
    const backConverted = GridStackAdapter.convertFromGridStackItem(gridStackItems[0])
    console.log('反向转换结果:', backConverted)
  }
  
  // 5. 统计信息测试
  console.log('\n5️⃣ 统计信息测试:')
  const statistics = GridStackAdapter.getDataStatistics(testPanelData)
  console.log('数据统计:', statistics)
  
  // 6. 完整转换测试
  console.log('\n6️⃣ 完整数据转换测试:')
  const convertedPanel = GridStackAdapter.convertToExternalPanelData(
    gridStackItems,
    { id: testPanelData.id, name: testPanelData.name }
  )
  console.log('转换后的面板配置:', convertedPanel)
  
  console.log('\n✅ GridStack数据适配器测试完成!')
  
  return {
    validation,
    parsedItems,
    gridStackItems,
    statistics,
    convertedPanel
  }
}

// 导出测试数据供其他地方使用
export { testPanelData }