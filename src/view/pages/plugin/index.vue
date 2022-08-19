<template>
  <div class="rounded p-5 card no-border v-application my-v-input" data-app="true">
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

        <!-- 已安装 -->
        <div v-show="activeTab == 'installed'">
          <installed></installed>
        </div>

        <!-- 插件商店 -->
        <div v-show="activeTab == 'store'">
          <plugin-store></plugin-store>
        </div>

        <!-- 插件编辑器 -->
        <div v-show="activeTab == 'editor'">
          <plugin-editor></plugin-editor>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Installed from "./Installed";
import PluginStore from "./PluginStore";
import PluginEditor from "./PluginEditor";
export default {
  name: "index",
  components: { Installed, PluginStore, PluginEditor },
  data() {
    return {
      activeTab: "installed",
      tabs: [
        {
          name: "COMMON.INSTALLED",
          value: "installed",
        },
        {
          name: "COMMON.PLUGIN_STORE",
          value: "store",
        },
        {
          name: "COMMON.PLUGIN_EDITOR",
          value: "editor",
        }
      ]
    };
  },
  methods: {
    handleClick(tab, event) {
      console.log(tab, event);
    },
  }
}
</script>

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
    padding: 2rem 1rem;

    & > p {
      font-size: 14px;
    }

    .card-text {
      margin-bottom: 10px;
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

    ::v-deep .el-upload {
      width: 100%;
    }
  }
}

.v-pagination .primary {
  background-color: #1867c0 !important;
  border-color: #1867c0 !important;
}

.width-20 {
  width: 20%;
  display: inline-block;
  padding: 10px;
}


@media (max-width: 1300px) {
  .width-20 {
    width: 25%;
  }
}

@media (max-width: 768px) {
  .marketbox {
    max-width: unset !important;
  }
  .width-20 {
    width: 50%;
    display: inline-block;
    padding: 10px;
  }
}

@media (max-width: 500px) {
  .width-20 {
    width: 100%;
    display: block;
    padding: 0px;
  }
}


</style>