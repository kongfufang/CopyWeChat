import moment from 'moment'

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

const formatDate = (timeStamp) => {
  const timeStampTime = moment(timeStamp)
  const days =
    Number.parseInt(moment().format('YYYYMMDD')) - Number.parseInt(timeStampTime.format('YYYYMMDD'))
  if (days === 0) {
    return timeStampTime.format('HH:mm')
  }
  if (days === 1) {
    return '昨天'
  }
  if (days > 2 && days < 7) {
    return timeStampTime.format('dddd')
  }
  return timeStampTime.format('YY-MM-DD')
}
export default {
  Isempty,
  getAreaInfo,
  formatDate
}
