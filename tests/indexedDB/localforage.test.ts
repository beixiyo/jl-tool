// @vitest-environment node
/** 用真实 localforage 1.10.0 建出的库验证原地接管：多 store 动态版本、Blob、编码 Blob、过渡期并存 */
import 'fake-indexeddb/auto'
import localforage from 'localforage'
import { afterEach, describe, expect, it } from 'vitest'
import type { Database } from '@/indexedDB'
import { defineDatabase, requestToPromise } from '@/indexedDB'
import { decodeLocalforageValue, localforageCompat } from '@/indexedDB/localforage'

const opened: Database<any>[] = []

afterEach(() => {
  for (const database of opened.splice(0)) database.close()
})

type Task = { ownerId: string; taskId: string; blob?: Blob }

/** 按「各 store 首次使用的先后」创建，复现用户机器上不可预知的版本号 */
async function seedLegacy(name: string, storeNames: string[]) {
  const instances = storeNames.map((storeName) => localforage.createInstance({ name, storeName, driver: localforage.INDEXEDDB }))
  for (const [i, instance] of instances.entries()) {
    const storeName = storeNames[i]
    await instance.setItem(JSON.stringify(['u1', storeName]), { ownerId: 'u1', taskId: storeName, blob: new Blob([storeName]) })
    await instance.setItem(JSON.stringify(['u2', storeName]), { ownerId: 'u2', taskId: storeName })
    await instance.setItem('nullish', null)
  }
  return instances
}

describe('localforage 兼容', () => {
  it('读取多 store 旧库的值与 Blob，补索引不搬数据，localforage 仍可继续读写', async () => {
    const legacy = await seedLegacy('LegacyRecovery', ['tasks', 'audio', 'chunks'])

    const database = defineDatabase<{
      tasks: { value: Task; key: string; indexes: 'ownerId' }
      audio: { value: Task; key: string; indexes: 'ownerId' }
      chunks: { value: Task; key: string; indexes: 'ownerTask' }
    }>({
      name: 'LegacyRecovery',
      stores: {
        tasks: { indexes: { ownerId: 'ownerId' } },
        audio: { indexes: { ownerId: 'ownerId' } },
        chunks: { indexes: { ownerTask: ['ownerId', 'taskId'] } },
      },
      ...localforageCompat(),
    })
    opened.push(database)

    // localforage 每加一个 store 升一版：3 个 store → 版本 4；补索引再升一版
    expect((await database.open()).version).toBe(5)

    const task = await database.store('tasks').get(JSON.stringify(['u1', 'tasks']))
    expect(task?.ownerId).toBe('u1')
    expect(await task?.blob?.text()).toBe('tasks')
    // localforage 把 null 存成 undefined，读出即「不存在」
    expect(await database.store('tasks').get('nullish')).toBeUndefined()
    expect(await database.store('tasks').has('nullish')).toBe(true)

    const owned = await database.store('audio').index('ownerId').getAll('u1')
    expect(owned.map((record) => record.taskId)).toEqual(['audio'])
    expect(await database.store('chunks').index('ownerTask').count(['u2', 'chunks'])).toBe(1)

    await database.store('tasks').set('fresh', { ownerId: 'u3', taskId: 'new' })
    database.close()

    // 过渡期两边并存：localforage 读到新写入，也能继续写
    expect(await legacy[0].getItem('fresh')).toEqual({ ownerId: 'u3', taskId: 'new' })
    await legacy[0].setItem('fromLegacy', { ownerId: 'u4', taskId: 'legacy' })
    expect((await database.store('tasks').index('ownerId').getAll('u4')).map((record) => record.taskId)).toEqual(['legacy'])
  })

  it('不删除 localforage 的 blob 探测 store', async () => {
    await seedLegacy('LegacyProbe', ['items'])
    const database = defineDatabase({ name: 'LegacyProbe', stores: { items: {} }, ...localforageCompat() })
    opened.push(database)
    const native = await database.open()
    expect([...native.objectStoreNames].sort()).toEqual(['items', 'local-forage-detect-blob-support'])
  })

  it('还原 localforage 在不支持 Blob 的环境里写入的 base64 编码', async () => {
    const encoded = { __local_forage_encoded_blob: true, data: btoa('\x00\x01binary'), type: 'audio/webm' }
    const raw = await requestToPromise(indexedDB.open('LegacyEncoded', 1))
    raw.close()
    const database = defineDatabase<{ items: { value: Blob; key: string } }>({
      name: 'LegacyEncoded',
      stores: { items: {} },
      ...localforageCompat(),
    })
    opened.push(database)
    await database.transaction('items', 'readwrite', ({ raw: transaction }) => {
      transaction.objectStore('items').put(encoded, 'audio')
    })

    const blob = await database.store('items').get('audio')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob?.type).toBe('audio/webm')
    expect([...new Uint8Array(await blob!.arrayBuffer())]).toEqual([0, 1, ...new TextEncoder().encode('binary')])

    expect(decodeLocalforageValue('plain')).toBe('plain')
    expect(decodeLocalforageValue({ __local_forage_encoded_blob: false })).toEqual({ __local_forage_encoded_blob: false })
  })
})
