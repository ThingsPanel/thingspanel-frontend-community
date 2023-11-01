<template>
  <div>
    <el-dialog
      :title="id ? $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.EDITTITLE') : $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.ADDTITLE')"
      class="el-dark-dialog"
      :close-on-click-modal="false"
      :before-close="handleClose"
      :visible.sync="dialogVisible"
      width="60%"
      height="60%"
      top="10vh"
    >
      <el-form ref="CreateForm" label-position="left" label-width="140px" :model="form">
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.GROUPNAME')" required>
            <el-input ref="nameRef" v-model="form.group_name"></el-input>
          </el-form-item>

          <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.DESC')" required>
            <el-input class="el-dark-input" ref="descRef" type="textarea" v-model="form.desc"></el-input>
          </el-form-item>
          
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.METHOD')" required>
            <el-select class="w-100" ref="selRef" v-model="form.notification_type" @change="handleTypeChange"
            :placeholder="$t('COMMON.PLACEHOLDER5')">
              <el-option label="成员通知" :value="1"></el-option>
              <el-option label="邮箱通知" :value="2"></el-option>
              <el-option label="短信通知" :value="4"></el-option>
              <el-option label="语音通知" :value="5"></el-option>
              <el-option label="企业微信群机器人" :value="6"></el-option>
              <el-option label="钉钉群机器人" :value="7"></el-option>
              <el-option label="飞书群机器人" :value="8"></el-option>
              <el-option label="webhook" :value="3"></el-option>
            </el-select>
          </el-form-item>

          <div v-if="noticeType==1">
            <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SETMETHOD')" required>
              <div style="display:flex;margin-bottom: 10px;" v-for="(command, index) in form.commands" :key="index">
                <DeviceTypeSelector ref="deviceTypeRef" style="" :data="command.data" :option="{operator: false}" @change="v=>handleCommandChange(command, v)"/>
                <!-- 新增一行 -->
                <el-button type="indigo" size="small" style="margin-left: auto" v-if="index == 0" @click="handleAddCommand(command)">{{ $t('COMMON.ADD')}}</el-button>
                <el-button type="danger" size="small" style="margin-left: auto" v-if="index > 0" @click="handleDeleteCommand(command)">{{ $t('COMMON.DELETE')}}</el-button>
              </div>
            </el-form-item>
          </div>

          <div v-if="noticeType==2">
            <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SETEMAIL')" required>
              <el-input class="el-dark-input" type="textarea" :placeholder="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER6')" v-model="form.email"></el-input>
            </el-form-item>
          </div>

          <div v-if="noticeType==4">
            <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SETSMS')" required>
              <el-input class="el-dark-input" type="textarea" :placeholder="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER7')" v-model="form.message"></el-input>
            </el-form-item>
          </div>
          <div v-if="noticeType==5">
            <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SETVOICE')" required>
              <el-input class="el-dark-input" type="textarea" :placeholder="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER8')" v-model="form.phone"></el-input>
            </el-form-item>
          </div>

          <div v-if="noticeType==3 || noticeType==6 || noticeType==7 || noticeType==8">
            <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SETURL')" required>
              <el-input v-model="form.webhook"></el-input>
            </el-form-item>
          </div>
          <div style="display: flex;justify-content: center">
            <el-button class="cancel-button" type="cancel" size="medium" plain @click="cancelDialog">{{ $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.CANCEL') }}</el-button>
            <el-button class="medium" type="save" size="medium" @click="onSubmit">{{ $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SAVE') }}</el-button>
          </div>
      </el-form>
    </el-dialog>
    <!-- <div class="model">
      <el-dialog class="el-dark-dialog el-dark-input"
              :title="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.DEBUG')"
              :visible.sync="dialogVisible2"
              :close-on-click-modal="false" :close-on-press-escape="false" :show-close="true" :append-to-body="true"
              width="500px">
              <div class="dialog-body">
                <el-form
                    ref="form3"
                    :rules="rules3"
                    label-position="left"
                    :model="formModel"
                    label-width="100px">
                    <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE9')" prop="phone_number">
                      <el-input v-model="formModel.phone_number"></el-input>
                    </el-form-item>
                    <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE10')" prop="content">
                      <el-input type="textarea" v-model="formModel.content"></el-input>
                    </el-form-item>
                    <div style="display: flex;justify-content: center">
                      <el-button class="medium" type="save" size="medium" @click="onSend">{{ $t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.SEND') }}</el-button>
                    </div>
                </el-form>
              </div>
      </el-dialog>
    </div> -->
  </div>
</template>

<script>
import { message_error } from '@/utils/helpers';
import DeviceTypeSelector from "@/view/pages/notice/DeviceTypeSelector.vue";
import {getNotificationAdd,getNotificationDetail,getNotificationEdit} from "@/api/notice";

export default {
  name: "CreateForm",
  components: { DeviceTypeSelector },
  props: {
    // init_data: {
    //   default: null
    // },
    id: {
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
          if (this.id) {
            // 编辑
            this.getDetail(this.id);
          } else {
            // 新增
            this.form = {
              group_name: '',
              desc: '',
              notification_type:"",
              commands: [
                {
                  data: {}
                }
              ],
              notification_config:{

              },
              email: '',
              message:'',
              phone:'',
              webhook: '',
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
    form:{
      group_name: '',
      desc: '',
      notification_type:"",
      commands: [
        {
          data: {}
        }
      ],
      notification_config:{
    
      },
      email: '',
      message:'',
      phone:'',
      webhook: '',
    },
    // formModel:{
      
    // },
    // dialogVisible2:false,
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


  },
  methods: {
    handleTypeChange(e){
      this.form.notification_type=e
      this.noticeType=e
    },

    /**
    * @description: 新增一行命令
    * @return {*}
    */    
    handleAddCommand() {
      this.form.commands.push({data: {}});
    },
    /**
    * @description: 指定行被改变
    * @param {*} command  改变前的值
    * @param {*} v  改变后的值
    * @return {*}
    */    
    handleCommandChange(command, v) {
      command.data = v;
    },
    /**
    * @description: 删除指定行
    * @param {*} command
    * @param {*} v
    * @return {*}
    */    
    handleDeleteCommand(command) {
      let index = this.form.commands.findIndex(item => item ==command );
      this.form.commands.splice(index, 1);
    },

    //详情
    getDetail(id){
      getNotificationDetail({id:id}).then(res => {
          if (res.data.code === 200) {
            let data = res.data.data
            if (data !== "{}") {
              let commands = this.getCommands(JSON.parse(JSON.stringify(data)))
              const tmp = JSON.parse(JSON.stringify(data));
              tmp.commands = commands;
              this.noticeType=tmp.notification_type
              const objData = JSON.parse(JSON.stringify(data));
              let obj= JSON.parse(objData.notification_config);
              tmp.email=obj.email
              tmp.message=obj.message
              tmp.phone=obj.phone
              tmp.webhook=obj.webhook
              this.form = tmp;
            }
          }
      })
    },

    getCommands(v) {
      let cmds = v?.notification_members || [{ data: {}}];
      let commands = cmds.map(cmd => {
        return {
            data: {
              is_email: cmd.is_email,
              is_message: cmd.is_message,
              is_phone: cmd.is_phone,
              user_id: cmd.users_id,
            }
        }
      })
      return commands;
    },

    //提交
    onSubmit(){
      if (!this.validate()) {
        return;
      }
      let params = JSON.parse(JSON.stringify(this.form));
      let jsonData={}
      if(!this.id){
        if(params.notification_type===1){
          params.notification_config={}
          params.notification_members = this.form.commands.map(cmd => {
            return {            
              user_id: cmd.data.user_id,
              is_email: cmd.data.is_email,
              is_message: cmd.data.is_message,
              is_phone: cmd.data.is_phone,
            }
          })
        }else if(params.notification_type===2){
          params.notification_config.email=this.form.email
        }else if(params.notification_type===4){
          params.notification_config.message=this.form.message
        }else if(params.notification_type===5){
          params.notification_config.phone=this.form.phone
        }else if(params.notification_type===3 || params.notification_type===6 || params.notification_type===7 || params.notification_type===8){
          params.notification_config.webhook=this.form.webhook
        }   
      }else{
         let objNum= JSON.parse(params.notification_config);
         if(params.notification_type===1){
          params.notification_config={}
          params.notification_members = this.form.commands.map(cmd => {
            return {            
              user_id: cmd.data.user_id,
              is_email: cmd.data.is_email,
              is_message: cmd.data.is_message,
              is_phone: cmd.data.is_phone,
            }
          })
        }else if(params.notification_type===2){
          objNum.email=this.form.email
          jsonData.email=objNum.email
          params.notification_config=jsonData
        }else if(params.notification_type===4){
          objNum.message=this.form.message
          jsonData.message=objNum.message
          params.notification_config=jsonData
        }else if(params.notification_type===5){
          objNum.phone=this.form.phone
          jsonData.phone=objNum.phone
          params.notification_config=jsonData
        }else if(params.notification_type===3 || params.notification_type===6 || params.notification_type===7 || params.notification_type===8){
          objNum.webhook=this.form.webhook
          jsonData.webhook=objNum.webhook
          params.notification_config=jsonData
        }   
      }
      
      if(!this.id){
        getNotificationAdd(params).then(res => {
          if (res.data.code === 200) {
            this.$emit("submit");
            this.noticeType=""
            this.dialogVisible = false;
            this.$message({message: "新建成功", center: true, type: "success"})
          }
        })  
      }else{
        getNotificationEdit(params).then(res => {
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
    validate() {
      if (!this.form.group_name || this.form.group_name === "") {
        this.$refs.nameRef.focus();
        message_error(this.$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER'));
        return false;
      }
      if (!this.form.desc || this.form.desc === "") {
        this.$refs.descRef.focus();
        message_error(this.$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER1'));
        return false;
      }

      if (!this.form.notification_type || this.form.notification_type === "") {
        this.$refs.selRef.focus();
        message_error(this.$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER2'));
        return false;
      }

      if(this.noticeType===2){
        if (!this.form.email || this.form.email === "") {
          // this.$refs.emailTextRef.focus();
          message_error(this.$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER5'));
          return false;
        }
      }

      if(this.noticeType===4){
        if (!this.form.message || this.form.message === "") {
          // this.$refs.emailTextRef.focus();
          message_error(this.$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER10'));
          return false;
        }
      }
      if(this.noticeType===5){
        if (!this.form.phone || this.form.phone === "") {
          // this.$refs.emailTextRef.focus();
          message_error(this.$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER10'));
          return false;
        }
      }

      if(this.noticeType===3 || this.noticeType===6 || this.noticeType===7 || this.noticeType===8){
        if (!this.form.webhook || this.form.webhook === "") {
          // this.$refs.urlRef.focus();
          message_error(this.$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER7'));
          return false;
        }
      }

      if(this.noticeType===1){
        for(let i=0; i < this.$refs.deviceTypeRef.length; i++) {
          const ref = this.$refs.deviceTypeRef[i];
          if (!ref.validate()) return false;
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