<template>
  <div>
    <el-dialog class="el-dark-dialog" :title="$t('PRODUCT_MANAGEMENT.BATCH_LIST.IMPORTDATA')" :visible.sync="dialogVisible" width="400px"
             :before-close="handleClose" :close-on-click-modal="false">
      
      <!-- 给el-dialog自定义头部 -->
      <div slot="head" class="dialog-footer text-center">
        <el-button type="save" @click="handleSubmit">{{ $t('COMMON.CONFIRM') }}</el-button> 
      </div>
      <!-- <div slot="head" class="dialog-footer text-center">
        <el-button type="save" @click="handleSubmit">提交</el-button>
      </div> -->

      <!-- <div class="text-center"> -->
      <el-form label-position="left" label-width="80px" ref="formRef" :model="form" :rules="rules">
        <el-form-item :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.BATCHNUMBER')" required prop="batch_number">
          <el-input v-model="form.batch_number"></el-input>
        </el-form-item>

        <el-form-item :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.FILE')" required prop="file">
          <el-upload style="float:left"
            class="upload-demo"
            :action="uploadUrl"
            :headers="headers"
            :data="{ type: 'importBatch'}"
            :file-list="fileList"
            accept=".xlsx,.xls"
            :on-success="onUploadSuccess">
            <el-button size="small" type="primary">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.UPLOAD') }}</el-button>
          </el-upload>
          <el-link style="margin-left:20px" type="success" :href="downloadUrl" :underline="false">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.DOWNLOAD_TEMPLATE') }}</el-link>

        </el-form-item>
      </el-form>
      <!-- </div> -->

      <div slot="footer" class="dialog-footer text-center">
        <el-button type="save" @click="handleSubmit">{{ $t('COMMON.CONFIRM') }}</el-button>
      </div>
  </el-dialog>
  </div>
</template>

<script>
import ProductAPI from '@/api/product';
import JwtService from "@/core/services/jwt.service";
const url = (process.env.VUE_APP_BASE_URL || document.location.protocol + "//" + document.domain + ":9999/")
export default {
  components: {},
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: () => { }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  data() {
    return {
      fileList: [],
      uploadUrl: ProductAPI.uploadUrl,
      headers: { Authorization: "Bearer " + JwtService.getToken() },
      form: {
        batch_number: "",
        file: ''
      },
      rules: {
        batch_number: [
          { required: true, message: '请输入批次号', trigger: 'blur' },
          { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
        ],
        file: [
          { required: true, message: '请上传文件', trigger: 'blur' }
        ]
      },
      downloadUrl: url + "/files/init-images/batch_devices_template.xlsx"
    }
  },
  methods: {
    onUploadSuccess(response, file, fileList) {
      this.form.file = response.data;
    },
    handleClose() {
      this.dialogVisible = false
    },
    handleSubmit() {
        this.form.product_id = this.$route.query.product_id;
        this.$refs.formRef.validate((valid) => {
          if (valid) {
            ProductAPI.importBatch(this.form)
              .then(res => {
                this.$message.success('导入成功')
                this.dialogVisible = false
                this.$emit('submit')

              })
          } else {
            return false;
          }
        });

    }
  }
}
</script>
<style lang="scss" scoped>
</style>