<template>
<!--  <div class="configure-aside-container">-->
    <div class="component-chart-list">

<!--      <el-collapse class="el-dark-collapse" style="padding:10px" v-model="activeNames">-->
        <el-collapse-item v-for="(configure, index) in configures" :key="index" :title="configure.category" :name="configure.category">
          <div v-if="isActive(configure.category)">
            <div class="component-item" v-for="(component, index) in configure.components" :key="index"
                 :style="getComponentStyle(component.style, configure.defaultStyle)">

              <vue-drag :option="component" type="configure" @click="handleComponentClicked" :index="'configure' + component.name">

                <el-tooltip class="item" effect="dark" :content="component.name ? component.name : configure.category" placement="top-end">
                  <div>
                    <el-image lazy
                        :style="getComponentStyle(component.style, configure.defaultStyle)"
                        :src="component.image_src"
                        ></el-image>
<!--                    <img :style="getComponentStyle(component.style, configure.defaultStyle)"-->
<!--                         :src="component.image_src" alt="">-->
                  </div>
                </el-tooltip>

              </vue-drag>

            </div>
          </div>

        </el-collapse-item>

<!--      </el-collapse>-->

    </div>
<!--  </div>-->
</template>

<script>
import VueDrag from "@/components/drag"
import { getConfigureComponents } from "@/view/pages/visual/components/index.js";
export default {
  name: "ConfigurePanel",
  components: { VueDrag },
  props: {
    searchText: {
      type: [String],
      default: ""
    }
  },
  data() {
    return {
      configures: [],
      categoryNames: [],
      activeNames: [""],
      defaultStyle: {
        width: "50px",
        height: "50px"
      }
    }
  },
  watch: {
    searchText: {
      handler(newVal) {
        if (!newVal) return;
        let filter = this.categoryNames.filter(item => item.indexOf(newVal) > -1 );
        this.activeNames = filter;
        console.log("====searchText.filter", filter)
      }
    }
  },
  mounted() {
    this.configures = getConfigureComponents();
    this.categoryNames = this.configures.map(item => item.category)

    console.log("========this.configures", this.configures)
  },
  methods: {
    isActive(value) {
      return this.activeNames.find(item => item == value);
    },
    handleComponentClicked(component, id) {
      console.log(component, id)
      this.$nextTick(() => {
        console.log(this.$refs[id])

      })
    },
    getComponentStyle(componentStyle, configureStyle) {
      return componentStyle ? componentStyle : (configureStyle ? configureStyle : this.defaultStyle);
    },
    getComponentDraggable(draggable) {
      if (draggable == "draw") {
        return false;
      } else {
        return true;
      }
    }
  }
}

</script>

<style scoped lang="scss">
.configure-aside-container {
  width: 100%;
  height: 100%;
  .component-chart-list {
    height: 100%;
    overflow-y: auto;

  }
  .component-list {
    width: 100%;
    height: calc(100% - 70px);
    margin-top: 20px;
    background-color: #202c62;
    overflow-y: auto;
  }
}
.component-item {
  float:left;
  position: relative;
  margin: 4px;
  border-radius: 4px;
  background-color: #2d3d86;
  p {
    position: absolute;
    color: #fff;
    text-align: center;
    width: 100%;
  }
  img {
    object-fit: scale-down;
  }
}
</style>