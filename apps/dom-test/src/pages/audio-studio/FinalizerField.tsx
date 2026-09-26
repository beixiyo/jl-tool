/** 无依赖的最终文件处理演示；不冒充 WebM 时长修复器 */
import type { RecordingFinalizer } from '@/webApi/recording'
import { SelectField } from '@app/components'

/** 选择无需安装第三方包即可验证的回调行为 */
export function FinalizerField(props: { value: FinalizerMode; onChange: (value: FinalizerMode) => void; disabled?: boolean }) {
  return (
    <SelectField
      label="finalizeBlob（时长修复需自行注入，见文档）"
      value={ props.value }
      onChange={ props.onChange }
      disabled={ props.disabled }
      options={ [
        { value: 'none', label: '不处理（默认原样输出）' },
        { value: 'passthrough', label: '回调观察 Blob 与时长，原样返回' },
        { value: 'delayed', label: '异步等待 500ms 后原样返回' },
        { value: 'error', label: '模拟处理失败，验证 stop 拒绝' },
      ] }
    />
  )
}

/** 只验证注入/等待/错误边界；真正的容器修复由应用实现适配器 */
export function createDemoFinalizer(mode: FinalizerMode, log: (message: string) => void): RecordingFinalizer | undefined {
  if (mode === 'none') return undefined
  return async ({ blob, durationMs }) => {
    log(`finalizeBlob · ${blob.size} bytes · ${durationMs.toFixed(0)} ms`)
    if (mode === 'error') throw new Error('finalizeBlob 演示失败')
    if (mode === 'delayed') await new Promise((resolve) => setTimeout(resolve, 500))
    return blob
  }
}

/** 实验页回调模式 */
export type FinalizerMode = 'none' | 'passthrough' | 'delayed' | 'error'
