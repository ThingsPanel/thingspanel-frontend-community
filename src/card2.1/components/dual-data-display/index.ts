import dualDataDisplayDefinition from './definition'
import { propertyExposureRegistry } from '@/card2.1/core/property-exposure'

// 注册属性暴露配置
if (dualDataDisplayDefinition.interaction?.propertyExposure) {
  propertyExposureRegistry.register(dualDataDisplayDefinition.interaction.propertyExposure)
  console.log(
    '🔌 [DualDataDisplay] 属性暴露配置已注册:',
    dualDataDisplayDefinition.interaction.propertyExposure.componentType
  )
}

export default dualDataDisplayDefinition
