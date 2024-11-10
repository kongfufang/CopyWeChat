const api = {
  proDomain: 'http://127.0.0.1:5050',
  devDomain: 'http://127.0.0.1:5050',
  proWsDomain: 'ws:/127.0.0.1:5051/ws',
  devWsDomain: 'ws:/127.0.0.1:5051/ws',
  checkCode: '/account/checkCode', // 验证码
  login: '/account/login', // 登录
  register: '/account/register', // 注册
  search: '/contact/search', // 搜索
  applyAdd: '/contact/applyAdd', // 添加好友
  loadContact: '/contact/loadContact', // 加载联系人
  getContactInfo: '/contact/getContactInfo', // 获取所拥有的所有联系人信息
  getContactUserInfo: '/contact/getContactUserInfo', // 获取联系人个体具体信息
  loadApply: '/contact/loadApply', // 加载申请
  dealWithApply: '/contact/dealWithApply', // 处理申请
  saveGroup: '/group/saveGroup', // 保存群组
  loadMyGroup: '/group/loadMyGroup', // 加载我的群组
  leaveGroup: '/group/leaveGroup', // 离开群组
  getGroupInfo: '/group/getGroupInfo', // 获取某个群组详细信息
  dissolutionGroup: '/group/dissolutionGroup', // 解散群组
  addContact2BlackList: '/contact/addContact2BlackList', // 添加联系人到黑名单
  delContact: '/contact/delContact', // 删除联系人
  getUserInfo: '/userInfo/getUserInfo', // 获取用户信息
  saveUserInfo: '/userInfo/saveUserInfo', // 保存用户信息
  updatePassword: '/userInfo/updatePassword' // 修改密码
}
export default api
