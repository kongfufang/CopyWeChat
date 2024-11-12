const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const { exec } = require('child_process') //引入子进程模块
const NODE_ENV = process.env.NODE_ENV
const { app, shell, ipcMain } = require('electron')
const FormData = require('form-data')
const axios = require('axios')
import store from './store'
const moment = require('moment')
moment.locale('zh-cn', {})

const saveMessage2Local = (messageId, filePath, fileType) => {
  new Promise((resolve) => {
    const startFunction = () => {}
    startFunction()
  })
}

export { saveMessage2Local }
