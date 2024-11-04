const Isempty = (obj) => {
  if (obj === null || obj === undefined || obj === '') {
    return true
  }
  return false
}
const getAreaInfo = (area) => {
  if (Isempty(area)) {
    return '-'
  }
  return area.replace(',', ' ')
}
export default {
  Isempty,
  getAreaInfo
}
