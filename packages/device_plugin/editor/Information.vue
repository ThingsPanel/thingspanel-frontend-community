<template>
  <div class="info-container">
      <el-form class="info-form" ref="information_form" style="text-align: center;width: 80%" label-position="left"
               :inline="false" :rules="formRules" :model="formData" >
        <el-row :gutter="80">

          <el-col :span="16" style="padding-top:10px">
            <el-form-item :label="$t('PLUGIN.DEVICE_INFO_TAB.LABLE1')" label-width="100" prop="pluginName">
              <el-input v-model="formData['pluginName']" ></el-input>
            </el-form-item>
            <el-form-item :label="$t('PLUGIN.DEVICE_INFO_TAB.LABLE2')" label-width="100" prop="pluginCategory">
              <el-select style="width: 100%" v-model="formData['pluginCategory']" :placeholder="$t('PLUGIN.DEVICE_INFO_TAB.PLACEHOLDER1')" :no-data-text="$t('PUBLIC.NODATA')">
                <el-option  v-for="(item, index) in pluginCategory" :key="index" :label="item.label" :value="item.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('PLUGIN.DEVICE_INFO_TAB.LABLE3')" label-width="100" >
              <el-input v-model="formData['author']"></el-input>
            </el-form-item>
            <el-form-item :label="$t('PLUGIN.DEVICE_INFO_TAB.LABLE4')" label-width="100" >
              <el-input v-model="formData['version']"></el-input>
            </el-form-item>
            <el-form-item :label="$t('PLUGIN.DEVICE_INFO_TAB.LABLE5')" label-width="100" >
              <el-input type="textarea" :rows="2" v-model="formData['description']"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="8" >
            <el-form-item :label="$t('PLUGIN.DEVICE_INFO_TAB.PLUNGIN_COVER')" label-width="100" label-position="top">
              <div >
                <el-upload
                    action="#"
                    list-type="picture"
                    :before-upload="checkFile"
                    :show-file-list="false"
                    :auto-upload="false"
                    :multiple="false"
                    :on-change="handleChange">
                    <img class="upload-img" width="100%" v-show="thumbImg!=''" :src="thumbImg" alt="">
                  <el-button type="primary" style="margin-top:20px">{{ $t('PLUGIN.DEVICE_INFO_TAB.CHOOSE_COVER') }}</el-button>
                </el-upload>
                <!-- <el-upload
                  action="http://119.91.238.241:8900/fileUploadAndDownload/upload"
                  :headers="{ 'x-token': app_token }"

                  :before-upload="checkFile"
                  :on-error="uploadError"
                  :on-success="uploadSuccess"
                  :show-file-list="false"
                  class="upload-btn"
                >
                  <el-button size="small" type="primary">普通上传</el-button>
                </el-upload> -->
              </div>

              <!-- 查看大图-->
              <el-dialog :visible.sync="dialogVisible" :append-to-body="true">
                <img width="100%" :src="thumbImg" alt="">
              </el-dialog>
            </el-form-item>



          </el-col>
        </el-row>

      </el-form>

  </div>
</template>

<script>
import i18n from "@/core/plugins/vue-i18n.js"
import Store from "@/core/services/app-store.service"

export default {
  name: "Information",
  props: {
    data: {
      type: [Object],
      default: () => { return {} }
    },
    pluginCategory: {
      type: [Array],
      default: () => [{label: "", value: ""}]
    }
  },
  data() {
    return {
      app_token: Store.getToken(),
      formData: {},
      // 校验表单
      formRules: {
        pluginName: [
          {required: true, message: i18n.t('PLUGIN.DEVICE_INFO_TAB.VALIDATE'), trigger: 'blur'}
        ],
        pluginCategory: [
          {required: true, message: i18n.t('PLUGIN.DEVICE_INFO_TAB.VALIDATE2'), trigger: 'blur'}
        ],

      },
      // 上传封面
      showUpload: true,
      fileList: [],
      thumbImg: '',
      dialogVisible: false
    }
  },
  watch: {
    data: {
      handler(newValue) {
        this.formData = JSON.parse(JSON.stringify(newValue))
        this.thumbImg = this.formData['thumbImg'];
      },
      immediate: true
    }
  },
  methods: {
    checkFile(file) {
      const isJPG = file.type === 'image/jpeg'
      const isPng = file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 0.5
      if (!isJPG && !isPng) {
      }
      if (!isLt2M) {
      }
      return (isPng || isJPG) && isLt2M
    },
    handleChange(file, fileList) {
      if (fileList.length >0) {
        this.showUpload = false;
        this.thumbImg = file.url;
        this.formData['thumbImg'] = fileList;
      }
    },
    /**
     * 校验
     * @returns {boolean}
     */
    chkValue() {
      let check = false;
      this.$refs["information_form"].validate((valid) => {
        check = valid;
      })
      return check;
    }
  }
}

</script>

<style scoped>
.info-container {
  height: 620px;
  text-align: center
}
.el-form-item {
  /*display: flex;*/
  margin-bottom: 10px;
}
::v-deep .el-form-item__label {
  width: 170px;
}
::v-deep .el-input__inner {
  width: 100%;
}
::v-deep .el-form-item__content {
  width: 100%;
}

.info-form {
  padding: 50px 100px;

}
.upload-img {
  width: 300px;
}
.upload-card {
  height: 340px;
  width: 340px;
  margin: 10px auto;
}
/*::v-deep .el-upload-list {*/
/*  display: none;*/
/*}*/

</style>