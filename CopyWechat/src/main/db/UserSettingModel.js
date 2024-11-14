import { startLocalServer } from '../file'
import store from '../store'
import { insertOrIgnore, queryOne, run, update } from './ADB'
const os = require('os')
const useDir = os.homedir()
//更新申请好友未读数量
const updateContactNoReadCount = ({ userId, noRead }) => {
  return new Promise((resolve) => {
    async function startFunction() {
      let sql = null
      if (noRead) {
        sql = 'update user_setting set contact_no_read= contact_no_read+? where user_id=?'
      } else {
        noRead = 0
        sql = 'update user_setting set contact_no_read=? where user_id=?'
      }
      await run(sql, [noRead, userId])
      resolve()
    }
    startFunction()
  })
}
//添加这个设置表里的信息
const addUserSetting = async (userId, email) => {
  let sql = 'select max(server_port) server_port from user_setting'
  let { serverPort } = await queryOne(sql, [])
  console.log('serverPort:', serverPort)

  if (serverPort === null) {
    serverPort = 10340
  } else {
    serverPort++
  }
  const sysSetting = {
    localFileFolder: useDir + '\\.easychat\\fileStorage\\'
  }

  sql = 'select * from user_setting where user_id=?'
  const userInfo = await queryOne(sql, [userId])
  let resultServerPort = null
  let localFileFolder = sysSetting.localFileFolder + userId
  if (userInfo) {
    await update('user_setting', { email }, { userId })
    resultServerPort = userInfo.serverPort
    localFileFolder = JSON.parse(userInfo.sysSetting).localFileFolder + userId
  } else {
    await insertOrIgnore('user_setting', {
      userId: userId,
      email: email,
      sysSetting: JSON.stringify(sysSetting),
      serverPort: serverPort,
      contactNoRead: 0
    })
    resultServerPort = serverPort
  }
  //启动本地服务
  startLocalServer(resultServerPort)
  store.setUserData('localServerPort', resultServerPort)
  store.setUserData('localFileFolder', localFileFolder)
}
export { updateContactNoReadCount, addUserSetting }
