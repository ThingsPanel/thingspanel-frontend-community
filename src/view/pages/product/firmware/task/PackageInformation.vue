<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 09:15:24
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-29 12:47:57
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\PackageInformation.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->

<template>
  <div class="rounded card p-4 el-table-transparent el-dark-input text-white">
    <el-form label-width="160px" label-position="left" style="padding:50px">
        <el-form-item label="签名算法">
            <span>{{ formData.signature_algorithm }}</span>
        </el-form-item>
        <el-form-item label="升级包签名">
            <span style="margin-right:20px">{{ formData.sign }}</span>
            <span>
              <a :href="formData.package_url" target="blank"><el-button type="border" size="small">下载</el-button></a>
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
      this.params.id = this.$route.query.otaId;
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