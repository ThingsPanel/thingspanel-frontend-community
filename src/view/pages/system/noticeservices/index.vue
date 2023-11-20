<template>
  <div class="rounded p-4 card no-border v-application my-v-input" data-app="true">
    
    <div class="system-box">
      <p class="tab-title">
        <span v-for="(item, index) in tabs" :key="index" :class="{ active: item.value == activeTab }" @click="activeTab=item.value">
          {{ $t(item.name) }}
        </span>
      </p>
      <div class="content">
        <div v-if="activeTab == 1">
          <!-- 短信设置 -->
          <div class="content-form">
            <el-form ref="form"  class="el-dark-input" :rules="rules" :label-position="'left'" label-width="140px" :model="formObj" >
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.NOTICE_TYPE')" prop="config.cloud_type">
                <el-select v-model="formObj.notice_type" :placeholder="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER')" style="width: 330px">
                  <el-option v-for="option in noticeTypeOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE1')" prop="config.cloud_type">
                <el-select v-model="formObj.config.cloud_type" :placeholder="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER')" style="width: 330px">
                  <el-option :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.ALY')" :value="1"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE2')" prop="config.access_key_id">
                <el-input
                  style="width: 330px"
                  v-model="formObj.config.access_key_id"
                ></el-input>
              </el-form-item>
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE3')" prop="config.access_key_secret">
                <el-input
                  style="width: 330px"
                  v-model="formObj.config.access_key_secret"
                ></el-input>
              </el-form-item>
              
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE4')" prop="config.endpoint">
                <el-input
                  style="width: 330px"
                  v-model="formObj.config.endpoint"
                ></el-input>
              </el-form-item>

              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE5')" prop="config.sign_name">
                <el-input
                  style="width: 330px"
                  v-model="formObj.config.sign_name"
                ></el-input>
              </el-form-item>

              <!-- <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE6')">
                <el-input
                  style="width: 330px"
                  v-model="formObj.name"
                ></el-input>
              </el-form-item> -->

              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE7')" prop="config.template_code">
                <el-input
                  style="width: 330px"
                  v-model="formObj.config.template_code"
                ></el-input>
              </el-form-item>

              <el-form-item label="">
                <el-input
                  disabled
                  type="textarea"
                  rows="5"
                  style="width: 330px;"
                  v-model="formObj.system_name"
                  :placeholder="templatePlaceholderOptions[formObj.notice_type].template"
                ></el-input>
              </el-form-item>

              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE8')">
                <el-switch v-model="formObj.status" :active-value="1" :inactive-value="0" @change="switchChange"></el-switch>
              </el-form-item>
            </el-form>
          </div>
          <div style="padding-left: 120px; margin-bottom: 20px;">
            <el-button type="yellow" @click="showSmsDebug">{{$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.DEBUG')}} </el-button>
            <!-- <el-button type="indigo" v-if="isEdit" @click="edit()">{{$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.EDIT')}} </el-button> -->
            <el-button type="save" @click="handleSaveSms">{{$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.SAVE')}} </el-button>
          </div>
        </div>
        <div v-if="activeTab == 2">
          <!-- 邮箱配置 -->
          <div class="content-form">
            <el-form ref="form2" :rules="rules2" :label-position="'left'" label-width="140px" :model="objForm" >
             
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE12')" prop="obj.host">
                <el-input
                  style="width: 330px"
                  v-model="objForm.obj.host"
                ></el-input>
              </el-form-item>
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE13')" prop="obj.port">
                <el-input
                  style="width: 330px"
                  v-model="objForm.obj.port"
                ></el-input>
                <span class="span-check"><el-checkbox v-model="objForm.obj.ssl">开启ssl</el-checkbox></span>
              </el-form-item>
              
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE14')" prop="obj.from_email">
                <el-input
                  style="width: 330px"
                  v-model="objForm.obj.from_email"
                ></el-input>
              </el-form-item>

              <!-- 授权码/密码 -->
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE15')" prop="obj.from_password">
                <el-input
                  style="width: 330px"
                  v-model="objForm.obj.from_password"
                ></el-input>
              </el-form-item>

              <!-- 开启/关闭服务 -->
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE8')">
                <el-switch v-model="objForm.status" :active-value="1" :inactive-value="0" @change="switchChange2"></el-switch>
              </el-form-item>
            </el-form>
          </div>
          <div style="padding-left: 120px; margin-bottom: 20px;">
            <el-button type="yellow" @click="showEmailDebug">{{$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.DEBUG')}} </el-button>
            <!-- <el-button type="indigo" v-if="isEdit2" @click="edit2()">{{$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.EDIT')}} </el-button> -->
            <el-button type="save" @click="handleSaveEmail()">{{$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.SAVE')}} </el-button>
          </div>
        </div>  
      </div>
    </div>
    
    <!-- 短信调试窗口 -->
    <div class="model">
      <el-dialog class="el-dark-dialog el-dark-input"
              :title="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.DEBUG')"
              :visible.sync="dialogVisible"
              :close-on-click-modal="false" :close-on-press-escape="false" :show-close="true" :append-to-body="true"
              width="500px">
              <div class="dialog-body">
                <el-form
                    ref="smsDebugForm"
                    :rules="rules3"
                    label-position="left"
                    :model="formModel"
                    label-width="100px">
                    <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE9')" prop="phone_number">
                      <el-input v-model="formModel.phone_number"></el-input>
                    </el-form-item>
                    <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE10')" prop="content">
                      <el-input 
                      type="textarea" 
                      :placeholder="templatePlaceholderOptions[formObj.notice_type].messageContent"
                      v-model="formModel.content">
                    </el-input>
                    </el-form-item>
                    <div style="display: flex;justify-content: center">
                      <el-button class="medium" type="save" size="medium" :disabled="submitLoading" @click="handleSmsDebugSend">{{ $t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.SEND') + sendTimeout}}</el-button>
                    </div>
                </el-form>
              </div>
      </el-dialog>
    </div>


    <!-- 邮箱调试窗口 -->
    <div class="model">
      <el-dialog class="el-dark-dialog el-dark-input"
              :title="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.DEBUG')"
              :visible.sync="dialogVisible2"
              :close-on-click-modal="false" :close-on-press-escape="false" :show-close="true" :append-to-body="true"
              width="500px">
              <div class="dialog-body">
                <el-form
                    ref="emailDebugForm"
                    :rules="rules4"
                    label-position="left"
                    :model="formModel2"
                    label-width="100px">
                    <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE11')" prop="email">
                      <el-input v-model="formModel2.email"></el-input>
                    </el-form-item>
                    <el-form-item :label="$t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.LABLE10')" prop="content">
                      <el-input type="textarea" v-model="formModel2.content"></el-input>
                    </el-form-item>
                    <div style="display: flex;justify-content: center">
                      <el-button class="medium" type="save" size="medium" :disabled="submitLoading" @click="handleEmailDebugSend">{{ $t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.SEND') + sendTimeout}}</el-button>
                    </div>
                </el-form>
              </div>
      </el-dialog>
    </div>
  </div>
</template>


<script>
import { local_url } from "@/api/LocalUrl"
import i18n from "@/core/plugins/vue-i18n.js"
import {getSmsSave, getDetail,getSendSms,getSendEmail} from "@/api/noticeservices";
import { message_error } from "@/utils/helpers.js";
export default {
  data () {
    return {
      activeTab: 1,
      tabs: [
        {
          name: "SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.SMS",
          value: 1,
        },
        {
          name: "SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.EMAIL",
          value: 2,
        },
        {
          name: "SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PHONE",
          value: 3,
        },
      ],
      url: local_url,
      formObj: {
        notice_type: 1,
        config:{
          cloud_type:'',
          access_key_id:"",
          access_key_secret:'',
          endpoint:'',
          sign_name:'',
          template_code:'',
        },
      
        status:0,
      },

      objForm:{
        notice_type: 2,
        config:{
          // host:'',
          // port:"",
          // ssl:true,
          // from_password:'',
          // from_email:'',
        },
        obj:{
          host:'',
          port:"",
          ssl:true,
          from_password:'',
          from_email:'',
        },
        status:0,
      },
      formModel:{
        phone_number:"",
        content:"",
      },
      formModel2:{
        email:"",
        content:"",
      },
      sendTimeout: "",
      submitLoading: false,
      isDisabled:true,
      isDisabled2:true,
      isEdit:true,
      isSave: false,
      isEdit2:true,
      isSave2: false,
      dialogVisible: false,
      dialogVisible2: false,
      rules: {
        "config.cloud_type": [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER'), trigger: "change"}
        ],
        "config.access_key_id": [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER1'), trigger: "blur"}
        ],
        "config.access_key_secret": [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER2'), trigger: "blur"}
        ],
        "config.endpoint": [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER3'), trigger: "blur"}
        ],
        "config.sign_name": [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER4'), trigger: "blur"}
        ],
        "config.template_code": [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER5'), trigger: "blur"}
        ],

      },
      rules2: {
     
        "obj.host": [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER8'), trigger: "blur"}
        ],
        "obj.port": [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER9'), trigger: "blur"}
        ],
        "obj.from_password": [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER10'), trigger: "blur"}
        ],
        "obj.from_email": [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER11'), trigger: "blur"}
        ],
        
      },
      rules3: {
        phone_number: [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER6'), trigger: "blur"}
        ],
        content: [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER7'), trigger: "blur"}
        ],
      },
      rules4: {
        email: [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER12'), trigger: "blur"}
        ],
        content: [
          {required: true, message: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.PLACEHOLDER7'), trigger: "blur"}
        ],
      },
      noticeTypeOptions: [
        { label: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.SMS_CODE_NOTICE'), value: 3 },
        { label: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.ALERT_MESSAGE_NOTICE'), value: 1 },
      ],
      templatePlaceholderOptions: {
        1: {
          template: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.ALERT_TEMPLATE_PLACEHOLDER'),
          messageContent: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.ALERT_CONTENT_PLACEHOLDER'),
        },
        3: {
          template: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.SMS_CODE_TEMPLATE_PLACEHOLDER'),
          messageContent: i18n.t('SYSTEM_MANAGEMENT.NOTICESERVICES_MANAGEMENT.SMS_CODE_CONTENT_PLACEHOLDER'),
        },
      }
    }
  },

  watch() {
  
    this.initData()
   
  },
  mounted(){
    this.getSmsDetail()
    this.getEmailDetail()
  },

  methods: {
    initData(){
      if(this.$refs.form !==undefined){
        this.$refs['form'].clearValidate();
      }
      if(this.$refs.form2 !==undefined){
        this.$refs['form2'].clearValidate();
      }
    
    },

    // 开关切换
    switchChange(value) {
      if(value===0){
        this.formObj.status=2
      }else{
        this.formObj.status=1
      }
    },

    // 开关切换
    switchChange2(value) {
      if(value===0){
        this.objForm.status=2
      }else{
        this.objForm.status=1
      }
    },
    // 短信保存
    handleSaveSms(){
      this.isDisabled=true
      this.isEdit=true
      this.isSave=false
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.formObj.config=JSON.stringify(this.formObj.config)
          let params = JSON.parse(JSON.stringify(this.formObj));
          getSmsSave(params).then(res => {
              if (res.data.code === 200) {
                this.$message({message: "保存成功", center: true, type: "success"})
                this.getSmsDetail()
              }
          })
        }
      })
    },

    // 短信详情
    getSmsDetail(){
      getDetail({notice_type:this.formObj.notice_type}).then(data => {
        if (data.data.code === 200) {
          let obj =data.data.data
          const config=JSON.parse(obj[0].config)
          if(obj[0].status===1){
            this.formObj.status=1
          }else{
            this.formObj.status=0
          }
          this.formObj.config=config
        }
      })
    },

    // 邮箱详情
    getEmailDetail(){
      getDetail({notice_type:this.objForm.notice_type}).then(data => {
        if (data.data.code === 200) {
          let obj =data.data.data
          const config=JSON.parse(obj[0].config)
          if(obj[0].status===1){
            this.objForm.status=1
          }else{
            this.objForm.status=0
          }
          this.objForm.obj=config
        }
      })
    },

    /**
     * @description: 短信调试
     * @return {*}
     */    
    showSmsDebug() {
      this.sendTimeout = "";
      this.submitLoading = false;
      this.dialogVisible=true
    },
    /**
     * @description: 邮箱保存
     * @return {*}
     */    
    handleSaveEmail(){
      this.isDisabled2=true
      this.isEdit2=true
      this.isSave2=false
       this.$refs.form2.validate((valid) => {
        if (valid) {
          this.objForm.obj.port=Number(this.objForm.obj.port)
          this.objForm.obj=JSON.stringify(this.objForm.obj)
          this.objForm.config=this.objForm.obj
          let params = JSON.parse(JSON.stringify(this.objForm));
          getSmsSave(params).then(res => {
              if (res.data.code === 200) {
                this.$message({message: "保存成功", center: true, type: "success"})
                this.getEmailDetail()
              }
          })
        }
      })
    },
    /**
     * @description: 打开邮箱调试窗口
     * @return {*}
     */
    showEmailDebug() {
      this.sendTimeout = "";
      this.submitLoading = false;
      this.dialogVisible2 = true
    },
    /**
     * @description: 短信调试发送
     * @return {*}
     */    
    handleSmsDebugSend(){
      this.$refs["smsDebugForm"].validate(valid => {
        if (valid) {
          if (this.submitLoading) {
            message_error("短信发送太频繁了!");
          }
          this.submitLoading = true;
          this.formModel.phone_number = Number(this.formModel.phone_number)
          getSendSms(this.formModel)
            .then(res => {
                if (res.data.code === 200) {
                  this.$message({message: "发送成功", center: true, type: "success"})
                }
            }) 
          let count = 5;
          const timer = setInterval(() => {
            this.sendTimeout = `(${count})`
            count--;
            if (count === -1) {
              clearInterval(timer);
              this.sendTimeout = "";
              this.submitLoading = false;
            }
          }, 1000);
        }
      })
          
    },
    /**
     * @description: 邮箱调试发送
     * @return {*}
     */    
    handleEmailDebugSend(){
      this.$refs["emailDebugForm"].validate(valid => {
        if (valid) {
          if (this.submitLoading) {
            message_error("邮箱发送太频繁了!");
          }
          this.submitLoading = true;
          this.formModel2 = { ...this.objForm.obj, email: this.formModel2.email, content: this.formModel2.content };
          getSendEmail(this.formModel2).then(res => {
              if (res.data.code === 200) {
                this.$message({message: "发送成功", center: true, type: "success"});
              }
          })  
          let count = 5;
          const timer = setInterval(() => {
            this.sendTimeout = `(${count})`
            count--;
            if (count === -1) {
              clearInterval(timer);
              this.sendTimeout = "";
              this.submitLoading = false;
            }
          }, 1000);
        } 
      })
         
    },
    
  },
};
</script>
<style lang="scss" scoped>
.system-box {
  color: #fff;
  p {
    margin: 0;
  }
  .tab-title {
    font-size: 1.3rem;
    border-bottom: 1px solid #f6f6f613;
    padding: 0 1rem;
    margin-bottom: 2rem;
    span {
      display: inline-block;
      padding: 0.6rem 0 1.4rem;
      margin-right: 5rem;
      cursor: pointer;
      &.active {
        border-bottom: 2px solid #5b92ff;
      }
    }
  }
  .content {
    padding: 0 1rem;
    & > p {
      font-size: 14px;
    }
    &-form {
      ::v-deep .el-form-item__label {
        color: #fff;
      }
    }
    .span-check{
      margin-left: 20px;
    }
  }
  .img-upload {
    display: flex;
    img {
      width: 140px;
      height: 140px;
      object-fit: contain;
    }
    ::v-deep .el-button {
      width: 100%;
      margin-top: 1rem;
      background: #212d66;
      border-color: #212d66;
    }
    ::v-deep .el-upload{
      width: 100%;
    }
  }
}
</style>