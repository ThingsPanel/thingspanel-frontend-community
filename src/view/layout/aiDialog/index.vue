<template>
  <div style="width: 100%; height:100%;">
    <div class="ai-button"  @click="openDialog">
      {{ $t('COMMON.AI_ASSISTANT')  }}
    </div>
    <Dialog ref="customerDialog" :visible.sync="dialogVisible"></Dialog>
  </div>
</template>

<script>
import Dialog from './dialog.vue';

export default {
  name: "AIDialog",
  components: {
    Dialog
  },
  data() {
    return {
      dialogVisible: false,
    };
  },
  methods: {
    openDialog() {
      this.dialogVisible = true;
    }
  }
};
</script>
<style>
.ai-button {
  
  width: 3rem;
  position: fixed; /* 使用固定定位 */
  right: 0px; /* 距离页面右边距20px */
  bottom: 70%; /* 距离页面底部边距20px */
  z-index: 1000; /* 确保按钮位于页面其他元素之上 */

  /* 按钮样式 - 根据需要自定义 */
  padding: 25px 13px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

</style>

