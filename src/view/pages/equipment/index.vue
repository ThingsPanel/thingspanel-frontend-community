<template>
<div class=" rounded p-4 card no-border v-application el-table-transparent">
  <div class="equipment-header">
    <strong class="equipment-title">设备操作日志</strong>
  </div>
  <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%">
      <el-table-column prop="time" label="时间" width="180"></el-table-column>
      <el-table-column prop="business" label="业务名"></el-table-column>
      <el-table-column prop="device_name" label="设备名"></el-table-column>
      <el-table-column prop="device_id" label="设备id"></el-table-column>
      <el-table-column prop="command" label="指令"></el-table-column>
      <el-table-column prop="action_type" label="操作类型"></el-table-column>
      <el-table-column prop="operator" label="操作人/触发器"></el-table-column>

      <el-table-column prop="result" label="执行结果">
        <template v-slot="scope">
          <el-tag size="small" :type="scope.row.result=='成功'?'success':'primary'">
            {{ scope.row.result }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="device_status" label="设备返回状态">
          <template v-slot="scope">
            <el-tag size="small" :type="scope.row.device_status=='开' ? 'success': 'primary'">
                {{ scope.row.device_status }}
            </el-tag>
          </template>
      </el-table-column>
  </el-table>

  <el-pagination
      :disabled="loading"
      class="equipment-pagination"
      background
      layout="prev, pager, next"
      :page-size="per_page"
      @current-change="page_change"
      :total="data_count">
  </el-pagination>
</div>
</template>

<script>
import data from './data'
export default {
  name: "index",
  data:()=>({
    loading: false,
    tableData: [],
    data_list: data,
    data_count: 2,
    per_page : 10,
    page:1,
  }),
  created() {
    this.data_count = this.data_list.length
    this.get_data()
  },
  methods: {
    get_data(){
      this.tableData = this.data_list.slice((this.page-1)*this.per_page, this.page*this.per_page)
    },
    page_change(val){
      if(this.loading) return
      this.loading = true

      setTimeout(()=>{
        this.page = val
        this.get_data()
        this.loading = false
      }, 500)
    }
  }
}
</script>

<style lang="scss">
.equipment-header{
  padding-bottom: 10px;
  .equipment-title{
    font-size: 1.5rem!important;
    color: #fff;
    font-weight: bold;
  }
}
.equipment-pagination{
  padding-top: 20px;
  text-align: right;

  .el-pager{
    padding-left: 0!important;
  }
}
</style>