<template>
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :visible.sync="showDialog"
      width="40%"
      center
      :close-on-click-modal="false"
  >
    <el-form
        ref="updateUserForm"
        label-width="80px"
        label-position="top"
        :model="formData"
        :rules="rules"
        hide-required-asterisk>
      <el-row>
        <el-form-item label="姓名：" prop="name" >
          <el-input size="medium" v-model="formData.name"></el-input>
        </el-form-item>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="角色：">
            <div style="width: 100%">
              <el-checkbox-group v-model="formData.roles" style="display:flex;float:left">
                <el-checkbox v-for="(option, index) in rolesData" :key="index" :label="option.id">{{option.role_name}}</el-checkbox>
              </el-checkbox-group>
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

      <el-form-item label="备注" prop="remark">
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
import {defineComponent, reactive, ref, watch, computed} from "@vue/composition-api";
import FormAlert from "@/components/common/FormAlert";
import {is_cellphone, is_email, message_success} from "@/utils/helpers";
import {get_role, get_roles, user_edit, user_edit_roles} from "@/api/user";

export default defineComponent({
  name: "UpdateUserForm",
  components: {
    FormAlert
  },
  props: {
    editUserItem: {
      required: true,
    },
    update_user: {
      required: true,
      type: Function,
    },
    updateUserDialogVisible: {
      type: Boolean,
      default: false,
    },
    rolesData: {
      type: Array,
      default: () => []
    }
  },
  setup(props, context){
    // 表单元素
    let updateUserForm = ref()
    let isCollapsed = ref(false)
    let showDialog = computed({
      get(){
        return !!props.updateUserDialogVisible
      },
      set(val){
        context.emit('update:updateUserDialogVisible', val)
      },
    })

    let formData = reactive({
      name: "",
      is_admin: 0,
      roles: [],
      email: "",
      mobile: "",
      remark: "",
    })

    watch(()=> props.editUserItem, (val)=>{
      if(val){

        formData.id = val.id
        formData.name = val.name;
        formData.roles = val.roles ? val.roles : [];
        formData.is_admin = val.is_admin;
        formData.email = val.email;
        formData.mobile = val.mobile;
        formData.remark = val.remark;

        get_roles({user: formData.email})
            .then(res => {
              let { data, code } = res.data;
              if (code == 200) {
                let arr = [];
                data.forEach(item => {
                  props.rolesData.forEach(rolesItem => {
                    if (item == rolesItem.role_name) {
                      arr.push(rolesItem.id)
                    }
                  })
                })
                formData.roles = arr


              }
            })
      }
    })

    let loading = ref(false)
    let error_message = ref("")

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
    })

    function handleSubmit(){
      updateUserForm.value.validate((valid)=>{
        if(!valid) return;

        if(loading.value) return;
        loading.value = true

        // 提交前清除错误
        error_message.value = ""

        // 发送请求
        user_edit(formData).then(({data})=>{
          if(data.code === 200) {
            let params = {user: data.data.email, roles: formData.roles }
            // 分配角色
            user_edit_roles(params)
                .then(({data}) => {
                  console.log(data)
                })
            message_success(data.message)

            // 调用父级修改的方法
            // 后端返回数据缺少 mobile
            data.data.mobile = formData.mobile
            props.update_user(props.editUserItem, data.data)
            // 通知父级关闭弹窗
            context.emit('update:updateUserDialogVisible', false)

          }else{
            error_message.value = data.message
          }
        }).finally(()=>{
          loading.value = false
        })
      })
    }

    return {
      isCollapsed,
      updateUserForm,
      formData,
      rules,
      error_message,
      handleSubmit,
      showDialog,
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