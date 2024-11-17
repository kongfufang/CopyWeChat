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
          <ChatSession
            :data="item"
            :current-session="currentChatSession.contactId == item.contactId"
            @contextmenu.stop="onContextMenu(item, $event)"
            @click="chatSessionClickHandle(item)"
          ></ChatSession>
        </template>
      </div>
    </template>
    <template #right-content>
      <div v-if="Object.keys(currentChatSession).length > 0" class="title-panel drag">
        <div class="title">
          <span>{{ currentChatSession.contactName }}</span>
          <span v-if="currentChatSession.contactType == 1"
            >({{ currentChatSession.memberCount }})</span
          >
        </div>
      </div>
      <div
        v-if="currentChatSession.contactType == 1"
        class="iconfont icon-more no-drag"
        @click="showGroupDetail"
      ></div>
      <div v-show="Object.keys(currentChatSession).length > 0" class="chat-panel">
        <div id="message-panel" class="message-panel">
          <div
            v-for="(data, index) in messageList"
            :id="'message' + messageId"
            :key="data.sessionId"
            class="message-item"
          >
            <!-- 展示聊天时候的时间 -->
            <template
              v-if="
                index > 1 &&
                data.sendTime - messageList[index - 1].sendTime > 300000 &&
                (data.messageType == 2 || data.messageType == 5)
              "
              ><ChatMessageTime :data="data"></ChatMessageTime
            ></template>
            <!-- 展示系统消息 1:添加好友成功 3：群创建成功 9：好友加入群聊 11：退出群聊 12：被踢出群聊-->
            <template
              v-if="
                data.messageType == 1 ||
                data.messageType == 3 ||
                data.messageType == 9 ||
                data.messageType == 8 ||
                data.messageType == 11 ||
                data.messageType == 12
              "
            ></template>
            <template
              v-if="data.messageType === 1 || data.messageType === 2 || data.messageType === 5"
            >
              <ChatMessage
                :data="data"
                :current-chat-session="currentChatSession"
                @show-media-detail="showMediaDetailHandle"
              ></ChatMessage>
            </template>
          </div>
        </div>
        <MessageSend
          :current-chat-session="currentChatSession"
          @send-message4-local="sendMessage4LocalHandle"
        ></MessageSend>
      </div>
      <div v-show="Object.keys(currentChatSession).length == 0">
        <Blank></Blank>
      </div>
    </template>
  </Layout>
  <WinOp></WinOp>
</template>
<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import Layout from '../../components/Layout.vue'
import ChatSession from './ChatSession.vue'
import ContextMenu from '@imengyu/vue3-context-menu'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import { getCurrentInstance } from 'vue'
import WinOp from '../../components/WinOp.vue'
import MessageSend from './MessageSend.vue'
import ChatMessage from './ChatMessage.vue'
import Blank from '../../components/Blank.vue'
import ChatMessageTime from './ChatMessageTime.vue'
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
    // console.log('loadSessionDataCallback', dataList)
    chatSessionList.value = dataList
  })
}
const onReceiveMessage = () => {
  window.ipcRenderer.on('receiveMessage', (e, message) => {
    // console.log('receiveMessage', message)
    if (message.messageType == 6) {
      const localMessage = messageList.value.find((item) => item.messageId == message.messageId)
      if (localMessage != null) {
        localMessage.status = 1
      }
      return
    }
    let curSession = chatSessionList.value.find((item) => item.sessionId == message.sessionId)
    if (curSession == null) {
      chatSessionList.value.push(message.extendData)
    } else {
      Object.assign(curSession, message.extendData)
    }
    sortChatSessionList(chatSessionList.value)
    if (message.sessionId != currentChatSession.value.sessionId) {
      //处理气泡
    } else {
      Object.assign(currentChatSession.value, message.extendData)
      messageList.value.push(message)
      gotoBottom()
    }
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
//会话删除函数(调用)
const delChatSessionList = (contactId) => {
  chatSessionList.value = chatSessionList.value.filter((item) => item.contactId !== contactId)
}
//置顶函数，与主进程进行交互
const setTop = (data) => {
  data.topType = data.topType === 0 ? 1 : 0
  sortChatSessionList(chatSessionList.value)
  chatSessionList.value = [...chatSessionList.value]
  window.ipcRenderer.send('topChatSession', { contactId: data.contactId, topType: data.topType })
}
const currentChatSession = ref({})
//分页相关信息
const messageInfo = {
  totalPage: 0,
  pageNo: 0,
  maxMessageId: null,
  noData: false
}
const messageList = ref([])
//去取到相关数据(调用)
const loadChatMessage = () => {
  if (messageInfo.noData) {
    console.log('没有数据了')
    return
  }
  messageInfo.pageNo++
  // console.log('messageInfo.pageNo++', messageInfo.pageNo)

  window.ipcRenderer.send('loadChatMessage', {
    sessionId: currentChatSession.value.sessionId,
    pageNo: messageInfo.pageNo,
    maxMessageId: messageInfo.maxMessageId
  })
}
//拿到相关数据(执行)
const onLoadChatMessage = () => {
  window.ipcRenderer.on('loadChatMessageCallback', (e, { dataList, totalPage, pageNo }) => {
    if (totalPage == pageNo) {
      messageInfo.noData = true
    }
    dataList.sort((a, b) => {
      return a.messageId - b.messageId
    })
    // console.log(dataList)
    // console.log(totalPage)
    // console.log(pageNo)

    messageList.value = dataList.concat(messageList.value)
    messageInfo.totalPage = totalPage
    messageInfo.pageNo = pageNo
    if (pageNo == 1) {
      messageInfo.maxMessageId =
        dataList.length > 0 ? dataList[dataList.length - 1].messageId : null
      //滚动到底部
      gotoBottom()
    }
    // console.log(messageList.value)
  })
}

//点击后保存当前的会话Id
const setSessionSelect = (contactId, sessionId) => {
  window.ipcRenderer.send('setSessionSelect', { contactId, sessionId })
}

//渲染相关消息记录(执行)
const chatSessionClickHandle = (item) => {
  currentChatSession.value = Object.assign({}, item)
  messageList.value = []
  messageInfo.maxMessageId = null
  messageInfo.noData = false
  messageInfo.pageNo = 0
  messageInfo.totalPage = 1
  loadChatMessage()
  setSessionSelect({ contactId: item.contactId, sessionId: item.sessionId })
}
//删除函数，与主进程进行交互
const delChatSession = (contactId) => {
  delChatSessionList(contactId)
  currentChatSession.value = {}
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
//点击发送添加消息并立即更新关于自己的消息页面
const sendMessage4LocalHandle = (messageObj) => {
  messageList.value.push(messageObj)
  const chatSession = chatSessionList.value.find((item) => item.sessionId == messageObj.sessionId)
  if (chatSession) {
    chatSession.lastMessage = messageObj.messageContent
    chatSession.lastReceiveTime = messageObj.sendTime
  }
  sortChatSessionList(chatSessionList.value)
  gotoBottom()
}
//发送消息后到达底部
const gotoBottom = () => {
  nextTick(() => {
    const items = document.querySelectorAll('.message-item')
    if (items.length > 0) {
      setTimeout(() => {
        items[items.length - 1].scrollIntoView()
      }, 100)
    }
  })
}

//发送视频等媒体消息成功后的回调
const onAddLocalMessageCallback = () => {
  window.ipcRenderer.on('addLocalMessageCallback', (e, { messageId, status }) => {
    const findMessage = messageList.value.find((item) => item.messageId == messageId)
    if (findMessage != null) {
      findMessage.status = status
    }
  })
}

//显示媒体详情
const showMediaDetailHandle = (messageId) => {
  let showFlieList = messageList.value.filter((item) => item.messageType == 5)
  showFlieList = showFlieList.map((item) => {
    return {
      partType: 'chat',
      fileId: item.messageId,
      fileType: item.fileType,
      fileName: item.fileName,
      fileSize: item.fileSize,
      forceGet: true
    }
  })
  window.ipcRenderer.send('newWindow', {
    windowId: 'media',
    title: '图片查看',
    path: '/showMedia',
    data: {
      currentFileId: messageId,
      fileList: showFlieList
    }
  })
}
onMounted(() => {
  onReceiveMessage()
  onLoadSessionData()
  loadChatSession()
  onLoadChatMessage()
  onAddLocalMessageCallback()
})

//页面结束删除监听
onUnmounted(() => {
  window.ipcRenderer.removeAllListeners('loadSessionDataCallback')
  window.ipcRenderer.removeAllListeners('receiveMessage')
  window.ipcRenderer.removeAllListeners('loadChatMessageCallback')
  window.ipcRenderer.removeAllListeners('addLocalMessageCallback')
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
.title-panel {
  display: flex;
  align-items: center;
  .title {
    height: 60px;
    line-height: 60px;
    padding-left: 10px;
    font-size: 18px;
    color: #000000;
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
.icon-more {
  position: absolute;
  top: 30px;
  right: 3px;
  z-index: 1;
  width: 20px;
  font-size: 20px;
  cursor: pointer;
  margin-right: 5px;
}
.chat-panel {
  background: #f5f5f5;
  border-top: 1px solid #ddd;
  .message-panel {
    padding: 10px 30px 0 30px;
    overflow-y: auto;
    height: calc(100vh - 200px - 62px);
    .message-item {
      margin-bottom: 15px;
      text-align: center;
    }
  }
}
</style>
