const WebSocket = require('ws')
import store from './store'
import { saveOrUpdateChatSessionBatch4Init } from './db/ChatSessionUserModel'
import { saveMessageBatch } from './db/ChatMessageModel'
import { updateContactNoReadCount } from './db/UserSettingModel'
const NODE_ENV = process.env.NODE_ENV
let ws = null

let maxReconnectTimes = null
let wsUrl = null
let sender = null
let needReconnect = null
let lockReconnect = false
//进行ws的初始化包括设置基本信息和创建ws连接
const initWs = (config, _sender) => {
  wsUrl = `${NODE_ENV === 'development' ? store.getStore('proWsDomain') : store.getStore('devWsDomain')}?token=${config.token}`
  sender = _sender
  needReconnect = true
  maxReconnectTimes = 5
  createWs()
}
//正式创建ws连接函数
const createWs = () => {
  if (!wsUrl) {
    console.log('wsUrl is null')
    return
  }
  ws = new WebSocket(wsUrl)
  ws.onopen = function () {
    console.log('ws客户端连接成功')
    ws.send('heart beat')
    maxReconnectTimes = 5
  }
  ws.onmessage = async function (e) {
    // console.log('ws客户端收到消息:', e.data)
    const message = JSON.parse(e.data)
    const messageType = message.messageType

    switch (messageType) {
      case 0:
        //处理三个表的数据
        await saveOrUpdateChatSessionBatch4Init(message.extendData.chatSessionList)
        await saveMessageBatch(message.extendData.chatMessageList)
        await updateContactNoReadCount({
          userId: store.getUserId(),
          noRead: message.extendData.applyCount
        })
        sender.send('receiveMessage', { messageType: message.messageType })
        break
    }
  }
  ws.onclose = function () {
    console.log('ws客户端关闭')
    reConnect()
  }
  ws.onerror = function (e) {
    console.log('ws客户端错误:', e)
    reConnect()
  }
  const reConnect = () => {
    if (!needReconnect) {
      console.log('变量显示不需要重连')
      return
    }
    if (ws != null) {
      console.log('ws不为空,先关闭ws')
      ws.close()
    }
    if (lockReconnect) {
      console.log('正在重连,请稍后')
      return
    }
    lockReconnect = true
    if (maxReconnectTimes > 0) {
      console.log('剩余重连次数:', maxReconnectTimes)
      maxReconnectTimes--
      setTimeout(() => {
        createWs()
        lockReconnect = false
      }, 5000)
    } else {
      console.log('重连次数已用完')
      ws.close()
    }
  }
  setInterval(() => {
    ws.send('heart beat')
    // console.log('发送心跳')
  }, 5000)
}
export { initWs }
