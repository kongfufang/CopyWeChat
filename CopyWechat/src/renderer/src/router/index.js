import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  mode: 'history',
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '首页',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login.vue')
    },
    {
      path: '/main',
      name: '聊天主页面',
      component: () => import('@/views/main.vue'),
      redirect: '/chat',
      children: [
        {
          path: '/contact',
          name: '联系人',
          component: () => import('@/views/contact/Contact.vue'),
          redirect: '/contact/blank',
          children: [
            {
              path: '/contact/blank',
              name: '空白页',
              component: () => import('@/views/contact/BlankPage.vue')
            },
            {
              path: '/contact/search',
              name: '搜索',
              component: () => import('@/views/contact/Search.vue')
            }
          ]
        },
        {
          path: '/chat',
          name: '聊天',
          component: () => import('@/views/chat/Chat.vue')
        },
        {
          path: '/setting',
          name: '设置',
          component: () => import('@/views/setting/Setting.vue')
        }
      ]
    }
  ]
})

export default router
