<template>
<div class="rounded card p-4 el-table-transparent">
  <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
    <el-col>
      <TableTitle>告警信息</TableTitle>
    </el-col>
  </el-row>

  <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
    <!--  业务筛选  -->
    <el-col :span="4">
      <BusinessSelector
          :business_id.sync="params.business_id"
          @change="handleBusinessSelectorChange"></BusinessSelector>
    </el-col>

    <!--  资产  -->
    <el-col :span="4">
      <AssertSelector
          :business_id="params.business_id"
          :asset_id.sync="params.asset_id"
          @change="handleSearch()"></AssertSelector>
    </el-col>

    <!--  设备  -->
<!--    <el-col :span="4">-->
<!--      <el-input size="medium"></el-input>-->
<!--    </el-col>-->

    <!--  日期筛选  -->
    <el-col :span="6">
      <el-date-picker
          class="w-100"
          v-model="datetimerange"
          :picker-options="DatePickerOptions"
          @change="handleSearch()"
          @clear="handleSearch()"
          size="medium"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期">
      </el-date-picker>
    </el-col>

    <el-col :span="10" class="text-right">
      <el-button type="indigo" size="medium" @click="handleSearch()">查询</el-button>
<!--      <el-button type="default" size="medium" @click="handleReset()">重置</el-button>-->
    </el-col>
  </el-row>

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column label="序号" type="index"></el-table-column>
    <el-table-column label="告警时间" prop="created_at"></el-table-column>
    <el-table-column label="业务名" prop="business_name"></el-table-column>
    <el-table-column label="设备名" prop="device_name"></el-table-column>
<!--    <el-table-column label="指标名" prop="asset_name"></el-table-column>-->
<!--    <el-table-column label="当前值"></el-table-column>-->
    <el-table-column label="触发条件" prop="describe" width="400"></el-table-column>
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

export default defineComponent({
  name: "AlarmIndex",
  components: {
    BusinessSelector,
    AssertSelector,
    TableTitle,
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

</style>