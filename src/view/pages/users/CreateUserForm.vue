<template>
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :visible.sync="showDialog"
      width="40%"
      :title="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.USERS')"
      :close-on-click-modal="false"
  >
    <el-form
        ref="createUserForm"
        label-width="80px"
        label-position="top"
        :model="formData"
        :rules="rules"
        :inline="false"
        hide-required-asterisk>

      <el-row>
        <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.NAME')" prop="name" style="width: 100%">
          <el-input size="medium" v-model="formData.name"></el-input>
        </el-form-item>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.ROLE')" prop="roles">
            <div style="width: 100%">
              <el-row :gutter="20">
                <el-col :span="20">
                  <el-checkbox-group :class="isCollapsed ? 'cg-roles-name' : ''" v-model="formData.roles">
                    <el-checkbox v-for="(option, index) in rolesData" :key="index" :label="option.id">{{option.role_name}}</el-checkbox>
                  </el-checkbox-group>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="2">
                  <div style="text-align: right">
                    <el-button v-show="isCollapsed" type="text" style="padding-top: 10px" @click="isCollapsed = !isCollapsed">
                      {{ $t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.DOWN') }}<i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-button v-show="!isCollapsed" type="text" style="padding-top: 10px"  @click="isCollapsed = !isCollapsed">
                      {{ $t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.UP') }}<i class="el-icon-arrow-up el-icon--right"></i>
                    </el-button>
                  </div>

                </el-col>
              </el-row>
            </div>

          </el-form-item>
        </el-col>
      </el-row>


      <el-row>
        <el-col :span="12">
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.EMAIL')" prop="email" style="margin-right: 15px">
            <el-input size="medium" v-model="formData.email"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.TELEPHONE')" prop="mobile" style="margin-left: 15px">
            <el-input size="medium" v-model="formData.mobile"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PASSWORD')" prop="password" style="margin-right: 15px">
            <el-input size="medium" v-model="formData.password" type="password" show-password></el-input>
            <el-alert show-icon
                :title="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.TITLE')"
                type="info" :closable="false" effect="dark">
            </el-alert>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.CONPASSWORD')" prop="password_confirmation" style="margin-left: 15px">
            <el-input size="medium" v-model="formData.password_confirmation" type="password" show-password></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.REMARKS')" prop="remark">
        <el-input size="medium" v-model="formData.remark" type="textarea" :rows="1"></el-input>
      </el-form-item>

      <FormAlert :error_message="error_message"></FormAlert>

      <el-form-item >
        <div style="display: flex;justify-content: center">
          <el-button size="medium" type="cancel" plain @click="showDialog = false">{{$t('SYSTEM_MANAGEMENT.CANCEL')}}</el-button>
          <el-button size="medium" type="save" @click="handleSubmit">{{$t('SYSTEM_MANAGEMENT.SAVE')}}</el-button>
          <!--  <div class="py-1"><el-button class="w-100" @click="handleReset">重置</el-button></div>-->
        </div>
      </el-form-item>


    </el-form>
  </el-dialog>
</template>

<script>
import {defineComponent, ref, reactive, computed, watch} from "@vue/composition-api";
import {is_cellphone, is_email, message_success} from "@/utils/helpers";
import {user_add, user_add_roles} from "@/api/user";
import FormAlert from "@/components/common/FormAlert";
import i18n from "@/core/plugins/vue-i18n.js"
export default defineComponent({
  name: "CreateUserForm",
  components: {
    FormAlert
  },
  props: {
    add_user: {
      required: true,
      type: Function,
    },
    createUserDialogVisible: {
      type: Boolean,
      default: false
    },
    rolesData: {
      type: Array,
      default: () => []
    }
  },
  setup(props, context){
    // from 表单元素
    let createUserForm = ref()

    // 父级 props 的计算属性
    let showDialog = computed({
      get(){
        return !!props.createUserDialogVisible
      },
      set(val){
        context.emit('update:createUserDialogVisible', val)
      },
    });

    // 弹窗关闭时重置表单
    watch(()=> props.createUserDialogVisible, (val)=>{
      if(val === false) {
        createUserForm.value.resetFields()
        error_message.value = ""
      }
    })

    // 提交的数据
    let formData = reactive({
      name: "",
      is_admin: 0,
      roles: [],
      email: "",
      mobile: "",
      password: "123456",
      password_confirmation: "123456",
      remark: "",
      authority: "TENANT_USER"
    })
    // 角色折叠按钮，默认折叠
    let isCollapsed = ref(true);
    let loading = ref(false);
    let error_message = ref("")

    // 检查密码
    const check_password_confirmation = (rule, value, callback) => {
      if (value === "") {
        callback(new Error(i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER8')));
      }
      if (formData.password !== value) {
        callback(new Error(i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER9')));
      }

      callback();
    }

    // 表单验证
    let rules = reactive({
      name: [
        {required: true, message: i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER1')}
      ],
      email: [
        {required: true, message: i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER2'), validator: check_email}
      ],
      mobile: [
        {required: true, message: i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER4'), validator: check_mobile}
      ],
      password: [
        {required:true, message: i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER6')},
        {min:6, message: i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER7')}
      ],
      password_confirmation: [
        {required: true, validator: check_password_confirmation}
      ]
    })

    // 提交
    function handleSubmit(){

      createUserForm.value.validate((valid)=>{

        if(!valid) return;


        if(loading.value) return;
        loading.value = true

        // 提交前清除错误
        error_message.value = ""
        // 发送请求
        user_add(formData).then(({data})=>{
          if( data.code === 200) {
            // 分配角色
            user_add_roles({user: data.data.email, roles: formData.roles })
                .then(({data}) => {
                })
            message_success(data.message)
            // 调用 props 方法向列表添加新数据
            // 后端返回数据缺少 mobile
            data.data.mobile = formData.mobile
            props.add_user(data.data)
            // 通知父级关闭 dialog
            context.emit("update:createUserDialogVisible", false)
          }else{
            error_message.value = data.message
          }
        }).finally(()=>{
          loading.value = false
        })

      })
    }

    // function handleReset(){
    //   createUserForm.value.resetFields()
    //   error_message.value = ""
    // }

    return {
      showDialog,
      isCollapsed,
      createUserForm,
      formData,
      rules,
      handleSubmit,
      error_message,
    }
  }
})

// el-form 表单自定义验证方法
const check_email = (rule, value, callback) => {
  if (is_email(value)) {
    callback()
  }
  callback(new Error(i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER3')))
}
const check_mobile = (rule, value, callback) => {
  if (is_cellphone(value)) {
    callback()
  }
  callback(new Error(i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER5')))
}
</script>

<style scoped>
.cg-roles-name {
  white-space: nowrap;
  overflow: hidden;

}
.el-alert {
  padding-top: 0px;
  padding-bottom: 0px;
  border: 1px solid;
  background-color: transparent;
}
</style>