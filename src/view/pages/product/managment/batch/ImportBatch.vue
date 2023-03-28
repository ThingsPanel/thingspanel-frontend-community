<template>
  <div>
    <el-dialog class="el-dark-dialog" title="导入数据" :visible.sync="dialogVisible" width="400px"
             :before-close="handleClose" :close-on-click-modal="false">
      
      <!-- 给el-dialog自定义头部 -->
      <div slot="head" class="dialog-footer text-center">
        <el-button type="save" @click="handleSubmit">提交</el-button> 
      </div>
      <!-- <div slot="head" class="dialog-footer text-center">
        <el-button type="save" @click="handleSubmit">提交</el-button>
      </div> -->

      <!-- <div class="text-center"> -->
      <el-form label-position="left" label-width="80px" ref="formRef" :model="form" :rules="rules">
        <el-form-item label="批次号" required prop="batch_number">
          <el-input v-model="form.batch_number"></el-input>
        </el-form-item>

        <el-form-item label="文件" required prop="file">
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :headers="headers"
            :data="{ type: 'importBatch'}"
            :file-list="fileList"
            accept=".xlsx,.xls"
            :on-success="onUploadSuccess">

          <el-button size="small" type="primary">点击上传</el-button>
          <el-link style="margin-left:20px" type="success" :underline="false">下载模板</el-link>
      </el-upload>
        </el-form-item>
      </el-form>
      <!-- </div> -->

      <div slot="footer" class="dialog-footer text-center">
        <el-button type="save" @click="handleSubmit">提交</el-button>
      </div>
  </el-dialog>
  </div>
</template>

<script>
import ProductAPI from '@/api/product';
import JwtService from "@/core/services/jwt.service";

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
      }
    }
  },
  methods: {
    onUploadSuccess(response, file, fileList) {
      console.log(response, response.data)

      this.form.file = response.data;
    },
    handleClose() {
      this.dialogVisible = false
    },
    handleSubmit() {
        console.log(this.form)
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