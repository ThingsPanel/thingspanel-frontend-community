<template>
  <div class="rounded card p-4">
    <el-tabs v-model="activeName" @tab-click="handleTabClick">
      <el-tab-pane :label="$t('SYSTEM_MANAGEMENT.TENANT_SETTING.AI_ASSISTANT')" name="ai_config">

        <el-form
          :label-position="'left'"
          :rules="rules"
          label-width="120px"
          :model="formObj"
          ref="formObj"
          style="padding: 50px 0 0 100px; width: fit-content;"
        >
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.TENANT_SETTING.MODEL_TYPE')" prop="model_type">
            <el-select style="width: 328px" v-model="formObj.model_type">
              <el-option :label="$t('SYSTEM_MANAGEMENT.TENANT_SETTING.OPENAI')" value="OpenAI">
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item :label="$t('SYSTEM_MANAGEMENT.TENANT_SETTING.API_SECRET')"  prop="api_key">
            <el-input
              style="width: 328px"
              show-password
              v-model="formObj.api_key"
            ></el-input>
          </el-form-item>
          
          <el-form-item :label="$t('SYSTEM_MANAGEMENT.TENANT_SETTING.BASE_URL')" prop="base_url">
            <el-input
              style="width: 328px" v-model="formObj.base_url"
            ></el-input>
          </el-form-item>

          <div style="float: right; margin-bottom: 30px">
            <el-button @click="submitForm('formObj')" type="primary" style="width: 100px; margin-left: 120px;">{{ $t('COMMON.SAVE') }}</el-button>
          </div>
        </el-form>
      </el-tab-pane>
      <el-tab-pane :label="$t('SYSTEM_MANAGEMENT.TENANT_SETTING.OTHER')" name="other">
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { get_tenant_config, save_tenant_config } from "@/api/user.js"
import { message_success, message_error } from '@/utils/helpers';
export default {
  name: "TenantSetting",
  data() {
    return {
      activeName: 'ai_config',
      formObj: {
        model_type: '',
        api_key: '',
        base_url: '',
      },
      rules: {
        model_type: [
          { required: true, trigger: 'blur' },
        ],
        api_key: [
          { required: true, trigger: 'blur' }
        ],
      }
    }
  },
  mounted() {
    get_tenant_config().then(res => {
      this.formObj = res.data?.data || {};
    })
  },
  methods: {
    handleTabClick(tab, event) {
      if (tab.name === 'ai_config') {
        get_tenant_config().then(res => {
          this.formObj = res.data?.data || {};
        })
      }
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          save_tenant_config(this.formObj).then(res => {
            if (res.data?.code === 200) {
              message_success(this.$t("COMMON.EDIT_SUCCESS"));
            } else {
              message_error(this.$t("COMMON.EDIT_FAILED"))
              return false;
            }
            get_tenant_config().then(res => {
              this.formObj = res.data?.data || {};
            })
          })
        } else {
          message_error(this.$t("COMMON.EDIT_FAILED"))
          return false;
        }
      });
    },
  },
}
</script>