<template>
  <div class="rounded p-4 card no-border v-application my-v-input" data-app="true">
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
          {{ $t(item.name) }}
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
              label-width="120px"
              :model="formObj"
            >
              <el-form-item :label="$t('COMMON.SYSTEMTITLE')">
                <el-input
                  style="width: 328px"
                  v-model="formObj.system_name"
                  :placeholder="$t('COMMON.PLACEHOLDER16')"
                ></el-input>
              </el-form-item>
              <el-form-item :label="$t('COMMON.THEMECOLOR')">
                <el-select
                  v-model="formObj.theme"
                  :placeholder="$t('COMMON.PLACEHOLDER5')"
                  style="width: 328px"
                >
                  <el-option :label="$t('COMMON.BLUE')" value="blue"></el-option>
                  <el-option :label="$t('COMMON.WHITE')" value="white"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item size="large">
                <div class="img-upload">
                  <div style="margin-right: 2.5rem">
                    <p>{{$t('COMMON.HOMEANDBACKEND')}} logo</p>
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
                          
                          >{{$t('COMMON.CHANGE')}} logo</el-button
                        >
                      </el-upload>
                    </p>
                  </div>
                  <div style="margin-right: 2.5rem">
                    <p>{{$t('COMMON.LOADINGPAGE')}} logo</p>
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
                          >{{$t('COMMON.CHANGE')}} logo</el-button
                        >
                      </el-upload>
                    </p>
                  </div>
                  <div>
                    <p>{{$t('COMMON.WEBSITE')}} logo</p>
                    <div>
                      <img :src="url + formObj.logo_three" alt="" width="148px" />
                    </div>
                    <p>
                      <el-upload
                        class="upload-logo"
                        :action="url + 'api/file/up'"
                        :show-file-list="false"
                        :headers="headersObj"
                        :data="params"
                        :on-success="handleAvatarSuccessThree"
                        :before-upload="beforeAvatarUpload"
                      >
                        <el-button
                          type="primary"
                          icon="el-icon-refresh"
                          size="mini"
                          >{{$t('COMMON.CHANGE')}} logo</el-button
                        >
                      </el-upload>
                    </p>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </div>
          <div style="padding-left: 120px; margin-bottom: 20px;">
            <el-button type="save" @click="submitData()">{{$t('COMMON.SAVE')}} </el-button>
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
        name: "COMMON.GENERALSETTINGS",
        value: "1",
      },
      {
        name: "COMMON.NOTIFICATIONSETTINGS",
        value: "2",
      },
      {
        name: "COMMON.SYSTEMAUTHORIZATION",
        value: "3",
      },
    ],
    url: (process.env.VUE_APP_BASE_URL ||
    document.location.protocol + "//" + document.domain + ":9999/"),
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
      console.log(res,file);
      this.formObj.logo_one = res.data;
    },
    handleAvatarSuccessTwo(res, file) {
      this.formObj.logo_two = res.data;
    },
    handleAvatarSuccessThree(res, file) {
      this.formObj.logo_three = res.data;
    },
    beforeAvatarUpload(file) {
      // 上传前设置请求头，因为 token 会刷新
      this.headersObj.Authorization = "Bearer " + JwtService.getToken()
      // console.log('111',file);
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
