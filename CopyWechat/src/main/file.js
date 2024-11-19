const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const { exec } = require('child_process') //引入子进程模块
const NODE_ENV = process.env.NODE_ENV
const { app, dialog, shell } = require('electron')
const FormData = require('form-data')
const axios = require('axios')
import store from './store'
import { selectByMessageId } from './db/ChatMessageModel'
import { selectSettingInfo, updateSysSetting } from './db/UserSettingModel'
import { getWindow } from './WindowProxy'
const moment = require('moment')
moment.locale('zh-cn', {})
const cover_image_suffix = '_cover.png'
const image_suffix = '.png'
const ffprobePath = '/assets/ffprobe.exe'
const ffmpegPath = '/assets/ffmpeg.exe'
//导入express
const express = require('express')
const expressServer = express()

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
        localFileFolder = localFileFolder + '/avatar/'
        if (!fs.existsSync(localFileFolder)) {
          mkdirs(localFileFolder)
        }
        localPath = localFileFolder + fileId + image_suffix
      } else if (partType == 'chat') {
        let messageInfo = await selectByMessageId(fileId)
        const month = moment(Number.parseInt(messageInfo.sendTime)).format('YYYYMM')
        localFileFolder = localFileFolder + '/' + month
        // console.log('localFileFolder:', localFileFolder)
        if (!fs.existsSync(localFileFolder)) {
          mkdirs(localFileFolder)
        }
        let fileSuffix = messageInfo.fileName
        fileSuffix = fileSuffix.substring(fileSuffix.lastIndexOf('.'))
        localPath = localFileFolder + '/' + fileId + fileSuffix
      } else if (partType == 'tmp') {
        localFileFolder = localFileFolder + '/tmp/'
        if (!fs.existsSync(localFileFolder)) {
          mkdirs(localFileFolder)
        }
        localPath = localFileFolder + '/' + fileId
      }
      if (showCover) {
        localPath = localPath + cover_image_suffix
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
  // console.log('resouresPath:', resouresPath)
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
      // console.log('savePath:', savePath)

      fs.copyFileSync(filePath, savePath)
      let coverPath = null
      if (fileType != 2) {
        let command = `"${getFFprobePath()}" -v error -select_streams v:0 -show_entries stream=codec_name "${path.resolve(filePath)}"` //获取视频编码格式
        let ffmpegPath = path.resolve(getFFmpegPath())
        let result = await execCommand(command)
        result = result.replaceAll('\r\n', '')
        result = result.substring(result.lastIndexOf('=') + 1)
        let code = result.substring(0, result.lastIndexOf('['))
        // console.log('code:', code)
        if (code === 'hevc') {
          command = `"${ffmpegPath}" -y -i "${path.resolve(filePath)}" -c:v libx264 -crf 20 "${savePath}"` //将hevc格式转换为h264格式
          await execCommand(command)
        }
        coverPath = savePath + cover_image_suffix
        // console.log('coverPath:', coverPath)
        command = `"${ffmpegPath}" -i "${savePath}" -y -vframes 1 -vf "scale='min(170,iw*min(170/iw,170/ih))':'min(170,ih*min(170/iw,170/ih))'" "${coverPath}"`
        await execCommand(command)
      }
      await uploadFile(messageId, savePath, coverPath)
      resolve()
    }
    startFunction()
  })
}
let server = null
//启动本地服务(调用)
const startLocalServer = (serverPort) => {
  server = expressServer.listen(serverPort, () => {
    console.log('server is running at port:', serverPort)
  })
}
//关闭本地服务(调用)
const closeLocalServer = () => {
  if (server) server.close()
}

//下载文件(调用)
const FILE_TYPE_CONTENT_TYPE = {
  0: 'image/',
  1: 'video/',
  2: 'audio/'
}
expressServer.get('/file', async (req, res) => {
  let { fileId, fileType, showCover, forceGet, partType } = req.query
  if (!fileId || !partType) {
    res.send('参数错误')
    return
  }
  // console.log('fileId:', fileId)
  showCover = showCover == undefined ? false : Boolean(showCover)
  const localPath = await getLocalFilePath(partType, showCover, fileId)
  // console.log('localPath:', localPath)
  if (!fs.existsSync(localPath) || forceGet == 'true') {
    if (forceGet == 'true' && partType == 'avatar') {
      await downFile(fileId, true, localPath + cover_image_suffix, partType)
    }
    await downFile(fileId, showCover, localPath, partType)
  }
  const fileSuffix = localPath.substring(localPath.lastIndexOf('.') + 1)
  let contentType = FILE_TYPE_CONTENT_TYPE[fileType] + fileSuffix
  res.setHeader('Content-Type', contentType)
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (showCover || fileType != 1) {
    fs.createReadStream(localPath).pipe(res)
    return
  }
  let stat = fs.statSync(localPath) //可以获取文件的大小、创建时间等信息，也可以用来判断文件是否存在
  let fileSize = stat.size
  let range = req.headers.range
  if (range) {
    let parts = range.replace(/bytes=/, '').split('-')
    let start = parseInt(parts[0], 10)
    let end = parts[1] ? parseInt(parts[1], 10) : start + 999999
    end = end > fileSize - 1 ? fileSize - 1 : end
    let chunksize = end - start + 1
    let stream = fs.createReadStream(localPath, { start, end })
    let head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    }
    res.writeHead(206, head)
    stream.pipe(res)
  } else {
    let head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    }
    res.writeHead(200, head)
    fs.createReadStream(localPath).pipe(res)
  }
  return
})
//从服务器上下载文件
const downFile = (fileId, showCover, savePath, partType) => {
  showCover = showCover + ''
  console.log('showCover:', showCover)
  let url = `${getDomin()}/api/chat/downloadFile`
  const token = store.getUserData('token')
  return new Promise((resolve) => {
    const startFunction = async () => {
      const config = {
        responseType: 'stream',
        headers: {
          'content-type': 'multipart/form-data',
          token
        }
      }
      let response = await axios.post(url, { fileId, showCover }, config)
      const folder = savePath.substring(0, savePath.lastIndexOf('/'))
      // console.log('folder:', folder)
      await mkdirs(folder)
      let writeStream = fs.createWriteStream(savePath)
      // console.log(savePath)
      if (response.headers['content-type'] === 'application/json') {
        let resouresPath = getResouresPath()
        if (partType === 'avatar') {
          fs.createReadStream(resouresPath + '/assets/user.png').pipe(writeStream)
        } else {
          fs.createReadStream(resouresPath + '/assets/404.png').pipe(writeStream)
        }
        console.log('这是没有找到文件')
      } else {
        response.data.pipe(writeStream)
        console.log('这是已经存进去了找到文件')
      }
      writeStream.on('finish', () => {
        writeStream.end()
        resolve()
      })
    }
    startFunction()
  })
}
//创建头像和头像缩略图
const createCover = (filePath) => {
  return new Promise((resolve) => {
    const startFunction = async () => {
      let ffmpegPath = getFFmpegPath()
      let avatarPath = await getLocalFilePath('avatar', false, store.getUserId() + '_temp')
      let command = `"${ffmpegPath}" -i "${filePath}" "${avatarPath}" -y` //生成缩略图
      await execCommand(command)
      let coverPath = await getLocalFilePath('avatar', false, store.getUserId() + '_temp_cover')
      command = `"${ffmpegPath}" -i "${avatarPath}" -y -vframes 1 -vf "scale='min(170,iw*min(170/iw,170/ih))':'min(170,ih*min(170/iw,170/ih))'" "${coverPath}"`
      await execCommand(command)
      resolve({
        avatarStream: fs.readFileSync(avatarPath),
        coverStream: fs.readFileSync(coverPath)
      })
    }
    startFunction()
  })
}

const saveAs = async ({ partType, fileId }) => {
  let fileName = ''
  if (partType == 'avatar') {
    fileName = fileId + image_suffix
  } else if (partType == 'chat') {
    let messageInfo = await selectByMessageId(fileId)
    fileName = messageInfo.fileName
  }

  const localPath = await getLocalFilePath(partType, false, fileId)
  const options = {
    title: '保存文件',
    defaultPath: fileName
  }
  let result = await dialog.showSaveDialog(options)
  console.log('result:', result)

  if (result.canceled || !result.filePath) return
  const filePath = result.filePath
  console.log('filePath:', filePath)
  console.log('localPath:', localPath)
  fs.copyFileSync(localPath, filePath)
}
//将图片保存到某个本地路径下
const saveClipboardFile = async (data) => {
  const fileSuffix = data.name.substring(data.name.lastIndexOf('.'))
  const filePath = await getLocalFilePath('tmp', false, 'tmp' + fileSuffix)
  let byteArray = data.byteArray
  let buffer = Buffer.from(byteArray)
  fs.writeFileSync(filePath, buffer)
  return {
    size: buffer.length,
    name: data.name,
    path: filePath
  }
}
//打开文件夹
const openLocalFolder = async () => {
  let settingInfo = await selectSettingInfo(store.getUserId())
  const sysSetting = JSON.parse(settingInfo.sysSetting)
  const localFileFolder = sysSetting.localFileFolder
  if (!fs.existsSync(localFileFolder)) {
    mkdirs(localFileFolder)
  }
  shell.openPath('file:///' + localFileFolder)
}

//改变文件路径
const changeLocalFolder = async () => {
  let settingInfo = await selectSettingInfo(store.getUserId())
  const sysSetting = JSON.parse(settingInfo.sysSetting)
  let localFileFolder = sysSetting.localFileFolder
  const options = {
    properties: ['openDirectory'],
    defaultPath: localFileFolder
  }
  let result = await dialog.showOpenDialog(options)
  const newFileFolder = result.filePaths[0]
  if (result.canceled || !result.filePaths) return
  if (localFileFolder != newFileFolder) {
    const userId = store.getUserId()
    getWindow('main').webContents.send('copyingCallback')
    await fse.copy(localFileFolder + '/' + userId, newFileFolder + '/' + userId)
  }

  sysSetting.localFileFolder = newFileFolder + '\\'
  const sysSettingJson = JSON.stringify(sysSetting)
  await updateSysSetting(sysSettingJson)
  store.setUserData('localFileFolder', sysSetting.localFileFolder + store.getUserId())
  getWindow('main').webContents.send('getSysSettingCallback', sysSetting)
}
export {
  saveMessage2Local,
  startLocalServer,
  closeLocalServer,
  createCover,
  saveAs,
  saveClipboardFile,
  openLocalFolder,
  changeLocalFolder
}
