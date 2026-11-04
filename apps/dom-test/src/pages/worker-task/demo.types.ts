/** 主线程与 Worker 共享的演示任务数据类型。 */
/** 单项任务的等待时间与失败注入配置。 */
export interface DemoInput {
  delay: number
  fail: boolean
}

/** Worker 成功返回的计算结果。 */
export interface DemoResult {
  index: number
  checksum: number
  delay: number
}

/** Worker 发出的单项阶段事件，不表示完成。 */
export interface DemoEvent {
  stage: number
  totalStages: number
}
