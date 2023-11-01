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
          {{ $t(item.name) ? $t(item.name) : item.name}}
        </span>
      </p>
      <div class="content">

        <!-- 插件列表 -->
        <div v-show="activeTab == 'installed'">
          <installed-list ref="installList" @edit="handleEditPlugin"></installed-list>
        </div>

        <!-- 应用市场 -->
        <div v-show="activeTab == 'market'">
          <market-list ></market-list>
        </div>

        <!-- 插件编辑器 -->
        <div v-show="activeTab == 'deviceEditor'">
          <device-plugin ref="pluginEditor" @save="handleSavePlugin"></device-plugin>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import InstalledList from "./installed"
import MarketList from "./market"
import DevicePlugin from "./device";
export default {
  name: "index",
  components: { InstalledList, MarketList, DevicePlugin },
  data() {
    return {
      activeTab: "installed",
      tabs: [
        {
          name: "PLUGIN.TAB1",
          value: "installed",
        },
        {
          name: "PLUGIN.TAB2",
          value: "market",
        },
        {
          name: "PLUGIN.TAB3",
          value: "deviceEditor",
        }
      ]
    };
  },
  mounted() {
    let tab = this.$route.query.tab;
    if (tab) {
      this.activeTab = tab;
    }
  },
  methods: {
    handleEditPlugin(item) {
      this.$refs.pluginEditor.handleImport(item);
    },
    handleSavePlugin() {
      this.$refs.installList.loadList();
    }
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
      margin-right: 2rem;
      cursor: pointer;

      &.active {
        border-bottom: 2px solid #5b92ff;
      }
    }
  }

  .content {
    padding: 1rem 0;

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