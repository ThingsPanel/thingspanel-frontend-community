<template>
  <div>
    <el-dialog class="el-dark-dialog" :title="formData.id ? $t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.EDIT_TENANT') : $t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.ADD_TENANT')" :visible.sync="dialogVisible" width="540px"
      :before-close="() => dialogVisible = false" :close-on-click-modal="false">
      <el-form class="form-box" ref="formRef" :rules="rules" label-position="left" :model="formData" label-width="100px">

        <!-- 姓名 -->
        <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.NAME')" prop="name" required autocomplete="off">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>

        <!-- 邮箱 -->
        <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.EMAIL')" prop="email" required autocomplete="off">
          <el-input v-model="formData.email"></el-input>
        </el-form-item>

        <!-- 手机 -->
        <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.TELEPHONE')" prop="mobile" required autocomplete="off">
          <el-input v-model="formData.mobile"></el-input>
        </el-form-item>

        <template v-if="!formData.id">
          <!-- 密码 -->
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PASSWORD')" prop="password" required autocomplete="off">
            <el-input v-model="formData.password" type="password"></el-input>
            <el-alert show-icon
                  :title="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.TITLE')"
                  type="info" :closable="false" effect="dark">
              </el-alert>
          </el-form-item>

          <!-- 重复密码 -->
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.CONPASSWORD')" prop="password_confirmation" required  autocomplete="off">
            <el-input v-model="formData.password_confirmation"  type="password"></el-input>
          </el-form-item>
        </template>

        <!-- 备注 -->
        <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.REMARKS')" prop="remark">
          <el-input v-model="formData.remark"></el-input>
        </el-form-item>

        <div class="text-right">
          <el-button type="border" @click="dialogVisible = false">{{ $t('COMMON.CANCEL') }}</el-button>
          <el-button type="primary" @click="handleSubmit">{{ $t('COMMON.CONFIRM') }}</el-button>
        </div>

      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import { user_add, user_edit } from "@/api/user.js";
export default {
  name: "EditTenant",
  components: {},
  props: {
    visible: {
      type: [Boolean],
      default: false
    },
    data: {
      type: [Object],
      default: () => { return {} }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val)
      }
    }
  },
  data() {
    return {
      formData: {
        id: this.data.id,
        name: this.data.name,
        email: this.data.email,
        mobile: this.data.mobile,
        password: this.data.password || "123456",
        password_confirmation: this.data.password  || "123456",
        remark: this.data.remark
      },
      rules: {
        email: [
          { required: true, message: "请输入邮箱", trigger: "blur" },
          { min: 3, max: 40, message: "长度在 3 到 40 个字符", trigger: "blur" }
        ],
        name: [
          { required: true, message: "请输入姓名", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
        ],
        mobile: [
          { required: true, message: "请输入手机号", trigger: "blur" },
          { min: 11, max: 11,  message: "请输入正确的手机号", trigger: "blur" },
          { pattern: /^1[3456789]\d{9}$/, message: "请输入正确的手机号", trigger: "blur" }
        ],
        password: [
          { required: true, message: "请输入密码", trigger: "blur" },
          { min: 6, max: 20, message: "长度在 6 到 20 个字符", trigger: "blur" }
        ],
        password_confirmation: [
          { required: true, message: "请输入密码", trigger: "blur" },
          { min: 6, max: 20, message: "长度在 6 到 20 个字符", trigger: "blur" }
        ],
        
      }
    }
  },
  watch: {
    data: {
      handler(newValue) {
        console.log('watch', newValue)
        if (newValue) {
          this.formData = { 
            ...newValue, 
            password: newValue.password || "123456", 
            password_confirmation: newValue.password || "123456"  
          };
        }
      }
    }
  },
  methods: {
    handleSubmit() {
      this.$refs["formRef"].validate(valid => {
        if (valid) {
          if (this.formData.id) {
            this.editTenant();
          } else {
            this.addTenant();
          }
        } else {
          return false;
        }
      });
    },
    addTenant() {
      this.formData.authority = "TENANT_ADMIN";
      user_add(this.formData)
          .then(({ data: result }) => {
            if (result.code === 200) {
              this.$message.success("操作成功");
              this.dialogVisible = false;
              this.$emit("submit");
            }
          })
    },
    editTenant() {
      user_edit(this.formData)
          .then(({ data: result }) => {
            if (result.code === 200) {
              this.$message.success("操作成功");
              this.dialogVisible = false;
              this.$emit("submit");
            }
          })
    }
  }
}
</script>
<style lang="scss" scoped>
.form-box {
  margin: 10px 20px 0 20px;
}
.el-alert {
  padding-top: 0px;
  padding-bottom: 0px;
  border: 1px solid;
  background-color: transparent;
}
</style>