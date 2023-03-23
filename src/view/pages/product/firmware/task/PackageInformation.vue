
<template>
  <div class="rounded card p-4 el-table-transparent el-dark-input text-white">
    <el-form label-width="160px" label-position="left">
        <el-form-item label="签名算法">
            <span>{{ formData.signature_algorithm }}</span>
        </el-form-item>
        <el-form-item label="升级包签名">
            <span style="margin-right:20px">{{ formData.signature_algorithm }}</span>
            <span>
                <el-button type="border" size="small">下载</el-button>
            </span>
        </el-form-item>
        <el-form-item label="其他配置">
            <div v-for="(config, index) in formData.additional_info" :key="index">
                <span style="margin-right:20px">{{  config.key }}</span>
                <span>{{ config.value }}</span>
            </div>
        </el-form-item>
    </el-form>

  </div>
</template>

<script>
import OTAAPI from "@/api/ota"
export default {
  components: {},
  props: {
    id: {
        type: [String],
        default: ""
    }
  },
  data() {
    return {
        formData: {
            sign: "MD5",
            signature_algorithm: "957df92544d9653655c309824cc354b4",
            additional_info: [{}]
        },
        params: {
            current_page: 1,
            per_page: 10,
            id: ""
        }
    }
  },
  mounted() {
    this.getOTA();
  },
  methods: {
    getOTA() {
      console.log("getOTA", this.id);

      this.params.id = this.id;
      OTAAPI.list(this.params)
        .then(({ data: result }) => {
          if (result.code === 200) {
            this.formData = result.data?.data[0] || {};
            console.log("getOTA", this.formData);
          }
        })
    }
  }
}
</script>
<style lang="scss" scoped>
</style>