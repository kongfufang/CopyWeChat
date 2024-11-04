<template>
  <div class="image-panel" @click="showImagePanel">
    <el-image :src="serverUrl" fit="scale-down" :width="props.width"></el-image>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { defineProps } from 'vue'
//传进来参数表示显示那种类型的图片
const props = defineProps({
  width: {
    type: Number,
    default: 170 // 修改为函数形式
  },
  showPlay: {
    type: Boolean,
    default: false // 修改为函数形式
  },
  fileId: {
    type: [String, Number]
  },
  partType: {
    type: String,
    default: 'avatar'
  },
  fileType: {
    type: Number,
    default: 0
  },
  forceGet: {
    type: Boolean,
    default: false
  }
})
const serverUrl = computed(() => {
  if (!props.fileId) {
    return ''
  }
  return ''
})
</script>

<style lang="scss" scoped>
.image-panel {
  max-width: 170px;
  max-height: 170px;
  background: #ddd;
  position: relative;
  display: flex;
  overflow: hidden;
  cursor: pointer;
}
</style>
