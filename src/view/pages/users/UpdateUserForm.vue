<template>
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :visible.sync="showDialog"
      width="40%"
      :title="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.USERS')"
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
        <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.NAME')" prop="name" >
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
            <el-input size="medium" readonly v-model="formData.email"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.TELEPHONE')" prop="mobile" style="margin-left: 15px">
            <el-input size="medium" v-model="formData.mobile"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.REMARKS')" prop="remark">
        <el-input size="medium" v-model="formData.remark" type="textarea" :rows="3"></el-input>
      </el-form-item>

      <FormAlert :error_message="error_message"></FormAlert>

      <el-form-item >
        <div style="display: flex;justify-content: center">
          <el-button size="medium" plain @click="showDialog = false">{{$t('SYSTEM_MANAGEMENT.CANCEL')}}</el-button>
          <el-button size="medium"  type="primary" @click="handleSubmit">{{$t('SYSTEM_MANAGEMENT.SAVE')}}</el-button>
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
import i18n from "@/core/plugins/vue-i18n.js"
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
        formData.roles = [];
        formData.is_admin = val.is_admin;
        formData.email = val.email;
        formData.mobile = val.mobile;
        formData.remark = val.remark;

        get_roles({user: formData.email})
            .then(res => {
              let { data, code } = res.data;
              if (code == 200 && data) {
                formData.roles = data
              }
            })
      }
    })

    let loading = ref(false)
    let error_message = ref("")

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
                  // 通知父级关闭弹窗
                  context.emit('update:updateUserDialogVisible', false)
                })
            message_success(data.message)
            props.update_user()
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
</style>