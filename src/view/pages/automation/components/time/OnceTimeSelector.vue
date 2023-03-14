<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-10 12:59:03
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\OnceTimeSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex;">
    <el-date-picker ref="datePicker" v-model="formData.value" type="datetime" 
    :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_DATE_TIME')" 
    format="yyyy-MM-dd HH:mm:ss"
    value-format="yyyy-MM-dd HH:mm:ss"
    @change="handleValueChange">
  </el-date-picker>
  <el-tooltip placement="top">
    <div slot="content">{{ $t('AUTOMATION.TIP.ONCE_TIME')}}</div>
    <i class="el-icon-info" style="margin:10px;"></i>
  </el-tooltip>
  </div>
</template>

<script>
import { message_error } from '@/utils/helpers';
export default {
  name: "OnceTimeSelector",
  props: {
    data: {
      type: [Object],
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      formData: {
        value: "",
      },
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          this.formData = JSON.parse(JSON.stringify(newValue));
        }
      },
      immediate: true
    }
  },
  methods: {
    handleValueChange(v) {
      this.$emit("change", v);
    },
    validate() {
      if (!this.formData.value || this.formData.value === "") {
        this.$refs.datePicker.focus();
        // 请选择日期和时间！
        message_error(this.$t('AUTOMATION.ERROR.DATE_TIME'))
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>