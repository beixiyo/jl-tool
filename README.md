# 🛠️ @jl-org/tool

<p align="center">
  <img alt="npm-version" src="https://img.shields.io/npm/v/@jl-org/tool?color=red&logo=npm" />
  <img alt="npm-download" src="https://img.shields.io/npm/dm/@jl-org/tool?logo=npm" />
  <img alt="License" src="https://img.shields.io/npm/l/@jl-org/tool?color=blue" />
  <img alt="typescript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img alt="github" src="https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white" />
</p>

> 强大而实用的前端工具库，零依赖，类型完善，功能丰富

## ✨ 特色

- 🚀 **高性能**：优化的算法和实现，如千万级函数执行也不卡顿的分时调度器
- 📦 **零依赖**：不依赖任何第三方库
- 📐 **类型完备**：完善的 TypeScript 类型定义
- 🧩 **模块化**：按需引入，减少包体积
- 🔧 **实用至上**：覆盖日常开发的大部分场景
- 🌐 **全面覆盖**：从基础工具到高级功能，一应俱全

## 📥 安装

```bash
# npm
npm i @jl-org/tool

# pnpm
pnpm add @jl-org/tool

# yarn
yarn add @jl-org/tool
```

---

## 📚 工具分类

### 🧰 常用工具

| 函数 | 说明 |
|------|------|
| [`uniqueId`](./src/tools/tools.ts) | 获取自增唯一ID |
| [`deepClone`](./src/tools/tools.ts) | 深拷贝，支持循环引用 |
| [`wait`](./src/tools/tools.ts) | 等待指定时间 |
| [`throttle`](./src/tools/domTools.ts) | 节流函数 |
| [`debounce`](./src/tools/domTools.ts) | 防抖函数 |
| [`once`](./src/tools/tools.ts) | 限制函数调用次数 |
| [`isPureNum`](./src/shared/is.ts) | 判断是否能强转成数字 |
| [`isStr`](./src/shared/is.ts) | 判断是否为字符串 |
| [`isObj`](./src/shared/is.ts) | 判断是否为对象 |
| [`isArr`](./src/shared/is.ts) | 判断是否为数组 |

### 📊 数组处理

| 函数 | 说明 |
|------|------|
| [`arrToTree`](./src/tools/arrTools.ts) | 扁平数组转树形结构 |
| [`searchTreeData`](./src/tools/arrTools.ts) | 树形结构搜索 |
| [`binarySearch`](./src/tools/arrTools.ts) | 二分查找 |
| [`bfsFind`](./src/tools/arrTools.ts) | 广度优先遍历 |
| [`dfsFind`](./src/tools/arrTools.ts) | 深度优先遍历 |
| [`groupBy`](./src/tools/arrTools.ts) | 数组分组 |
| [`arrToChunk`](./src/tools/arrTools.ts) | 数组分块 |

### 📆 日期处理

- [`formatDate`](./src/tools/dateTools.ts) - 强大的日期格式化
- [`timeGap`](./src/tools/dateTools.ts) - 获取类似"1分钟前"的相对时间
- [`dayDiff`](./src/tools/dateTools.ts) - 计算日期差值，单位(天)
- [`getQuarter`](./src/tools/dateTools.ts) - 获取季度

### 🌈 颜色处理

- [`mixColor`](./src/tools/colorTools.ts) - 混合两种颜色
- [`lightenColor`](./src/tools/colorTools.ts) - 调整颜色明度
- [`colorAddOpacity`](./src/tools/colorTools.ts) - 添加透明度
- [`getColorInfo`](./src/tools/colorTools.ts) - 提取颜色的RGBA值
- [`hexToRGB`](./src/tools/colorTools.ts) - 十六进制转RGB
- [`rgbToHex`](./src/tools/colorTools.ts) - RGB转十六进制

### 🧮 数学运算

- [`mapRange`](./src/math/mapRange.ts) - 将数值从一个范围映射到另一个范围
- [`calcAspectRatio`](./src/math/ratio.ts) - 根据面积计算宽高比
- [`clamp`](./src/math/tools.ts) - 限制值在指定范围内
- [`calcCoord`](./src/math/coord.ts) - 根据半径和角度获取坐标

### 🕒 时钟与进度

- [`Clock`](./src/tools/Clock.ts) - 计时器，获取帧间隔、累计时间等
- [`FakeProgress`](./src/tools/FakeProgress.ts) - 模拟进度条，适用于未知进度的加载
- [`timer`](./src/tools/timer.ts) - 高级setInterval替代，使用requestAnimationFrame实现

### 🌐 网络请求工具

- [`concurrentTask`](./src/net/concurrentTask.ts) - 并发执行异步任务
- [`retryTask`](./src/net/retryTask.ts) - 失败后自动重试
- [`WS`](./src/net/WS.ts) - 自动重连的WebSocket
- [`StreamJsonParser`](./src/tools/StreamJsonParser.ts) - 流式解析JSON，适用于SSE

### 📄 文件处理

- [`downloadByData`](./src/fileTool/tools.ts) / [`downloadByUrl`](./src/fileTool/tools.ts) - 下载文件
- [`blobToBase64`](./src/fileTool/tools.ts) / [`base64ToBlob`](./src/fileTool/tools.ts) - 格式转换
- [`checkFileSize`](./src/fileTool/tools.ts) - 检查文件大小
- [`FileChunker`](./src/fileTool/FileChunker.ts) - 文件分块处理器
- [`createStreamDownloader`](./src/fileTool/streamDownloader.ts) - 流式下载（无内存限制）
- [`getMimeType`](./src/fileTool/getMimeType.ts) - 获取资源的MIME类型
- [`detectFileType`](./src/fileTool/fileType.ts) - 检测文件类型

### 🌍 URL处理

- [`isValidUrl`](./src/tools/urlTools.ts) - 检测链接是否合法
- [`getUrlQuery`](./src/tools/urlTools.ts) - 解析URL的查询参数
- [`getUrlPaths`](./src/tools/urlTools.ts) - 解析URL的路径部分
- [`getHostname`](./src/tools/urlTools.ts) - 获取URL的主机名
- [`getProtocol`](./src/tools/urlTools.ts) - 获取URL的协议

### 🎬 媒体API

- [`Recorder`](./src/webApi/Recorder.ts) - 音频录制
- [`Speaker`](./src/webApi/Speaker.ts) - 语音播放
- [`SpeakToTxt`](./src/webApi/SpeakToTxt.ts) - 语音转文字
- [`screenCAP`](./src/webApi/tools.ts) - 屏幕录制

### 📦 数据结构

- [`MinHeap`](./src/dataStructure/Heap.ts) - 最小堆实现
- [`MaxHeap`](./src/dataStructure/Heap.ts) - 最大堆实现
- [`LRUCache`](./src/dataStructure/LRUCache.ts) - LRU缓存实现

### 🔄 事件与插件

- [`EventBus`](./src/channel/EventBus.ts) - 消息订阅与派发
- [`Observer`](./src/channel/Observe.ts) - 观察者模式
- [`autoUpdate`](./src/plugins/autoUpdate.ts) - 检查页面更新

### 🎨 DOM与主题

- [`getCurTheme`](./src/tools/theme.ts) - 获取当前主题
- [`isDarkMode`](./src/tools/theme.ts) - 判断是否为暗色模式
- [`onChangeTheme`](./src/tools/theme.ts) - 监听主题变化
- [`bindWinEvent`](./src/tools/eventTools.ts) - 绑定window事件
- [`doubleKeyDown`](./src/tools/eventTools.ts) - 双击键盘事件

---

## 💼 使用示例

### 主题色自动适配

```ts
import { isDarkMode, onChangeTheme } from '@jl-org/tool'

/** 检查当前是否暗色模式 */
if (isDarkMode()) {
  applyDarkTheme()
}
else {
  applyLightTheme()
}

/** 监听系统主题变化 */
onChangeTheme(
  () => applyLightTheme(), // 切换到亮色时
  () => applyDarkTheme() // 切换到暗色时
)
```

### 图片压缩和调整大小

```ts
import { compressImg, resizeImg } from '@jl-org/tool'

async function processImage(file) {
  /** 压缩图片，转为webp格式 */
  const compressed = await compressImg(file, 'blob', 0.8, 'image/webp')

  /** 调整图片尺寸，保持比例 */
  const resized = await resizeImg(compressed, 800, 600)

  return resized
}
```

### 🔄 分时渲染调度器

类似 React 调度器，在浏览器空闲时执行任务，即使是千万级函数执行也不会卡顿！

```ts
import { scheduleTask } from '@jl-org/tool'

/** 处理大量任务而不阻塞主线程 */
const tasks = Array.from({ length: 10000 }, (_, i) => () =>
  Promise.resolve(heavyCalculation(i)))

scheduleTask(tasks).then((results) => {
  console.log('所有任务已完成!')
})
```

### 🎨 动画处理

类似 GSAP 的动画能力，但自动处理 CSS 单位

```ts
import { ATo } from '@jl-org/tool'

const aTo = new ATo()
aTo
  .start(
    div1.style,
    {
      left: '200px',
      top: '200px',
      opacity: '0.1'
    },
    1000
  )
  .next(
    div2.style,
    {
      translateX: '50vw',
      translateY: '300px',
    },
    2000,
    {
      transform: true,
      timeFunc: 'ease-in-out'
    }
  )
```

### 📡 自动重连的 WebSocket

```ts
import { WS } from '@jl-org/tool'

const socket = new WS({
  url: 'wss://example.com/socket',
  heartbeatInterval: 3000, // 每3秒发送一次心跳
})

socket.connect()
socket.send(JSON.stringify({ type: 'message', content: 'Hello!' }))
```

### 🖼️ 图片处理工具

```ts
import { compressImg, cutImg, resizeImg } from '@jl-org/tool'

/** 压缩图片 */
const compressed = await compressImg(imageEl, 'base64', 0.7)

/** 缩放图片 */
const resized = await resizeImg(imageEl, 800, 600)

/** 裁剪图片 */
const cropped = await cutImg(imageEl, { x: 10, y: 10, width: 200, height: 200 })
```

### 📊 事件总线

```ts
import { EventBus } from '@jl-org/tool'

const bus = new EventBus()

/** 订阅事件 */
bus.on('dataChange', (data) => {
  console.log('数据变化:', data)
})

/** 发送事件 */
bus.emit('dataChange', { value: 'new value' })

/** 一次性订阅 */
bus.once('singleEvent', () => {
  console.log('这个事件只触发一次')
})
```

### 🗄️ LRU缓存

```ts
import { LRUCache } from '@jl-org/tool'

/** 创建容量为100的LRU缓存 */
const cache = new LRUCache<string, any>(100)

/** 设置缓存 */
cache.set('user:1', { name: 'John', age: 30 })

/** 获取缓存，会自动更新使用顺序 */
const user = cache.get('user:1')
```

### ⏱️ 时钟与计时

```ts
import { Clock } from '@jl-org/tool'

/** 创建时钟实例 */
const clock = new Clock()

function animate() {
  /** 获取两帧之间的时间间隔 */
  console.log('帧间隔(秒):', clock.delta)
  console.log('帧间隔(毫秒):', clock.deltaMS)

  /** 获取经过的总时间 */
  console.log('总时间(秒):', clock.elapsed)

  requestAnimationFrame(animate)
}

animate()
```
