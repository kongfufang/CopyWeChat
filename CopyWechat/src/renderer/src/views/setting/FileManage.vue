<template>
  <ContentPanel v-loading="copying" element-loading-text="正在复制文件">
    <el-form
      ref="formDataRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
      label-position="top"
      @submit.prevent
    >
      <el-form-item label="文件管理" prop="" class="file-manage">
        <div class="file-input" :title="formData.sysSetting">{{ formData.sysSetting }}1111</div>
        <div class="tips">文件存在的默认位置</div>
      </el-form-item>
      <el-form-item label="" prop="">
        <el-button type="primary" @click="changeFolder">更改</el-button>
        <el-button type="primary" @click="openLocalFolder">打开文件夹</el-button>
      </el-form-item>
    </el-form>
  </ContentPanel>
</template>

<script setup>
import { ref } from 'vue'
import ContentPanel from '../../components/ContentPanel.vue'
const formData = ref({})

//todo: 从数据库中获取文件管理的路径
const changeFolder = () => {
  console.log('changeFolder')
}
const openLocalFolder = () => {
  console.log('openLocalFolder')
}
</script>

<style lang="scss" scoped>
.file-manage {
  :deep(.el-form-item__content) {
    display: block;
  }
  .file-input {
    background: #fff;
    padding: 0 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 16px;
  }
  .tips {
    font-size: 13px;
    color: #88888888;
  }
}
</style>
