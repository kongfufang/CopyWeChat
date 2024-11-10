import store from '../store'

import { insertOrReplace } from './ADB'
import { updateNoReadCount } from './ChatSessionUserModel'
//插入单条数据(调用)
const saveMessage = (data) => {
  data.userId = store.getUserId()
  return insertOrReplace('chat_message', data)
}
//批量插入数据(执行)并更新未读数量
const saveMessageBatch = (chatMessageList) => {
  return new Promise((resolve) => {
    async function startFunction() {
      const chatSessionCountMap = {}
      chatMessageList.forEach((item) => {
        let contactId = item.contactType === 1 ? item.contactId : item.sendUserId
        let noReadCount = chatSessionCountMap[contactId]
        if (!noReadCount) {
          chatSessionCountMap[contactId] = 1
        } else {
          chatSessionCountMap[contactId] = noReadCount + 1
        }
      })
      //更新未读数量,在另一个表中进行更新
      for (let item in chatSessionCountMap) {
        await updateNoReadCount({ contactId: item, noReadCount: chatSessionCountMap[item] })
      }
      //批量插入此表格数据
      chatMessageList.forEach(async (item) => {
        await saveMessage(item)
      })
      resolve()
    }
    startFunction()
  })
}

export { saveMessageBatch }
