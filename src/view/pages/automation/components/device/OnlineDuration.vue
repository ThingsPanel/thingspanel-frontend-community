<template>
  <div style="display: flex">
    持续
    <el-input ref="durationRef" style="width: 100px;margin-right:10px" v-model="formData.value" @change="handleValueChange"></el-input>
    秒
  </div>
</template>

<script>
import { message_error } from '@/utils/helpers';
export default {
  name: "OnlineDuration",
  props: {
    data: {
      type: [Object],
      default: () => { return {}}
    }
  },
  data() {
    return {
      formData: {
        value: ""
      }
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
      this.$emit("change", { value: v });
    },
    validate() {
      if (!this.formData.value || this.formData.value === "") {
        this.$refs.durationRef.focus();
        message_error("请输入秒数!")
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>