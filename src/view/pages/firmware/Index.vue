<template>
<div class="firmware rounded p-4 card no-border v-application el-table-transparent">
  <div class="firmware-header pb-5">
    <v-btn depressed color="primary" class="ml-2" @click="dialogVisible = true">新增固件</v-btn>
    <v-btn depressed color="primary" class="ml-2">导入产品</v-btn>
<!--    <v-btn depressed color="indigo">Error</v-btn>-->
<!--    <el-button class="create-btn" type="primary" size="medium">新增固件</el-button>-->
<!--    <el-button type="primary" size="medium">导入产品</el-button>-->
  </div>
  <el-table :data="tableData">
    <el-table-column prop="firmware_name" label="固件名称"></el-table-column>
    <el-table-column prop="product" label="归属产品"></el-table-column>
    <el-table-column prop="firmware_version" label="固件版本"></el-table-column>
    <el-table-column prop="created_at" label="创建时间"></el-table-column>
    <el-table-column prop="actions" label="操作">
      <template v-slot="scope">
        <el-popconfirm title="确定要删除吗？" @confirm="handle_del(scope.row)">
          <el-button slot="reference" size="mini" type="danger">删除</el-button>
        </el-popconfirm>

        <el-button style="margin-left: 10px" size="mini" type="warning" @click="startEditor(scope.row)">配置</el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-dialog
      class="firmware-dialog"
      title="新增固件"
      :visible.sync="dialogVisible"
      :modal="false"
      width="40%">
    <CreateForm @submit="handle_create"></CreateForm>
  </el-dialog>
</div>
</template>

<script>
import data from "./data"
import CreateForm from "./CreateForm.vue"
export default {
  name: "Index",
  components: {
    CreateForm
  },
  data:()=>({
    tableData:data,
    dialogVisible: false,
  }),
  created() {
  },
  methods: {
    handle_del(item){
      let index = this.tableData.indexOf(item)
      this.tableData.splice(index, 1)
    },
    startEditor(item){
      console.log(item)
    },
    handle_create(form){
      this.tableData.unshift(form)
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss">
.firmware-dialog{
  color: #fff;
  .el-dialog{
    background-color: #1a234f;

  .el-dialog__title{
    color: #fff;
  }
}
}
</style>