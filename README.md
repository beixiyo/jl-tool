# 🛠️ @jl-org/tool

<div align="center">
  <a href="https://github.com/beixiyo/jl-tool/blob/master/README.en.md">English</a>
  <a href="https://github.com/beixiyo/jl-tool/blob/master/README.md">中文</a>
</div>

<br />

<div align="center">
  <img alt="npm-version" src="https://img.shields.io/npm/v/@jl-org/tool?color=red&logo=npm" />
  <img alt="npm-download" src="https://img.shields.io/npm/dm/@jl-org/tool?logo=npm" />
  <img alt="License" src="https://img.shields.io/npm/l/@jl-org/tool?color=blue" />
  <img alt="typescript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img alt="github" src="https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white" />
</div>

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
| [`uniqueId`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/tools.ts) | 获取自增唯一ID |
| [`deepClone`](https://github.com/beixiyo/jl-tool/blob/master/src/deep/deepClone.ts) | 深拷贝，支持循环引用 |
| [`deepMerge`](https://github.com/beixiyo/jl-tool/blob/master/src/deep/deepMerge.ts) | 深度合并对象，保留目标对象未包含的属性 |
| [`deepCompare`](https://github.com/beixiyo/jl-tool/blob/master/src/deep/deepCompare.ts) | 深度比较两个对象是否相等，支持自定义比较规则和忽略属性 |
| [`wait`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/tools.ts) | 等待指定时间 |
| [`throttle`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/domTools.ts) | 节流函数 |
| [`debounce`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/domTools.ts) | 防抖函数 |
| [`once`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/tools.ts) | 限制函数调用次数 |
| [`isPureNum`](https://github.com/beixiyo/jl-tool/blob/master/src/shared/is.ts) | 判断是否能强转成数字 |
| [`isStr`](https://github.com/beixiyo/jl-tool/blob/master/src/shared/is.ts) | 判断是否为字符串 |
| [`isObj`](https://github.com/beixiyo/jl-tool/blob/master/src/shared/is.ts) | 判断是否为对象 |
| [`isXXX`](https://github.com/beixiyo/jl-tool/blob/master/src/shared/is.ts) | 更多判断... |
| [`parseMDCode`](https://github.com/beixiyo/jl-tool/blob/master/src/markdown/parseCode.ts) | 解析 markdown 中的代码块 |

### 📊 数组处理

| 函数 | 说明 |
|------|------|
| [`arrToTree`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/arrTools.ts) | 扁平数组转树形结构 |
| [`searchTreeData`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/arrTools.ts) | 树形结构搜索 |
| [`binarySearch`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/arrTools.ts) | 二分查找 |
| [`bfsFind`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/arrTools.ts) | 广度优先遍历 |
| [`dfsFind`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/arrTools.ts) | 深度优先遍历 |
| [`groupBy`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/arrTools.ts) | 数组分组 |
| [`arrToChunk`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/arrTools.ts) | 数组分块 |

### 📆 日期处理

- [`formatDate`](https://github.com/beixiyo/jl-tool/blob/master/src/date/dateTools.ts) - 强大的日期格式化
- [`formatTimeFromNow`](https://github.com/beixiyo/jl-tool/blob/master/src/date/formatTimeFromNow.ts) - 获取类似"1分钟前"的相对时间
- [`dayDiff`](https://github.com/beixiyo/jl-tool/blob/master/src/date/dateTools.ts) - 计算日期差值，单位(天)
- [`getQuarter`](https://github.com/beixiyo/jl-tool/blob/master/src/date/dateTools.ts) - 获取季度

### 🌈 颜色处理

- [`mixColor`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/colorTools.ts) - 混合两种颜色
- [`lightenColor`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/colorTools.ts) - 调整颜色明度
- [`colorAddOpacity`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/colorTools.ts) - 添加透明度
- [`getColorInfo`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/colorTools.ts) - 提取颜色的RGBA值
- [`hexToRGB`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/colorTools.ts) - 十六进制转RGB
- [`rgbToHex`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/colorTools.ts) - RGB转十六进制

### 🧮 数学运算

- [`mapRange`](https://github.com/beixiyo/jl-tool/blob/master/src/math/mapRange.ts) - 将数值从一个范围映射到另一个范围
- [`calcAspectRatio`](https://github.com/beixiyo/jl-tool/blob/master/src/math/ratio.ts) - 根据面积计算宽高比
- [`clamp`](https://github.com/beixiyo/jl-tool/blob/master/src/math/tools.ts) - 限制值在指定范围内
- [`numFixed`](https://github.com/beixiyo/jl-tool/blob/master/src/math/tools.ts) - 解决 Number.toFixed 计算错误，精确四舍五入
- [`formatFileSize`](https://github.com/beixiyo/jl-tool/blob/master/src/math/tools.ts) - 文件大小单位换算，支持 bit/byte/kb/mb/gb/tb 互相转换，返回包含各单位数值的对象
- [`formatDuration`](https://github.com/beixiyo/jl-tool/blob/master/src/math/tools.ts) - 格式化时长（秒转 MM:SS 格式），支持小数秒
- [`calcCoord`](https://github.com/beixiyo/jl-tool/blob/master/src/math/coord.ts) - 根据半径和角度获取坐标

### 🎨 动画处理

| 函数/类 | 说明 |
|------|------|
| [`ATo`](https://github.com/beixiyo/jl-tool/blob/master/src/animation/ATo.ts) | 链式调用，分段执行动画 |
| [`ScrollTrigger`](https://github.com/beixiyo/jl-tool/blob/master/src/animation/ScrollTrigger/ScrollTrigger.ts) | 滚动触发动画系统，实现视差等滚动动画效果 |
| [`SmoothScroller`](https://github.com/beixiyo/jl-tool/blob/master/src/animation/ScrollTrigger/SmoothScroller.ts) | 平滑滚动实现，提供惯性滚动体验 |
| [`createAnimation`](https://github.com/beixiyo/jl-tool/blob/master/src/animation/createAnimation.ts) | 创建基础动画 |
| [`createAnimationByTime`](https://github.com/beixiyo/jl-tool/blob/master/src/animation/createAnimationByTime.ts) | 基于时间的动画创建器，支持对 DOM 元素和普通 JS 对象的属性进行补间动画 |

### 🕒 时钟与进度

- [`Clock`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/Clock.ts) - 计时器，获取帧间隔、累计时间等
- [`FakeProgress`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/FakeProgress.ts) - 模拟进度条，适用于未知进度的加载
- [`timer`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/timer.ts) - 高级setInterval替代，使用requestAnimationFrame实现

### 🌐 网络请求工具

- [`concurrentTask`](https://github.com/beixiyo/jl-tool/blob/master/src/net/concurrentTask.ts) - 并发执行异步任务
- [`retryTask`](https://github.com/beixiyo/jl-tool/blob/master/src/net/retryTask.ts) - 失败后自动重试
- [`WS`](https://github.com/beixiyo/jl-tool/blob/master/src/net/WS.ts) - 自动重连的WebSocket

### 📊 数据解析
- [`StreamJsonParser`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/StreamJsonParser.ts) - 流式解析JSON，适用于SSE
- [`StreamSingleXmlParser`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/StreamSingleXmlParser.ts) - 流式解析单层 XML，适用于 AI 结构化流式输出

### 📄 文件处理

- [`downloadByData`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/tools.ts) / [`downloadByUrl`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/tools.ts) - 下载文件
- [`blobToBase64`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/tools.ts) / [`base64ToBlob`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/tools.ts) - 格式转换
- [`checkFileSize`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/tools.ts) - 检查文件大小
- [`convertToWav`](https://github.com/beixiyo/jl-tool/blob/master/src/convert/audioToWav.ts) - 将 MediaRecorder/WebM/OGG 音频转换成 WAV，支持重采样和声道混合
- [`FileChunker`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/FileChunker.ts) - 文件分块处理器
- [`BinaryMetadataEncoder`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/BinaryMetadataEncoder.ts) - 元数据与二进制数据混合编码工具
- [`createStreamDownloader`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/streamDownloader.ts) - 流式下载（无内存限制）
- [`getMimeType`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/getMimeType.ts) - 获取资源的MIME类型
- [`detectFileType`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/fileType.ts) - 检测文件类型
- [`jsonToJsonl`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/jsonl.ts) / [`jsonlToJson`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/jsonl.ts) - JSON与JSONL格式转换
- [`readJsonlFile`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/jsonl.ts) - 逐行读取JSONL文件
- [`appendToJsonlFile`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/jsonl.ts) - 追加JSON数据到JSONL文件
- [`mapJsonlFile`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/jsonl.ts) / [`filterJsonlFile`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/jsonl.ts) - 对JSONL文件进行映射和过滤操作
- [`findWithJsonlFile`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/jsonl.ts) / [`findIndexWithJsonlFile`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/jsonl.ts) - 在JSONL文件中查找数据
- [`everyWithJsonlFile`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/jsonl.ts) / [`someWithJsonlFile`](https://github.com/beixiyo/jl-tool/blob/master/src/fileTool/jsonl.ts) - 检查JSONL文件中数据是否满足条件

### 🌍 URL处理

- [`isValidUrl`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/urlTools.ts) - 检测链接是否合法
- [`getUrlQuery`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/urlTools.ts) - 解析URL的查询参数
- [`getUrlPaths`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/urlTools.ts) - 解析URL的路径部分
- [`getHostname`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/urlTools.ts) - 获取URL的主机名
- [`getProtocol`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/urlTools.ts) - 获取URL的协议

### 🎬 媒体API

- [`Recorder`](https://github.com/beixiyo/jl-tool/blob/master/src/webApi/Recorder.ts) - 音频录制
- [`Speaker`](https://github.com/beixiyo/jl-tool/blob/master/src/webApi/Speaker.ts) - 语音播放
- [`SpeakToTxt`](https://github.com/beixiyo/jl-tool/blob/master/src/webApi/SpeakToTxt.ts) - 语音转文字
- [`openCamera`](https://github.com/beixiyo/jl-tool/blob/master/src/webApi/openCamera.ts) - 开启摄像头
- [`ScreenRecorder`](https://github.com/beixiyo/jl-tool/blob/master/src/webApi/screenRecord/ScreenRecorder.ts) - 屏幕录制

[查看测试用例](https://github.com/beixiyo/jl-tool/blob/master/test/__DOM_TEST__/webApi)

### 📦 数据结构

- [`MinHeap`](https://github.com/beixiyo/jl-tool/blob/master/src/dataStructure/Heap.ts) - 最小堆实现
- [`MaxHeap`](https://github.com/beixiyo/jl-tool/blob/master/src/dataStructure/Heap.ts) - 最大堆实现
- [`LRUCache`](https://github.com/beixiyo/jl-tool/blob/master/src/dataStructure/LRUCache.ts) - LRU缓存实现

### 🔄 事件与插件

- [`EventBus`](https://github.com/beixiyo/jl-tool/blob/master/src/channel/EventBus.ts) - 消息订阅与派发
- [`Observer`](https://github.com/beixiyo/jl-tool/blob/master/src/channel/Observe.ts) - 观察者模式
- [`autoUpdate`](https://github.com/beixiyo/jl-tool/blob/master/src/plugins/autoUpdate.ts) - 检查页面更新

### 🎨 DOM与主题

| 函数 | 说明 |
|------|------|
| [`getCurTheme`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/theme.ts) | 获取当前主题 |
| [`isDarkMode`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/theme.ts) | 判断是否为暗色模式 |
| [`onChangeTheme`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/theme.ts) | 监听主题变化 |
| [`bindWinEvent`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/eventTools.ts) | 绑定window事件 |
| [`doubleKeyDown`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/eventTools.ts) | 双击键盘事件 |
| [`typewriterEffect`](https://github.com/beixiyo/jl-tool/blob/master/src/tools/typewriterEffect.ts) | 模拟打字机效果 |

### 🔧 环境变量管理 (Node.js)

| 函数 | 说明 |
|------|------|
| [`loadEnv`](https://github.com/beixiyo/jl-tool/blob/master/node/env/loadEnv.ts) | 加载环境变量文件，支持多环境自动切换 |
| [`getEnv`](https://github.com/beixiyo/jl-tool/blob/master/node/env/getEnv.ts) | 读取环境变量，支持默认值和必需检查 |

---

## 💼 使用示例

### 深度操作（深拷贝、深度合并、深度比较）

```ts
import { deepClone, deepMerge, deepCompare } from '@jl-org/tool'

/** 深拷贝对象 */
const obj = { a: 1, b: { c: 2 } }
const cloned = deepClone(obj)
cloned.b.c = 3
console.log(obj.b.c) // 2 - 原对象未改变

/** 深度合并对象 */
const target = { a: 1, b: { c: 2, d: 3 } }
const source = { b: { c: 4 } }
const merged = deepMerge(target, source)
console.log(merged) // { a: 1, b: { c: 4, d: 3 } }

/** 深度比较对象 */
const obj1 = { user: { name: 'Alice', age: 30 }, tags: ['work', 'urgent'] }
const obj2 = { user: { name: 'Alice', age: 30 }, tags: ['work', 'urgent'] }
deepCompare(obj1, obj2) // true

/** 使用自定义比较规则 */
deepCompare(
  { value: 'hello' },
  { value: 'HELLO' },
  {
    customComparers: {
      string: (a, b) => a.toLowerCase() === b.toLowerCase()
    }
  }
) // true（忽略大小写）

/** 忽略指定属性 */
deepCompare(
  { name: 'Alice', id: 1, timestamp: Date.now() },
  { name: 'Alice', id: 2, timestamp: Date.now() + 1000 },
  { ignores: ['id', 'timestamp'] }
) // true（忽略 id 和 timestamp）
```

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

### 🎧 WebM 音频转换为 WAV

```ts
import { convertToWav } from '@jl-org/tool'

async function toWav(webmBlob: Blob) {
  const wavBlob = await convertToWav(webmBlob, {
    sampleRate: 16000, // 语音识别常用采样率
    channels: 1, // 混合为单声道
  })

  return URL.createObjectURL(wavBlob)
}
```

> `convertToWav` 基于浏览器的 `AudioContext`，可在录音结束后立即完成重采样与格式化，避免后端再做二次处理。

### 🔄 分时渲染调度器

类似 React 调度器，在浏览器空闲时执行任务，即使是千万级函数执行也不会卡顿

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

[查看完整测试用例](https://github.com/beixiyo/jl-tool/blob/master/test/__DOM_TEST__/createAnimationByTime.ts)

```ts
import { ATo, createAnimationByTime } from '@jl-org/tool'

/**
 * 过渡到 to 的样式属性
 */
createAnimationByTime({
  target: document.querySelector('.yourSelector'),
  to: { x: 200, opacity: 0.3 },
  duration: 1000,
})

/**
 * 分段处理，链式调用
 * - 先执行 .yourSelector1 的动画
 * - 再执行 .yourSelector2 的动画
 */
const ato = new ATo()
ato
  .start({
    target: document.querySelector('.yourSelector1'),
    to: { x: 100, rotate: 360 },
    duration: 1000,
    ease: 'easeInOut',
  })
  .next({
    target: document.querySelector('.yourSelector2'),
    to: { x: 250, scale: 1.2, rotate: -360 },
    duration: 1000,
    ease: 'easeInOut',
  })
```

### 📜 滚动触发动画

强大的滚动动画系统，类似GSAP的ScrollTrigger，实现视差效果、滚动进度指示器等

```ts
import { ScrollTrigger } from '@jl-org/tool'

/**
 * 基于滚动的动画基础示例
 */
new ScrollTrigger({
  trigger: '.hero', // 控制进度的元素
  targets: '.hero__img', // 要动画的元素
  start: ['top', 'bottom'], // 当.hero顶部碰到视口底部时
  end: ['bottom', 'top'], // 当.hero底部碰到视口顶部时
  scrub: true, // 将进度直接绑定到滚动位置

  smoothScroll: true, // 启用平滑滚动
  props: [ // 从起始值到结束值的样式
    { scale: 1, opacity: 1 }, // 开始状态
    { scale: 1.3, opacity: 0 } // 结束状态
  ],
})
```

#### ScrollTrigger 主要特性

- 📏 **声明式API** - 描述元素何时进入视口以及应该发生什么
- 🔄 **惯性滚动** - 与`SmoothScroller`结合实现丝滑的滚动体验
- 🧩 **可组合** - 无限触发器，共享或独立的滚动区域
- 🔍 **调试标记** - 可选的开始/结束位置可视化标记

#### 使用注意事项

1. **一个触发器对应一个进度曲线** - 需要每个元素单独的进度？创建多个触发器实例
2. **相对位置** - `['top', 'bottom']`表示*元素顶部*对齐*视口底部*时进度为0
3. **进度更新** - 当`scrub=false`时，触发器在进入时播放一次，离开时反向（除非`once=true`）
4. **动态内容** - 内容高度动态变化后记得调用`ScrollTrigger.refreshAll()`
5. **性能优化** - 避免在`onUpdate`回调中进行繁重的DOM操作，尽量缓存查询结果

#### 多区域视差效果示例

[视差滚动完整代码](https://github.com/beixiyo/jl-tool/blob/master/test/__DOM_TEST__/ScrollTrigger.ts)

```ts
/** 为每一个 section 单独创建 ScrollTrigger */
document.querySelectorAll<HTMLElement>('section').forEach((sec, i) => {
  new ScrollTrigger({
    trigger: sec, // 关键：把 trigger 指向该 section
    targets: sec, // 该 section 自己
    scrub: true,
    smoothScroll: true,
    start: ['top', 'bottom'],
    end: ['bottom', 'top'],
    props: [
      { backgroundPositionY: `-${height / 2}px` },
      { backgroundPositionY: `${height / 2}px` },
    ],
  })
})
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

### 📊 事件系统

EventBus 提供了强大的类型安全性，支持多种泛型参数类型，包括字符串、枚举和对象映射类型：

```ts
import { EventBus } from '@jl-org/tool'

// 1. 基础字符串类型事件（默认）
const basicBus = new EventBus()

// 2. 枚举类型事件（推荐，提供最佳类型安全性）
enum AppEvents {
  DataUpdate = 'data-update',
  UserLogin = 'user-login'
}
const enumBus = new EventBus<AppEvents>()

// 3. 对象映射类型事件（最严格的类型检查）
interface EventMap {
  'user-action': { action: string, userId: string }
  'data-loaded': { data: any[], timestamp: number }
}
const strictBus = new EventBus<EventMap>()

/** 使用示例 */
const bus = new EventBus({
  /**
   * ## 是否触发遗漏的事件
   * 当尚未 on 监听事件前发送的事件，会存起来会在监听时执行
   */
  triggerBefore: true
})

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

#### 类型安全性优势

1. **编译时检查** - TypeScript 会在编译时检查事件名称和参数类型
2. **自动补全** - IDE 会提供事件名称和参数的自动补全
3. **重构安全** - 重命名事件名称时，TypeScript 会确保所有引用都被更新
4. **多种模式** - 支持字符串、枚举和严格映射三种类型模式，适应不同需求

### 📠 模拟打字机效果

[完整代码示例](https://github.com/beixiyo/jl-tool/blob/master/test/__DOM_TEST__/typewriterEffect.ts)

```ts
import { typewriterEffect } from '@jl-org/tool'

typewriterEffect({
  content: '这是将要逐字显示的文本内容...',
  speed: 50, // 打字速度 (ms)
  onUpdate: (text) => {
    /** 将更新后的文本应用到你的DOM元素上 */
    document.getElementById('my-element').textContent = text
  },
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

### 📊 元数据与二进制混合编码

```ts
import { BinaryMetadataEncoder } from '@jl-org/tool'

/** 创建元数据和二进制数据 */
const metadata = { name: 'image.png', type: 'image/png', size: 1024 * 50 }
const binaryData = new Uint8Array([/* 图片数据 */]).buffer

/** 编码：合并元数据和二进制数据为单一 ArrayBuffer */
const encoded = BinaryMetadataEncoder.encode(metadata, binaryData)

/** 解码：提取元数据和原始二进制数据 */
const { metadata: extractedMeta, buffer: originalBuffer }
  = BinaryMetadataEncoder.decode<typeof metadata>(encoded)

console.log(extractedMeta) // { name: 'image.png', type: 'image/png', size: 51200 }
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

### And more ...