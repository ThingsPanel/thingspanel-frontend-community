<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 11:37:33
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-27 16:14:06
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\components\Widget.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    
    <div class="widget-container panel-bg-blue px-4 py-4 rounded text-center" @click="handleClick">
        <div class="text-muted">{{ d__title }}</div>
        <div class=" text-white title-num">
            {{ value }}
        </div>
    </div>
</template>

<script>
import { UpgradeState } from '../Const'
export default {
  props: {
    title: {
      type: [String],
      default: ""  
    },
    status: {
      type: [String, Number],
      default: 0
    },
    value: {
        type: [String, Number],
        default: 0
    },
    option: {
        type: [Object],
        default: () => { return {} }
    }
  },
  data() {
    return {
      d__title: ""
    }
  },
  mounted() {
    this.d__title = this.title || UpgradeState.getText(this.status);
  },
  methods: {
    handleClick() {
      this.$emit("click", this.status);
    }
  }
}
</script>
<style lang="scss" scoped>
.widget-container {
    cursor: pointer;
    .title-num {
        font-size: 24px;
        font-weight: 600;
    }
}
</style>