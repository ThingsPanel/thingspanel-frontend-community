<template>
  <div>
    <el-dialog
      :title="data ? $t('DATASERVICE_MANAGEMENT.EDITTITLE') : $t('DATASERVICE_MANAGEMENT.ADDTITLE')"
      class="el-dark-dialog"
      :close-on-click-modal="false"
      :before-close="handleClose"
      :visible.sync="dialogVisible"
      width="60%"
      height="60%"
      top="10vh"
    >
      <el-form ref="CreateForm" label-position="left" label-width="140px" :model="form">
          <el-form-item :label="$t('DATASERVICE_MANAGEMENT.FORMNAME')" required>
            <el-input ref="nameRef" v-model="form.name"></el-input>
          </el-form-item>

          <el-form-item :label="$t('DATASERVICE_MANAGEMENT.FORMWAY')" required>
            <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" class="w-100" ref="wayRef" v-model="form.signature_mode">
              <el-option label="MD5" :value="'MD5'"></el-option>
              <el-option label="HAS256" :value="'HAS256'"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item :label="$t('DATASERVICE_MANAGEMENT.FORMIPWHITELIST')">
            <el-input class="el-dark-input" ref="ip_whitelistRef" :placeholder="$t('DATASERVICE_MANAGEMENT.PLACEHOLDER6')" type="textarea" v-model="form.ip_whitelist"></el-input>
          </el-form-item>

          <el-form-item :label="$t('DATASERVICE_MANAGEMENT.FORMINTERFACE_SUPPORT_FLAG')" required>
            <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" class="w-100" ref="selRef" v-model="form.api_flag" @change="handleTypeChange">
              <el-option label="http接口" :value="'0'"></el-option>
              <el-option label="http和ws接口" :value="'1'"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item v-if="noticeType==1" :label="$t('DATASERVICE_MANAGEMENT.FORMSPACE')" required>
            <el-input class="el-dark-input" ref="intervalRef" v-model="form.time_interval"></el-input>
          </el-form-item>

          <el-form-item :label="$t('DATASERVICE_MANAGEMENT.FORMDESC')">
            <el-input class="el-dark-input" ref="remarkRef" type="textarea" v-model="form.remark"></el-input>
          </el-form-item>

          <el-form-item>
            <el-form-item :label="$t('DATASERVICE_MANAGEMENT.FORMSQLWRITiINGASSISTANCE')">
              <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" class="w-100" ref="sqlIdRef" v-model="form.table_name" @change="handleSqlChange">
                <el-option v-for="item in sqlList" :key="item.table_name" :label="item.table_name" :value="item.table_name"></el-option>
              </el-select>
            </el-form-item> 
          </el-form-item>
          <!-- <el-form-item :label="$t('DATASERVICE_MANAGEMENT.FORMSQLWRITiINGASSISTANCE')">
            <el-select class="w-100" ref="sqlIdRef" v-model="form.table_name" @change="handleSqlChange">
              <el-option v-for="item in sqlList" :key="item.table_name" :label="item.table_name" :value="item.table_name"></el-option>
            </el-select>
          </el-form-item> -->

          <el-form-item>
            <el-table :data="tableData">
              <el-table-column prop="field" :label="$t('DATASERVICE_MANAGEMENT.TABLE')"></el-table-column>
              <el-table-column prop="type" :label="$t('DATASERVICE_MANAGEMENT.TABLE1')"></el-table-column>
              <el-table-column prop="comment" :label="$t('DATASERVICE_MANAGEMENT.TABLE2')"></el-table-column>
            </el-table>
          </el-form-item>

          <el-form-item :label="$t('DATASERVICE_MANAGEMENT.FORMSQL')">
            <el-input class="el-dark-input" ref="sqlRef" type="textarea" v-model="form.data_sql"></el-input>
          </el-form-item>

          <el-form-item >
            <el-button class="medium" type="save" size="medium" @click="onBtn">{{ $t('DATASERVICE_MANAGEMENT.BTN') }}</el-button>
          </el-form-item>
          
          <div style="display: flex;justify-content: center">
            <el-button class="cancel-button" type="cancel" size="medium" plain @click="cancelDialog">{{ $t('DATASERVICE_MANAGEMENT.CANCEL') }}</el-button>
            <el-button class="medium" type="save" size="medium" @click="onSubmit">{{ $t('DATASERVICE_MANAGEMENT.SAVE') }}</el-button>
          </div>
      </el-form>
    </el-dialog>

    <el-dialog class="el-dark-dialog el-dark-input"
      :title="$t('DATASERVICE_MANAGEMENT.TITLE')"
      :visible.sync="dialogVisible2"
      :close-on-click-modal="false" :close-on-press-escape="false" :show-close="true" :append-to-body="true"
      width="800px">
      <div class="dialog-body">
        <el-form
            ref="form"
            :rules="rules"
            label-position="left"
            :model="formModel"
            label-width="100px">
            <el-form-item :label="$t('DATASERVICE_MANAGEMENT.LABLE')" prop="content">
              <el-input type="textarea" :rows="10" disabled v-model="formModel.content"></el-input>
            </el-form-item>
           
            <div style="display: flex;justify-content: center">
              <el-button class="medium"  type="save" size="medium" @click="onSend">{{ $t('DATASERVICE_MANAGEMENT.SAVE') }}</el-button>
            </div>
        </el-form>
      </div>
    </el-dialog>

 </div>
</template>

<script>
import { message_error } from '@/utils/helpers';
import {getAdd,getEdit,getSet,getSqlList,getSqlTabelList} from "@/api/dataService";
export default {
  name: "CreateForm",
  components: {  },
  props: {
    // init_data: {
    //   default: null
    // },
    data: {
      default: null
    },
    visible: {
      type: [Boolean],
      default: false
    }
  },
  computed: {
    dialogVisible: {
      get() { 
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      }
    }
  },
  watch:{
    visible: {
      handler(newValue) {
        if (newValue) {
          if (this.data) {
            // 编辑
            this.getDetail(this.data);
          } else {
            // 新增
            this.form = {
              name: '',
              signature_mode: '',
              ip_whitelist:'',
              api_flag:'',
              time_interval: '',
              remark:'',
              data_sql:'',
            };
          }
        } else {
          this.form = {};
        }
      }
    },
  },
  data:()=>({
    // 通知方式类型
    noticeType:'',
    dialogVisible2:false,
    form:{
      name: '',
      signature_mode: '',
      ip_whitelist:'',
      api_flag:'',
      time_interval: '',
      remark:'',
      data_sql:'',

    },
    formModel:{
      content:"",
    },
    disabled:false,
    sqlList:[],
    tableData:[],
   //rules: {
    //  group_name: [
    //    {required, message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER')}
    //  ],
    //  desc: [
    //    {required, message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER1')}
    //  ],
    //  notification_type: [
    //     {required, message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER1')}
    //  ]
   //},
  }),
  created() {
    this.getSql()

  },
  methods: {
    handleTypeChange(e){
      this.form.api_flag=e
      this.noticeType=e
    },

    getSql(){
      getSqlList({}).then(res => {
          if (res.status == 200) {
            this.sqlList = res.data.data
            // this.tableData.forEach(item => {
            //   // let enable_flag= item.enable_flag
            //   // parseInt(enable_flag) == 1 ? true : false;
            //   item.statusValue = item.enable_flag == 1 ? true : false;
            // })
            // this.data_count = res.data.data.total
            // this.loading = false
          }
      })
    },


    handleSqlChange(e){
      getSqlTabelList({table_name:e}).then(res => {
          if (res.status == 200) {
            this.tableData = res.data.data
           
          }
      })
    },

    onBtn(){
      if(this.form.data_sql==''){
       message_error(this.$t('DATASERVICE_MANAGEMENT.PLACEHOLDER5'));
       return
      }else{
        this.dialogVisible2=true
        getSet({data_sql:this.form.data_sql}).then(res => {
          if (res.data.code === 200) {
             let params = JSON.stringify(res.data.data)
             this.formModel.content=params
          }
        })
      }
    },

    //详情
    getDetail(data){
      this.form=data
      this.noticeType=data.api_flag
    },

    
    //提交
    onSubmit(){
      if (!this.validate()) {
        return;
      }
      if(this.form.ip_whitelist){
        var reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
        var valdata = this.form.ip_whitelist.split('|');
        for(var i=0;i<valdata.length;i++){
          if(reg.test(valdata[i])== false){
            message_error(this.$t('DATASERVICE_MANAGEMENT.PLACEHOLDER7'));
            return false;
          }
        }
      }
      let params = this.form;
      if(!this.data){
        if(params.api_flag==="1"){
          params.time_interval=Number(this.form.time_interval)
        }else{
          params.time_interval=0
        }
      }else{
        if(params.api_flag==="1"){
          params.time_interval=Number(this.form.time_interval)
        }
      }
      
      if(!this.data){
        getAdd(params).then(res => {
          if (res.data.code === 200) {
            this.$emit("submit");
            this.noticeType=""
            this.dialogVisible = false;
            this.$message({message: "新建成功", center: true, type: "success"})
          }
        })  
      }else{
        getEdit(params).then(res => {
          if (res.data.code === 200) {
            this.$emit("submit");
            this.noticeType=""
            this.dialogVisible = false;
            this.$message({message: "编辑成功", center: true, type: "success"})
          }
        }) 
      }
    },
    handleClose(){
      this.form={}
      this.noticeType=""
      this.dialogVisible = false;
    },
    cancelDialog() {
      this.form={}
      this.noticeType=""
      this.dialogVisible = false;
    },

    onSend(){
      this.dialogVisible2=false
    },

    validate() {
      if (!this.form.name || this.form.name === "") {
        this.$refs.nameRef.focus();
        message_error(this.$t('DATASERVICE_MANAGEMENT.PLACEHOLDER1'));
        return false;
      }
      if (!this.form.signature_mode || this.form.signature_mode === "") {
        this.$refs.wayRef.focus();
        message_error(this.$t('DATASERVICE_MANAGEMENT.PLACEHOLDER2'));
        return false;
      }
      if (!this.form.api_flag || this.form.api_flag === "") {
        this.$refs.selRef.focus();
        message_error(this.$t('DATASERVICE_MANAGEMENT.PLACEHOLDER3'));
        return false;
      }
      if(this.noticeType===1){
        if (!this.form.time_interval || this.form.time_interval === "") {
          // this.$refs.intervalRef.focus();
          message_error(this.$t('DATASERVICE_MANAGEMENT.PLACEHOLDER4'));
          return false;
        }
      }

      return true;
    }
  }
}
</script>

<style scoped lang="scss">

.code-editor-label {
 color: #fff;
 margin-top: 10px;

}
::v-deep .code_editor .code_area  textarea {
 overflow-y: auto;
}
.dialog-box{
 border: 1px solid #e9e9eb;
 padding: 10px;
 cursor: pointer;
 p{
   margin-bottom: 0;
 }
}
.dialog-box:last-child{
 margin-top: 20px;
}

.dialog-border{
 border: 1px solid #5867dd;
 padding: 10px;
 cursor: pointer;
 p{
   margin-bottom: 0;
 }
}

.dialog-border:last-child{
 margin-top: 20px;
}

.list_box{
 margin-top:20px;
 .item{
   display:flex;
   align-items:center;
   height:60px;
   justify-content:space-between;
   border-bottom:1px solid #ccc;
   .flex_full{
     flex: 1;
   }
   &:first-child{
     border-top:1px solid #ccc;
   }
 }
 
}
</style>