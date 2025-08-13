# 🛠️ @jl-org/tool

<div align="center">
  <a href="./README.en.md">English</a>
  <a href="./README.md">中文</a>
</div>

<br />

<div align="center">
  <img alt="npm-version" src="https://img.shields.io/npm/v/@jl-org/tool?color=red&logo=npm" />
  <img alt="npm-download" src="https://img.shields.io/npm/dm/@jl-org/tool?logo=npm" />
  <img alt="License" src="https://img.shields.io/npm/l/@jl-org/tool?color=blue" />
  <img alt="typescript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img alt="github" src="https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white" />
</div>

> Powerful and practical frontend utility library with zero dependencies, comprehensive types, and rich functionality

## ✨ Features

- 🚀 **High Performance**: Optimized algorithms and implementations, like time-slicing scheduler that handles millions of function calls without lag
- 📦 **Zero Dependencies**: No external library dependencies
- 📐 **Type Complete**: Comprehensive TypeScript type definitions
- 🧩 **Modular**: Tree-shakable imports to reduce bundle size
- 🔧 **Practical First**: Covers most common development scenarios
- 🌐 **Full Coverage**: From basic utilities to advanced features, everything included

## 📥 Installation

```bash
# npm
npm i @jl-org/tool

# pnpm
pnpm add @jl-org/tool

# yarn
yarn add @jl-org/tool
```

---

## 📚 Tool Categories

### 🧰 Common Utilities

| Function | Description |
|----------|-------------|
| [`uniqueId`](./src/tools/tools.ts) | Get auto-incrementing unique ID |
| [`deepClone`](./src/tools/tools.ts) | Deep clone with circular reference support |
| [`wait`](./src/tools/tools.ts) | Wait for specified time |
| [`throttle`](./src/tools/domTools.ts) | Throttle function |
| [`debounce`](./src/tools/domTools.ts) | Debounce function |
| [`once`](./src/tools/tools.ts) | Limit function call count |
| [`isPureNum`](./src/shared/is.ts) | Check if value can be converted to number |
| [`isStr`](./src/shared/is.ts) | Check if value is string |
| [`isObj`](./src/shared/is.ts) | Check if value is object |
| [`isXXX`](./src/shared/is.ts) | More type checks... |

### 📊 Array Processing

| Function | Description |
|----------|-------------|
| [`arrToTree`](./src/tools/arrTools.ts) | Convert flat array to tree structure |
| [`searchTreeData`](./src/tools/arrTools.ts) | Search in tree structure |
| [`binarySearch`](./src/tools/arrTools.ts) | Binary search |
| [`bfsFind`](./src/tools/arrTools.ts) | Breadth-first search |
| [`dfsFind`](./src/tools/arrTools.ts) | Depth-first search |
| [`groupBy`](./src/tools/arrTools.ts) | Group array elements |
| [`arrToChunk`](./src/tools/arrTools.ts) | Split array into chunks |

### 📆 Date Processing

- [`formatDate`](./src/tools/dateTools.ts) - Powerful date formatting
- [`timeGap`](./src/tools/dateTools.ts) - Get relative time like "1 minute ago"
- [`dayDiff`](./src/tools/dateTools.ts) - Calculate date difference in days
- [`getQuarter`](./src/tools/dateTools.ts) - Get quarter

### 🌈 Color Processing

- [`mixColor`](./src/tools/colorTools.ts) - Mix two colors
- [`lightenColor`](./src/tools/colorTools.ts) - Adjust color brightness
- [`colorAddOpacity`](./src/tools/colorTools.ts) - Add opacity to color
- [`getColorInfo`](./src/tools/colorTools.ts) - Extract RGBA values from color
- [`hexToRGB`](./src/tools/colorTools.ts) - Convert hex to RGB
- [`rgbToHex`](./src/tools/colorTools.ts) - Convert RGB to hex

### 🧮 Math Operations

- [`mapRange`](./src/math/mapRange.ts) - Map value from one range to another
- [`calcAspectRatio`](./src/math/ratio.ts) - Calculate aspect ratio based on area
- [`clamp`](./src/math/tools.ts) - Clamp value within range
- [`calcCoord`](./src/math/coord.ts) - Get coordinates based on radius and angle

### 🎨 Animation Processing

| Function/Class | Description |
|----------------|-------------|
| [`ATo`](./src/animation/ATo.ts) | Chainable, segmented animation execution |
| [`ScrollTrigger`](./src/animation/ScrollTrigger/ScrollTrigger.ts) | Scroll-triggered animation system for parallax and scroll effects |
| [`SmoothScroller`](./src/animation/ScrollTrigger/SmoothScroller.ts) | Smooth scrolling implementation with inertia |
| [`createAnimation`](./src/animation/createAnimation.ts) | Create basic animations |
| [`createAnimationByTime`](./src/animation/createAnimationByTime.ts) | Time-based animation creator supporting DOM elements and JS objects |

### 🕒 Clock & Progress

- [`Clock`](./src/tools/Clock.ts) - Timer for frame intervals and elapsed time
- [`FakeProgress`](./src/tools/FakeProgress.ts) - Simulate progress bar for unknown progress loading
- [`timer`](./src/tools/timer.ts) - Advanced setInterval replacement using requestAnimationFrame

### 🌐 Network Request Tools

- [`concurrentTask`](./src/net/concurrentTask.ts) - Execute async tasks concurrently
- [`retryTask`](./src/net/retryTask.ts) - Automatic retry on failure
- [`WS`](./src/net/WS.ts) - Auto-reconnecting WebSocket
- [`StreamJsonParser`](./src/tools/StreamJsonParser.ts) - Stream JSON parser for SSE

### 📄 File Processing

- [`downloadByData`](./src/fileTool/tools.ts) / [`downloadByUrl`](./src/fileTool/tools.ts) - Download files
- [`blobToBase64`](./src/fileTool/tools.ts) / [`base64ToBlob`](./src/fileTool/tools.ts) - Format conversion
- [`checkFileSize`](./src/fileTool/tools.ts) - Check file size
- [`FileChunker`](./src/fileTool/FileChunker.ts) - File chunking processor
- [`BinaryMetadataEncoder`](./src/fileTool/BinaryMetadataEncoder.ts) - Metadata and binary data encoding tool
- [`createStreamDownloader`](./src/fileTool/streamDownloader.ts) - Stream download (memory unlimited)
- [`getMimeType`](./src/fileTool/getMimeType.ts) - Get resource MIME type
- [`detectFileType`](./src/fileTool/fileType.ts) - Detect file type
- [`jsonToJsonl`](./src/fileTool/jsonl.ts) / [`jsonlToJson`](./src/fileTool/jsonl.ts) - Convert between JSON and JSONL formats
- [`readJsonlFile`](./src/fileTool/jsonl.ts) - Read JSONL file line by line
- [`appendToJsonlFile`](./src/fileTool/jsonl.ts) - Append JSON data to JSONL file
- [`mapJsonlFile`](./src/fileTool/jsonl.ts) / [`filterJsonlFile`](./src/fileTool/jsonl.ts) - Map and filter operations on JSONL files
- [`findWithJsonlFile`](./src/fileTool/jsonl.ts) / [`findIndexWithJsonlFile`](./src/fileTool/jsonl.ts) - Find data in JSONL files
- [`everyWithJsonlFile`](./src/fileTool/jsonl.ts) / [`someWithJsonlFile`](./src/fileTool/jsonl.ts) - Check if data in JSONL files meets conditions

### 🌍 URL Processing

- [`isValidUrl`](./src/tools/urlTools.ts) - Check if URL is valid
- [`getUrlQuery`](./src/tools/urlTools.ts) - Parse URL query parameters
- [`getUrlPaths`](./src/tools/urlTools.ts) - Parse URL path segments
- [`getHostname`](./src/tools/urlTools.ts) - Get URL hostname
- [`getProtocol`](./src/tools/urlTools.ts) - Get URL protocol

### 🎬 Media APIs

- [`Recorder`](./src/webApi/Recorder.ts) - Audio recording
- [`Speaker`](./src/webApi/Speaker.ts) - Speech playback
- [`SpeakToTxt`](./src/webApi/SpeakToTxt.ts) - Speech to text
- [`screenCAP`](./src/webApi/tools.ts) - Screen recording

### 📦 Data Structures

- [`MinHeap`](./src/dataStructure/Heap.ts) - Min heap implementation
- [`MaxHeap`](./src/dataStructure/Heap.ts) - Max heap implementation
- [`LRUCache`](./src/dataStructure/LRUCache.ts) - LRU cache implementation

### 🔄 Events & Plugins

- [`EventBus`](./src/channel/EventBus.ts) - Message subscription and dispatch
- [`Observer`](./src/channel/Observe.ts) - Observer pattern
- [`autoUpdate`](./src/plugins/autoUpdate.ts) - Check page updates

### 🎨 DOM & Theme

| Function | Description |
|----------|-------------|
| [`getCurTheme`](./src/tools/theme.ts) | Get current theme |
| [`isDarkMode`](./src/tools/theme.ts) | Check if dark mode |
| [`onChangeTheme`](./src/tools/theme.ts) | Listen to theme changes |
| [`bindWinEvent`](./src/tools/eventTools.ts) | Bind window events |
| [`doubleKeyDown`](./src/tools/eventTools.ts) | Double key press events |
| [`typewriterEffect`](./src/tools/typewriterEffect.ts) | Simulate typewriter effect |

---

## 💼 Usage Examples

### Theme Auto-Adaptation

```ts
import { isDarkMode, onChangeTheme } from '@jl-org/tool'

/** Check if currently in dark mode */
if (isDarkMode()) {
  applyDarkTheme()
}
else {
  applyLightTheme()
}

/** Listen to system theme changes */
onChangeTheme(
  () => applyLightTheme(), // Switch to light mode
  () => applyDarkTheme() // Switch to dark mode
)
```

### Image Compression and Resizing

```ts
import { compressImg, resizeImg } from '@jl-org/tool'

async function processImage(file) {
  /** Compress image to webp format */
  const compressed = await compressImg(file, 'blob', 0.8, 'image/webp')

  /** Resize image while maintaining aspect ratio */
  const resized = await resizeImg(compressed, 800, 600)

  return resized
}
```

### 🔄 Time-Slicing Scheduler

Similar to React's scheduler, executes tasks during browser idle time, handles millions of function calls without lag

```ts
import { scheduleTask } from '@jl-org/tool'

/** Process large amounts of tasks without blocking main thread */
const tasks = Array.from({ length: 10000 }, (_, i) => () =>
  Promise.resolve(heavyCalculation(i)))

scheduleTask(tasks).then((results) => {
  console.log('All tasks completed!')
})
```

### 🎨 Animation Processing

[View complete test cases](./test/__DOM_TEST__/createAnimationByTime.ts)

```ts
import { ATo, createAnimationByTime } from '@jl-org/tool'

/**
 * Transition to target style properties
 */
createAnimationByTime({
  target: document.querySelector('.yourSelector'),
  to: { x: 200, opacity: 0.3 },
  duration: 1000,
})

/**
 * Segmented processing with chaining
 * - First execute .yourSelector1 animation
 * - Then execute .yourSelector2 animation
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

### 📜 Scroll-Triggered Animations

Powerful scroll animation system, similar to GSAP's ScrollTrigger, for parallax effects and scroll progress indicators

```ts
import { ScrollTrigger } from '@jl-org/tool'

/**
 * Basic scroll-based animation example
 */
new ScrollTrigger({
  trigger: '.hero', // Element that controls progress
  targets: '.hero__img', // Elements to animate
  start: ['top', 'bottom'], // When .hero top hits viewport bottom
  end: ['bottom', 'top'], // When .hero bottom hits viewport top
  scrub: true, // Bind progress directly to scroll position

  smoothScroll: true, // Enable smooth scrolling
  props: [ // Styles from start to end values
    { scale: 1, opacity: 1 }, // Start state
    { scale: 1.3, opacity: 0 } // End state
  ],
})
```

#### ScrollTrigger Key Features

- 📏 **Declarative API** - Describe when elements enter viewport and what should happen
- 🔄 **Inertia Scrolling** - Combine with `SmoothScroller` for silky smooth scroll experience
- 🧩 **Composable** - Unlimited triggers, shared or independent scroll areas
- 🔍 **Debug Markers** - Optional start/end position visualization markers

#### Usage Notes

1. **One trigger per progress curve** - Need individual progress for each element? Create multiple trigger instances
2. **Relative positioning** - `['top', 'bottom']` means *element top* aligns with *viewport bottom* at progress 0
3. **Progress updates** - When `scrub=false`, trigger plays once on enter, reverses on leave (unless `once=true`)
4. **Dynamic content** - Call `ScrollTrigger.refreshAll()` after content height changes
5. **Performance optimization** - Avoid heavy DOM operations in `onUpdate` callbacks, cache query results

#### Multi-Section Parallax Example

[Complete parallax scrolling code](./test/__DOM_TEST__/ScrollTrigger.ts)

```ts
/** Create individual ScrollTrigger for each section */
document.querySelectorAll<HTMLElement>('section').forEach((sec, i) => {
  new ScrollTrigger({
    trigger: sec, // Key: Point trigger to this section
    targets: sec, // The section itself
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

### 📡 Auto-Reconnecting WebSocket

```ts
import { WS } from '@jl-org/tool'

const socket = new WS({
  url: 'wss://example.com/socket',
  heartbeatInterval: 3000, // Send heartbeat every 3 seconds
})

socket.connect()
socket.send(JSON.stringify({ type: 'message', content: 'Hello!' }))
```

### 🖼️ Image Processing Tools

```ts
import { compressImg, cutImg, resizeImg } from '@jl-org/tool'

/** Compress image */
const compressed = await compressImg(imageEl, 'base64', 0.7)

/** Resize image */
const resized = await resizeImg(imageEl, 800, 600)

/** Crop image */
const cropped = await cutImg(imageEl, { x: 10, y: 10, width: 200, height: 200 })
```

### 📊 Event Bus

EventBus provides strong type safety and supports multiple generic parameter types, including strings, enums, and object mapping types:

```ts
import { EventBus } from '@jl-org/tool'

// 1. Basic string type events (default)
const basicBus = new EventBus()

// 2. Enum type events (recommended for best type safety)
enum AppEvents {
  DataUpdate = 'data-update',
  UserLogin = 'user-login'
}
const enumBus = new EventBus<AppEvents>()

// 3. Object mapping type events (strictest type checking)
interface EventMap {
  'user-action': { action: string, userId: string }
  'data-loaded': { data: any[], timestamp: number }
}
const strictBus = new EventBus<EventMap>()

// Usage example
const bus = new EventBus({
  /**
   * ## Whether to trigger missed events
   * Events sent before 'on' listeners are registered will be stored and executed when listeners are added
   */
  triggerBefore: true
})

/** Subscribe to events */
bus.on('dataChange', (data) => {
  console.log('Data changed:', data)
})

/** Emit events */
bus.emit('dataChange', { value: 'new value' })

/** One-time subscription */
bus.once('singleEvent', () => {
  console.log('This event only triggers once')
})
```

#### Type Safety Advantages

1. **Compile-time checking** - TypeScript checks event names and parameter types at compile time
2. **Auto-completion** - IDE provides auto-completion for event names and parameters
3. **Refactoring safety** - When renaming event names, TypeScript ensures all references are updated
4. **Multiple modes** - Supports string, enum, and strict mapping type modes to fit different needs

### 📠 Typewriter Effect

[Complete code example](test/__DOM_TEST__/typewriterEffect.ts)

```ts
import { typewriterEffect } from '@jl-org/tool'

typewriterEffect({
  content: 'This is the text content to be displayed character by character...',
  speed: 50, // Typing speed (ms)
  onUpdate: (text) => {
    /** Apply updated text to your DOM element */
    document.getElementById('my-element').textContent = text
  },
})
```

### 🗄️ LRU Cache

```ts
import { LRUCache } from '@jl-org/tool'

/** Create LRU cache with capacity of 100 */
const cache = new LRUCache<string, any>(100)

/** Set cache */
cache.set('user:1', { name: 'John', age: 30 })

/** Get cache, automatically updates usage order */
const user = cache.get('user:1')
```

### 📊 Metadata and Binary Data Encoding

```ts
import { BinaryMetadataEncoder } from '@jl-org/tool'

/** Create metadata and binary data */
const metadata = { name: 'image.png', type: 'image/png', size: 1024 * 50 }
const binaryData = new Uint8Array([/* image data */]).buffer

/** Encode: Merge metadata and binary data into single ArrayBuffer */
const encoded = BinaryMetadataEncoder.encode(metadata, binaryData)

/** Decode: Extract metadata and original binary data */
const { metadata: extractedMeta, buffer: originalBuffer }
  = BinaryMetadataEncoder.decode<typeof metadata>(encoded)

console.log(extractedMeta) // { name: 'image.png', type: 'image/png', size: 51200 }
```

### ⏱️ Clock and Timing

```ts
import { Clock } from '@jl-org/tool'

/** Create clock instance */
const clock = new Clock()

function animate() {
  /** Get time interval between frames */
  console.log('Frame delta (seconds):', clock.delta)
  console.log('Frame delta (milliseconds):', clock.deltaMS)

  /** Get total elapsed time */
  console.log('Total time (seconds):', clock.elapsed)

  requestAnimationFrame(animate)
}

animate()
```
