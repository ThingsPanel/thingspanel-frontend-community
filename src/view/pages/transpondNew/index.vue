<template>
  <div class="rounded p-4 card">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t("RULE_ENGINE.DATA_FORWARDINGNEW.TRANSPOND")}}</TableTitle>
      </el-col>
      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="border" @click="handleShowAdd">{{ $t("RULE_ENGINE.DATA_FORWARDINGNEW.CREATINGFORWARDINGRULE")}}</el-button>
       
      </el-col>
    </el-row>
  
    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.NO')" type="index" width="80">
        <template v-slot="scope">
          <span>{{ (page - 1) * 10 + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.RULE_NAME')"></el-table-column>
      <el-table-column prop="desc" :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.RULE_DESCRIBE')"></el-table-column>
      <el-table-column prop="create_time" :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.CREATEDATE')" width="145">
        <template v-slot="scope">
          {{ formatDate(scope.row.create_time) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.TNTERFACESTATUS')">
        <template v-slot="scope">
          <el-tag size="small">{{scope.row.status == 1 ? $t('RULE_ENGINE.DATA_FORWARDINGNEW.SRARTED') : $t('RULE_ENGINE.DATA_FORWARDINGNEW.PUTONHOLD')}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="actions" :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.OPERATION')" align="left" width="220px">
        <template v-slot="scope">
          <el-button size="mini" v-if="scope.row.status == 0" type="success" @click="handleSetStatus(scope.row)">{{ $t("RULE_ENGINE.DATA_FORWARDINGNEW.START")}}</el-button>
          <el-button size="mini" v-if="scope.row.status == 1"  type="yellow" @click="handleSetStatus(scope.row)">{{ $t("RULE_ENGINE.DATA_FORWARDINGNEW.SUSPENDED")}}</el-button>
          <el-button class="mr-3" size="mini" type="indigo" @click="handleShowEdit(scope.row)">{{ $t("RULE_ENGINE.DATA_FORWARDINGNEW.EDIT")}}</el-button>
          <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')" :title="$t('RULE_ENGINE.DATA_FORWARDINGNEW.TITLE4')" @confirm="handle_del(scope.row.id)">
            <el-button slot="reference" size="mini" type="danger">{{ $t("RULE_ENGINE.DATA_FORWARDINGNEW.DELETE")}}</el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
      
      <template #empty>
        <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
      </template>
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
  
    <CreateForm :visible.sync="dialogVisible" :id="formId" @submit="get_data"/>
  </div>
  </template>
  
  <script>
  import CreateForm from "@/view/pages/transpondNew/CreateForm.vue";
  import TableTitle from "@/components/common/TableTitle.vue"
  import {getTranspondNewList,getTranspondNewStatus,getTranspondNewDelete} from "@/api/transpondNew";
  import "@/core/mixins/common"
  import { message_success } from '@/utils/helpers';
  export default {
    name: "TranspondNew",
    components: {
      CreateForm,
      TableTitle,
    },
    data:()=>({
      dialogVisible:false,
      formId:'',
      loading: false,
      per_page: 10,
      page: 1,
      data_count:2,
      tableData: [],
    }),
    created() {
      this.get_data()
    },
    methods: {
      get_data(){
        let page = {
          "current_page": this.page,
          "per_page":10,
        }
        getTranspondNewList(page).then(res => {
          if (res.status == 200) {
            this.tableData = res.data.data.data
            this.data_count = res.data.data.total
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

      //删除
      handle_del(id){
        getTranspondNewDelete({data_transpond_id:id}).then(res => {
          if (res.data.code === 200) {
            this.get_data()
            this.$message({message: "删除成功", center: true, type: "success"})
          }
        })
      },

      //新建弹框
      handleShowAdd() {
        this.formId = ''
        this.dialogVisible = true;
      },
      //编辑弹框
      handleShowEdit(item) {
        this.formId = item.id;
        this.dialogVisible = true;
      },
     
       //启动
      // handle_launch(item) {
      //   getTranspondNewStatus({data_transpond_id:item.id,switch:1}).then(res => {
      //     if (res.data.code === 200) {
      //       this.get_data()
      //       this.$message({message: "启动成功", center: true, type: "success"})
      //     }
      //   })
      // },
      // //关闭
      // handle_pause(item) {
      //   getTranspondNewStatus({data_transpond_id:item.id,switch:0}).then(res => {
      //     if (res.data.code === 200) {
      //       this.get_data()
      //       this.$message({message: "暂停成功", center: true, type: "success"})
      //     }
      //   })
      // },

      handleSetStatus(item) {
        let status = item.status === 0 ? 1 : 0;
      
        getTranspondNewStatus({data_transpond_id:item.id,switch:status}).then(res => {
          if (res.data.code === 200) {
            this.get_data()
            message_success(
              status === 1 ? this.$t("AUTOMATION.ENABLED") : this.$t("AUTOMATION.DISABLED"));
          }
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