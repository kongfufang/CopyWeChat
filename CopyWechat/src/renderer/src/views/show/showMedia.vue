<template>
  <div class="media-window">
    <div class="win-title drag"></div>
    <div class="media-op no-drag">
      <div
        :class="['iconfont icon-left', currentIndex == 0 ? 'not-allow' : '']"
        title="上一张"
        @dblclick.stop
        @click="next(-1)"
      ></div>
    </div>
    <div class="media-panel"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentIndex = ref(0)
</script>

<style lang="scss" scoped>
.media-window {
  padding: 0;
  height: calc(100vh);
  border: 1px solid #ddd;
  background: #fff;
  position: relative;
  overflow: hidden;
  .win-title {
    height: 37px;
  }
  .media-op {
    position: absolute;
    top: 0;
    left: 0;
    height: 35px;
    line-height: 35px;
    display: flex;
    align-items: center;
    .iconfont {
      font-size: 18px;
      padding: 0 10px;
      &:hover {
        background: #f3f3f3;
        cursor: pointer;
      }
    }
    .not-allow {
      cursor: not-allowed;
      color: #ddd;
      text-decoration: none;
      &:hover {
        cursor: not-allowed;
        color: #ddd;
        background: none;
      }
    }
  }
  .media-panel {
    height: calc(100vh - 37px);
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    :deep(.viewer-backdrop) {
      background: #f5f5f5;
    }
  }
}
</style>
