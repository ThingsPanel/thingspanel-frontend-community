<template>
<div class="rounded card p-4">
  <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
    <el-col>
      <TableTitle>{{ $t("ALARM.WARNINFO")}}</TableTitle>
    </el-col>
  </el-row>

  <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
    <!--  业务筛选  -->
    <el-col :span="4">
      <BusinessSelector
          :business_id.sync="params.business_id"
          @change="handleBusinessSelectorChange"></BusinessSelector>
    </el-col>

    <!--  分组  -->
    <el-col :span="4">
      <DeviceGroupSelector
          :business_id="params.business_id"
          :asset_id.sync="params.asset_id"
          @change="handleSearch()"></DeviceGroupSelector>
    </el-col>

    <!--  日期筛选  -->
    <el-col :span="7">
      <el-date-picker
          class="w-100"
          v-model="datetimerange"
          :picker-options="DatePickerOptions"
          @change="handleSearch()"
          @clear="handleSearch()"
          type="datetimerange"
          :start-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER5')"
          :range-separator="$t('DATA_MANAGEMENT.PLACEHOLDER6')"
          :end-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER7')">
      </el-date-picker>
    </el-col>

    <el-col :span="7">
      <el-button type="border" size="medium" @click="handleSearch()">{{ $t("DATA_MANAGEMENT.SEARCH")}}</el-button>
<!--      <el-button type="default" size="medium" @click="handleReset()">重置</el-button>-->
    </el-col>
  </el-row>

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column :label="$t('ALARM.NO')" type="index"></el-table-column>
    <el-table-column :label="$t('ALARM.ALARMTIME')" prop="created_at" width="180" ></el-table-column>
    <el-table-column :label="$t('ALARM.BUSINESSNAME')" prop="business_name" width="220"></el-table-column>
    <el-table-column :label="$t('ALARM.DEVICENAME1')" prop="device_name" width="220"></el-table-column>
<!--    <el-table-column label="指标名" prop="asset_name"></el-table-column>-->
<!--    <el-table-column label="当前值"></el-table-column>-->
    <el-table-column :label="$t('ALARM.TRIGGERCONDITIONS')" prop="describe" :show-overflow-tooltip="true">
      <template v-slot="scope">
        <p class="table-describe mad">{{ scope.row.describe }}</p>
      </template>
    </el-table-column>
  </el-table>
  <!-- 表 end -->

  <div class="text-right py-3">
    <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="params.page"
        :page-size="params.limit"
        @current-change="getAlarmIndex"></el-pagination>
  </div>

</div>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import useAlarmIndex from "@/view/pages/alarm/useAlarmIndex";
import DatePickerOptions from "@/utils/DatePickerOptions";
import BusinessSelector from "@/components/common/BusinessSelector.vue"
import AssertSelector from "@/components/common/AssertSelector.vue"
import TableTitle from "@/components/common/TableTitle.vue"
import DeviceGroupSelector from "@/components/common/DeviceGroupSelector.vue"

export default defineComponent({
  name: "AlarmIndex",
  components: {
    BusinessSelector,
    AssertSelector,
    TableTitle,
    DeviceGroupSelector,
  },
  setup(){
    // 表单数据
    let {
      tableData,
      loading,
      params,
      total,
      getAlarmIndex,
      handleReset,
      handleSearch,
      datetimerange,
    } = useAlarmIndex()

    // 清除 business 选择器
    function handleBusinessSelectorChange(){
      // 清除资产的筛选
      params.asset_id = ""
      handleSearch()
    }


    return {
      tableData,
      loading,
      params,
      total,
      getAlarmIndex,
      handleReset,
      handleSearch,
      datetimerange,
      DatePickerOptions,
      handleBusinessSelectorChange,
    }
  }
})
</script>

<style scoped>
.el-table-column {

}
.mad{
  margin-bottom: 0;
}
</style>