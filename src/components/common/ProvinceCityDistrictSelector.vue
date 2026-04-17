<template>
  <div class="province-city-district-selector">
    <!-- 省份选择 -->
    <n-select
      v-model:value="selectedProvince"
      :options="provinceOptions"
      placeholder="请选择省份"
      clearable
      filterable
      class="selector-item"
      @update:value="handleProvinceChange"
    />

    <!-- 城市选择 -->
    <n-select
      v-model:value="selectedCity"
      :options="cityOptions"
      :placeholder="isMunicipality ? '请选择区县' : '请选择城市'"
      clearable
      filterable
      :disabled="!selectedProvince"
      class="selector-item"
      @update:value="handleCityChange"
    />

    <!-- 区县选择 - 直辖市时隐藏 -->
    <n-select
      v-if="!isMunicipality"
      v-model:value="selectedDistrict"
      :options="districtOptions"
      placeholder="请选择区县"
      clearable
      filterable
      :disabled="!selectedCity"
      class="selector-item"
      @update:value="handleDistrictChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NSelect } from 'naive-ui'
import pwData from '@/views/management/user/components/pw.json'

// 定义组件的 props
interface Props {
  // 当前选中的省市区值
  province?: string
  city?: string
  district?: string
}

// 定义组件的 emits
interface Emits {
  // 当选择发生变化时触发
  change: [value: { province: string; city: string; district: string }]
}

const props = withDefaults(defineProps<Props>(), {
  province: '',
  city: '',
  district: ''
})

const emit = defineEmits<Emits>()

// 当前选中的值
const selectedProvince = ref<string>('')
const selectedCity = ref<string>('')
const selectedDistrict = ref<string>('')

// 省份选项
const provinceOptions = computed(() => {
  return pwData.map(province => ({
    label: province.name,
    value: province.name
  }))
})

// 城市选项
const cityOptions = computed(() => {
  if (!selectedProvince.value) return []

  const province = pwData.find(p => p.name === selectedProvince.value)
  if (!province || !province.children) return []

  if (isMunicipality.value) {
    // 直辖市：跳过"市辖区"层级，直接返回区县作为城市选项
    const cityDistricts = province.children.find(city => city.name === '市辖区')
    if (cityDistricts && cityDistricts.children) {
      return cityDistricts.children.map(district => ({
        label: district.name,
        value: district.name
      }))
    }
  }

  // 普通省份：返回正常的城市列表
  return province.children.map(city => ({
    label: city.name,
    value: city.name
  }))
})

// 判断是否为直辖市
const isMunicipality = computed(() => {
  const municipalities = ['北京市', '天津市', '上海市', '重庆市']
  return municipalities.includes(selectedProvince.value)
})

// 区县选项
const districtOptions = computed(() => {
  if (!selectedProvince.value || !selectedCity.value) return []

  const province = pwData.find(p => p.name === selectedProvince.value)
  if (!province || !province.children) return []

  // 直辖市不显示区县选择器
  if (isMunicipality.value) {
    return []
  }

  // 普通省份：查找对应城市的区县
  const city = province.children.find(c => c.name === selectedCity.value)
  if (!city || !city.children) return []

  return city.children.map(district => ({
    label: district.name,
    value: district.name
  }))
})

// 处理省份变化
const handleProvinceChange = (value: string | null) => {
  selectedProvince.value = value || ''
  selectedCity.value = ''
  selectedDistrict.value = ''
  emitChange()
}

// 处理城市变化
const handleCityChange = (value: string | null) => {
  selectedCity.value = value || ''
  selectedDistrict.value = ''
  emitChange()
}

// 处理区县变化
const handleDistrictChange = (value: string | null) => {
  selectedDistrict.value = value || ''
  emitChange()
}

// 触发变化事件
const emitChange = () => {
  let province = selectedProvince.value
  let city = selectedCity.value
  let district = selectedDistrict.value

  if (isMunicipality.value) {
    // 直辖市：城市就是省份，区县就是选择的"城市"
    city = selectedProvince.value
    district = selectedCity.value
  }

  emit('change', {
    province,
    city,
    district
  })
}

// 监听 props 变化，用于回显
watch(
  () => [props.province, props.city, props.district],
  ([newProvince, newCity, newDistrict]) => {
    selectedProvince.value = newProvince || ''

    // 处理直辖市的回显逻辑
    const municipalities = ['北京市', '天津市', '上海市', '重庆市']
    const isCurrentMunicipality = municipalities.includes(newProvince || '')

    if (isCurrentMunicipality) {
      // 直辖市：城市选择器显示的是区县
      selectedCity.value = newDistrict || ''
      selectedDistrict.value = ''
    } else {
      // 普通省份：正常显示
      selectedCity.value = newCity || ''
      selectedDistrict.value = newDistrict || ''
    }
  },
  { immediate: true }
)

// 组件挂载时初始化
onMounted(() => {
  // 如果有初始值，触发一次变化事件
  if (props.province || props.city || props.district) {
    emitChange()
  }
})
</script>

<style scoped>
.province-city-district-selector {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  /* 让地址选择器占据整行 */
}

.selector-item {
  min-width: 150px;
  flex: 1;
  max-width: 200px;
  /* 限制最大宽度，保持合理比例 */
}

/* 响应式布局 */
@media (max-width: 768px) {
  .province-city-district-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .selector-item {
    min-width: unset;
    max-width: unset;
  }
}

/* 平板布局 */
@media (max-width: 1024px) and (min-width: 769px) {
  .selector-item {
    max-width: 180px;
  }
}
</style>
