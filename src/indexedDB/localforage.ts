/**
 * 接管 localforage（IndexedDB driver）创建的数据库
 *
 * localforage 的存储布局本身就是普通 IndexedDB：store 无 keyPath、主键为字符串
 * 因此只要以相同的库名 / store 名、且不声明 keyPath 来定义，即可原地读写旧数据
 * 剩下的差异只有一个：在不支持存 Blob 的浏览器里，它把顶层 Blob 编码成 base64 对象
 * 这里在读取时还原；写入一律存原生 Blob，不再产生这种编码
 *
 * 另外，localforage 会在每个库里额外建一个 `local-forage-detect-blob-support` store；
 * 本库从不删除未声明的 store，无需处理
 *
 * @example
 * defineDatabase({ name: 'legacy', stores: { items: {} }, ...localforageCompat() })
 */
export function localforageCompat(): { decode: (value: unknown) => unknown } {
  return { decode: decodeLocalforageValue }
}

/** 还原 localforage 编码过的顶层 Blob；其他值原样返回 */
export function decodeLocalforageValue(value: unknown): unknown {
  if (!isEncodedBlob(value)) return value

  const binary = atob(value.data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: value.type })
}

function isEncodedBlob(value: unknown): value is LocalforageEncodedBlob {
  return typeof value === 'object'
    && value !== null
    && (value as Partial<LocalforageEncodedBlob>).__local_forage_encoded_blob === true
    && typeof (value as Partial<LocalforageEncodedBlob>).data === 'string'
}

type LocalforageEncodedBlob = {
  __local_forage_encoded_blob: true
  data: string
  type: string
}
