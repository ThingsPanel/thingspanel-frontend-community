<template>
<div class="rounded card p-4 el-table-transparent">
  <!-- 头 start -->
  <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
    <el-col :span="5">
      <el-cascader
          placeholder="请选择业务"
          v-model="cascaderData"
          size="medium"
          :props="calenderProps"
          clearable
          @change="handleSearch()"
          class="w-100">
      </el-cascader>
    </el-col>
    <el-col :span="5">
      <el-input v-model="params.token" placeholder="请输入要筛选的token" size="medium" clearable @clear="handleSearch()">
<!--        <template slot="prepend">token</template>-->
      </el-input>
    </el-col>
    <el-col :span="8">
      <el-date-picker
          v-model="datetimerange"
          :picker-options="DatePickerOptions"
          :clearable="false"
          value-format="yyyy-MM-dd HH:mm:ss"
          @change="handleSearch()"
          size="medium"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期">
      </el-date-picker>
    </el-col>
    <el-col :span="2">
      <el-button class="w-100" type="indigo" size="medium" @click="handleSearch()">查询</el-button>
    </el-col>
    <el-col :span="2">
      <el-popconfirm :title="`确定导出 ${total} 条数据吗?`" @confirm="handleExport()">
        <el-button slot="reference" class="w-100" type="indigo" size="medium">导出</el-button>
      </el-popconfirm>
    </el-col>
    <el-col :span="2">
      <el-button class="w-100" type="default" size="medium" @click="handleReset()">重置</el-button>
    </el-col>
  </el-row>
  <!-- 头 end -->

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column align="center" label="业务名称" prop="bname"></el-table-column>
    <el-table-column align="center" label="设备分组名称" prop="name"></el-table-column>
    <el-table-column align="center" label="Token" prop="token">
      <template v-slot="scope">
        <span class="cursor-pointer" @click="handleSearch({token: scope.row.token})">{{scope.row.token}}</span>
      </template>
    </el-table-column>
    <el-table-column align="center" label="时间" prop="ts"></el-table-column>
    <el-table-column align="center" label="数据标签" prop="key"></el-table-column>
    <el-table-column align="center" label="值" prop="dbl_v"></el-table-column>
    <el-table-column align="center" label="设备插件" prop="entity_type"></el-table-column>
  </el-table>
  <!-- 表 end -->

  <div class="text-right py-3">
    <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="params.page"
        :page-size="params.limit"
        @current-change="getKvIndex"></el-pagination>
  </div>

  <el-dialog
      width="30%"
      title="导出"
      :visible.sync="exportVisible">

    <div class="text-center">
      <p>{{ downloadUrl ? downloadUrl.split('/').pop().toString() : "生成中请稍后..." }}</p>
      <p v-if="!exporting">
          <a :href="downloadUrl">点击下载</a>
      </p>
    </div>

  </el-dialog>
</div>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import DatePickerOptions from "@/utils/DatePickerOptions";
import useDataIndex from "@/view/pages/datas/useDataIndex";
import {dateFormat} from "@/utils/tool";
import useDataCalender from "@/view/pages/datas/useDataCalender";
import useDataExport from "@/view/pages/datas/useDataExport";

export default defineComponent({
  name: "DataIndex",
  setup(){

    const {
      tableData,
      loading,
      params,
      total,
      getKvIndex,
      datetimerange,
      handleSearch,
      handleReset
    } = useDataIndex()

    // 业务级联选择器
    const {
      calenderProps,
      cascaderData
    } = useDataCalender(params)


    // 导出
   const {
     exportVisible,
     downloadUrl,
     exporting,
     handleExport,
   } = useDataExport(params)



    return {
      tableData,
      loading,
      params,
      total,
      getKvIndex,
      datetimerange,
      DatePickerOptions,
      handleSearch,
      handleReset,
      dateFormat,
      calenderProps,
      cascaderData,
      handleExport,
      exportVisible,
      downloadUrl,
      exporting,
    }
  }
})
</script>

<style scoped>

</style>