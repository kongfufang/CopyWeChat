const { exec } = require('child_process')
const path = require('path')

const test = async () => {
  // 使用 path.resolve 确保路径是绝对路径
  const ffprobePath = path.resolve(
    'D:/拒绝内卷/拒绝前端/Vue2+3/vue of weChat/CopyWechat/assets/ffprobe.exe'
  )
  const videoPath = path.resolve('C:/Users/DELL/Pictures/Camera Roll/樱花完整.mp4')
  const ffmpegPath = path.resolve(
    'D:/拒绝内卷/拒绝前端/Vue2+3/vue of weChat/CopyWechat/assets/ffmpeg.exe'
  )
  let savePath = path.resolve('C:/Users/DELL/Pictures/Camera Roll/樱花完整_mp4.mp4')
  // 为路径添加双引号以处理空格和特殊字符
  let command = `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=codec_name "${videoPath}"` //获取视频编码格式
  let result = await execCommand(command)
  result = result.replaceAll('\r\n', '')
  result = result.substring(result.lastIndexOf('=') + 1)
  let code = result.substring(0, result.lastIndexOf('['))
  console.log('code:', code)
  if (code === 'hevc') {
    command = `"${ffmpegPath}" -y -i "${videoPath}" -c:v libx264 -crf 20 "${savePath}"` //将hevc格式转换为h264格式
    await execCommand(command)
  } else {
    // 如果编码格式不是 hevc，直接使用原视频路径
    console.log('savePath:', savePath)
    console.log('videoPath:', videoPath)
  }
  //生成缩略图
  const coverPath = `${savePath}_cover.png`
  command = `"${ffmpegPath}" -i "${savePath}" -y -vframes 1 -vf "scale='min(170,iw*min(170/iw,170/ih))':'min(170,ih*min(170/iw,170/ih))'" "${coverPath}"`
  await execCommand(command)
}

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

test()
