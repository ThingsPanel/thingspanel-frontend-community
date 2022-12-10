<template>
  <div class="info-container">
      <el-form class="info-form" ref="information_form" style="text-align: center;width: 80%" label-position="left"
               :inline="false" :rules="formRules" :model="formData">
        <el-row :gutter="80">

          <el-col :span="16" style="padding-top:10px">
            <el-form-item label="插件名称：" label-width="80"  prop="pluginName">
              <el-input v-model="formData['pluginName']" ></el-input>
            </el-form-item>
            <el-form-item label="插件分类：" label-width="80"  prop="pluginCategory">
              <el-select style="width: 100%" v-model="formData['pluginCategory']">
                <el-option  v-for="(item, index) in pluginCategory" :key="index" :label="item.label" :value="item.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="作者名称：" label-width="80" >
              <el-input v-model="formData['author']"></el-input>
            </el-form-item>
            <el-form-item label="插件版本：" label-width="80" >
              <el-input v-model="formData['version']"></el-input>
            </el-form-item>
            <el-form-item label="插件说明：" label-width="80" >
              <el-input type="textarea" :rows="2" v-model="formData['description']"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="8" >
            <el-form-item label="插件封面（474X246）：" label-width="auto" label-position="top">
              <div >
                <el-upload
                    action="#"
                    list-type="picture"
                    :show-file-list="false"
                    :auto-upload="false"
                    :on-change="handleChange">
<!--                  <el-card class="upload-card">-->
                    <img class="upload-img" width="100%" v-show="thumbImg!=''" :src="thumbImg" alt="">
<!--                  </el-card>-->
                  <el-button type="primary">选择封面</el-button>
                </el-upload>
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
      formData: {},
      // 校验表单
      formRules: {
        pluginName: [
          {required: true, message: '请输入插件名称', trigger: 'blur'}
        ],
        pluginCategory: [
          {required: true, message: '请选择插件分类', trigger: 'blur'}
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
    handleChange(file, fileList) {
      if (fileList.length >0) {
        this.showUpload = false;
        this.thumbImg = file.url;
        this.formData['thumbImg'] = this.thumbImg;
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
  width: 120px;
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