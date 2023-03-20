<template>
<div class="rounded p-4 card">
  <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
    <el-col :span="12">
      <TableTitle>{{ $t("RULE_ENGINE.DATA_FORWARDING.TRANSPOND")}}</TableTitle>
    </el-col>
    <el-col :span="12" class="px-2 text-right">
      <el-button size="medium" type="border" @click="dialogVisible = true">{{ $t("RULE_ENGINE.DATA_FORWARDING.CREATINGFORWARDINGRULE")}}</el-button>
      <el-button size="medium" type="border">发布</el-button>
    </el-col>
  </el-row>

  <el-table :data="tableData" v-loading="loading">
    <el-table-column :label="$t('RULE_ENGINE.DATA_FORWARDING.NO')" type="index" width="100"></el-table-column>
    <el-table-column prop="label" :label="$t('RULE_ENGINE.DATA_FORWARDING.RULE_NAME')"></el-table-column>
    <el-table-column prop="status" :label="$t('RULE_ENGINE.DATA_FORWARDING.TNTERFACESTATUS')">
      <template v-slot="scope">
        <el-tag size="small">{{scope.row.disabled == 'false' ? $t('RULE_ENGINE.DATA_FORWARDING.SRARTED') : $t('RULE_ENGINE.DATA_FORWARDING.PUTONHOLD')}}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="actions" :label="$t('RULE_ENGINE.DATA_FORWARDING.OPERATION')" align="left" width="320px">
      <template v-slot="scope">
        <el-button size="mini" type="success" @click="handle_launch(scope.row)">{{ $t("RULE_ENGINE.DATA_FORWARDING.START")}}</el-button>
        <el-button size="mini" type="yellow" @click="handle_pause(scope.row)">{{ $t("RULE_ENGINE.DATA_FORWARDING.SUSPENDED")}}</el-button>
        <el-button class="mr-3" size="mini" type="indigo" @click="startEditor(scope.row)">{{ $t("RULE_ENGINE.DATA_FORWARDING.EDIT")}}</el-button>

        <el-popconfirm :title="$t('RULE_ENGINE.DATA_FORWARDING.TITLE4')" @confirm="handle_del(scope.row)">
          <el-button slot="reference" size="mini" type="danger">{{ $t("RULE_ENGINE.DATA_FORWARDING.DELETE")}}</el-button>
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
      :title="$t('RULE_ENGINE.DATA_FORWARDING.CREATE')"
      :visible.sync="dialogVisible"
      :close-on-click-modal="false"
      width="30%">
    <CreateForm @cancel="dialogVisible = false" @submit="handle_create"></CreateForm>
  </el-dialog>

<!-- 更新 -->
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :title="$t('RULE_ENGINE.DATA_FORWARDING.CONFIGURATION')"
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
import {
  addFlow,
  addTranspond,
  delTranspond,
  getRedUrl,
  getTranspondList,
} from "@/api/transpond";
import {
  delFlow,
  getFlow,
  getFlows,
  startFlow,
  stopFlow,
  updateFlow,
  updateFlows,
  updateTranspond
} from "../../../api/transpond";

export default {
  name: "TranspondIndex",
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
      let page = {
        "current_page": this.page,
        "per_page":10,
        "role_type": "2"
      }
      getTranspondList(page).then(res => {
        if (res.status == 200) {
          this.tableData = res.data.data.data
          this.data_count = res.data.data.total
          console.log(this.tableData)
          this.loading = false
        }
      })
    },
    page_change(val){
      if(this.loading) return
      this.loading = true
      this.page = val
      this.get_data()
    },
    handle_launch(row){
      if(this.launch_loading) return
      this.launch_loading = true
      this.handleFlows(row, false)
    },
    handle_pause(row){
      if(this.launch_loading) return
      this.launch_loading = true
      this.handleFlows(row, true)
    },
    handleFlows(row, b) {
      let flow_id = row.process_id;
      let label = row.label;
      let id = row.id;
      console.log(row)
      // 获取node-red的所有flows
      getFlows()
          .then(res => {
            if (res.status == 200) {
              res.data.flows.forEach(flow => {
                if (flow.id == flow_id) {
                  flow.disabled = b;
                }
              })
              // 更新flows
              updateFlows(res.data)
              .then(res => {
                if (res.status == 200) {
                  console.log(b)
                  this.$message({message: label + (!b ? " 启动成功" : "暂停成功"), center: true, type: "success"})
                  // flows更新成功后，更新thingspanel数据库中的数据
                  row.disabled = b ? "true" : "false";
                  updateTranspond(row)
                  .then(res => {
                    console.log(res)
                    this.get_data();
                  })
                  this.launch_loading = false
                }
              })
            }
          })
      .catch(() => {
        this.launch_loading = false
      })
    },
    handle_del(item){
      // 在数据库中删除该条记录
      delTranspond({id: item.id}).then(res => {
        if (res.status == 200) {
          // 数据库中删除Flow
          this.get_data();
          // 删除node-red中的流程
          delFlow( item.process_id )
              .then(res => {
                console.log(res)
              })
          this.$message({message: item.label + " 删除成功", center: true, type: "success"})
        }
      })
    },
    handle_create(form_data){
      console.log("==================================")
      console.log(form_data)
      console.log("==================================")

      // 在node-red中创建一个flow
      let flow = {
        "label": form_data.rule_name,
        "nodes": [],
        "configs": []
      }
      addFlow(flow).then(res => {
        if (res.status == 200) {
          // 创建flow成功后，向数据库写入数据
          addTranspond({process_id: res.data.id, disabled: "false", label: form_data.rule_name, role_type: "2" }).then(result => {
            this.get_data();
            this.dialogVisible = false;
            this.$message({message: "创建成功", center: true, type: "success"})
          })
        }
      }).catch(err => {
        console.log(err)
      })
    },
    startEditor(row){
      const newWindow = window.open(getRedUrl(row.process_id), '_blank');
      newWindow.opener = null;
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

<style scoped>
/deep/ .el-tag {
  border: 1px solid;
  background-color: transparent;
}
</style>