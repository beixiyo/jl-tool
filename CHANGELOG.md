# 更新日志

## [5.0.0] - 未发布

### 破坏性改动

- **`connect()` 返回 `WS` 实例，不再返回原生 `WebSocket`。** `WS` 自身就是事件目标，
  且跨重连保持有效，因此不再需要单独持有一个 socket 对象。把返回值标注为 `WebSocket`、
  或传给期望 `WebSocket` 的 API 的代码将无法通过类型检查

  ```ts
  // 旧写法
  const socket = ws.connect()
  socket.addEventListener('message', onMessage)

  // 新写法：处理器跨重连始终有效，无需重新绑定
  ws.addEventListener('message', onMessage)
  ws.connect()
  ```

- **`onVisible` 不再接收 `socket` 参数。** 确实需要底层连接时改用 `socket` getter
- **连接不可用时 `send()` 由丢弃改为入队。** 这是一处静默的投递语义变化，既不抛错也不告警
  断线期间发送的消息会在重连后补发，对聊天类流量是改进，但对不可重放的业务指令
  （下单、撤单等）是风险。需要保持 4.x 的丢弃语义时设置 `queueMessages: false`

  ```ts
  new WS({ url, queueMessages: false })
  ```

### 新增

- **待发队列**，默认开启，容量 100、TTL 10 秒，可通过 `maxQueuedMessages` 和
  `queuedMessageTTL` 调整。过期条目在访问时惰性清理，不涉及定时器或轮询
  它只覆盖短暂断线窗口，不提供 ACK、持久化或 exactly-once 保证
- **有限指数退避重连**，由 `autoReconnect`、`maxReconnectAttempts`、`reconnectBaseDelay`
  和 `reconnectMaxDelay` 控制，并新增 `onReconnectAttempt` 与 `onReconnectExhausted`
  回调。网络恢复 `online` 和页面恢复可见会重置退避周期
- **close 事件的 `superseded` 标记。** 底层连接被内部替换时，合成的 close 事件带
  `superseded: true`，供调用方区分真实断开与内部换连接
- **`createWebSocket` 工厂选项**，用于在 Node、Electron 或测试中注入实现
- **`logger` 选项。** 默认不向控制台输出任何内容，需要诊断信息时传入 `logger: console`
- 对齐原生的成员：`readyState`、`url`、`protocol`、`extensions`、`bufferedAmount`、
  `binaryType`、`CONNECTING` / `OPEN` / `CLOSING` / `CLOSED` 常量，以及与
  `addEventListener` 并存的 `onopen` / `onclose` / `onerror` / `onmessage` 属性处理器
- `close(code?, reason?)` 支持参数并按原生规则校验；新增显式别名 `dispose()`

### 变更

- **逻辑连接模型。** 一个 `WS` 实例代表一条逻辑连接，其生命周期横跨多个物理 socket
  被替换 socket 的迟到事件会被忽略，且 `close` → `open` 的顺序保证永不倒置
- `send()` 返回 `boolean`（原为 `void`），消息已发送或已入队时为 `true`。仅在
  `CONNECTING` 且关闭队列时抛 `InvalidStateError`，与原生一致；`CLOSING` / `CLOSED`
  静默丢弃
- 就绪状态常量取自平台 `WebSocket`，非浏览器环境回退到字面量
- `WS` 从 `src/net/WS.ts` 迁移到 `src/net/WS/` 并按职责拆分（`EnvironmentEvents`、
  `Heartbeat`、`MessageQueue`、`ReconnectCycle`、`EventHandlerTarget`）
  `@jl-org/tool` 的导入路径不变

### 修复

- 已被替换的 socket 上迟到的事件不再泄漏到当前逻辑连接
- 替换连接时，若旧 socket 仍在关闭中，待发的 `close` 事件不再被吞掉
- close 处理器内先 `connect()` 后 `close()` 不再无限递归，close 派发在单个同步栈内加了护栏

### 说明

- 页面恢复可见触发的重连**刻意不受** `autoReconnect` 约束。隐藏时的挂起是 `WS` 主动发起的，
  恢复与之成对，否则挂起过一次的连接将永久无法恢复。需要完全禁止自动建连时，
  请同时设置 `stopOnHidden: false`

## [4.0.2] - 2026-06-02

### 修复

- **计时工具在浏览器外不再崩溃。** `debounce`、`throttle` 和 `FakeProgress` 调用了 `window.setTimeout` / `window.setInterval`，在非浏览器运行时（Node.js、Electron 主进程、Web Workers）中抛出 `ReferenceError: window is not defined`。现在它们使用原生的 `setTimeout` / `setInterval` 全局对象——在浏览器、Node 和 Worker 中都可用——所以标准构建真正可移植了
- 计时器句柄类型从硬编码的 `number` 改为 `ReturnType<typeof setTimeout>`，在 DOM 和 Node 类型定义下都能正确解析

### 变更

- **`rafThrottle` 在非浏览器环境中优雅降级。** 当 `requestAnimationFrame` 不可用时，回退到约 16ms 的 `setTimeout` 而不是抛错。动画语义仍假设浏览器环境；回退只保证不会崩溃

### 说明

- 天然仅限浏览器的模块（`WS`、`autoUpdate`、`domTools/*`、`fileTool/*`、`webApi/*`、`ScrollTrigger`、`theme` 等）不变——它们合理地依赖 DOM / 浏览器 API。在 Node 中导入包仍然安全：没有顶层浏览器全局访问，只有 `typeof window` 防护

## [4.0.1] - 2026-05-29

### 修复

- **`getLocalStorage` 不再对非 JSON 值抛错。** `setLocalStorage` 按字面存储 `string` 值（不带 JSON 引号），但 `getLocalStorage` 对所有值运行 `JSON.parse` 并对纯字符串抛错。现在它在 `JSON.parse` 失败时回退到原始字符串，所以字符串能正确往返且格式不当 / 遗留值不再导致调用方崩溃：
  - `'-created_time'` — 原为 `SyntaxError: No number after minus sign`，现返回 `'-created_time'`
  - `''`（空字符串）— 原为 `SyntaxError: Unexpected end of JSON input`，现返回 `''`
- **`getLocalStorage` 对缺失的键明确返回 `null`**，而不是依赖 `JSON.parse(null)` 的副作用

### 说明

- 因为字符串按字面存储，JSON 样式的字符串（`'123'`、`'true'`、`'{"a":1}'`）在读取时仍会解析到对应的 JSON 类型。传入 `autoParseJSON = false` 到 `getLocalStorage` 来保持原始字符串
- 为 `setLocalStorage` / `getLocalStorage` 添加了回归测试套件（`test/test/tools/localStorage.test.ts`）

## [4.0.0] - 2026-05-29

### `formatDate` 重写——通用 LDML 风格令牌

`formatDate` 现在使用单遍令牌解析器，使格式字符串完全通用（任何令牌、任意位置、任意次数），
而非固定的硬编码模式集合

#### 新增

- **可变宽度令牌** — 每个字段现在都有填充和非填充形式：
  `M`/`MM`、`d`/`dd`、`H`/`HH`、`m`/`mm`、`s`/`ss`、`S`/`SSS`
- **两位数年份** `yy`（例如 `2026` → `26`）
- **全局替换** — 令牌在每处出现都会被替换，不仅仅是第一处
  （`'yyyy yyyy'` → `'2026 2026'`）
- **单引号字面量转义**（Unicode LDML 风格）— 用单引号包裹的文本原样输出，`''` 产生单引号：
  - `"yyyy年MM月dd日 'at' HH:mm"` → `2026年03月05日 at 09:08`
  - `"'it''s' yyyy"` → `it's 2026`

#### 变更

- **`getLocaleDateInfo` 时间处理** — 从 `hour12: false` 改为 `hourCycle: 'h23'`，
  所以午夜在所有地域都可靠地表示为 `00`/`0`（不再是 `24`）
- **内部日期信息**现在携带原始数字；填充在令牌解析时发生

#### 修复

- **本地时区毫秒填充** — `ms`/`SSS` 现在一致地填充到 3 位
  （之前本地路径填充到 2 位：`5ms` → `05`，现在 → `005`），与自定义时区路径一致

#### ⚠️ 破坏性改动

1. **`DateInfo` 回调对象形状改变**，从填充字符串改为原始数字：
   - 前：`{ yyyy, MM, dd, HH, mm, ss, ms }`（字符串，零填充）
   - 后：`{ year, month, day, hour, minute, second, millisecond }`（数字）
   - 任何使用旧字段名的自定义格式化器必须更新：
     ```ts
     // 前
     formatDate(info => `${info.yyyy}`)
     // 后
     formatDate(info => `${info.year}`)
     ```

2. **单字母令牌现在有效**，所以格式字符串中的字面字母被解释为令牌，必须用单引号转义：
   - `formatDate('day')` → `5ay`（`d` = 日）
   - 使用 `formatDate("'day'")` → `day`

3. **全局替换** — 重复的令牌都会被替换
   （`'yyyy yyyy'`：原为 `'2026 yyyy'`，现为 `'2026 2026'`）

4. **本地时区毫秒宽度改变**从 2 位改为 3 位（见上文 _修复_）

5. **自定义时区午夜小时**现在是 `00`/`0` 而非某些地域可能的 `24`（见上文 _变更_）

#### 说明

- `yyyy`/`MM`/`dd`/`HH`/`mm`/`ss`（常见的填充形式）不变——大多数不含字面字母的格式字符串无需迁移
- 非标准令牌 `YYYY`（= `yyyy`）和 `ms`（= `SSS`）在运行时仍被接受以保持向后兼容，
  但 **不再被** `DateFormat` 类型建议，新代码中不推荐使用
