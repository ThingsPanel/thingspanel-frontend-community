<template>
  <el-dialog
      :title="formData.id ? $t('AUTOMATION.EDIT_RULE') : $t('AUTOMATION.ADD_RULE')"
      class="el-dark-dialog"
      :close-on-click-modal="false"
      :visible.sync="dialogVisible"
      width="60%"
      height="60%"
      top="10vh"
  >
    <el-form ref="formRules" label-position="left" label-width="85px" :model="formData">
      <el-row :gutter="20">
        <!-- 自动化名称-->
        <el-col :span="8">
          <el-form-item :label="$t('AUTOMATION.RULE_NAME')" required>
            <el-input ref="nameRef" v-model="formData.automation_name"></el-input>
          </el-form-item>
        </el-col>

        <!-- 描述-->
        <el-col :span="8">
          <el-form-item :label="$t('AUTOMATION.RULE_DESCRIBE')">
            <el-input ref="describeRef" v-model="formData.automation_described"></el-input>
          </el-form-item>
        </el-col>

        <!-- 优先级-->
        <el-col :span="8">
          <el-form-item :label="$t('AUTOMATION.PRIORITY')">
            <el-input-number ref="priorityRef" :min="0" :max="100" v-model="formData.priority"></el-input-number>
            <el-tooltip class="item" effect="dark" :content="$t('AUTOMATION.TIP.PRIORITY')" placement="top-start">
              <i class="el-icon-info" style="margin-left:10px;"></i>
            </el-tooltip>
            
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 条件  -->
      <ConditionForm ref="conditionRef" :data="formData.conditions" @change="handleConditionChange"/>

      <!-- 执行动作 -->
      <ActionForm ref="actionRef" :data="formData.actions" @change="handleActionChange"/>

      <div class="text-right">
        <el-button v-if="formData.id" size="medium" type="save" @click="handleSaveAndStart()">{{ $t('AUTOMATION.SAVE_START') }}</el-button>
        <el-button size="medium" type="cancel" @click="handleSave()">{{ $t('AUTOMATION.SAVE') }}</el-button>
      </div>
    </el-form>
  </el-dialog>

</template>

<script>
import ConditionForm from "./ConditionForm";
import ActionForm from "./ActionForm";
import Auto from "@/api/automation_1.0"
import { message_success } from '@/utils/helpers';
import { setConditions, setActions, getConditions, getActions }  from "./Const"
import { message_error } from '@/utils/helpers';

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
        automation_name: "",
        automation_described: "",
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
        if (!val) {
          this.formData = {};
        }
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
      },
      immediate: true
    }
  },
  methods: {
    /**
     * @description: 初始化表单数据
     * @return {*}
     */    
    initFormData() {
      if (!this.data.id) {
        // 新增
        this.formData = {
          automation_name: "",
          automation_described: "",
          priority: "",
          conditions: [{}],
          actions: []
        }
      } else {
        // 编辑
        Auto.Control.get({id: this.data.id})
          .then(({ data: result }) => {
            if (result.code === 200) {
              let data = JSON.parse(JSON.stringify(result?.data || {}));
              data.conditions = getConditions(data.automation_conditions);
              data.actions = getActions(data.automation_actions);
              this.formData = data;
            }
          })
      }
    },
    handleConditionChange(v) {
      console.log("handleConditionChange", v);
      this.formData.conditions = v;
    },
    handleActionChange(v) {
      this.formData.actions = v;
    },
    /**
     * @description: 保存并启用
     * @return {*}
     */    
    handleSaveAndStart() {
      this.handleSave(1);
    },
    /**
     * @description: 
     * @return {*}
     */    
    validate() {
      if (!this.formData.automation_name || this.formData.automation_name === "") {
        this.$refs.nameRef.focus();
        message_error(this.$t('AUTOMATION.PLACEHOLDER10'));
        return false;
      }
      if (!this.$refs.conditionRef.validate()) return false;
      if (!this.$refs.actionRef.validate()) return false;
      return true;
    },
    /**
     * @description: 保存
     * @param {*} enabled
     * @return {*}
     */    
    handleSave(enabled = 0) {
      if (!this.validate()) return;
      
      let data = JSON.parse(JSON.stringify(this.formData));
      data.enabled = enabled.toString();   // 是否启用
      
      data.automation_conditions = setConditions(data.conditions);
      delete data.conditions;
      
      data.automation_actions = setActions(data.actions, this.formData.automation_name);
      delete data.actions;
     
      console.log("data", data)
      if (data.id) {
        // 编辑
        Auto.Control.edit(data)
          .then(({data: result}) => {
            if (result.code === 200) {
              this.$emit("submit");
              message_success(this.$t("AUTOMATION.EDIT_SUCCESSFULLY"))
              this.dialogVisible = false;
            }
          })
          .finally(() => {

          })
      } else {
        // 新增
        Auto.Control.add(data)
          .then(({data: result}) => {
            if (result.code === 200) {
              this.$emit("submit");
              message_success(this.$t("AUTOMATION.ADD_SUCCESSFULLY"));
              this.dialogVisible = false;
            }
          })
          .finally(() => {
            
          })
      }
    },

    
  }
}


</script>
<style scope>

</style>
<style>
.el-form-item.is-required:not(.is-no-asterisk) .el-form-item__label-wrap>.el-form-item__label:before, .el-form-item.is-required:not(.is-no-asterisk)>.el-form-item__label:before {
  content: unset;
}
.el-form-item.is-required:not(.is-no-asterisk) .el-form-item__label-wrap>.el-form-item__label:after, .el-form-item.is-required:not(.is-no-asterisk)>.el-form-item__label:after {
  content: '*';
  font-size: 18px;
  color: #F56C6C;
  margin-left: 4px;
}
</style>