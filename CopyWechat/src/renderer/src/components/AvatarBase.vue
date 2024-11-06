<template>
  <div
    class="user-avatar"
    :style="{ width: width + 'px', height: width + 'px', 'border-radius': borderRadius + 'px' }"
    @click="showDetailHander"
  >
    <ShowLocalImage
      :width="width"
      :file-id="userId"
      :force-get="true"
      :file-type="0"
    ></ShowLocalImage>
  </div>
</template>

<script setup>
import ShowLocalImage from './ShowLocalImage.vue'
const props = defineProps({
  width: {
    type: Number,
    default: 40
  },
  userId: {
    type: String
  },
  borderRadius: {
    type: Number,
    default: 0
  },
  showDetail: {
    type: Boolean,
    default: false
  }
})
// 点击头像查看详情
const showDetailHander = () => {
  if (!props.showDetail) {
    return
  }
  //todo
}
</script>

<style lang="scss" scoped>
.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d3d3d3;
  overflow: hidden;
  cursor: pointer;
}
</style>
