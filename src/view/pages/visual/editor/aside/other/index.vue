<template>
  <div class="other-aside-container">
    <div class="component-chart-list">

      <el-collapse class="el-drak-collapse" style="padding:10px" v-model="activeName" accordion>
        <el-collapse-item v-for="(other, index) in others" :key="index" :title="other.title" :name="other.value">
          <div class="component-item" v-for="(component, index) in other.components" :key="other.value + index"
               :style="getComponentStyle(component.style, other.defaultStyle)">

            <vue-drag :option="component" :type="other.type ? other.type : 'other'" :ref="(component.value ? component.value : other.value)  + index"
                      :index="(component.value ? component.value : other.value)  + index"
            >

              <el-tooltip class="item" effect="dark" :content="component.title ? component.title : other.title" placement="top-end">
                <div style="display: inline-block;">
                    <img :style="getComponentStyle(component.style, other.defaultStyle)"
                         :src="component.image_src" alt="">
                </div>
              </el-tooltip>

            </vue-drag>

          </div>
        </el-collapse-item>

      </el-collapse>

    </div>
  </div>
</template>

<script>
import VueDrag from "@/components/drag"

import { otherComponents } from "@/view/pages/visual/components/index.js";

export default {
  name: "index",
  components: { VueDrag },
  data() {
    return {
      others: [],
      activeName: "",
      defaultStyle: {
        "width": "60px",
        "height": "60px"
      }
    }
  },
  mounted() {
    this.others = otherComponents;
  },
  methods: {
    getComponentStyle(componentStyle, otherStyle) {
      return componentStyle ? componentStyle : (otherStyle ? otherStyle : this.defaultStyle);
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
.other-aside-container {
  width: 100%;
  height: 100%;
  .component-list {
    width: 100%;
    height: calc(100% - 70px);
    margin-top: 20px;
    //top: 50px;
    //bottom: 0;
    background-color: #202c62;
    overflow-y: auto;
    .component-chart-list {
      width: 100%;
      height: 100%;

    }
  }
}
.component-item {
  float:left;
  position: relative;

  margin: 4px;
  //border: 1px dashed #ccc;
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