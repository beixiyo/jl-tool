import { matchProtocol } from './domTools'

/**
 * 用 `Blob` 下载
 * @param data 数据
 * @param fileName 文件名
 */
export const downloadByData = (data: Blob, fileName = '') => {
  const a = document.createElement("a")

  a.href = URL.createObjectURL(data)
  a.setAttribute('download', fileName)
  a.click()

  // 解决移动端无法下载问题
  setTimeout(() => {
    URL.revokeObjectURL(a.href)
  }, 1000)
}

/**
 * 用 url 下载
 * @param url 链接
 * @param fileName 文件名
 * @param matchProto 是否匹配协议，比如把 http 匹配为当前站的协议。默认 false
 */
export const downloadByUrl = async (url: string, fileName = '', matchProto = false) => {
  if (matchProto) {
    url = matchProtocol(url)
  }
  const a = document.createElement('a')

  a.href = url
  a.setAttribute('download', fileName)
  a.click()
}


/** 
 * Blob 转 Base64
 */
export function blobToBase64(blob: Blob) {
  const fr = new FileReader()
  fr.readAsDataURL(blob)

  return new Promise<string>((resolve) => {
    fr.onload = function () {
      resolve(this.result as string)
    }
  })
}

/**
 * Base64 转 Blob
 * @param base64Str base64
 * @param mimeType 文件类型，默认 application/octet-stream
 */
export function base64ToBlob(base64Str: string, mimeType: string = 'application/octet-stream'): Blob {
  const base64Data = base64Str.replace(/^data:([A-Za-z-+/]+);base64,/, '')

  // 将Base64解码为二进制数据
  const byteCharacters = atob(base64Data)

  // 计算二进制数据的长度
  const byteArrays = new Uint8Array(byteCharacters.length)

  // 将字符转换为字节并放入 Uint8Array
  for (let offset = 0; offset < byteCharacters.length; offset++) {
    byteArrays[offset] = byteCharacters.charCodeAt(offset)
  }

  return new Blob([byteArrays], { type: mimeType })
}

/**
 * 把 http url 转 blob
 */
export function urlToBlob(url: string): Promise<Blob> {
  return fetch(url).then(res => res.blob())
}

/**
 * blob 转成 Stream，方便浏览器和 Node 互操作
 */
export async function blobToStream(blob: Blob): Promise<ReadableStream> {
  return new ReadableStream({
    async start(controller) {
      const reader = blob.stream().getReader()
      let { done, value } = await reader.read()

      while (!done) {
        controller.enqueue(value)

        const { done: _d, value: _v } = await reader.read()
        done = _d
        value = _v
      }

      controller.close()
    }
  })
}

/** 
 * 二进制转字符串
 * @param data 数据
 * @param encode 编码格式，默认 utf-8
 */
export async function dataToStr(data: Blob | ArrayBuffer, encode = 'utf-8') {
  if (data instanceof ArrayBuffer) {
    return new TextDecoder(encode).decode(data)
  }

  const _data = await data.arrayBuffer()
  return new TextDecoder(encode).decode(_data)
}
