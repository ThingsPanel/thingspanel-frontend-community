<template>
  <div class="rounded p-4 card">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t("SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.NOTICE")}}</TableTitle>
      </el-col>
      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="border" @click="handleShowAdd">{{ $t("SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.NOTICEADD")}}</el-button>
      </el-col>
    </el-row>
  
    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.NO')" type="index" width="100">
        <template v-slot="scope">
          <span>{{ (page - 1) * 10 + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="group_name" :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.NOTICENAME')"></el-table-column>
      <el-table-column prop="notification_type" :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.NOTICETYPE')">
        <template v-slot="scope">
           <span v-if="scope.row.notification_type == 1">成员通知</span>
           <span v-if="scope.row.notification_type == 2">邮箱通知</span>
           <span v-if="scope.row.notification_type == 3">webhook</span>
           <span v-if="scope.row.notification_type == 4">短信通知</span>
           <span v-if="scope.row.notification_type == 5">语音通知</span>
           <span v-if="scope.row.notification_type == 6">企业微信群机器人</span>
           <span v-if="scope.row.notification_type == 7">钉钉群机器人</span>
           <span v-if="scope.row.notification_type == 8">飞书群机器人</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="status" :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.STATUS')">
        <template v-slot="scope">
          <el-switch
            v-model="scope.row.statusValue" @change="handleSetStatus(scope.row)"
            :inactive-text="scope.row.statusValue ? $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SRARTED') : $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PUTONHOLD')"
            active-text="">
          </el-switch>
          <!-- <el-tag size="small">{{scope.row.status == 1 ? $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SRARTED') : $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PUTONHOLD')}}</el-tag> -->
          <!-- <el-button size="mini" v-if="scope.row.status == 2" type="success" @click="handleSetStatus(scope.row)">{{ $t("SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PUTONHOLD")}}</el-button>
          <el-button size="mini" v-if="scope.row.status == 1" type="yellow" @click="handleSetStatus(scope.row)">{{ $t("SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SRARTED")}}</el-button>  -->
        </template>
      </el-table-column>
      <el-table-column prop="actions" :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.OPERATION')" align="left" width="142px">
        <template v-slot="scope">
          <!-- <el-button size="mini" v-if="scope.row.status == 2" type="success" @click="handleSetStatus(scope.row)">{{ $t("SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.START")}}</el-button>
          <el-button size="mini" v-if="scope.row.status == 1"  type="yellow" @click="handleSetStatus(scope.row)">{{ $t("SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SUSPENDED")}}</el-button> -->
          <el-button class="mr-3" size="mini" type="indigo" @click="handleShowEdit(scope.row)">{{ $t("COMMON.EDIT")}}</el-button>
          <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')" :title="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.TITLE4')" @confirm="handle_del(scope.row.id)">
            <el-button slot="reference" size="mini" type="danger">{{ $t("COMMON.DELETE")}}</el-button>
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
  import CreateForm from "@/view/pages/notice/CreateForm.vue";
  import TableTitle from "@/components/common/TableTitle.vue"
  import {getNotificationList,getStatus,getNotificationDelete} from "@/api/notice";
  import "@/core/mixins/common"
  import { message_success } from '@/utils/helpers';
  export default {
    name: "notice",
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
        getNotificationList(page).then(res => {
          if (res.status == 200) {
            this.tableData = res.data.data.data
            this.tableData.forEach(item => {
              item.statusValue = item.status == 1 ? true : false;
            })
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
        getNotificationDelete({id:id}).then(res => {
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
      //   getStatus({id:item.id,switch:1}).then(res => {
      //     if (res.data.code === 200) {
      //       this.get_data()
      //       this.$message({message: "启动成功", center: true, type: "success"})
      //     }
      //   })
      // },
      // //关闭
      // handle_pause(item) {
      //   getStatus({id:item.id,switch:2}).then(res => {
      //     if (res.data.code === 200) {
      //       this.get_data()
      //       this.$message({message: "暂停成功", center: true, type: "success"})
      //     }
      //   })
      // },

      handleSetStatus(item) {
        let status = item.statusValue ? 1 : 2;
        getStatus({id: item.id, switch: status}).then(res => {
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
  ::v-deep .el-switch__label {
    color: #409EFF; 
  }
  ::v-deep span.el-switch__label.el-switch__label--left.is-active {
    color: #C0CCDA;
  }
  </style>