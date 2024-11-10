<template>
  <Layout>
    <template #left-content>
      <div class="drag-panel drag"></div>
      <div class="top-search">
        <!--input输入-->
        <el-input v-model="searchKey" clearable placeholder="提示信息" size="small" @keyup="search">
          <template #suffix>
            <!--这个插槽的作用是在输入框后进行插入-->
            <span class="iconfont icon-search"></span>
          </template>
        </el-input>
      </div>
      <div class="chat-session-list">
        <template v-for="item in chatSessionList" :key="item.contactId">
          <ChatSession :data="item" @contextmenu.stop="onContextMenu(item, $event)"></ChatSession>
        </template>
      </div>
    </template>
  </Layout>
</template>
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import Layout from '../../components/Layout.vue'
import ChatSession from './ChatSession.vue'
import ContextMenu from '@imengyu/vue3-context-menu'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import { getCurrentInstance } from 'vue'
const { proxy } = getCurrentInstance()
const searchKey = ref('')
const search = () => {
  console.log(searchKey.value)
}
//向主进程发送拿取聊天记录的信息(调用)
const loadChatSession = () => {
  window.ipcRenderer.send('loadSessionData')
}
//拿到主进程里的数据(执行)
const chatSessionList = ref([])
const onLoadSessionData = () => {
  window.ipcRenderer.on('loadSessionDataCallback', (e, dataList) => {
    sortChatSessionList(dataList)
    console.log('loadSessionDataCallback', dataList)
    chatSessionList.value = dataList
  })
}
const onReceiveMessage = () => {
  window.ipcRenderer.on('receiveMessage', (e, message) => {
    console.log('receiveMessage', message)
  })
}
onMounted(() => {
  onReceiveMessage()
  onLoadSessionData()
  loadChatSession()
})

//置顶函数，与主进程进行交互
const setTop = (data) => {
  data.topType = data.topType === 0 ? 1 : 0
  sortChatSessionList(chatSessionList.value)
  chatSessionList.value = [...chatSessionList.value]
  window.ipcRenderer.send('topChatSession', { contactId: data.contactId, topType: data.topType })
}
//删除函数，与主进程进行交互
const delChatSession = (contactId) => {
  window.ipcRenderer.send('delChatSession', contactId)
}
//对人头像进行右击出现框的函数
const onContextMenu = (data, e) => {
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    items: [
      {
        label: data.topType == 0 ? '置顶' : '取消置顶',
        onClick: () => {
          setTop(data)
        }
      },
      {
        label: '删除会话',
        onClick: () => {
          proxy.confirm({
            message: `确定删除${data.contactName}会话吗？`,
            okfun: () => {
              delChatSession(data.contactId)
            }
          })
        }
      }
    ]
  })
}
//会话排序规则函数
const sortChatSessionList = (dataList) => {
  dataList.sort((a, b) => {
    const topTypeResult = b['topType'] - a['topType']
    if (topTypeResult == 0) {
      return b['lastReceiveTime'] - a['lastReceiveTime']
    }
    return topTypeResult
  })
}

//页面结束删除监听
onUnmounted(() => {
  window.ipcRenderer.removeAllListeners('loadSessionDataCallback')
  window.ipcRenderer.removeAllListeners('receiveMessage')
})
</script>

<style lang="scss" scoped>
.drag-panel {
  height: 25px;
  background: #f7f7f7;
}
.top-search {
  padding: 0 10px 9px 10px;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  .iconfont {
    font-size: 12px;
  }
}
.chat-session-list {
  height: calc(100vh - 62px);
  overflow: hidden;
  border-top: 1px solid #ddd;
  &:hover {
    overflow-y: auto;
  }
}
.chat-session-list::-webkit-scrollbar {
  display: none;
}
</style>
