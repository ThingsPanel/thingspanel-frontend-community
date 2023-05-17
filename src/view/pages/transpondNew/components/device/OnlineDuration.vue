<template>
  <div style="display: flex">
    {{ $t('AUTOMATION.DURATION') }}
    <el-input ref="durationRef" style="width: 100px;margin-left:10px;margin-right:10px" v-model="formData.value" @change="handleValueChange"></el-input>
    {{ $t('AUTOMATION.SECONDS') }}
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
        message_error(this.$t('AUTOMATION.ERROR.DURATION'))
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>