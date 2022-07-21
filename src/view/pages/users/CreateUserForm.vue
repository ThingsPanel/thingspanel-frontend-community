<template>
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :visible.sync="showDialog"
      width="40%"
      center
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
        <el-form-item label="姓名：" prop="name" style="width: 100%">
          <el-input size="medium" v-model="formData.name"></el-input>
        </el-form-item>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="角色：" prop="roles">
            <div style="width: 100%">
              <el-checkbox-group v-model="formData.roles" style="display:flex;float:left">
                <el-checkbox v-for="(option, index) in rolesData" :key="index" :label="option.id">{{option.role_name}}</el-checkbox>
              </el-checkbox-group>
              <!--          <el-link type="primary" style="display:flex;float:right">展开</el-link>-->
              <el-button v-show="isCollapsed" type="text" style="display:flex;float:right" @click="isCollapsed = !isCollapsed">
                展开<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-button v-show="!isCollapsed" type="text" style="display:flex;float:right" @click="isCollapsed = !isCollapsed">
                收起<i class="el-icon-arrow-up el-icon--right"></i>
              </el-button>
            </div>

          </el-form-item>
        </el-col>
      </el-row>


      <el-row>
        <el-col :span="12">
          <el-form-item label="邮箱：" prop="email" style="margin-right: 15px">
            <el-input size="medium" v-model="formData.email"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机：" prop="mobile" style="margin-left: 15px">
            <el-input size="medium" v-model="formData.mobile"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="密码：" prop="password" style="margin-right: 15px">
            <el-input size="medium" v-model="formData.password" type="password" show-password></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="确认密码：" prop="password_confirmation" style="margin-left: 15px">
            <el-input size="medium" v-model="formData.password_confirmation" type="password" show-password></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注：" prop="remark">
        <el-input size="medium" v-model="formData.remark" type="textarea" :rows="5"></el-input>
      </el-form-item>

      <FormAlert :error_message="error_message"></FormAlert>

      <el-form-item >
        <div style="display: flex;justify-content: center">
          <el-button size="medium" plain @click="showDialog = false">取消</el-button>
          <el-button size="medium"  type="primary" @click="handleSubmit">保存</el-button>
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
      password: "",
      password_confirmation: "",
      remark: "",
    })
    // 角色折叠按钮
    let isCollapsed = ref(false);
    let loading = ref(false);
    let error_message = ref("")

    // 检查密码
    const check_password_confirmation = (rule, value, callback) => {
      if (value === "") {
        callback(new Error("请再次输入密码"));
      }
      if (formData.password !== value) {
        callback(new Error("新密码两次输入不一致"));
      }

      callback();
    }

    // 表单验证
    let rules = reactive({
      name: [
        {required: true, message: "请填写姓名"}
      ],
      email: [
        {required: true, message: "请填写合法的电子邮箱", validator: check_email}
      ],
      mobile: [
        {required: true, message: "请填写合法的手机号", validator: check_mobile}
      ],
      password: [
        {required:true, message: "请输入新密码"},
        {min:6, message: "密码至少 6 位"}
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
        console.log("=======================")
        console.log({...formData})
        console.log("=======================")
        // 发送请求
        user_add(formData).then(({data})=>{
          if( data.code === 200) {
            // 分配角色
            user_add_roles({user: data.data.email, roles: formData.roles })
                .then(({data}) => {
                  console.log(data)
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
  callback(new Error("请填写合法的电子邮箱"))
}
const check_mobile = (rule, value, callback) => {
  if (is_cellphone(value)) {
    callback()
  }
  callback(new Error("请填写合法的手机号"))
}
</script>

<style scoped>

</style>