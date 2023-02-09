<template>
  <el-dialog
      :title="formData.id ? $t('AUTOMATION.CONTROL_STRATEGY.EDIT_CONTROL_STRATEGY') : $t('AUTOMATION.CONTROL_STRATEGY.ADD_CONTROL_STRATEGY')"
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

      <!-- 条件  -->
      <ConditionForm :data="formData.conditions" @change="handleConditionChange"/>

      <!-- 执行动作 -->
      <ActionForm :data="formData.actions" @change="handleActionChange"/>

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
    data: {
      type: [Object],
      default:  () => {return {} }
    }
  },
  data() {
    return {
      formData: {
        name: "",
        describe: "",
        priority: "",
        conditions: [
          {}
        ],
        actions: []
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
  watch: {
    visible: {
      handler(newValue) {
        if (newValue) {
          this.initFormData();
        }
      }
    }
  },
  methods: {
    /**
     * @description: 初始化表单数据
     * @return {*}
     */    
    initFormData() {
      if (!this.data.id) {
        this.formData = {
          name: "",
          describe: "",
          priority: "",
          conditions: [{}],
          actions: []
        }
      } else {
        this.formData = JSON.parse(JSON.stringify(this.data));
      }
      console.log("====initFormData.formData", this.formData);
      
    },
    handleConditionChange(v) {
      this.formData.conditions = v;
      this.updateData();
    },
    handleActionChange(v) {
      this.formData.actions = v;
      console.log("====handleActionChange", v)
      this.updateData();
    },
    handleSaveAndStart() {

    },
    handleSave() {

    },
    updateData() {
      this.$emit("change", this.formData);
    }
  }
}


</script>

<style scoped>

</style>