import { BrowserWindow, ipcMain } from 'electron'
import store from './store'
import { initWs } from './wsClient'
import { addUserSetting } from './db/UserSettingModel'
import {
  readAll,
  selectUserSessionList,
  updateSessionInfo4Message
} from './db/ChatSessionUserModel'
import { delChatSession } from './db/ChatSessionUserModel'
import { topChatSession } from './db/ChatSessionUserModel'
import { selectChatMessageList, saveMessage, updateMessage } from './db/ChatMessageModel'
import { createCover, saveMessage2Local } from './file'
import { delWindow, getWindow, saveWindow } from './WindowProxy'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { is } from '@electron-toolkit/utils'
//登录后的操作
const NODE_ENV = process.env.NODE_ENV
const onLoginorRegister = (callback) => {
  ipcMain.on('LoginorRegister', (e, IsLogin) => {
    // console.log('收到渲染进程:', IsLogin)
    callback(IsLogin)
  })
}
//打开聊天窗口
const onOpenChat = (callback) => {
  ipcMain.on('openChat', (e, config) => {
    store.initUserId(config.userId)
    store.setUserData('token', config.token)
    addUserSetting(config.userId, config.email)
    callback(config)
    //开始ws连接
    initWs(config, e.sender)
  })
}
//修改窗口参数
const onWinTitleOp = (callback) => {
  ipcMain.on('winTitleOp', (e, data) => {
    callback(e, data)
  })
}
//设置本地存储
const onsetLocalStore = () => {
  ipcMain.on('setLocalStore', (e, { key, value }) => {
    store.setStore(key, value)
    // console.log('设置本地存储:', store.getStore(key))
  })
}
//获取主进程里的本地存储(调用)
const ongetLocalStore = () => {
  ipcMain.on('getLocalStore', (e, key) => {
    e.sender.send('getLocalStoreCallback', store.getStore(key))
  })
}
//进入聊天拿取数据库内容发送给渲染进程
const onLoadSessionData = () => {
  ipcMain.on('loadSessionData', async (e) => {
    const dataList = await selectUserSessionList()
    e.sender.send('loadSessionDataCallback', dataList)
  })
}
//监听某个会话删除的操作
const onDelChatSession = () => {
  ipcMain.on('delChatSession', (e, contactId) => {
    delChatSession(contactId)
  })
}
//监听某个会话置顶的操作
const onTopChatSession = () => {
  ipcMain.on('topChatSession', (e, { contactId, topType }) => {
    topChatSession(contactId, topType)
  })
}
//监听某个会话的页面得到消息的操作
const onloadChatMessage = () => {
  ipcMain.on('loadChatMessage', async (e, data) => {
    const result = await selectChatMessageList(data)
    // console.log(result)
    e.sender.send('loadChatMessageCallback', result)
  })
}
//监听某个会话发送消息的操作
const onAddLocalMessage = () => {
  ipcMain.on('addLocalMessage', async (e, data) => {
    await saveMessage(data)
    //如果是文件消息则保存文件到本地
    if (data.messageType === 5) {
      await saveMessage2Local(data.messageId, data.filePath, data.fileType)
      const updateInfo = {
        status: 1
      }
      await updateMessage(updateInfo, { messageId: data.messageId })
    }
    data.lastReceiveTime = data.sendTime
    //更新所有会话
    updateSessionInfo4Message(store.getUserData('currentSessionId'), data)
    e.sender.send('addLocalMessageCallback', { status: 1, messageId: data.messageId })
  })
}

//点击某个会话时保存当前的会话id
const onSetSessionSelect = () => {
  ipcMain.on('setSessionSelect', (e, { contactId, sessionId }) => {
    if (sessionId) {
      store.setUserData('currentSessionId', sessionId)
      readAll(contactId)
    } else {
      store.deleteUserData('currentSessionId')
    }
  })
}

const OnCreateCover = () => {
  ipcMain.on('createCover', async (e, localFilePath) => {
    const stream = await createCover(localFilePath)
    e.sender.send('createCoverCallback', stream)
  })
}

const onOpenNewWindow = () => {
  ipcMain.on('newWindow', async (e, config) => {
    openWindow(config)
  })
}

const openWindow = ({ windowId, title, path, width, height, data }) => {
  title = title || 'CopyWeChat'
  width = width || '960'
  height = height || '970'
  let newWindow = getWindow(windowId)
  if (!newWindow) {
    newWindow = new BrowserWindow({
      icon: icon,
      width: width,
      height: height,
      fullscreenable: false,
      fullscreen: false,
      maximizable: false,
      autoHideMenuBar: true,
      titleBarStyle: 'hidden',
      transparent: true,
      resizable: false,
      frame: true,
      hasShadow: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: false //关闭隔离后才能实现渲染进程与主进程通信
      }
    })
    saveWindow(windowId, newWindow)
    newWindow.setMinimumSize(600, 480)
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      newWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/index.html#${path}`)
    } else {
      newWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: `${path}` })
    }
    if (NODE_ENV === 'development') {
      newWindow.webContents.openDevTools()
    }
    newWindow.on('ready-to-show', () => {
      newWindow.show()
      newWindow.setTitle(title)
    })
    newWindow.once('show', () => {
      setTimeout(() => {
        newWindow.webContents.send('pageInitData', data)
      }, 500)
    })
    newWindow.on('close', () => {
      delWindow(windowId)
    })
  } else {
    newWindow.show()
    newWindow.setSkipTaskbar(false)
    newWindow.webContents.send('pageInitData', data)
  }
}
export {
  onLoginorRegister,
  onOpenChat,
  onWinTitleOp,
  onsetLocalStore,
  ongetLocalStore,
  onLoadSessionData,
  onDelChatSession,
  onTopChatSession,
  onloadChatMessage,
  onAddLocalMessage,
  onSetSessionSelect,
  OnCreateCover,
  onOpenNewWindow
}
