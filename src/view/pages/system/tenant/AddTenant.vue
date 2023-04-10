<template>
  <div>
    <el-dialog class="el-dark-dialog" :title="form.id ? '编辑租户' : '新增租户'"
            :visible.sync="dialogVisible" width="540px" :before-close="() => dialogVisible=false" :close-on-click-modal="false">
            <el-form :rules="rules" label-position="left" :model="formData"
                label-width="150px">

                <!-- 用户名 -->
                <el-form-item label="用户名" prop="username" required>
                      <el-input v-model="formData.username"></el-input>   
                </el-form-item>

                <!-- 姓名 -->
                <el-form-item label="姓名" prop="name" required>
                    <el-input v-model="formData.name"></el-input>   
                </el-form-item>

                <div class="text-right">
                    <el-button type="border" @click="dialogVisible=false">{{$t('COMMON.CANCEL') }}</el-button>
                    <el-button type="primary"  @click="handleSubmit">{{$t('COMMON.CONFIRM') }}</el-button>
                </div>
                
            </el-form>
        </el-dialog>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
    visible: {
      type: [Boolean],
      default: false
    },
    data: {
      type: [Object],
      default: () => {}
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
      formData: {},
      rules: {
        username: [
          { required: true, message: "请输入用户名", trigger: "blur" },
          { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" }
        ],
        name: [
          { required: true, message: "请输入姓名", trigger: "blur" },
          { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" }
        ]
      }
    }
  },
  methods: {}
}
</script>
<style lang="scss" scoped>
</style>