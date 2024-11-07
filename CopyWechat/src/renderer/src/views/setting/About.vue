<template>
  <ContentPanel>
    <el-form ref="formDataRef" label-width="80px" @submit.prevent>
      <el-form-item label="版本信息">
        <div class="version-info">
          <div>Wechat {{ config.version }}</div>
          <div><el-button type="primary" @click="checkUpdate">检查更新</el-button></div>
        </div>
      </el-form-item>
    </el-form>
  </ContentPanel>
</template>

<script setup>
import ContentPanel from '../../components/ContentPanel.vue'
import config from '../../../../../package.json'
const checkUpdate = () => {
  console.log('checkUpdate')
}
</script>

<style lang="scss" scoped></style>
