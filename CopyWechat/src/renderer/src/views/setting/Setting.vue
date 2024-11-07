<template>
  <Layout>
    <template #left-content>
      <div class="title-panel drag">设置</div>
      <div class="menu-list">
        <div
          v-for="item in settingMenuList"
          :key="item.name"
          :class="['menu-item', route.path == item.path ? 'menu-active' : '']"
          @click="Jump(item)"
        >
          <div :class="['iconfont', item.icon]" :style="{ background: item.bgColor }"></div>
          <div class="menu-name">{{ item.name }}</div>
        </div>
      </div>
    </template>
    <template #right-content>
      <div class="title-panel drag"></div>
      <router-view v-slot="{ Component }">
        <component :is="Component" ref="componentRef" />
      </router-view>
    </template>
  </Layout>
</template>

<script setup>
import Layout from '../../components/Layout.vue'
import { ref, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
const settingMenuList = ref([
  { name: '账号设置', icon: 'icon-user-setting', path: '/setting/userInfo', bgColor: '#0294f5' },
  { name: '文件管理', icon: 'icon-folder1', path: '/setting/fileManage', bgColor: '#ffd04f' },
  { name: '关于我们', icon: 'icon-about', path: '/setting/about', bgColor: '#08bf61' }
])
</script>

<style lang="scss" scoped></style>
