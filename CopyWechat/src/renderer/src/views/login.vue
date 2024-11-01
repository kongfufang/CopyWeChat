<template>
  <div class="login-panel">
    <div class="title drag">Wechat</div>
    <div class="login-form">
      <div class="error-msg">{{ errorMsg }}</div>
      <el-form ref="formDataRef" :model="formData" label-width="0px" @submit.prevent>
        <!--input输入-->
        <el-form-item prop="email">
          <el-input v-model.trim="formData.email" clearable placeholder="请输入邮箱地址">
            <template #prefix>
              <span class="iconfont icon-email"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="!IsLogin" prop="nickName">
          <el-input v-model.trim="formData.nickName" clearable placeholder="请输入昵称">
            <template #prefix>
              <span class="iconfont icon-user-nick"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model.trim="formData.password"
            clearable
            placeholder="请输入密码"
            show-password
          >
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="!IsLogin" prop="rePassword">
          <el-input v-model.trim="formData.rePassword" clearable placeholder="请再次输入密码">
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="checkcode">
          <el-input v-model.trim="formData.checkcode" clearable placeholder="请输入验证码">
            <template #prefix>
              <span class="iconfont icon-checkcode"></span>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="login-btn" @click="submit">{{
            IsLogin ? '登陆' : '注册'
          }}</el-button>
        </el-form-item>
      </el-form>
      <div class="bottom-link">
        <span class="a-link" @click="changeOpType">{{ IsLogin ? '没有账号?' : '已有账号?' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
const { proxy } = getCurrentInstance()
const formData = ref({})
const formDataRef = ref()

const IsLogin = ref(true)
// 切换登录注册
const changeOpType = () => {
  window.ipcRenderer.send('LoginorRegister', !IsLogin.value)
  IsLogin.value = !IsLogin.value
}
const errorMsg = ref(null)
//提交行为
const submit = () => {
  //校验表单
  clearInput()
  if (!checkValue('checkEmail', formData.value.email, '请输入邮箱地址')) {
    return
  }
  if (!checkValue('checkPassword', formData.value.password, '请输入8-18位字母数字组合密码')) {
    return
  }
  if (!checkValue(null, formData.value.checkcode, '请输入验证码')) {
    return
  }
}
//校验密码是否正确
const checkValue = (type, value, msg) => {
  if (proxy.Utils.Isempty(value)) {
    errorMsg.value = msg
    return false
  }
  return true
}
//将输入框清空
const clearInput = () => {
  errorMsg.value = null
}
</script>
<style lang="scss" scoped>
.loding-panel {
  height: calc(100vh - 30px); //calc() 函数用于动态计算长度值
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  img {
    width: 300px;
  }
}
.login-panel {
  background: #fff;
  border-radius: 3px;
  border: 1px solid #ddd;
  .title {
    height: 30px;
    padding: 5px 0 0 10px;
  }
}
.login-form {
  padding: 0 15px 29px 15px;
  // :deep() 是 Vue 中 scoped 样式的一种特殊选择器，用于深度选择子组件的样式,使用 :deep() 可以穿透当前组件的样式范围，对子组件或嵌套组件的样式进行覆盖。
  :deep(.el-input__wrapper) {
    box-shadow: none;
    border-radius: none;
  }
  .login-form-item {
    border-radius: 1px solid #ddd;
  }
}
.login-btn {
  margin-top: 20px;
  width: 100%;
  height: 36px;
  background: #07c160;
  font-size: 16px;
}
.bottom-link {
  text-align: right;
}
.error-msg {
  line-height: 30px;
  height: 30px;
  color: #fb7373;
}
</style>
