
/**
 * 获取URL的主机名
 * @param url URL字符串
 * @returns 主机名
 */
function getHostname(url) {
  const urlObj = new URL(url)
  return urlObj.hostname
}

console.log(getHostname('https://www.baidu.com'))