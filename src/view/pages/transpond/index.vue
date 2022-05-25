<template>
<div class="transpond rounded p-4 card no-border v-application el-table-transparent">
  <div class="transpond-header">
    <strong class="transpond-title">数据转发</strong>
    <v-btn class="create-btn" color="primary" @click="dialogVisible = true">创建转发</v-btn>
  </div>
  <el-table :data="tableData" v-loading="loading">
    <el-table-column prop="device_id" label="设备ID"></el-table-column>
    <el-table-column prop="device_name" label="设备名"></el-table-column>
    <el-table-column prop="frequency" label="频率"></el-table-column>
    <el-table-column prop="status" label="接口状态">
      <template v-slot="scope">
        <el-tag size="small" :type="scope.row.status == '工作中' ? 'success' : 'info'">
          {{scope.row.status}}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="actions" label="操作">
      <template v-slot="scope">
        <el-popconfirm title="确定要删除吗？" @confirm="handle_del(scope.row)">
          <el-button slot="reference" size="mini" type="danger">删除</el-button>
        </el-popconfirm>

        <el-button style="margin-left: 10px" size="mini" type="success" @click="handle_launch(scope.row)">启动</el-button>
        <el-button size="mini" type="warning" @click="startEditor(scope.row)">配置</el-button>
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

<!-- 新建 -->
  <el-dialog
      class="transpond-dialog"
      title="创建"
      :visible.sync="dialogVisible"
      :modal="false"
      width="30%">
    <CreateForm @submit="handle_create"></CreateForm>
  </el-dialog>

<!-- 更新 -->
  <el-dialog
      class="transpond-dialog"
      title="配置"
      :visible.sync="updateDialogVisible"
      :modal="false"
      width="30%">
    <UpdateForm :init_data="edit_item" @update="handle_update"></UpdateForm>
  </el-dialog>

</div>
</template>

<script>
import CreateForm from "@/view/pages/transpond/CreateForm.vue";
import UpdateForm from "@/view/pages/transpond/UpdateForm.vue";
import data from "./data"
export default {
  name: "index",
  components: {
    CreateForm,
    UpdateForm,
  },
  data:()=>({
    loading: false,
    per_page: 10,
    page: 1,
    data_count:2,
    tableData: [],
    data_list: data,
    launch_loading: false,
    form_data:{
      device_name: "",
      frequency: 0,
    },
    dialogVisible: false,
    updateDialogVisible: false,
    edit_item: {
      frequency: '',
      status: '',
    }
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
    },
    handle_launch(item){
      if(this.launch_loading) return
      this.launch_loading = true
      setTimeout(()=>{
        this.$message({
          message: item.device_name + " 启动成功",
          center: true,
          type: "success"
        })
        this.launch_loading = false
      },500)
    },
    handle_del(item){
      // console.log(item)
      let index = this.tableData.indexOf(item)
      this.tableData.splice(index, 1)
    },
    handle_create(form_data){
      let data = {
        device_id: Math.floor(Math.random() * (999999 - 123456 + 1)) + 123456,
        device_name: form_data.device_name.join(" - "),
        frequency: form_data.frequency,
        status: "工作中"
      }
      this.tableData.unshift(data)
      this.dialogVisible = false

      this.$message({
        message: "创建成功",
        center: true,
        type: "success"
      })
    },
    startEditor(item){
      // console.log(item)
      // this.edit_item.frequency = item.frequency
      // this.edit_item.status = item.status
      this.updateDialogVisible = true
      this.edit_item = item
    },
    handle_update(form_data){
      this.edit_item.frequency = form_data.frequency
      this.edit_item.status = form_data.status
      this.updateDialogVisible = false

      this.$message({
        message: "更新成功",
        center: true,
        type: "success"
      })
    }
  }
}
</script>

<style lang="scss">
.transpond{
  .el-tag{
    background-color: #5867dd;
    border-color: #5867dd;
    color: #fff;
  }

  .el-pagination.is-background .el-pager li:not(.disabled).active{
    background-color: #5867dd;
    border-color: #5867dd;
  }

  .equipment-pagination{
    padding: 10px;
    text-align: right;
    ul{
      padding-left: 0;
    }
  }

}
.transpond-header{
  display: flex;
  flex-direction: row;
  padding-bottom: 10px;
  .create-btn{
    margin-left: auto;
    //color: #fff;
  }
  .transpond-title{
    font-size: 1.5rem!important;
    color: #fff;
    font-weight: bold;
  }
}

.transpond-dialog{
  color: #fff;
  .el-dialog{
    background-color: #1a234f;

    .el-dialog__title{
      color: #fff;
    }
  }
}
</style>