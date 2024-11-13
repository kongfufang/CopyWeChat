const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const { exec } = require('child_process') //引入子进程模块
const NODE_ENV = process.env.NODE_ENV
const { app, shell, ipcMain } = require('electron')
const FormData = require('form-data')
const axios = require('axios')
import store from './store'
import { selectByMessageId } from './db/ChatMessageModel'
const moment = require('moment')
moment.locale('zh-cn', {})
const cover_image_suffix = '_cover.png'
const image_suffix = '.png'

const ffprobePath = '/assets/ffprobe.exe'
const ffmpegPath = '/assets/ffmpeg.exe'

const getDomin = () => {
  return NODE_ENV === 'development' ? store.getStore('proDomain') : store.getStore('devDomain')
}

//传入一个路径递归创建文件夹
function mkdirs(dirPath) {
  const rootDir = path.parse(dirPath).root
  if (!fs.existsSync(rootDir)) {
    console.error(`根目录 (${rootDir}) 不存在或无法访问。`)
    return
  }
  // 使用递归选项创建目录
  fs.mkdirSync(dirPath, { recursive: true })
}
//获取将文件保存到本地的路径(调用)
const getLocalFilePath = (partType, showCover, fileId) => {
  return new Promise((resolve) => {
    const startFunction = async () => {
      let localFileFolder = store.getUserData('localFileFolder')
      let localPath = null
      if (partType == 'avatar') {
        console.log('avatar')
      } else if (partType == 'chat') {
        let messageInfo = await selectByMessageId(fileId)
        // console.log('messageInfo:', messageInfo)
        const month = moment(Number.parseInt(messageInfo.sendTime)).format('YYYYMM')
        // console.log('messaage-sendTime:', messageInfo.sendTime)
        // console.log('month:', month)

        localFileFolder = localFileFolder + '/' + month
        console.log('localFileFolder:', localFileFolder)
        if (!fs.existsSync(localFileFolder)) {
          mkdirs(localFileFolder)
        }
        let fileSuffix = messageInfo.fileName
        fileSuffix = fileSuffix.substring(fileSuffix.lastIndexOf('.'))
        localPath = localFileFolder + '/' + fileId + fileSuffix
        // console.log('localPath:', localPath)
      }
      resolve(localPath)
    }
    startFunction()
  })
}

//获取资源路径(调用)
const getResouresPath = () => {
  let resouresPath = app.getAppPath()
  if (NODE_ENV !== 'development') {
    resouresPath = path.dirname(app.getPath('exe') + '/resources')
  }
  console.log('resouresPath:', resouresPath)
  return resouresPath
}
//获取ffprobe路径(调用)
const getFFprobePath = () => {
  return path.join(getResouresPath(), ffprobePath)
}
//获取ffmpeg路径(调用)
const getFFmpegPath = () => {
  return path.join(getResouresPath(), ffmpegPath)
}
//执行cmd命令(调用)
const execCommand = (command) => {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      // console.log('ffprobe command:', command)
      if (error) {
        console.error(`执行出现错误: ${error.message}`)
        console.error(`标准错误输出: ${stderr}`)
        return
      }
      resolve(stdout)
    })
  })
}

//上传文件(调用)
const uploadFile = (messageId, filePath, coverPath) => {
  const formData = new FormData()
  formData.append('messageId', messageId)
  formData.append('file', fs.createReadStream(filePath))
  if (coverPath) {
    formData.append('cover', fs.createReadStream(coverPath))
  }
  const url = `${getDomin()}/api/chat/uploadFile`
  const token = store.getUserData('token')
  const config = {
    headers: {
      'Content-Type': `multipart/form-data`,
      token: token
    }
  }
  axios.post(url, formData, config).then((res) => {
    console.log('uploadFile:', res.data)
  })
}
//保存消息进入本地(执行)
const saveMessage2Local = (messageId, filePath, fileType) => {
  new Promise((resolve) => {
    const startFunction = async () => {
      let savePath = path.resolve(await getLocalFilePath('chat', false, messageId))
      //源文件到目标文件
      console.log('savePath:', savePath)

      fs.copyFileSync(filePath, savePath)
      let coverPath = null
      if (fileType != 2) {
        let command = `"${getFFprobePath()}" -v error -select_streams v:0 -show_entries stream=codec_name "${path.resolve(filePath)}"` //获取视频编码格式
        let ffmpegPath = path.resolve(getFFmpegPath())
        let result = await execCommand(command)
        result = result.replaceAll('\r\n', '')
        result = result.substring(result.lastIndexOf('=') + 1)
        let code = result.substring(0, result.lastIndexOf('['))
        console.log('code:', code)
        if (code === 'hevc') {
          command = `"${ffmpegPath}" -y -i "${path.resolve(filePath)}" -c:v libx264 -crf 20 "${savePath}"` //将hevc格式转换为h264格式
          await execCommand(command)
        }
        coverPath = savePath + cover_image_suffix
        console.log('coverPath:', coverPath)
        command = `"${ffmpegPath}" -i "${savePath}" -y -vframes 1 -vf "scale='min(170,iw*min(170/iw,170/ih))':'min(170,ih*min(170/iw,170/ih))'" "${coverPath}"`
        await execCommand(command)
      }
      uploadFile(messageId, savePath, coverPath)
      resolve()
    }
    startFunction()
  })
}

export { saveMessage2Local }
