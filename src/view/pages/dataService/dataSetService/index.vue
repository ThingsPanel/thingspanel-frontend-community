<template>
  <div class="rounded p-4 card">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t("DATASERVICE_MANAGEMENT.DATASERVICE") }}</TableTitle>
      </el-col>
      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="border" @click="handleShowAdd">{{ $t("DATASERVICE_MANAGEMENT.ADD") }}</el-button>
      </el-col>
    </el-row>
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="4">
        <el-input :placeholder="$t('DATASERVICE_MANAGEMENT.SEARCHPLACEHOLDER')" v-model="name"></el-input>
      </el-col>
      <el-col :span="4">
        <el-select v-model="enable_flag" clearable :placeholder="$t('DATASERVICE_MANAGEMENT.SEARCHPLACEHOLDER2')">
         
          <el-option :label="$t('DATASERVICE_MANAGEMENT.SELECT1')" :value="1"></el-option>
          <el-option :label="$t('DATASERVICE_MANAGEMENT.SELECT2')" :value="0"></el-option>
        </el-select>
      </el-col>
      <el-col :span="4">
          <el-button type="border" @click="getSearch">{{ $t("DATASERVICE_MANAGEMENT.SEARCH") }}</el-button>
      </el-col>
    </el-row>
    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label="$t('DATASERVICE_MANAGEMENT.NO')" type="index" width="100"></el-table-column>
      <el-table-column prop="name" :label="$t('DATASERVICE_MANAGEMENT.NAME')"></el-table-column>
      <el-table-column prop="app_key" :label="$t('DATASERVICE_MANAGEMENT.APPKEY')">
      
      </el-table-column>
      <el-table-column prop="signature_mode" :label="$t('DATASERVICE_MANAGEMENT.WAY')"></el-table-column>
      <el-table-column prop="ip_whitelist" :label="$t('DATASERVICE_MANAGEMENT.IPWHITELIST')"></el-table-column>
      <el-table-column prop="api_flag" :label="$t('DATASERVICE_MANAGEMENT.INTERFACE_SUPPORT_FLAG')">
        <template v-slot="scope">
           {{scope.row.api_flag==='0' ? "http接口" : "http和ws接口"}}
        </template>
      </el-table-column>
      <el-table-column prop="remark" :label="$t('DATASERVICE_MANAGEMENT.DESC')"></el-table-column>
      <el-table-column prop="created_at" :label="$t('DATASERVICE_MANAGEMENT.CREATEDATE')">
        <template v-slot="scope">
           {{scope.row.created_at ? dateFormat(scope.row.created_at) : ""}}
        </template>
      </el-table-column>

      <el-table-column prop="enable_flag" :label="$t('DATASERVICE_MANAGEMENT.STATUS')">
        <template v-slot="scope">
          <el-switch
            v-model="scope.row.statusValue" @change="handleSetStatus(scope.row)"
            :inactive-text="scope.row.statusValue ? $t('DATASERVICE_MANAGEMENT.SRARTED') : $t('DATASERVICE_MANAGEMENT.PUTONHOLD')"
            active-text="">
          </el-switch>
          <!-- <el-tag size="small">{{scope.row.status == 1 ? $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SRARTED') : $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PUTONHOLD')}}</el-tag> -->
          <!-- <el-button size="mini" v-if="scope.row.status == 2" type="success" @click="handleSetStatus(scope.row)">{{ $t("SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PUTONHOLD")}}</el-button>
          <el-button size="mini" v-if="scope.row.status == 1" type="yellow" @click="handleSetStatus(scope.row)">{{ $t("SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SRARTED")}}</el-button>  -->
        </template>
      </el-table-column>
      <el-table-column prop="actions" :label="$t('DATASERVICE_MANAGEMENT.OPERATION')" align="left" width="320px">
        <template v-slot="scope">
          <!-- <el-button size="mini" v-if="scope.row.status == 2" type="success" @click="handleSetStatus(scope.row)">{{ $t("SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.START")}}</el-button>
          <el-button size="mini" v-if="scope.row.status == 1"  type="yellow" @click="handleSetStatus(scope.row)">{{ $t("SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SUSPENDED")}}</el-button> -->
          <el-button size="mini" type="indigo" @click="handleView(scope.row.secret_key)">{{ $t("DATASERVICE_MANAGEMENT.VIEW") }}</el-button>
          <el-button class="mr-3" size="mini" type="indigo" @click="handleShowEdit(scope.row)">{{ $t("DATASERVICE_MANAGEMENT.EDIT")}}</el-button>
          <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')" :title="$t('DATASERVICE_MANAGEMENT.TITLE4')" @confirm="handle_del(scope.row.id)">
            <el-button slot="reference" size="mini" type="danger">{{ $t("DATASERVICE_MANAGEMENT.DELETE")}}</el-button>
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
  
    <CreateForm :visible.sync="dialogVisible" :data="formData" @submit="get_data"/>

    <el-dialog class="el-dark-dialog el-dark-input"
      :title="$t('DATASERVICE_MANAGEMENT.VIEW')"
      :visible.sync="dialogViewVisible"
      :close-on-click-modal="false" :close-on-press-escape="false" :show-close="true" :append-to-body="true"
      width="400px">
      <div class="dialog-body">
        <el-form
            ref="form"
            :rules="rules"
            label-position="left"
            :model="formModel"
            label-width="100px">
            <el-tooltip effect="dark" :content="formModel.tooltip ? formModel.tooltip : $t('DEVICE_MANAGEMENT.EDIT_PARAMETER.COPY')" placement="right-start">
               <el-input readonly v-clipboard:copy="formModel.value" v-model="formModel.value" @focus="handleCopy(formModel)"></el-input>
            </el-tooltip>    
        </el-form>
      </div>
    </el-dialog>
  </div>
  </template>
  
  <script>
  import CreateForm from "@/view/pages/dataService/dataSetService/CreateForm.vue";
  import TableTitle from "@/components/common/TableTitle.vue"
  import {getList,getEdit,getDelete} from "@/api/dataService";

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
      dialogViewVisible:false,
      formData:'',
      loading: false,
      per_page: 10,
      page: 1,
      name: "",
      enable_flag:"",
      data_count:2,
      tableData: [],
      secret_key:"",
      formModel:{
       
        tooltip:"",
        value:"",
      }
     
    }),
    created() {
      this.get_data()
    },
    methods: {
      get_data(){
        let page = {
          "current_page": this.page,
          "per_page":10,
          "name":this.name,
          "enable_flag":this.enable_flag.toString()
        }
        getList(page).then(res => {
          if (res.status == 200) {
            this.tableData = res.data.data.data
            this.tableData.forEach(item => {
              // let enable_flag= item.enable_flag
              // parseInt(enable_flag) == 1 ? true : false;
              item.statusValue = item.enable_flag == 1 ? true : false;
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
        getDelete({id:id}).then(res => {
          if (res.data.code === 200) {
            this.get_data()
            this.$message({message: "删除成功", center: true, type: "success"})
          }
        })
      },

      //新建弹框
      handleShowAdd() {
        this.formData = ''
        this.dialogVisible = true;
      },
      //编辑弹框
      handleShowEdit(item) {
        this.formData = item;
        this.dialogVisible = true;
      },

      handleView(data){
        console.log(data)
        this.formModel.value = data;
        this.dialogViewVisible = true;
      },
      getSearch(){
        this.get_data()
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
        let status = item.statusValue ? "1" : "0";
        getEdit({id: item.id, enable_flag: status}).then(res => {
          if (res.data.code === 200) {
            this.get_data()
            message_success(status === "1" ? this.$t("AUTOMATION.ENABLED") : this.$t("AUTOMATION.DISABLED"));
          }
        })
      },

      handleCopy(item) {
        item.tooltip = this.$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.COPIED');
      },


      dateFormat(timestamp) {
        if (!timestamp) return "";
        if (timestamp.toString().length === 10) {
          timestamp = Number(timestamp) * 1000;
        } else if (timestamp.toString().length === 13) {
          timestamp = timestamp;
        } else if (timestamp.toString().length === 16) {  
          timestamp = timestamp.toString().substring(0, 13);
        } else {
          return "";
        }
        var n = parseInt(timestamp);
        var D = new Date(n);
        var year = D.getFullYear(); //四位数年份

        var month = D.getMonth() + 1; //月份(0-11),0为一月份
        month = month < 10 ? "0" + month : month;

        var day = D.getDate(); //月的某一天(1-31)
        day = day < 10 ? "0" + day : day;

        var hours = D.getHours(); //小时(0-23)
        hours = hours < 10 ? "0" + hours : hours;

        var minutes = D.getMinutes(); //分钟(0-59)
        minutes = minutes < 10 ? "0" + minutes : minutes;

        var seconds = D.getSeconds(); //秒(0-59)
        seconds = seconds < 10 ? "0" + seconds : seconds;
        // var week = D.getDay();//周几(0-6),0为周日
        // var weekArr = ['周日','周一','周二','周三','周四','周五','周六'];

        var now_time =
          year +
          "-" +
          month +
          "-" +
          day +
          " " +
          hours +
          ":" +
          minutes +
          ":" +
          seconds;
        return now_time;
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