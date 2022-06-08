<template>
<div class="rounded card p-4 el-table-transparent">
  <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
    <!--  业务筛选  -->
    <el-col :span="4">
      <el-cascader
          placeholder="请选择业务"
          v-model="businessCascaderData"
          size="medium"
          :props="businessProps"
          clearable
          class="w-100"
          @change="handleBusinessCascaderClear()"
      >
      </el-cascader>
    </el-col>

    <!--  资产  -->
    <el-col :span="4">
      <el-cascader
          placeholder="请选择资产"
          v-model="assetCascaderData"
          size="medium"
          :props="assetProps"
          :options="assetOptions"
          clearable
          :show-all-levels="false"
          class="w-100"
          @change="handleSearch()"
      >
      </el-cascader>
    </el-col>

    <!--  设备  -->
<!--    <el-col :span="4">-->
<!--      <el-input size="medium"></el-input>-->
<!--    </el-col>-->

    <!--  日期筛选  -->
    <el-col :span="8">
      <el-date-picker
          class="w-100"
          v-model="datetimerange"
          :picker-options="DatePickerOptions"
          value-format="yyyy/MM/dd HH:mm:ss"
          @change="handleSearch()"
          @clear="handleSearch()"
          size="medium"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期">
      </el-date-picker>
    </el-col>

    <el-col :span="4"></el-col>

    <el-col :span="2">
      <el-button class="w-100" type="indigo" size="medium" @click="handleSearch()">查询</el-button>
    </el-col>
    <el-col :span="2">
      <el-button class="w-100" type="default" size="medium" @click="handleReset()">重置</el-button>
    </el-col>
  </el-row>

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column align="center" label="告警时间" prop="created_at"></el-table-column>
    <el-table-column align="center" label="业务名" prop="business_name"></el-table-column>
    <el-table-column align="center" label="设备名" prop="device_name"></el-table-column>
<!--    <el-table-column align="center" label="指标名" prop="asset_name"></el-table-column>-->
<!--    <el-table-column align="center" label="当前值"></el-table-column>-->
    <el-table-column align="center" label="触发条件" prop="describe"></el-table-column>
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
import useAlarmSelect from "@/view/pages/alarm/useAlarmSelect";

export default defineComponent({
  name: "AlarmIndex",
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


    // 选择
    let {
      businessCascaderData,
      businessProps,
      assetOptions,
      assetProps,
      assetCascaderData,
    } = useAlarmSelect(params)

    // 清除 business 选择器
    function handleBusinessCascaderClear(){
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
      businessProps,
      businessCascaderData,
      assetOptions,
      assetProps,
      assetCascaderData,
      handleBusinessCascaderClear,
    }
  }
})
</script>

<style scoped>

</style>