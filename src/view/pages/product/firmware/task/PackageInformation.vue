<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 09:15:24
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-15 14:46:13
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\PackageInformation.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="rounded card p-4 el-table-transparent el-dark-input text-white">
    <el-form label-width="160px" label-position="left">
        <el-form-item label="签名算法">
            <span>{{ formData.signatureMode }}</span>
        </el-form-item>
        <el-form-item label="升级包签名">
            <span style="margin-right:20px">{{ formData.signature }}</span>
            <span>
                <el-button type="border" size="small">下载</el-button>
            </span>
        </el-form-item>
        <el-form-item label="其他配置">
            <div v-for="(config, index) in formData.configs">
                <span style="margin-right:20px">key</span>
                <span>value</span>
            </div>
        </el-form-item>
    </el-form>

  </div>
</template>

<script>
export default {
  components: {},
  props: {
    data: {
        type: [Object],
        default: () => { return {} }
    }
  },
  data() {
    return {
        formData: {
            signatureMode: "MD5",
            signature: "957df92544d9653655c309824cc354b4",
            configs: [
                {},
                {}
            ]
        }
    }
  },
  methods: {}
}
</script>
<style lang="scss" scoped>
</style>