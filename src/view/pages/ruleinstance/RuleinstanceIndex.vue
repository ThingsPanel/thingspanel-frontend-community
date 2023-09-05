<template>
  <div class="rounded p-4 card no-border el-table-transparent">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>规则实例</TableTitle>
      </el-col>
      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="indigo" @click="dialogVisible = true">创建转发</el-button>
      </el-col>
    </el-row>

    <el-table :data="tableData" v-loading="loading">
      <el-table-column label="序号" type="index" width="50"></el-table-column>
      <el-table-column prop="name" label="名称"></el-table-column>
      <el-table-column prop="rule_state" label="规则类型"></el-table-column>
      <el-table-column prop="status" label="状态">
        <template v-slot="scope">
          <el-tag size="mini">{{scope.row.status}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="actions" label="操作" align="center" width="210px">
        <template v-slot="scope">
          <el-button size="mini" type="indigo" @click="handle_launch(scope.row)">启动</el-button>
          <el-button class="mr-3" size="mini" type="indigo" @click="startEditor(scope.row)">配置</el-button>

          <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')" title="确定要删除吗？" @confirm="handle_del(scope.row)">
            <el-button slot="reference" size="mini" type="danger">删除</el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="text-right py-3">
      <el-pagination
          background
          layout="prev, pager, next"
          :total="data_count"
          :current-page.sync="page"
          :page-size="per_page"
          @current-change="page_change"></el-pagination>
    </div>

    <!-- 新建 -->
    <el-dialog
        class="el-dark-dialog el-dark-input"
        title="创建"
        :visible.sync="dialogVisible"
        :close-on-click-modal="false"
        width="30%">
      <CreateForm @submit="handle_create"></CreateForm>
    </el-dialog>

    <!-- 更新 -->
    <el-dialog
        class="el-dark-dialog el-dark-input"
        title="配置"
        :visible.sync="updateDialogVisible"
        :close-on-click-modal="false"
        width="30%">
      <UpdateForm :init_data="edit_item" @update="handle_update"></UpdateForm>
    </el-dialog>

  </div>
</template>

<script>
import CreateForm from "@/view/pages/transpond/CreateForm.vue";
import UpdateForm from "@/view/pages/transpond/UpdateForm.vue";
import TableTitle from "@/components/common/TableTitle.vue"
import data from "./data"

export default {
  name: "RuleinstanceIndex",
  components: {
    CreateForm,
    UpdateForm,
    TableTitle,
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
      this.tableData.splice(TranspondIndex, 1)
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

</style>