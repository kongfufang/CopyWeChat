const getPageOffset = (pageNo = 1, totalCount) => {
  const pageSize = 4
  const offset = (pageNo - 1) * pageSize
  const pageTotal =
    totalCount % pageSize === 0 ? totalCount / pageSize : Number.parseInt(totalCount / pageSize) + 1
  pageNo < 1 ? 1 : pageNo
  pageNo > pageTotal ? pageTotal : pageNo
  return {
    pageTotal,
    offset,
    limit: pageSize
  }
}
const result = getPageOffset(3, 9)
console.log(result)
