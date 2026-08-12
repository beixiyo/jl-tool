export const ROUTE_META = [
  route('/tests/clock', 'Clock', '实时观察时钟状态、暂停恢复与帧间隔', 'Animation'),
  route('/tests/create-animation-by-time', 'createAnimationByTime', '补间、缓动和链式动画', 'Animation'),
  route('/tests/typewriter-effect', 'Typewriter Effect', '打字、暂停和销毁生命周期', 'Animation'),
  route('/tests/debounce', 'Debounce / Throttle', '对比高频输入的执行节奏', 'Scheduling'),
  route('/tests/disable-debug', 'disableDebug', '测试开发者工具限制与检测回调', 'Browser'),
  route('/tests/schedule-task', 'scheduleTask', '对比同步阻塞与时间片调度的主线程流畅度', 'Scheduling'),
  route('/tests/preload', 'Preload', '测试图片预加载和失败反馈', 'Browser'),
  route('/tests/stream-downloader', 'Stream Downloader', '测试流式写入和下载状态', 'Browser'),
  route('/tests/canvas', 'Canvas Tools', '图片裁剪、压缩和像素处理', 'Visual'),
  route('/tests/scroll-trigger', 'ScrollTrigger', '纵向滚动触发动画', 'Visual'),
  route('/tests/scroll-trigger-x', 'ScrollTrigger X', '横向滚动触发动画', 'Visual'),
  route('/tests/media', 'Media APIs', '浏览所有浏览器媒体能力', 'Media'),
  route('/tests/recorder', 'Recorder', '录音、暂停、分析和回放', 'Media'),
  route('/tests/speaker', 'Speaker', '语音合成参数与播放控制', 'Media'),
  route('/tests/speak-to-txt', 'SpeakToTxt', '浏览器语音识别与实时结果', 'Media'),
  route('/tests/camera', 'Camera', '摄像头权限、预览和释放', 'Media'),
  route('/tests/screen-record', 'Screen Recorder', '屏幕捕获、录制和回放', 'Media'),
] as const

function route(path: string, title: string, description: string, group: RouteGroup) {
  return { path, title, description, group }
}

export type RouteGroup = 'Animation' | 'Scheduling' | 'Browser' | 'Visual' | 'Media'
