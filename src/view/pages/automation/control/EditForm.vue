<template>
  <el-dialog
      :title="currentItem.id ? $t('AUTOMATION.CONTROL_STRATEGY.EDIT_CONTROL_STRATEGY') : $t('AUTOMATION.CONTROL_STRATEGY.ADD_CONTROL_STRATEGY')"
      class="el-dark-dialog"
      :close-on-click-modal="false"
      :visible.sync="visible"
      width="60%"
      height="60%"
      top="10vh"
  >
    <ConditionForm/>
  </el-dialog>

</template>

<script>
import ConditionForm from "./ConditionForm";
export default {
  name: "EditForm",
  components: {
    ConditionForm
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

    }
  }
}


</script>

<style scoped>

</style>