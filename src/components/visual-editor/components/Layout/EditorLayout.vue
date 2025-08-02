<template>
  <div class="editor-layout">
    <div class="layout-main">
      <!-- 左侧面板 -->
      <div class="layout-left">
        <slot name="left" />
      </div>
      
      <!-- 中央画布 -->
      <div class="layout-center">
        <slot name="main" />
      </div>
      
      <!-- 右侧面板 -->
      <div class="layout-right">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--n-body-color);
}

.layout-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.layout-left {
  width: 280px;
  border-right: 1px solid var(--n-border-color);
  background-color: var(--n-card-color);
  overflow-y: auto;
}

.layout-center {
  flex: 1;
  background-color: var(--n-body-color);
  overflow: hidden;
}

.layout-right {
  width: 320px;
  border-left: 1px solid var(--n-border-color);
  background-color: var(--n-card-color);
  overflow-y: auto;
}
</style>