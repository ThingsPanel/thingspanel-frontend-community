<template>
  <el-dialog
      :title="currentItem.id ? $t('AUTOMATION.CONTROL_STRATEGY.EDIT_CONTROL_STRATEGY') : $t('AUTOMATION.CONTROL_STRATEGY.ADD_CONTROL_STRATEGY')"
      class="el-dark-dialog"
      :close-on-click-modal="false"
      :visible.sync="dialogVisible"
      width="60%"
      height="60%"
      top="10vh"
  >
    <el-form label-position="left" label-width="85px">
      <el-row :gutter="20">
        <!-- 自动化名称-->
        <el-col :span="8">
          <el-form-item label="自动化名称">
            <el-input v-model="formData.name"></el-input>
          </el-form-item>
        </el-col>

        <!-- 描述-->
        <el-col :span="8">
          <el-form-item label="描述">
            <el-input v-model="formData.describe"></el-input>
          </el-form-item>
        </el-col>

        <!-- 优先级-->
        <el-col :span="8">
          <el-form-item label="优先级">
            <el-input v-model="formData.priority"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 条件 Dohkn4158 -->
      <ConditionForm/>

      <!-- 执行动作 -->
      <ActionForm/>

      <div class="text-right">
        <el-button size="medium" type="save" @click="handleSaveAndStart()">保存并执行</el-button>
        <el-button size="medium" type="cancel" @click="handleSave()">仅保存</el-button>
      </div>
    </el-form>
  </el-dialog>

</template>

<script>
import ConditionForm from "./ConditionForm";
import ActionForm from "./ActionForm";
export default {
  name: "EditForm",
  components: {
    ConditionForm, ActionForm
  },
  props: {
    /**
     * 是否显示编辑/新建对话框
     */
    visible: {
      type: [Boolean],
      default:  false
    },
    currentItem: {
      type: [Object],
      default:  () => {
        return {}
      }
    }
  },
  data() {
    return {
      formData: {
        name: "",
        describe: "",
        priority: ""
      }
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
  methods: {
    handleSaveAndStart() {

    },
    handleSave() {

    }
  }
}


</script>

<style scoped>

</style>