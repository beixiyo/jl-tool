# 介绍

*TypeScript* 编写的工具函数

支持 `ESM` | `CommonJS` | `iife`

**iife** 模式下，全局导出一个 `_jl` 对象

---


## 安装
```bash
npm i @jl-org/tool
```

---


## 文档地址

- https://beixiyo.github.io/

其实不如看 *VSCode* 的代码提示方便  

**鼠标悬浮在变量上即可查看，几乎所有地方我都写了文档注释**

所有类型，**你都能在文档注释看到说明**

---


## 工具目录

- [各种常用工具](#各种常用工具)
- [数学运算，如数值映射、坐标计算、比例计算](#数学运算)
- [网络请求工具，如最大并发、自动重试、自动重连的 Websocket 等](#网络请求工具)
<br />

- [数组处理，如扁平数组转树、树搜索...](#数组处理)
- [颜色处理](#颜色处理)
- [日期处理](#日期处理)
- [时钟，如获取帧间隔、过去时间...](#时钟)
<br />

- [DOM，如节流、防抖、CSS单位处理...](#dom)
- [事件工具，如主题变化、双击键盘事件、全屏...](#事件工具)
- [资源预加载，提高页面加载速度](#资源预加载)
- [禁止调试](#禁止调试)
<br />

- [文件处理，如 Base64 和 Blob 互转、下载文件...](#文件处理)
<br />

- [分时渲染函数，再多函数也不卡顿](#分时渲染函数)
- [Media API，如录屏、录音、文字语音互转...](#media-api)
- [一些数据结构，如：最小堆、LRU缓存](#数据结构)
<br />

- [动画处理，类似 GSAP，但是会自动处理 CSS 单位](#动画处理)
- [虚假进度条](#虚假进度条)
<br />

- [事件分发，如消息订阅、观察者模式](#事件分发)
<br />

- [*is* 判断](#is-判断)
<br />

- [canvas，可以压缩图片，裁剪缩放图片...](#canvas)
- [*Web* 小插件，如：客户端同步服务器更新](#web-小插件)
- [常用常量，如角度、正则表达式...](#常量)


## 各种常用工具
```ts
/**
 * 获取自增唯一 ID
 */
export declare const uniqueId: () => number;

/** 获取类型 */
export declare const getType: (data: any) => string;

/** 随机长度为`10`的字符串 */
export declare const randomStr: () => string;

/** 摄氏度转华氏度 */
export declare const celsiusToFahrenheit: (celsius: number) => number;

/** 华氏度转摄氏度 */
export declare const fahrenheitToCelsius: (fahrenheit: number) => number;

/**
 * 获取随机范围数值，不包含最大值
 * @param min 最小值
 * @param max 最大值
 * @param enableFloat 是否返回浮点数，默认 false
 */
export declare function getRandomNum(min: number, max: number, enableFloat?: boolean): number;

/** 深拷贝 */
export declare function deepClone<T>(data: T, map?: WeakMap<WeakKey, any>): T;

/**
 * 深度比较对象 `Map | Set` 无法使用
 * 支持循环引用比较
 */
export declare function deepCompare(o1: any, o2: any, seen?: WeakMap<WeakKey, any>): boolean;

/**
 * - 截取字符串，默认补 `...` 到后面
 * - 如果长度小于等于 `placeholder` 补充字符串的长度，则直接截取
 * @param str 字符串
 * @param len 需要截取的长度
 * @param placeholder 补在后面的字符串，默认`...`
 */
export declare function cutStr(str: string, len: number, placeholder?: string): string;

/**
 * - 把对象的空值转为指定字符串，默认 `--`，返回一个对象
 * - 空值包含 **空字符串、空格、null、undefined**
 * - 默认不包含数值 0，可通过配置修改
 *
 * @param data 需要转换的对象
 */
export declare function padEmptyObj<T extends object>(data: T, config?: {
    /** 要填补的字符串，默认 -- */
    padStr?: string;
    /** 忽略数字 0，默认 true */
    ignoreNum?: boolean;
}): T;

/**
 * 蛇形转驼峰 也可以指定转换其他的
 *
 * @example
 * ```ts
 * toCamel('test_a') => 'testA'
 * toCamel('test/a', '/') => 'testA'
 * ```
 *
 * @param key 需要转换的字符串
 * @param replaceStr 默认是 `_`，也就是蛇形转驼峰
 */
export declare function toCamel(key: string, replaceStr?: string): string;

/** 柯里化 */
export declare function curry(): any;

/**
 * 数字补齐精度
 * @param num 数字
 * @param precision 精度长度，默认 `2`
 * @param placeholder 补齐内容，默认 `0`
 * @returns 数字字符串
 *
 * @example
 * ```ts
 * padNum(1) => '1.00'
 * padNum(1, 3) => '1.000')
 * padNum(1, 3, '1') => '1.111'
 * ```
 */
export declare function padNum(num: string | number, precision?: number, placeholder?: string): string;

/**
 * 解决 Number.toFixed 计算错误
 * @example
 * ```ts
 * 1.335.toFixed(2) => '1.33'
 * numFixed(1.335) => 1.34
 * ```
 *
 * @param num 数值
 * @param precision 精度，默认 2
 */
export declare function numFixed(num: number | string, precision?: number): number;

/**
 * 生成 iconfont 的类名
 * @param name icon 名字
 * @param prefix 前缀默认 iconfont
 * @param suffix 后缀默认 icon
 * @param connector 连接符默认 -
 * @returns iconfont icon-${name}
 */
export declare function genIcon(name: string, prefix?: string, suffix?: string, connector?: string): string;

/**
 * - 提取值在 extractArr 中的元素，返回一个对象
 * - 例如提取对象中所有空字符串
 *
 * @example
 * ```ts
 * filterVals(data, [''])
 * ```
 * @param data 一个对象
 * @param extractArr 提取的值
 */
export declare function filterVals<T>(data: T, extractArr: any[]): Partial<T>;

/**
 * - 排除值在 excludeArr 中的元素，返回一个对象
 * - 例如排除对象中所有空字符串
 *
 * @example
 * ```ts
 * excludeVals(data, [''])
 * ```
 * @param data 一个对象
 * @param excludeArr 排除的值
 */
export declare function excludeVals<T extends object>(data: T, excludeArr: any[]): Partial<T>;

/**
 * - 从 `keys` 数组中提取属性，返回一个对象
 * - 例如：从对象中提取 `name` 属性，返回一个对象
 * @example
 * ```ts
 * filterKeys(data, ['name'])
 * ```
 * @param data 目标对象
 * @param keys 需要提取的属性
 */
export declare function filterKeys<T extends object, K extends keyof T>(data: T, keys: K[]): Pick<T, Extract<keyof T, K>>;

/**
 * - 从 `keys` 数组中排除属性，返回一个对象
 * - 例如：从对象中排除 `name` 属性，返回一个对象
 * @example
 * ```ts
 * excludeKeys(data, ['name'])
 * ```
 * @param data 目标对象
 * @param keys 需要提取的属性
 */
export declare function excludeKeys<T extends object, K extends keyof T>(data: T, keys: K[]): Omit<T, Extract<keyof T, K>>;

/**
 * 等待指定时间后返回 Promise
 *
 * @example
 * ```ts
 * await wait(2000)
 * ```
 *
 * @param durationMS 等待时间，默认 1000 毫秒
 */
export declare function wait(durationMS?: number): Promise<unknown>;

/**
 * setInterval 替代，用 requestAnimationFrame 实现
 * @returns 停止函数
 */
export declare function timer(fn: (elapsedMS: number) => any, durationMS: number): () => void;

```

---


## 数学运算
```ts
/**
 * 根据半径和角度获取 DOM 坐标
 * @param r 半径
 * @param deg 角度
 */
export declare function calcCoord(r: number, deg: number): readonly [number, number];

/**
 * 将数值从一个范围映射到另一个范围，支持反向映射
 *
 * @example
 * ```ts
 * // 反向映射，输出 50
 * mapRange(0, {
 *   input: [0, 50],
 *   output: [50, 0]
 * })
 *
 * // 正向映射，输出 190
 * mapRange(10, {
 *   input: [0, 100],
 *   output: [100, 1000]
 * })
 * ```
 *
 * @param value 要映射的值
 * @param range 输入和输出范围
 * @param options 配置选项
 * @returns 映射后的值
 */
export declare function mapRange(value: number, range: Range, options?: MapRangeOptions): number;

/**
 * 创建一个可重用的映射函数
 * @param range 输入和输出范围
 * @param options 配置选项
 * @returns 映射函数
 */
export declare function createMapRange(range: Range, options?: MapRangeOptions): (value: number) => number;

/**
 * 根据总面积、宽高计算宽高
 * @param totalArea 期望的总面积，宽 * 高
 * @param aspectRatio 宽高比元组
 * @param options 可选最大范围限制、是否需要被指定数值整除
 * @returns 计算出的 [宽度, 高度]
 */
export declare function calcAspectRatio(totalArea: number, aspectRatio: [number, number], options?: AspectRatioOpts): [number, number];
```


---


## 网络请求工具
```ts
/**
 * 失败后自动重试请求
 * @param task 任务数组
 * @param maxCount 重试次数，默认 3
 */
export declare function retryReq<T>(task: () => Promise<T>, maxCount?: number): Promise<T>;

/**
 * 并发任务数组 完成最大并发数后才会继续
 * @param tasks 任务数组
 * @param maxCount 最大并发数，默认 4
 */
export declare function concurrentTask<T>(tasks: (() => Promise<T>)[], maxCount?: number): Promise<T[]>;

/**
 * 根据网络状态自动重连的，自动发送心跳数据的 WebSocket
 */
export declare class WS {
    constructor(opts: WSOpts);
    /**
     * socket.readyState === WebSocket.OPEN
     */
    get isConnected(): boolean;
    /**
     * socket.readyState === WebSocket.CONNECTING
     */
    get isConnecting(): boolean;
    /**
     * socket.readyState === WebSocket.CLOSING
     */
    get isClose(): boolean;
    /**
     * 网络状态是否离线，!window.navigator.onLine
     */
    get isOffline(): boolean;
    send(message: Parameters<WebSocket['send']>[0]): void;
    connect(): void;
    close(): void;
}
```

---


## 数组处理
```ts
/**
 * 计算分页的当前数据
 * @param arr 全部数据的数组
 * @param curPage 当前页
 * @param pageSize 一页大小，默认 20
 */
export declare function getPageData<T>(arr: T[], curPage: number, pageSize?: number): T[];

/**
 * 对数组求和
 * @param handler 可以对数组每一项进行操作，返回值将会被相加
 */
export declare function getSum<T>(arr: T[], handler?: (item: T) => number): number;

/**
 * - 给定一个数组，根据 key 进行分组
 * - 分组内容默认放入数组中，你也可以指定为 `'+' | '-' | '*' | '/' | '**'` 进行相应的操作
 * - 你也可以把整个对象进行分组（设置 `operateKey` 为 `null`），他会把整个对象放入数组。而不是进行 加减乘除 等操作
 *
 * @example
 * ```ts
 * const input = [{ type: 'chinese', score: 10 }, { type: 'chinese', score: 100 }]
 * groupBy(input, 'type', 'score') => [{ type: 'chinese', score: [10, 100] }]
 * groupBy(input, 'type', null) => [ { type: 'chinese', children: [{ ... }] }, ... ]
 * ```
 *
 * @param data 要分组的数组
 * @param key 要进行分组的 **键**
 * @param operateKey 要操作的 **键**，填 `null` 则对整个对象进行分组，并且会把 `action` 设置为 `arr`
 * @param action 操作行为，默认放入数组，你也可以进行相应的操作，`'+'` 为加法，`'-'` 为减法，`'*'` 为乘法，`'/'` 为除法，`'**'` 为乘方
 * @param enableParseFloat 默认 false，当你指定 action 为数值操作时，是否使用 parseFloat，这会把 '10px' 也当成数字
 * @param enableDeepClone 是否深拷贝，默认 false
 */
export declare function groupBy<T extends Record<BaseKey, any>>(data: T[], key: keyof T, operateKey: null | (keyof T), action?: 'arr' | '+' | '-' | '*' | '/' | '**', enableParseFloat?: boolean, enableDeepClone?: boolean): any[];

/**
 * 扁平数组转递归树
 * @example
 * ```ts
 * const arr = [
 *     { id: 1, name: '部门1', pid: 0 },
 *     { id: 2, name: '部门2', pid: 1 },
 *     { id: 3, name: '部门3', pid: 1 },
 *     { id: 4, name: '部门4', pid: 3 },
 *     { id: 5, name: '部门5', pid: 4 },
 *     { id: 6, name: '部门6', pid: 1 },
 * ]
 * const treeData = arrToTree(arr)
 * ```
 */
export declare function arrToTree<T extends Record<string, any>>(arr: T[], options?: ArrToTreeOpts<T>): TreeData<T>;

/**
 * 树形结构搜索
 * @param keyword 搜索关键字
 * @param data 数据
 * @param opts 配置项，包含搜索字段和是否忽略大小写
 */
export declare function searchTreeData<T extends {
    children?: T[];
}>(keyword: string, data: T[], opts?: SearchOpts): T[];

/**
 * 把数组分成 n 块，空数组直接返回，其他情况均返回二维数组
 * @param arr 数组
 * @param size 每个数组大小
 * @returns 返回二维数组
 */
export declare function arrToChunk<T>(arr: T[], size: number): T[][];

/**
 * 二分查找，必须是正序的数组
 * @param arr 数组
 * @param value 目标值
 * @param getValFn 获取目标值的函数，可以从对象中取值
 * @returns 索引，找不到返回 -1
 */
export declare function binarySearch<T>(arr: T[], value: number, getValFn?: (item: T) => number): number;

/**
 * 广度遍历
 */
export declare function bfsFind<T extends TreeNode>(arr: T[], condition: (value: T) => boolean): T | null;

/**
 * 深度遍历
 */
export declare function dfsFind<T extends TreeNode>(arr: T[], condition: (value: T) => boolean): T | null;

/**
 * 生成一个指定大小的类型化数组，默认 `Float32Array`，并用指定的生成函数填充
 * @param size 数组的长度
 * @param genVal 一个生成数值的函数，用于填充数组
 * @param ArrayFn 填充数组的构造函数，默认 `Float32Array`
 * @returns 返回一个填充了指定生成函数数值的数组
 */
export declare function genTypedArr<T extends AllTypedArrConstructor = Float32ArrayConstructor>(size: number, genVal: (index: number) => number, ArrayFn?: T): ArrReturnType<T>;

/**
 * 生成一个指定大小的数组，并用指定的生成函数填充
 * @param size 数组的长度
 * @param genVal 一个生成数值的函数，用于填充数组
 */
export declare function genArr<V>(size: number, genVal: (index: number) => V): V[];

/**
 * 比较两个数组是否相等，默认不在乎顺序。空数组返回 true
 * @param ignoreOrder 是否忽略顺序，默认 true
 */
export declare function arrIsEqual<T = string | number>(arr1: T[], arr2: T[], ignoreOrder?: boolean): boolean;

export type AllTypedArrConstructor = Float32ArrayConstructor | Float64ArrayConstructor | Int8ArrayConstructor | Uint8ArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor;
```

---


## 颜色处理
```ts
/**
 * 把颜色提取出 RGBA
 * @example
 * ```ts
 * getColorInfo('rgba(0, 0, 0, 1)')
 * getColorInfo('rgb(0, 0, 0)')
 *
 * getColorInfo('#fff')
 * getColorInfo('#fff1')
 * ```
 */
export declare function getColorInfo(color: string): {
    r: number;
    g: number;
    b: number;
    a: number;
};

/** 获取十六进制随机颜色 */
export declare function getColor(): string;
/** 随机十六进制颜色数组 */
export declare function getColorArr(size: number): string[];

/**
### 把十六进制颜色转成 原始长度的颜色
  - #000 => #000000
  - #000f => #000000ff
 */
export declare function hexColorToRaw(color: string): string;

/** 十六进制 转 RGB */
export declare function hexToRGB(color: string): string;

/** RGB 转十六进制 */
export declare function rgbToHex(color: string): string;

/**
 * 淡化颜色透明度，支持 `RGB` 和 `十六进制`
 * @param color rgba(0, 239, 255, 1)
 * @param strength 淡化的强度
 * @returns 返回 RGBA 类似如下格式的颜色 `rgba(0, 0, 0, 0.1)`
 */
export declare function lightenColor(color: string, strength?: number): string;

/**
 * 颜色添加透明度，支持 `RGB` 和 `十六进制`
 * @param color 颜色
 * @param opacity 透明度
 * @returns 返回十六进制 类似如下格式的颜色 `#ffffff11`
 */
export declare function colorAddOpacity(color: string, opacity?: number): string;
```

---


## 日期处理
```ts
/** 今年的第几天 */
export declare const dayOfYear: (date?: Date) => number;

/** 获取时分秒 */
export declare const timeFromDate: (date: Date) => string;

/** 获取季度 */
export declare function getQuarter(date?: TimeType): 1 | 2 | 4 | 3;

/** 获取日期间隔 单位(天) */
export declare function dayDiff(date1: TimeType, date2: TimeType): number;

/**
 * 日期补零 把`yyyy-MM-dd` 转成 `yyyy-MM-dd HH:mm:ss`
 * @param date 格式: `2016-06-10`，必须和它长度保持一致，否则直接返回
 * @param placeholder 后面补充的字符串 默认`00:00:00`
 * @returns 如`2016-06-10 10:00:00`
 */
export declare function padDate(date: string, placeholder?: string): string;

/**
 * 把日期转为 `Date` 对象，非法日期则抛异常
 * @param date 日期，可以是字符串或者时间戳
 */
export declare function getValidDate(date: Date | string | number): string | number | Date;

/**
 * 返回给定日期是否小于某年`一月一日` 默认去年
 * @param curDate 当前日期
 * @param yearLen 年份长度，默认 `-1`，即去年
 */
export declare function isLtYear(curDate: Date | string | number, yearLen?: number): boolean;

/**
 * 描述传入日期相对于当前时间的口头说法
 * 例如：刚刚、1分钟前、1小时前、1天前、1个月前、1年前...
 * @param date 需要计算时间间隔的日期
 * @example
 * console.log(timeGap()) // 刚刚
 */
export declare function timeGap(date?: TimeType, opts?: TimeGapOpts): string;

/**
 * 格式化时间，你也可以放在 Date.prototype 上，然后 new Date().formatDate()
 *
 * @example
 * ```ts
 * console.log(formatDate('yyyy-MM-dd 00:00'))
 * console.log(formatDate('yyyy-MM-dd', new Date(66600), false))
 * console.log(formatDate('yyyy-MM-dd HH:mm:ss:ms'))
 * console.log(formatDate((dateInfo) => {
 *     return `今年是${dateInfo.yyyy}年`
 * }))
 * ```
 *
 * @param formatter 格式化函数或者字符串，默认 `yyyy-MM-dd HH:mm:ss`。可选值: yyyy, MM, dd, HH, mm, ss, ms
 * @param date 日期，默认当前时间
 */
export declare function formatDate(formatter?: DateFormat, date?: Date, opts?: FormatDateOpts): string;

export type TimeGapOpts = {
    /** 兜底替代字符串，默认 -- */
    fallback?: string;
    /** 以前日期格式化 */
    beforeFn?: (dateStr: string) => string;
    /** 以后日期格式化 */
    afterFn?: (dateStr: string) => string;
};

export type FormatDateOpts = {
    /**
     * 需要和 timeZone 配合使用，指定时区的日期格式化
     * @example 'zh-CN'
     */
    locales?: Intl.LocalesArgument;
    /**
     * 指定时区，默认本地时区
     * @example 'Asia/Shanghai'
     */
    timeZone?: string;
};
```

---


## 时钟
```ts
export declare class Clock {
    
    /** 开始时间 */
    startTime: number;
    /** 当前时间 */
    curTime: number;

    /** 每帧时间间隔 */
    delta: number;
    /** 每帧时间间隔（毫秒） */
    deltaMS: number;

    /** 停止时间计算函数 */
    stop: VoidFunction;

    /**
     * 利用 requestAnimationFrame 循环计算时间，可获取
     * - 帧间时间间隔
     * - 累计时间
     * - 起始时间
     * - 当前时间
     * @param timeApi 用来选取获取时间的 Api，`performance` 更加精准（默认值）
     */
    constructor(timeApi?: 'performance' | 'date');

    /** 开始计算时间，构造器默认调用一次 */
    start(): void;
    
    /** 累计时间（毫秒） */
    get elapsedMS(): number;
    /** 累计时间（秒） */
    get elapsed(): number;
}
```

---


## DOM
```ts
/** 获取浏览器内容宽度 */
export declare function getWinWidth(): number;
/** 获取浏览器内容高度 */
export declare function getWinHeight(): number;

/** 把`http`协议转换成当前站的 */
export declare const matchProtocol: (url: string) => string;

/**
 * 根据原始设计稿宽度 等比例转换大小
 * @param px 像素大小
 * @param designSize 设计稿大小 默认`1920`
 * @param type 根据什么缩放 默认是宽度
 */
export declare const adaptPx: (px: number | string, designSize?: number, type?: 'height' | 'width') => string;

/** 处理 `CSS` 单位，如果可以转换成数字，则添加 px */
export declare function handleCssUnit(value: string | number): string | number;

/**
 * 将像素值转换为`vw`或`vh`单位 如果传入百分比值 则直接返回
 * @param px - 要转换的像素值或百分比值
 * @param designSize 设计稿大小 默认为1920像素
 * @param unit 尺寸单位 默认为`vw`
 * @returns 转换后的值 带有指定单位
 */
export declare function pxToVw(px: number | string, designSize?: number, unit?: 'vw' | 'vh'): string | number;

/**
 * 获取样式表属性 如果单位是 px ，则会去除单位
 * @param el 元素
 * @param attr 样式属性键值
 * @param pseudoElt 伪元素
 */
export declare const getStyle: (el: HTMLElement, attr: string, pseudoElt?: string) => string | number;

/**
 * 判断图片的 src 是否可用，可用则返回图片
 * @param src 图片
 * @param setImg 图片加载前执行的回调函数
 */
export declare const getImg: (src: string, setImg?: (img: HTMLImageElement) => void) => Promise<false | HTMLImageElement>;

/**
 * 节流
 * @param delay 延迟时间（ms），@default 200
 */
export declare function throttle<P extends any[]>(fn: (...args: P) => any, delay?: number): (this: any, ...args: P) => any;

/**
 * 防抖
 * @param delay 延迟时间（ms），@default 200
 */
export declare function debounce<P extends any[]>(fn: (...args: P) => any, delay?: number): (this: any, ...args: P) => void;

/**
 * 用 requestAnimationFrame 节流，只有一帧内执行完毕，才会继续执行
 * @param fn 可以是异步函数
 */
export declare function rafThrottle<P extends any[]>(fn: (...args: P) => any): (this: any, ...args: P) => void;

/**
 * 设置 LocalStorage，默认自动转 JSON
 * @param autoToJSON 是否自动 JSON.stringify
 * @param storage 存储对象，默认 localStorage
 */
export declare function setLocalStorage(key: string, value: any, autoToJSON?: boolean, storage?: Storage): void;
/**
 * 获取 LocalStorage，默认自动解析 JSON
 * ### 'undefined' 字符串会被转成 null
 * @param autoParseJSON 是否自动 JSON.parse，默认 true
 * @param storage 存储对象，默认 localStorage
 */
export declare function getLocalStorage<T>(key: string, autoParseJSON?: boolean, storage?: Storage): T | null;

/** 获取选中的文本 */
export declare const getSelectedText: () => string;

/** 文本复制到剪贴板 */
export declare const copyToClipboard: (text: string) => Promise<void>;

/** 是否为深色模式 */
export declare const isDarkMode: () => boolean;

/** 是否滑倒页面底部 */
export declare const isToBottom: () => boolean;

/** 获取所有样式表 */
export declare const getAllStyle: () => Promise<string>;

/**
 * 打印 必须启动一个服务器才能用; ***建议使用事件交互，如按钮点击，否则可能打开多个窗口***
 * @param el 要打印的元素
 * @param styleStr 样式 建议使用`getAllStyle`函数，可不传
 * @param href 打开的链接 默认使用`location.href`
 */
export declare const print: Print;

/** 解析出`HTML`的所有字符串 */
export declare const HTMLToStr: (HTMLStr: string) => string;

/**
 * 正则匹配移动设备 UA
 * @returns 是否为移动设备
 */
export declare function isMobile(): boolean;
```

## 事件工具
```ts
/**
 * 监听用户主题变化
 * @param onLight 用户切换到浅色模式时触发
 * @param onDark 用户切换到深色模式时触发
 * @returns 解绑事件函数
 */
export declare function onChangeTheme(onLight: VoidFunction, onDark: VoidFunction): () => void;

/**
 * 获取当前主题
 */
export declare function getCurTheme(): "dark" | "light";

/**
 * 绑定 window 事件，返回解绑事件
 * @param eventName window.addEventListener 事件名称
 * @param listener window.addEventListener 事件回调
 * @param options window.addEventListener 配置项
 * @returns 解绑事件函数
 */
export declare function bindWinEvent<K extends keyof WindowEventMap & {}>(eventName: K, listener: WinListenerParams<K>[1], options?: WinListenerParams<K>[2]): () => void;

/**
 * 判断页面所有图片是否加载完成
 * @param el 要判断的元素 默认 document
 * @returns 是否加载完成
 */
export declare const judgeImgLoad: (el?: Document) => Promise<boolean>;

/**
 * 返回一个双击键盘事件
 * @param key 键盘码（KeyboardEvent.key）
 * @param fn 双击后执行函数
 * @param gap 间隔时间，默认 150
 */
export declare function doubleKeyDown<T, R>(key: string, fn: (this: T, e: KeyboardEvent, ...args: any[]) => R, gap?: number, { triggerKey }?: DoubleKeyDownOpts): (e: KeyboardEvent) => R;

/**
 * 适配主流浏览器的全屏。若已全屏，则退出全屏
 * @param dom 要全屏的元素
 */
export declare const fullScreen: (dom?: HTMLElement) => void;
```

---

# 资源预加载
```ts
/**
 * 图片资源预加载
 */
export declare function preloadImgs(srcs: string[], opts?: PreloadOpts): Promise<unknown[]>;

export type PreloadType = 'preload' | 'prefetch';
export type PreloadOpts = {
    /**
     * 超时时间，毫秒
     * @default 10000
     */
    timeout?: number;
    /**
     * 预加载类型
     * @default preload
     */
    preloadType?: PreloadType;
    /**
     * 并发数量
     * @default 3
     */
    concurrentCount?: number;
};

```

---


## 禁止调试
```ts
/**
 * 禁用调试
 * @example
 * ```ts
 * disableDebug({
 *   secret: '^sdf./][Cl32038df%……&*（）——+=',
 * })
 * ```
 */
export declare function disableDebug(debugOpts: DebugOpts): void;

export type DebugOpts = {
    /**
     * 是否开启禁用调试，你可根据环境变量设置
     * @default true
     */
    enable?: boolean;
    secret: string;
    /**
     * 开发按键，例如传入 'd'，则按住 shift + d 键，可以输入密码打开调试
     * @default 'd'
     */
    key?: string;
    /**
     * 是否禁用 F12 按键
     * @default true
     */
    disableF12?: boolean;
    /**
     * 是否禁用右键菜单
     * @default true
     */
    disableMenu?: boolean;
    /**
     * 输入框 label 文本
     * @default '你想干什么？'
     */
    labelText?: string;
    /**
     * 输入框按钮文本
     * @default '确定'
     */
    btnText?: string;
    /**
     * 输入框按钮样式的 style.cssText
     */
    btnStyleText?: string;
    /**
     * 外层样式的 style.cssText
     */
    wrapStyleText?: string;
    /**
     * input 样式的 style.cssText
     */
    inputStyleText?: string;
}
```

---


## 文件处理
```ts
/**
 * 用 `Blob` 下载
 * @param data 数据
 * @param fileName 文件名
 */
export declare const downloadByData: (data: Blob, fileName?: string) => void;

/**
 * 用 url 下载
 * @param url 链接
 * @param fileName 文件名
 * @param matchProto 是否匹配协议，比如把 http 匹配为当前站的协议。默认 false
 */
export declare const downloadByUrl: (url: string, fileName?: string, matchProto?: boolean) => Promise<void>;

/**
 * Blob 转 Base64
 */
export declare function blobToBase64(blob: Blob): Promise<string>;

/**
 * Base64 转 Blob
 * @param base64Str base64
 * @param mimeType 文件类型，默认 application/octet-stream
 */
export declare function base64ToBlob(base64Str: string, mimeType?: string): Blob;

/**
 * 把 http url 转 blob
 */
export declare function urlToBlob(url: string): Promise<Blob>;

/**
 * blob 转成 Stream，方便浏览器和 Node 互操作
 */
export declare function blobToStream(blob: Blob): Promise<ReadableStream>;

/**
 * 二进制转字符串
 * @param data 数据
 * @param encode 编码格式，默认 utf-8
 */
export declare function dataToStr(data: Blob | ArrayBuffer, encode?: string): Promise<string>;
```

---


## 分时渲染函数
```ts
/**
 * 类似`React`调度器，在浏览器空闲时，用`MessageChannel`调度任务。在任务很多时，可以避免卡顿
 * @param taskArr 任务数组
 * @param onEnd 任务完成的回调
 * @param needStop 是否停止任务
 */
export declare const scheduleTask: (taskArr: Function[], onEnd?: Function, needStop?: () => boolean) => void;
```

---


## Media API
```ts
/**
 * 录音
 * @example
 * const recorder = new Recorder()
 * await recorder.init()
 * recorder.start()
 */
export declare class Recorder {
    /** 录制的音频的临时 `URL` 。录制完毕自动赋值，每次录制前都会清空 */
    audioUrl: string;
    /** 录制的音频 `Blob`。录制完毕自动赋值 每次录制前都会清空 */
    chunks: Blob[];

    /**
     * @param onFinish 录音完成的回调
     */
    constructor(onFinish?: (audioUrl: string, chunk: Blob[]) => void);
    init(): Promise<string | undefined>;

    /** 开始录音 */
    start(): this;
    /** 停止录音，停止后，回调给构造器传递的 `onFinish` */
    stop(): this;
    /** 播放刚刚的录音，或者指定 base64 的录音 */
    play(url?: string): this;
}


/**
 * 语音播放
 * @example
 * const speaker = new Speaker('你好')
 * speaker.play()
 */
export declare class Speaker {
    /** 默认播放语音名称 */
    voiceName: string;
    /** 可播放语音列表 */
    voiceArr: SpeechSynthesisVoice[];
    /** 内部操作的实例对象 */
    speak: SpeechSynthesisUtterance;
 
    constructor(txt?: string, volume?: number, lang?: string);

    /**
     * 播放声音
     * @param onEnd 声音播放完毕的回调
     */
    play(onEnd?: (e: SpeechSynthesisEvent) => void): this;
    /** 停止 */
    stop(): this;
    /** 暂停 */
    pause(): this;
    /** 继续 */
    resume(): this;
    /** 设置播放文本 */
    setText(txt?: string): this;
    /** 设置音量 */
    setVolume(volume?: number): this;
    /** 设置声音类型 */
    setVoice(index: number): this;
    /** 设置语速 */
    setRate(rate: number): this;
    /** 设置音高 */
    setPitch(pitch: number): this;
}


/**
 * 语音转文字，默认中文识别
 * @example
 * const speakToTxt = new SpeakToTxt((data) => {
 *     console.log(data)
 * })
 * speakTxtBtn.onclick = () => speakToTxt.start()
 */
export declare class SpeakToTxt {
    /**
     * 调用 start 方法开始录音，默认中文识别
     * @param onResult 返回结果的回调
     * @param opts 配置项
     */
    constructor(onResult: OnResult, opts?: SpeakToTxtOpts);
    /** 开始识别 */
    start(): this;
    /** 停止识别 */
    stop(): this;
}

type SpeakToTxtOpts = {
    onstart?: (ev: Event) => void;
    onEnd?: (ev: Event) => void;
    /** 是否在用户停止说话后继续识别，默认 `false` */
    continuous?: boolean;
    /** 是否返回临时结果，默认 `false` */
    interimResults?: boolean;
    lang?: string;
};
type OnResult = (data: string, e: SpeechRecognitionEvent) => void;


/**
 * 开启摄像头
 * @param callbackOrVideoEl 视频元素或者回调
 * @returns 停止播放的函数
 */
export declare const openCamera: (callbackOrVideoEl: HTMLVideoElement | ((stream: MediaStream) => void)) => Promise<Function>;

/** 录屏 */
export declare const screenCAP: (fileName?: string) => Promise<void>;
```

---


## 数据结构
```ts
/** 最小堆算法 */
export declare class MinHeap<T extends HeapItem> {
    readonly data: T[];

    get size(): number;
    isEmpty(): boolean;

    /** 返回堆顶的值 */
    peek(): T;

    push(...items: T[]): void;

    /** 删除并返回堆顶的值 */
    pop(): T;
}

/** 最大堆算法 */
export declare class MaxHeap<T extends HeapItem> {
    readonly data: T[];

    get size(): number;
    isEmpty(): boolean;

    /** 返回堆顶的值 */
    peek(): T;

    push(...items: T[]): void;

    /** 删除并返回堆顶的值 */
    pop(): T;
}

export declare class LRUCache<K, V> extends Map<K, V> {
    maxLen: number;
    constructor(maxLen: number);
    get(key: K): V | undefined;
    set(key: K, value: V): this;
}
```

---


## 动画处理
```ts
/**
 * 在一帧中执行你的函数
 * @param fn 将此函数放在 *requestAnimationFrame* 内递归执行，如果此函数返回 `stop` 则停止执行
 * @returns 返回一个函数，用于取消函数执行
 */
export declare const applyAnimation: (fn: () => 'stop' | void) => () => void;

/**
 * 根据传入的值，返回一个动画函数。通常用来做滚动动画值映射
 * #### 你可以拿到返回的函数，传入指定范围的值，他会映射成对应的值
 *
 * @param stVal 动画起点，比如滚动起始位置
 * @param endVal 动画终点，比如滚动终点位置
 * @param animateStVal 动画起点对应的值
 * @param animateEndVal 动画终点对应的值
 * @param timeFunc 动画缓动函数，支持内置函数和自定义函数
 */
export declare function createAnimation(stVal: number, endVal: number, animateStVal: number, animateEndVal: number, timeFunc?: TimeFunc): (curVal: number) => number;

/**
 * 根据传入对象，随着时间推移，自动更新值。类似 GSAP 等动画库
 *
 * ### 不是 CSS 也能用，注意把配置项的 transform 设置为 false，就不会去解析了
 *
 * - 如果 target 是 *CSSStyleDeclaration* 并且
 * - 不是 *transform* 属性 并且
 * - 样式表和 *finalProps* 都没有单位，则使用 `px` 作为 `CSS` 单位
 *
 * @param target 要修改的对象，如果是`CSSStyleDeclaration`对象 则单位默认为`px`
 * @param finalProps 要修改对象的最终属性值，不支持 `transform` 的复合属性
 * @param durationMS 动画持续时间
 * @param animationOpts 配置项，可以控制动画曲线等; 动画单位优先级: `finalProps` > `animationOpts.unit` > `rawEl(原始 DOM 的单位)`;
 *
 * @returns 返回一个停止动画函数
 */
export declare const createAnimationByTime: <T, P extends FinalProp>(target: T, finalProps: P, durationMS: number, animationOpts?: AnimationOpts<T, P>) => () => void;

/**
 * 生成贝塞尔曲线函数
 * @param name 动画函数名称
 * @returns 一个接收`0 ~ 1`进度参数的函数
 */
export declare function genTimeFunc(name?: TimeFunc): (v: number) => number;

/**
 * 一个动画类 能够链式调用; 请先调用`start`函数, 参数和`createAnimationByTime`一致
 * @example
 * const aTo = new ATo()
 * aTo
 *     .start(
 *         div1.style,
 *         {
 *             left: '200px',
 *             top: '200px',
 *             opacity: '0.1'
 *         },
 *         1000
 *     )
 *     .next(
 *         div2.style,
 *         {
 *             translateX: '50vw',
 *             translateY: '300px',
 *         },
 *         2000,
 *         {
 *             transform: true,
 *             timeFunc: 'ease-in-out'
 *         }
 *     )
 */
export declare class ATo {

    /**
     * 开始执行动画 首次执行请先调用此函数
     * @param target 要修改的对象 如果是`CSSStyleDeclaration`对象 则单位默认为`px`
     * @param finalProps 要修改对象的最终属性值
     * @param durationMS 动画持续时间
     * @param animationOpts 配置项 可选参数
     * @returns 返回一个停止动画函数
     */
    start<T, P extends FinalProp>(target: T, finalProps: P, durationMS: number, animationOpts?: AnimationOpts<T, P>): this;
    
    /**
     * 等待上一个动画完成后执行 ***第一次请先调用`start`函数***
     * @param target 要修改的对象，可以是一个函数（用来获取同一个对象不同时间的值）。如果是`CSSStyleDeclaration`对象，则单位默认为`px`
     * @param finalProps 要修改对象的最终属性值
     * @param durationMS 动画持续时间
     * @param animationOpts 配置项 可选参数
     * @returns 返回一个停止动画函数
     */
    next<T, P extends FinalProp>(target: T | (() => any), finalProps: P, durationMS: number, animationOpts?: AnimationOpts<T, P>): this;
    
    /** 停止所有动画 */
    stop(): void;

}
```

---


## 虚假进度条

```ts
/**
 * 虚假进度条
 *
 * @example
 * ```ts
 * const progress = new FakeProgress({ ... })
 * console.log(progress.progress)
 * ```
 */
export declare class FakeProgress {

    timeConstant: number;

    /** 进度，0 ~ 1 之间 */
    progress: number;
    onChange?: (progress: number) => void;
    
    constructor(fakeProgressOpts?: FakeProgressOpts);

    start(): void;
    stop(): void;
    end(): void;

    setProgress(value: number): void;
}
```

---


## 事件分发
```ts
/**
 * 消息订阅与派发，订阅和派发指定消息
 */
export declare class EventBus<T extends BaseKey = BaseKey> {
    /**
     * 订阅
     * @param eventName 事件名
     * @param fn 接收函数
     */
    on(eventName: T, fn: Function): void;

    /**
     * 订阅一次
     * @param eventName 事件名
     * @param fn 接收函数
     */
    once(eventName: T, fn: Function): void;

    /**
     * 发送指定事件，通知所有订阅者
     * @param eventName 事件名
     * @param args 不定参数
     */
    emit(eventName: T, ...args: any[]): void;
    
    /**
     * 取关
     * @param eventName 空字符或者不传代表重置所有
     * @param func 要取关的函数，为空取关该事件的所有函数
     */
    off(eventName?: T, func?: Function): void;
}
```

---


## is 判断
```ts
/**
 * 判断是否能强转成数字
 * @param value 判断的值
 * @param enableParseFloat 默认 false，是否使用 parseFloat，这会把 '10px' 也当成数字
 */
export declare function isPureNum(value: string | number, enableParseFloat?: boolean): boolean;

export declare const isStr: (data: any) => data is string;
export declare const isNum: (data: any) => data is number;
export declare const isBool: (data: any) => data is boolean;

export declare const isFn: (data: any) => data is Function;
export declare const isObj: (data: any) => data is object;
export declare const isArr: <T>(data: any) => data is T[];

/** Object.is */
export declare const isSame: (a: any, b: any) => boolean;
```

---


## canvas
```ts
/**
 * 截取图片指定区域，可设置缩放，返回 base64 | blob
 * @param img 图片
 * @param opts 配置
 * @param resType 需要返回的文件格式，默认 `base64`
 */
export declare function cutImg<T extends TransferType = 'base64'>(img: HTMLImageElement, opts?: CutImgOpts, resType?: T): HandleImgReturn<T>;

/**
 * 压缩图片
 * @param img 图片
 * @param resType 需要返回的文件格式，默认 `base64`
 * @param quality 压缩质量，默认 0.5
 * @param mimeType 图片类型，默认 `image/webp`。`image/jpeg | image/webp` 才能压缩
 * @returns base64 | blob
 */
export declare function compressImg<T extends TransferType = 'base64'>(img: HTMLImageElement, resType?: T, quality?: number, mimeType?: 'image/jpeg' | 'image/webp'): HandleImgReturn<T>;

/**
 * 把 canvas 上的图像转成 base64 | blob
 * @param cvs canvas
 * @param resType 需要返回的文件格式，默认 `base64`
 * @param mimeType 图片的 MIME 格式
 * @param quality 压缩质量
 */
export declare function getCvsImg<T extends TransferType = 'base64'>(cvs: HTMLCanvasElement, resType?: T, mimeType?: string, quality?: number): HandleImgReturn<T>;


/**
 * 创建一个指定宽高的画布
 * @param width 画布的宽度
 * @param height 画布的高度
 * @param options 上下文配置
 * @returns 包含画布和上下文的对象
 */
export declare function createCvs(width?: number, height?: number, options?: CanvasRenderingContext2DSettings): {
    cvs: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
};

/**
 * 取出 `canvas` 用一维数组描述的颜色中，某个坐标的`RGBA`数组
 * ### 注意坐标从 0 开始
 * @param x 宽度中的第几列
 * @param y 高度中的第几行
 * @param imgData ctx.getImageData 方法获取的 ImageData
 * @returns `RGBA`数组
 */
export declare function getPixel(x: number, y: number, imgData: ImageData): Pixel;

/**
 * 美化 ctx.getImageData.data 属性
 * 每一行为一个大数组，每个像素点为一个小数组
 * @param imgData ctx.getImageData 方法获取的 ImageData
 */
export declare function parseImgData(imgData: ImageData): Pixel[][];

/** 给 canvas 某个像素点填充颜色的函数 */
export declare function fillPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void;
```

---


## Web 小插件
```ts
/** 检查页面更新 */
export declare function autoUpdate(opts?: Opts): void;
```

---


## 常量
```ts
/** Math.PI / 180 */
export declare const DEG_1: number;

/** Math.PI / 180 * 15 */
export declare const DEG_15: number;
/** Math.PI / 180 * 30 */
export declare const DEG_30: number;
/** Math.PI / 180 * 45 */
export declare const DEG_45: number;
/** Math.PI / 180 * 60 */
export declare const DEG_60: number;

/** Math.PI / 180 * 90 */
export declare const DEG_90: number;
/** Math.PI */
export declare const DEG_180: number;
/** Math.PI / 180 * 270 */
export declare const DEG_270: number;
/** Math.PI * 2 */
export declare const DEG_360: number;



/** 各种正则表达式 */
export declare const Reg: {
    /** 手机号正则 */
    phone: RegExp;
    /** rgb 颜色正则 */
    rgb: RegExp;
    /** 身份证正则 */
    cardId: RegExp;
    /** 中文正则 */
    chinese: RegExp;
    /**
     * 数字转千分位正则
     * @example
     * "123456789".replace(Reg.numToLocaleString, ",")
     */
    numToLocaleString: RegExp;
    /** 密码校验正则：必须包含数字、大小写字母、特殊字符，6-12 位 */
    pwd: RegExp;
};

/** 一整天的毫秒 */
export declare const ONE_DAY: number;
```