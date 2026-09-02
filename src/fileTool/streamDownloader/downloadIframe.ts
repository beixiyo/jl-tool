/** 创建隐藏 iframe 以触发 Service Worker 返回的下载响应。 */
export function createDownloadIframe(src: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  iframe.hidden = true
  Object.assign(iframe.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
  })
  iframe.src = src
  document.body.appendChild(iframe)
  return iframe
}

/** 移除下载 iframe；重复调用不产生副作用。 */
export function removeDownloadIframe(iframe: HTMLIFrameElement): void {
  iframe.remove()
}
