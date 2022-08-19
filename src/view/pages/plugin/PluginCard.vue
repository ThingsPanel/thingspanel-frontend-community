<template>
  <b-card class="mb-5 text-center card-box margin-auto marketbox"
          v-bind:key="data.id"
          :title="data.name"
          :img-src="data.img"
          img-alt="Image"
          img-top
          tag="article"
  >
    <b-card-text class="text-left text-muted">
      {{ $t("COMMON.CLASSIFY") }}：{{ data.type }}
    </b-card-text>
    <b-card-text class="text-left text-muted">
      {{ $t("COMMON.VERSION") }}：{{ data.version }}
    </b-card-text>
    <b-card-text class="text-left text-muted text-overflow">
      {{ $t("COMMON.AUTHOR") }}：<span v-b-tooltip :title="data.author">{{ data.author }}</span>
    </b-card-text>
    <b-card-text class="text-left text-muted">
      {{ $t("COMMON.SCORE") }}：
      <v-rating
          v-model="rating"
          color="orange"
          dense
          small
          readonly
          class="d-inline-block v-application"
      ></v-rating>
    </b-card-text>
    <b-card-text style="margin-top: 10px">
      <b-btn v-show="isInstalled" variant="primary" size="sm" class="text-center" >
        {{ $t("COMMON.INSTALLED") }}
      </b-btn>
      <b-btn v-show="!isInstalled"
             variant="primary" size="sm" class="text-center installing"
             :disabled="installing || isInstalled"
             @click="handleInstall">
        {{ installing ?  $t("COMMON.INSTALLING_TITLE") : $t("COMMON.INSTALL") }}
      </b-btn>
    </b-card-text>
  </b-card>
</template>

<script>
import {message_success} from "../../../utils/helpers";

export default {
  name: "PluginCard",
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    isInstalled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 评分
      rating: 5,
      installing: false,
    }
  },
  methods: {
    /**
     *
     * 一键安装
     */
    handleInstall() {
      console.log(this.data)
      this.installing = true
      setTimeout(() => {
        message_success("安装成功！")
        this.$emit("installed", this.data)
      }, 2000)
    }
  }
}
</script>

<style scoped>
.marketbox {
  border-radius: 8px;
}
.text-overflow {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.installing {

}
</style>