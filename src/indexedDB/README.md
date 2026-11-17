# IndexedDB

声明式 IndexedDB 封装：按声明自动建表 / 补索引，键值与索引查询，多 store 原子事务。零运行时依赖

## 为什么

| 需求 | localforage | 原生 IndexedDB | 本库 |
| --- | --- | --- | --- |
| 键值读写 | ✅ | 繁琐 | ✅ `get / set / delete` |
| 二级索引、范围查询、倒序游标 | ❌ 只能全表 `iterate` | ✅ | ✅ `index(name).getAll(range)` |
| 跨 store 原子读改写 | ❌ 每次调用一个事务 | ✅ | ✅ `transaction([...], 'readwrite', fn)` |
| 版本号与迁移 | 自动但不透明 | 手写 `onupgradeneeded` | 按声明比对，自动升到「当前版本 + 1」 |

## 用法

```ts
import { defineDatabase } from '@jl-org/tool'

interface AppDB {
  settings: { value: Settings, key: string }
  chunks: { value: Chunk, key: string, indexes: 'ownerId' | 'ownerTask' }
}

const db = defineDatabase<AppDB>({
  name: 'app',
  stores: {
    settings: {}, // 不写 keyPath：键值模式
    chunks: {
      keyPath: 'id', // 记录模式：主键取自值
      indexes: {
        ownerId: 'ownerId',
        ownerTask: ['ownerId', 'taskId'], // 复合索引
      },
    },
  },
})

// 键值
await db.store('settings').set('theme', { mode: 'dark' })
await db.store('settings').get('theme') // 不存在为 undefined

// 记录与索引
await db.store('chunks').put({ id: 'c1', ownerId: 'u1', taskId: 't1' })
await db.store('chunks').index('ownerTask').getAll(['u1', 't1'])
await db.store('chunks').index('ownerTask').getAll(IDBKeyRange.bound(['u1'], ['u1', []])) // 复合索引按前缀查
await db.store('chunks').index('ownerId').deleteAll('u1')

// 多 store 原子事务：任一步失败整体回滚
await db.transaction(['settings', 'chunks'], 'readwrite', async ({ store }) => {
  const settings = await store('settings').get('theme')
  await store('chunks').index('ownerId').deleteAll('u1')
  await store('settings').set('theme', { ...settings, cleared: true })
})
```

`store(name)` 上的每个方法各开一个事务；需要「读后写不被插队」或跨 store 一致时用 `transaction`

## Schema 规则

- **不写版本号**：先不带版本打开，结构不满足声明时以「当前版本 + 1」升级；多个标签页、多个声明不同的实例交替打开同一个库也能收敛
- **并发升级重试**：`maxOpenAttempts` 设置单轮打开的最大尝试次数，默认为 5；耗尽后本轮失败，下次操作可重新尝试。阻塞及其他错误不会因此自动重试
- **只补不删**：缺的 store / index 创建，定义变化的 index 重建；未声明的 store / index 保留。因此可以原地接管别的库建的数据库
- 已存在 store 的 `keyPath` / `autoIncrement` 无法修改，与声明冲突时抛 `IDBSchemaError`
- 新建索引会回填已有记录；取值不是合法 key（缺字段、`boolean`、`null`、对象）的记录不进索引，按索引查时查不到
- 唯一索引被已有数据违反时整轮升级回滚，抛出原生 `ConstraintError`

## 事务规则

- 回调返回且原生 `complete` 之后才 resolve；回调抛错、请求失败、显式 abort 都回滚并以原始错误 reject
- 回调里只能等待本事务内的请求。`fetch`、哈希、定时器等事务外的异步会让事务先行提交，之后的请求失败（Chromium 实测为 `InvalidStateError`，事务尚未结束时为 `TransactionInactiveError`），整个操作 reject。这类工作放到事务开始前
- `iterate` 回调在游标事件里同步执行，返回 `false` 提前结束
- 本库未覆盖的操作用 `context.raw`（`IDBTransaction`）或事务内 store 的 `raw`（`IDBObjectStore`），配合导出的 `requestToPromise`

## 钩子

| 选项 | 时机 | 用途 |
| --- | --- | --- |
| `beforeOpen({ name })` | 每轮打开连接前，同步 | 注入调用方的准入校验；抛错中止本轮，下次操作重试 |
| `decode(value, { store })` | 每个读出的值返回前 | 兼容旧数据格式；写入不经过 |

## 从 localforage 迁移

```ts
import { localforageCompat } from '@jl-org/tool'

defineDatabase({
  name: 'sameNameAsLocalforage',
  stores: { sameStoreName: { indexes: { ownerId: 'ownerId' } } }, // 不写 keyPath
  ...localforageCompat(),
})
```

- 库名、store 名与 localforage 的 `name` / `storeName` 一致，不写 `keyPath`，即可原地读写旧数据，无需搬迁
- 可以直接给旧 store 补索引，已有记录会回填
- `localforageCompat` 只做一件事：还原 localforage 在不支持 Blob 的浏览器里写入的 base64 编码 Blob
- 语义差异：`getItem` 缺失返回 `null`，本库 `get` 返回 `undefined`；localforage `setItem(k, null)` 实际存的是 `undefined`
- 同一个库名下的所有 store 须一起切换：localforage 会自行升级同一个库的版本，两边混用会频繁互相触发 `versionchange`
