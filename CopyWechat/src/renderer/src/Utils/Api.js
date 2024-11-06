const api = {
  proDomain: 'http://127.0.0.1:5050',
  devDomain: 'http://127.0.0.1:5050',
  proWsDomain: 'ws://127.0.0.1:5051/ws',
  checkCode: '/account/checkCode', // 验证码
  login: '/account/login', // 登录
  register: '/account/register', // 注册
  search: '/contact/search', // 搜索
  applyAdd: '/contact/applyAdd', // 添加好友
  loadContact: '/contact/loadContact', // 加载联系人
  getContactInfo: '/contact/getContactInfo', // 获取联系人信息
  saveGroup: '/group/saveGroup'
}
export default api
