<template>
  <div class="rounded p-4 card no-border v-application" data-app="true">
      <v-snackbar v-model="snackbar" top :vertical="vertical">
        {{ text }}

        <template v-slot:action="{ attrs }">
          <v-btn color="indigo" text v-bind="attrs" @click="snackbar = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    <div class="system-box">
      <p class="tab-title">
        <span
          v-for="(item, index) in tabs"
          :key="index"
          :class="{ active: item.value == activeTab }"
          @click="activeTab = item.value"
        >
          {{ item.name }}
        </span>
      </p>
      <div class="content">
        <div v-if="activeTab == 1">
          <!-- 系统设置 -->
          <p style="font-size: 1.3rem; padding: 2rem 0">
            {{ formObj.system_name }}
          </p>
          <div class="content-form">
            <el-form
              :label-position="'left'"
              label-width="80px"
              :model="formObj"
            >
              <el-form-item label="系统标题">
                <el-input
                  style="width: 328px"
                  v-model="formObj.system_name"
                  placeholder="请输入系统标题"
                ></el-input>
              </el-form-item>
              <el-form-item label="主题色">
                <el-select
                  v-model="formObj.theme"
                  placeholder="请选择主题色"
                  style="width: 328px"
                >
                  <el-option label="蓝色" value="blue"></el-option>
                  <el-option label="白色" value="white"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item size="large">
                <div class="img-upload">
                  <div style="margin-right: 2.5rem">
                    <p>首页和后台logo</p>
                    <div>
                      <img :src="url + formObj.logo_one" alt="" />
                    </div>
                    <p>
                      <el-upload
                        class="upload-logo"
                        :action="url + 'api/file/up'"
                        :show-file-list="false"
                        :headers="headersObj"
                        :data="params"
                        :on-success="handleAvatarSuccess"
                        :before-upload="beforeAvatarUpload"
                      >
                        <el-button
                          type="primary"
                          icon="el-icon-refresh"
                          size="mini"
                          
                          >更换logo</el-button
                        >
                      </el-upload>
                    </p>
                  </div>
                  <div>
                    <p>加载页面logo</p>
                    <div>
                      <img :src="url + formObj.logo_two" alt="" width="148px" />
                    </div>
                    <p>
                      <el-upload
                        class="upload-logo"
                        :action="url + 'api/file/up'"
                        :show-file-list="false"
                        :headers="headersObj"
                        :data="params"
                        :on-success="handleAvatarSuccessTwo"
                        :before-upload="beforeAvatarUpload"
                      >
                        <el-button
                          type="primary"
                          icon="el-icon-refresh"
                          size="mini"
                          >更换logo</el-button
                        >
                      </el-upload>
                    </p>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </div>
          <div style="padding-left: 80px">
            <v-btn color="primary" @click="submitData()">{{
              "保存修改"
            }}</v-btn>
          </div>
        </div>
        <!-- <div v-if="activeTab == 2">
          <p>通知设置</p>
        </div>
        <div v-if="activeTab == 3">
          <p>系统授权</p>
        </div> -->
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.system-box {
  color: #fff;
  p {
    margin: 0;
  }
  .tab-title {
    font-size: 1.3rem;
    border-bottom: 1px solid #f6f6f613;
    padding: 0 1rem;
    span {
      display: inline-block;
      padding: 0.6rem 0 1.4rem;
      margin-right: 5rem;
      cursor: pointer;
      &.active {
        border-bottom: 2px solid #5b92ff;
      }
    }
  }
  .content {
    padding: 0 1rem;
    & > p {
      font-size: 14px;
    }
    &-form {
      ::v-deep .el-form-item__label {
        color: #fff;
      }
    }
  }
  .img-upload {
    display: flex;
    img {
      width: 140px;
      height: 140px;
      object-fit: contain;
    }
    ::v-deep .el-button {
      width: 100%;
      margin-top: 1rem;
      background: #212d66;
      border-color: #212d66;
    }
    ::v-deep .el-upload{
        width: 100%;
    }
  }
}
</style>

<script>
import AUTH from "@/core/services/store/auth.module";
import ApiService from "@/core/services/api.service";
import JwtService from "@/core/services/jwt.service";
import { REFRESH } from "@/core/services/store/auth.module";
import { RESET_LAYOUT_CONFIG } from "@/core/services/store/config.module"
export default {
  data: () => ({
    activeTab: "1",
    tabs: [
      {
        name: "常规设置",
        value: "1",
      },
      {
        name: "通知设置",
        value: "2",
      },
      {
        name: "系统授权",
        value: "3",
      },
    ],
    url: process.env.VUE_APP_BASE_URL,
    formObj: {
      custom_id: "",
      id: "",
      logo_one: "",
      logo_three: "",
      logo_two: "",
      remark: "",
      system_name: "",
      theme: "",
    },
    headersObj: {
      Authorization: "Bearer " + JwtService.getToken(),
    },
    params: {
      type: "logo",
    },
    text:'',
    snackbar:false,
    vertical: true,
  }),

  created() {
    ApiService.post(AUTH.local_url + "/system/logo/index", null).then(
      ({ data }) => {
        if (data.code == 200) {
          this.formObj = Object.assign({}, data.data);
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      }
    );
  },

  methods: {
    handleAvatarSuccess(res, file) {
      this.formObj.logo_one = res.data;
    },
    handleAvatarSuccessTwo(res, file) {
      this.formObj.logo_two = res.data;
    },
    beforeAvatarUpload(file) {
      console.log(file);
      return true;
    },
    submitData() {
      ApiService.post(AUTH.local_url + "/system/logo/update", this.formObj).then(
        ({ data }) => {
          if (data.code == 200) {
              this.text = "保存成功！";
              this.$store.dispatch(RESET_LAYOUT_CONFIG);
          this.snackbar = true;
          } else if (data.code == 401) {
            this.$store.dispatch(REFRESH).then(() => {});
          } else {
          }
        }
      );
    },
  },
};
</script>
