import { ipcMain } from 'electron'
import store from './store'
//登录后的操作
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
    callback(config)
    //开始ws连接
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
    store.setData(key, value)
  })
}
//获取本地存储
const ongetLocalStore = () => {
  ipcMain.on('getLocalStore', (e, key) => {
    e.sender.send('getLocalStoreCallback', store.getData(key))
  })
}
export { onLoginorRegister, onOpenChat, onWinTitleOp, onsetLocalStore, ongetLocalStore }
