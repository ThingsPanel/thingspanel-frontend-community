<template>
<div class="equipment rounded p-4 card no-border v-application el-table-transparent">
  <div class="equipment-filter-box">
    <el-row>
      <el-col :span="2">
        <div class="label-name">设备名</div>
      </el-col>
      <el-col :span="5">
        <el-input></el-input>
      </el-col>
      <el-col :span="2" :offset="1">
        <div class="label-name pl-4">日期</div>
      </el-col>
      <el-col :span="5">
        <el-date-picker
            class="el-date-picker-custom"
            v-model="value1"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期">
        </el-date-picker>
      </el-col>
      <el-col :span="4" :offset="5">
        <div style="text-align: right; padding-right: 10px">
          <v-btn depressed color="primary">查询</v-btn>
          <v-btn class="ml-4" depressed>重置</v-btn>
        </div>
      </el-col>
    </el-row>
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
    value1: '',
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

.equipment{
  .el-tag{
    background-color: #5867dd;
    border-color: #5867dd;
    color: #fff;
  }

  .el-pagination.is-background .el-pager li:not(.disabled).active{
    background-color: #5867dd;
    border-color: #5867dd;
  }
}

.equipment-filter-box{
  padding-bottom: 10px;
  //.equipment-title{
  //  font-size: 1.5rem!important;
  //  color: #fff;
  //  font-weight: bold;
  //}

  .label-name{
    height: 100%;
    //text-align: center;
    padding-left: 10px;
    color: #fff;
    font-size: 1.25rem!important;
    line-height: 32px;
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